# Malo 1.1｜Batch 4 Cloud Architecture Audit

> 主题：Cloud Backup v2 架构审计
>
> 审计范围：B11 Cloud Backup 删除、B12 Backup History、B13 真正多设备同步 / Conflict Merge
>
> 审计基线：`feature/malo-1.1`，审计开始时 HEAD `0aacf99`
>
> 结论性质：架构决策与下一轮实现计划；本轮没有修改生产代码、Cloud Function、snapshot schema 或 Cloud Collection。

## Executive Decision

Malo 1.1 的 Cloud 范围应保持克制：继续使用稳定的 snapshot `schemaVersion: 1`，只建议实现 **B11 删除云备份**。删除必须与关闭自动 Cloud Backup 绑定为一个服务端安全语义，避免 `onHide` 立即把刚删除的数据重新上传。B12 Backup History 缺少已验证的产品需求，推迟；B13 已经属于新的同步协议和数据模型，应放到 2.0+ / future，而不是作为 Backup v1 的增量功能。

| Bonus | Product Value | Complexity | Risk | Recommended Release | Verdict |
|---|---|---|---|---|---|
| B11 Delete Backup | High：补齐用户对云端私密内容的控制闭环 | Medium | Medium | Malo 1.1 | Recommend；仅实现“删除全部云备份 + 自动关闭备份” |
| B12 Backup History | Medium，但当前没有真实需求证据 | Medium | Medium | Defer，至少 1.2 再评估 | 不进入 1.1；先收集误删/误覆盖场景证据 |
| B13 Multi-device Sync | 潜在 High，但与当前 Local-first 定位跨度大 | High | High | 2.0+ / future | 不作为 Backup v2 小改；需要独立产品与协议设计 |

## 1. Current Cloud v1 Architecture

### 1.1 身份：`loginOrRegister`

代码事实来自 `cloudfunctions/loginOrRegister/index.js` 与 `utils/cloud-auth.js`。

- Cloud Function 通过 `cloud.getWXContext().OPENID` 在服务端取得微信身份。
- `users` 以 `openid` 查询；新用户由 Cloud Database `add` 生成 `_id`，该 `_id` 即 Malo `userId`。
- 新建用户的基础字段为：`openid`、`status: "active"`、`createdAt: db.serverDate()`、`lastSeenAt: db.serverDate()`。
- 老用户登录只更新 `lastSeenAt`。
- 备份 opt-in 后，`users` 还会出现：`backupMode`、`backupConsentVersion`、`backupConsentUpdatedAt`。
- 客户端响应只得到 `userId` 与 `isNewUser`，不会看到 `OPENID`。
- owner 绑定不是“客户端提交 userId 后信任它”，而是 Cloud Function 每次用当前微信上下文的 `OPENID` 查回 `users._id`。这是 v1 必须保持不动的安全边界。

### 1.2 `syncBackup` API

代码事实来自 `cloudfunctions/syncBackup/index.js` 与 `utils/cloud-backup.js`。

| Action | Client request | Success response（核心字段） | Server owner rule |
|---|---|---|---|
| `saveBackup` | `action`、`snapshot`、`estimatedBytes`、`appVersion` | `backupId`、`created`、`updatedAt`、`snapshotBytes`、`duplicateBackupCount` | 以服务端 `OPENID` 查 user；只写 `ownerOpenid = OPENID` 的记录 |
| `getStatus` | 仅 `action` | `exists`；若存在则含 id/schema/app/size/created/updated/duplicate count | 只按服务端 `OPENID` 查询 |
| `getBackup` | 仅 `action` | `exists`；若存在则返回 metadata + `snapshot` | 只按服务端 `OPENID` 查询；要求 backup mode enabled |
| `getPreference` | 仅 `action` | `mode`、`consentVersion`、`consentUpdatedAt` | 从当前 OPENID 对应 user 读取 |
| `setPreference` | `action`、`mode: enabled/disabled` | 更新后的 mode/consent metadata | 只更新当前 OPENID 对应 user |

安全与限制：

- 客户端没有 owner、OPENID 或 userId 参数，因而不能指定或伪造其他用户作为目标。
- `saveBackup` 与 `getBackup` 会检查服务端 `backupMode === "enabled"`；`getStatus` 可在关闭状态下查询 retained backup。
- 客户端和服务端都限制 snapshot 为 1 MiB，并要求 `schemaVersion === 1`。
- 当前没有 `deleteBackup` action。

### 1.3 `backup-snapshot.js`

当前 snapshot 的真实形状：

```js
{
  schemaVersion: 1,
  payload: {
    diaryEntries: [],
    escapePlan: {
      userItems: [],
      defaultItemStates: [{ id, completed, completedAt }]
    },
    localVoicePosts: [],
    customEmergencyCards: []
  }
}
```

与 Local Storage 的映射：

- `malo_diary_entries` → `payload.diaryEntries`
- `malo_wish_items` → 用户新增项进入 `escapePlan.userItems`；系统默认项只备份 `id/completed/completedAt`
- `malo_local_voice_posts` → `payload.localVoicePosts`
- `malo_custom_emergency_cards` → `payload.customEmergencyCards`

`collectBackupSnapshot` 读取这四组核心数据，并把默认愿望项规范化为状态；`validateBackupSnapshot` 要求 schema 精确为 1、payload 与 `escapePlan` 存在、四个内容字段均为数组；`restoreBackupSnapshot` 按当前内置默认愿望重新生成默认项，再覆盖能识别的默认状态，并写回四个 storage key。

兼容行为很有限：

- schema 不是 1 会直接拒绝，没有 v0/v2 migration router。
- 已从当前内置默认愿望中消失的旧 state 会被忽略并计数，这只是默认愿望项兼容，不是 schema migration。
- 元素层仅做有限规范化，尚非完整的逐字段深度 schema 校验。

明确不在 snapshot 中：nickname、首次引导状态、反馈本地记录、精选心声抱抱状态、oracle snapshot、默认愿望初始化/版本标记、日记清理版本、`recoverySuppressed`。Cloud Backup opt-in 本身存于云端 `users`，也不是 snapshot 字段。

### 1.4 `user_backups` 真实数据模型

新建记录字段：

- `_id`：Cloud Database 生成
- `userId`：当前 `users._id`
- `ownerOpenid`：服务端当前 `OPENID`
- `schemaVersion`
- `appVersion`
- `snapshot`
- `snapshotBytes`
- `createdAt: db.serverDate()`
- `updatedAt: db.serverDate()`

更新已有记录时会更新 `userId/schemaVersion/appVersion/snapshot/snapshotBytes/updatedAt`，保留原 `ownerOpenid/createdAt`。

当前是“一用户一份**逻辑上的最新 backup**”，不是数据库强约束的一用户一行：`findBackups` 会按 `ownerOpenid` 查询并按 `updatedAt desc` 排序，使用第一行；若已经有多行，代码只报告 `duplicateBackupCount`，不会清理其余记录。仓库中也没有可证明唯一约束的 collection/index 配置。因此物理上允许多份重复 current backup，B11 必须删除该 owner 的全部记录，不能只删除最新一行。

### 1.5 Restore Flow

```text
App onLaunch
  ↓ 初始化 wx.cloud + loginOrRegister（服务端 OPENID → Malo user）
  ↓ initializeCloudBackupLifecycle
读取服务端 backup preference
  ├─ disabled / unconfigured → 不自动恢复、不自动上传
  └─ enabled
       ↓ 读取本机 malo_cloud_recovery_suppressed
       ├─ true → 标记 suppressed；不恢复，也不上传
       └─ false
            ↓ collect v1 snapshot，判断本机是否有 meaningful core data
            ├─ 本地有数据 → 不自动恢复；允许后续 backup 覆盖 cloud latest
            └─ 本地为空 → getBackup
                   ├─ 云端无 backup → 保持本地为空，不上传空快照
                   └─ 云端有合法 v1 → 自动恢复；校验失败则保留/回滚本地

App onHide
  ↓ backupNow("app_hide")
  ├─ 未 enabled / recovery 未检查完成 / recovery 失败 / 正在 restore / suppressed → 跳过
  └─ 其他 → 上传整份本地 snapshot，覆盖 owner 的逻辑 latest
```

补充语义：

- 用户主动“清空本地数据”后，`markIntentionalLocalClear()` 写入 `malo_cloud_recovery_suppressed = true`，防止下次启动把云端旧数据自动恢复，也防止空本地覆盖云端。
- About 页只在该 suppression 场景提供手动恢复；恢复成功后清除 suppression。
- 底层 `restoreCloudBackup({force:true})` 虽能覆盖有数据的本地，但当前生命周期/UI 没有把它作为普通入口暴露。
- 恢复前会收集本地 snapshot；恢复后重新收集并比较语义。失败时尝试用恢复前 snapshot 回滚。但 storage 写入仍是多个同步写操作，不是真正数据库事务。
- 当前冲突策略是整份 snapshot 的 last successful write wins；没有 cloud revision、条件写、merge 或冲突提示。

### 1.6 v1 必须保持不动的部分

1. 服务端从微信上下文取得 OPENID，并在服务端解析 owner。
2. 客户端不接收、不提交可用于 owner 授权的 OPENID/userId。
3. Local-first 与 opt-in 默认：未配置/关闭时不上传。
4. intentional local clear 的 suppression 防误恢复机制。
5. 恢复前验证、1 MiB 上限、恢复后验证与失败回滚。
6. B11 不应借机改变 snapshot payload 或 `schemaVersion: 1`。

## 2. Local Data Inventory

“Private User Data”按内容是否可能表达用户私密信息判断；“Recommended Backup”是架构建议，不代表本轮修改。

| Storage Key / Cloud state | Purpose / Category | Private User Data? | Current Backup? | Recommended Backup? | Reason |
|---|---|---:|---:|---:|---|
| `malo_diary_entries` | 日记/30 秒记录；用户内容 | Yes | Yes | Yes | 核心私密内容，备份的首要价值 |
| `malo_wish_items` | 愿望/离职准备计划；用户内容 + 默认项状态 | Yes | Yes（规范化） | Yes | 用户新增项完整备份；系统默认项只需状态 |
| `malo_wish_defaults_initialized` | 默认愿望初始化标记；内部设置 | No | No | No | 可由当前版本重新生成，不应同步迁移状态 |
| `malo_wish_defaults_version` | 默认愿望版本；内部 migration 标记 | No | No | No | 设备/版本本地实现细节 |
| `malo_local_voice_posts` | 私密本地心声；用户内容 | Yes | Yes | Yes | 已被产品定义为核心可恢复内容 |
| `malo_trial_feedback_posts` | 反馈草稿、提交状态与本地历史；用户内容/传输队列 | Yes | No | No | 已有独立 `submitFeedback` 云端生命周期；纳入 backup 会混淆“仅明确递出才上传”的承诺并复制数据 |
| `malo_featured_voice_hugs` | 对精选内容的抱抱状态/计数；轻量交互偏好 | Low | No | No | 非核心恢复数据，丢失成本低，且与内容版本绑定 |
| `malo_diary_cleanup_version` | 日记清理 migration 标记；内部设置 | No | No | No | 设备/版本本地实现细节 |
| `malo_custom_emergency_cards` | 自定义急救小卡；用户内容 | Yes | Yes | Yes | 私密且不可重新生成的核心内容 |
| `malo_oracle_snapshots` | 旧 oracle 收藏快照；dormant 数据 | No/Low | No | No | UI 已停止使用，来源可确定性重建，不应扩大云端保存 |
| `malo_nickname` | Malo 内昵称；个人偏好 | Yes/Low | No | Future v2 | 换设备保留有合理期待，但不足以单独触发 schema 升级；与下一次真实 v2 一起加入 |
| `malo_cloud_recovery_suppressed` | 主动清空后的本机恢复保护；设备级安全状态 | No | No | No | 必须保持 device-local，跨设备同步会制造错误抑制 |
| `hasSeenFirstUseGuide` | 首次引导已看状态；临时 UI/体验状态 | No | No | No | 非用户内容；每台设备独立显示一次更合理 |
| `users.backupMode` + consent fields | Cloud Backup opt-in；云端设置 | No | N/A（不在 snapshot） | 继续存 `users` | 服务端必须以此作为上传/下载授权真相，不能依赖本地 key |

`clearLocalData()` 会清除 `storage.js` 管理的上述本地内容、nickname、oracle 与内部标记；之后生命周期另行写入 `malo_cloud_recovery_suppressed`。`hasSeenFirstUseGuide` 不在 `clearLocalData()` 范围内。

### 2.1 Nickname 决策

选择 **C：未来 schemaVersion 2 再加入**。

- 用户合理期待换设备后昵称仍存在，因为它已经影响个性化称呼。
- 它是低风险、小体积设置，未来进入备份是合理的。
- 但它不影响核心内容可恢复性，不值得单独改变 snapshot schema、双版本恢复与测试矩阵。
- 在下一次有多个真实字段需要升级时，把 nickname 放到明确的 `preferences`/`profile` 区域，并提供 v1 → v2 migration。

### 2.2 Oracle Snapshot 决策

- 继续完全排除 Backup。
- 不做旧 local data migration，也不在本轮主动清理；清理本身会增加不必要的数据删除行为与回归面。
- dormant helper 与 key 可在未来普通代码清理中删除，但必须先确认无历史页面/调试入口依赖；它与 Cloud v2 无关。

## 3. B11｜Delete Cloud Backup Audit

### 3.1 三种动作必须独立

| Action | Local data | Existing cloud backup | Future automatic uploads |
|---|---|---|---|
| A. 关闭自动 Cloud Backup | 保留 | 保留 | 停止 |
| B. 删除云端 Backup | 保留 | 删除 owner 的全部 backup | 推荐同时关闭，避免重建 |
| C. 清空本地 Malo 数据 | 删除本机内容 | 保留 | 当前用 suppression 阻止误恢复/空覆盖 |

UI 和文案必须把三者分开，不能用“关闭备份”暗示“云端数据已删除”，也不能用“删除云备份”暗示本地内容会被清除。

### 3.2 推荐用户流程

```text
云备份卡 → 管理云备份 → 删除云端备份（danger/ghost）
  ↓ 明确确认
“这只会删除云端备份。手机里的日记和计划不会被删除。
 为避免它被自动重新创建，自动云备份也会关闭。”
  ↓ destructive confirm：“删除云端备份”
  ↓ 服务端关闭 opt-in，并删除当前 owner 的全部 user_backups
  ↓ 成功态：“云端没有备份 · 自动云备份已关闭”
```

删除成功后：

- 本地数据原样保留。
- Cloud 卡显示“自动云备份已关闭 / 云端没有备份”，`lastBackupAt` 清空。
- `backupMode` 必须为 `disabled`；用户未来可再次明确开启。
- 清除本机 `recoverySuppressed`，避免一个已经没有云端备份的旧 suppression 在未来重新启用时继续阻塞备份。它不是删除授权凭证，也不应长期残留。
- 若用户未来重新开启且本地有数据，按现有流程创建新的 v1 backup；若本地为空，不上传空快照。

### 3.3 语义方案比较

| Scheme | Behavior | Problem | Decision |
|---|---|---|---|
| A | 删除 backup + 自动关闭 Cloud Backup | 用户需再次明确开启才能重建 | **推荐**：语义稳定、状态少、不会被 `onHide` 反转 |
| B | 删除 backup + 保持 enabled + 临时 suppression | suppression 的生命周期、跨启动/跨设备与解除条件复杂；容易永久阻塞或意外重建 | Reject |
| C | 删除后保留 enabled，但跳过一次 `onHide` | 只延迟重建，下一次仍会上传；删除结果不可持续 | Reject |

当前代码下，若仅删除 `user_backups` 而仍保持 enabled，下一次符合条件的 `onHide → backupNow` 会重新创建 backup。因此“delete-only”不可发布。

### 3.4 最小后端 API

继续复用 `syncBackup`，新增 action 比单独 Cloud Function 更合适：身份、偏好、collection、snapshot 权限边界均已集中在这里。

Request：

```js
{ action: "deleteBackup" }
```

不得接受 `ownerOpenid`、`userId` 或 `backupId`。服务端流程：

1. 从 `getWXContext().OPENID` 取当前身份并 `findCurrentUser`。
2. 用**服务端事务或等价的 per-owner generation fence**把 save 与 delete 串行化：所有 `saveBackup` 必须在写 backup 的同一事务中重新读取当前 user 的 `backupMode`；delete 则改变该 user 文档为 disabled，使已经读到旧 enabled 状态但尚未提交的 save 发生事务冲突并失败/重试后被 gate 拒绝。
3. **先**把当前 user 的 `backupMode` 更新为 `disabled`，同时更新 consent 时间/版本。
4. 在上述写入成功后，按服务端 OPENID 查询并删除该 owner 的**全部** `user_backups`（包括历史重复 current rows）。
5. 删除后复查 owner rows 为零，再返回删除数量与最终 disabled 状态。

先禁用再删除的理由：即使删除阶段失败，新的 `saveBackup` 也会被 preference gate 拒绝。但这**单独并不足够**：当前实现把 user 查找与 backup 写入分开，一个在 disabled 之前已经通过检查、之后才落库的 in-flight save 仍可能重建 backup。因此 B11 的安全实现前提是让 `saveBackup` 参与同一 user 状态的事务冲突检测，或引入 save 必须验证的 server-owned operation generation。推荐优先验证 Cloud Database transaction 能力并使用 user 文档作为串行化点；不要用客户端 delay/“跳过一次 onHide”模拟锁。

在 save 已建立事务栅栏后，delete 可以先事务性写 disabled，再执行可重试的 owner 全量删除。若跨 collection/query delete 无法放进一个事务，“disable first + retryable delete + 最终零行复查”仍是安全降级：合法的新 save 已被挡住，删除部分失败则保持 disabled 并明确返回失败，不能显示成功。

建议 response：

```js
{
  ok: true,
  mode: "disabled",
  deleted: true,       // 即使原本不存在，也表示目标状态已达成
  deletedCount: 1,     // 可能 > 1，用于清理重复记录
  backup: null,
  consentVersion: 1,
  consentUpdatedAt: "server timestamp serialized value"
}
```

建议错误：

- `OPENID_UNAVAILABLE`
- `USER_NOT_FOUND`
- `PREFERENCE_UPDATE_FAILED`：未能先关闭备份，未开始删除
- `BACKUP_DELETE_FAILED`：mode 已 disabled，但仍可能有 backup；客户端应显示“自动备份已关闭，云端删除未完成，请重试”
- `BACKUP_DELETE_PARTIAL`：删除重复 rows 时仅部分成功；同样不得显示完成
- `UNSUPPORTED_ACTION` / `UNEXPECTED_ERROR`

成功应具有目标状态幂等性：重复调用在云端已无记录时仍返回 `ok: true, deletedCount: 0, mode: "disabled"`。

### 3.5 隐私影响

发布 B11 前需要修改/复核，但不在本轮修改：

- **小程序内隐私/关于页：需要更新。** 说明关闭自动备份不会删除已保存数据；删除云备份会删除云端副本、保留本机内容并同时关闭自动备份；说明删除范围包含 owner 的全部 backup。
- **数据保存期限说明：需要更新。** 明确“保留到用户主动删除/服务终止或达到声明期限”，并说明删除后的处理结果；若还有运营/安全备份或法定留存，应如实写明实际窗口，不能承诺即时不可恢复而后台仍保留。
- **微信用户隐私保护指引：需要在发布前审阅并在不一致时更新。** B11 不新增一种个人信息或新的隐私接口，但新增了用户删除路径与处理语义；平台声明中的处理目的、保存期限、用户权利/删除方式应与实际一致。腾讯云关于微信小程序隐私保护指引的适配说明也强调按实际使用的信息类型完善并提交指引：https://cloud.tencent.com/document/product/1301/97930 。

这部分是产品与工程审计建议，不替代法律意见；最终文本应以实际云端留存/日志策略和主体义务为准。

### 3.6 B11 Verdict

- **Release：Recommend for 1.1**
- **Complexity：Medium**
- **Risk：Medium**
- **Rationale：** 用户私密内容已经进入云端，但当前只能停传，不能主动删除现有 backup。B11 能补齐控制闭环；同时涉及 destructive UI、重复记录全删、偏好与删除顺序、onHide 竞态以及失败态，不能评为 Low。它不需要 snapshot v2 或新 collection。

## 4. B12｜Backup History Audit

### 4.1 三种历史模型比较

| Model | Records / volume | Restore & migration | UI / privacy / cost | Assessment |
|---|---|---|---|---|
| A. 每次整份 snapshot 留历史 | 每次保存新增近 1 MiB 记录，`onHide` 频繁时增长快 | 恢复简单；每个历史版本仍需 schema compatibility | 列表、差异含义、保留期、批量删除都要新增；存储/读成本最高 | 不加去重/节流/retention 不可接受 |
| B. record-level history | 记录数最多，但小记录可去重 | 需要实体 schema、版本链、删除语义和逐记录恢复 | UI 与冲突解释最复杂；已经接近同步系统 | 不适合作为现有 Backup 的第一版 history |
| C. latest + 少量 checkpoint | 上限固定；仅 2–3 份历史 | 整份恢复，复杂度可控 | 用户较易理解；仍需历史选择、删除与 retention | 若未来有需求证据，最小可行方案 |

History 把产品语义从“防止本地数据丢失”扩大为“版本管理”。当前仓库没有误删率、误覆盖投诉或恢复旧版本需求数据，也没有回收站。不能只因为技术上可做就让私密数据被更久、更多份地保留。

典型价值：误删日记、错误覆盖、同步冲突后的回退。但最后一项只有先引入 B13 才会成为系统性需求；前两项应先用用户反馈验证，也可先评估本地 soft-delete/短期回收站是否更贴近问题。

### 4.2 若未来实现的最小方案

建议 C：保留 current latest，并使用独立 `backup_history` collection 保存最多最近 3 个**有意义变化**的 snapshot checkpoint。

不要把 `latest/previous_1/previous_2` 塞进同一个 `user_backups` 文档：单份当前已允许接近 1 MiB，三个 snapshot 会超过单文档上限或把每次更新变成大对象整体重写。独立 collection 能独立查询、retention 与删除，也能让 current 读取保持稳定。

建议字段：`ownerOpenid`、`userId`、`schemaVersion`、`appVersion`、`snapshot`、`snapshotBytes`、`contentHash`、`source`、`createdAt`。索引为 `ownerOpenid + createdAt desc`，可选 `ownerOpenid + contentHash` 去重。

边界建议：

- 不应每次 `onHide` 都无条件创建历史；先计算 canonical content hash，只在内容变化时 checkpoint，并做时间节流。
- retention：每 owner 最近 3 个，同时设置不超过 90 天（最终期限需产品/隐私确认）。
- 恢复 UI 显示时间、app/schema、大小和“会覆盖本机核心数据”的确认；恢复历史前仍执行本地 pre-snapshot 与回滚保护。
- B11 删除必须同时清除 `user_backups` 和 `backup_history`；关闭备份则两者都保留。
- 每个历史 snapshot 独立按其 schema 走验证/migration router；不能让旧版本绕过校验。

### 4.3 B12 Verdict

- **Release：Defer；至少 1.2 再评估**
- **Complexity：Medium**（若选 record-level 则 High）
- **Risk：Medium**
- **Product value evidence：当前无仓库内证据；只有合理假设场景**
- **Rationale：** 会增加私密内容副本、云成本、保留期义务与 destructive restore UI。先收集误删/覆盖的真实频率；若证据成立，再做“最多 3 个整份 checkpoint”，不要直接进入记录级历史。

## 5. B13｜True Multi-device Sync / Conflict Merge Audit

### 5.1 Backup 与 Sync 的区别

- **Backup/Restore：** 某台设备周期性上传整份状态；只有本地为空或用户明确恢复时下载。目标是灾难恢复。
- **Sync：** 每台设备持续交换增量变化，在本地已有数据时也要拉取、合并、传播删除并解决并发。目标是多端收敛到一致状态。

Malo 当前明确是前者。`getStatus` 没有 revision，启动时本地有 meaningful data 就不会拉云端，`saveBackup` 也没有 compare-and-set。

### 5.2 现有代码下的 A1/B1 场景

1. 设备 A 本地写入日记 A1，`onHide` 上传整份 snapshot A，云端 latest = A。
2. 设备 B 已有旧本地数据，因此启动时跳过自动恢复；它不知道 A1。
3. B 写入 B1，`onHide` 上传整份 snapshot B，服务端直接更新同一逻辑 latest；云端变为 B，A1 若不在 B 的旧 snapshot 中就从云端消失。
4. A 仍保留自己的 A1；它下次有机会 `onHide` 时可能再次整份覆盖，令云端又失去 B1。

所以当前不是稳定的“最后编辑获胜”，而是“最后一次成功上传的**整份设备状态**获胜”；两台设备可以反复覆盖，没有冲突检测或合并。

### 5.3 Merge 粒度

| Granularity | Benefit | Required machinery | Complexity / risk |
|---|---|---|---|
| 整份 snapshot LWW | 与 v1 最接近 | server revision + conditional save 至少能检测 stale write | Low–Medium，但仍会丢另一设备独有记录；不能称为真正 merge |
| Record-level merge | 不同 id 的 diary/wish/voice/card 可并集；冲突局部化 | 每条 `updatedAt/version/deletedAt`、server revision、outbox、idempotency | **推荐的最低真实 sync 粒度**；High |
| Field-level merge | 可合并同一记录的不同字段 | 字段版本/CRDT 或复杂操作日志、可解释 UI | Very High；日记语义容易产生用户从未写过的混合文本，不推荐 |

记录级是最低合理粒度，但当前记录不具备条件：

- diary edit 会保留原 `createdAt`，没有 `updatedAt`/version。
- wish 只有 `createdAt/completedAt`，删除没有 tombstone，其他修改无统一更新时间。
- voice 与 custom emergency card 基本是 immutable + delete，也没有 tombstone。
- client id 由时间 + random 生成，尚无 server revision、deviceId 或 mutation id。

### 5.4 删除冲突

“A 删除 diary X、B 仍保留 X”不能靠数组并集解决，否则 X 会被 B 永久复活。真正同步至少需要：

- `deletedAt` tombstone
- record `version` 或 server-assigned revision
- 删除 mutation 的幂等 id
- tombstone retention 与设备游标/ack 规则

默认建议：较新 server revision 的 tombstone 胜过旧实体；若 B 在看到删除后又明确编辑 X，则将其视为新冲突，产品可保存冲突副本而不是静默复活。直接弹出每个冲突让用户裁决会显著增加 UI 与测试成本，不适合第一版。

### 5.5 修改冲突

同一 diary X 在 A/B 同时编辑时：

- 纯 client timestamp LWW 不安全，设备时钟可能偏移。
- server timestamp LWW 可确定收敛，但后到服务器不等于用户真正想保留的版本。
- 第一版若实现，应使用 server revision 确定顺序，同时对“基于同一 baseRevision 的两次 diary 修改”保留 losing conflict copy/审计窗口；不要字段级拼接。
- manual conflict resolution 只有在真实冲突率证明值得后再增加。否则会把复杂概念暴露给用户。

### 5.6 Offline-first 最小协议要求

1. 每条实体有稳定 id、`createdAt`、`updatedAt`、`version`、可选 `deletedAt`。
2. 服务端分配单调 `serverRevision`，不能依赖设备时间排序。
3. 每个安装有随机 `deviceId`（不作为身份），每次 mutation 有稳定 `clientMutationId` 以支持断网重试幂等。
4. 本地 durable outbox 保存待上传 mutation；收到 ack 后才移除。
5. 客户端持有 `syncCursor`，按 revision 增量拉取；失败重试不跳游标。
6. stale base version 触发明确的冲突策略，而不是无条件覆盖。
7. 删除用 tombstone 传播；在所有合理活跃设备有机会看到后，才按 retention 回收。
8. snapshot backup 可继续作为灾难恢复，但不能同时作为 sync 的权威增量日志。

这至少要求 record `updatedAt/version/deviceId/deletedAt`、server revision 与新的同步存储模型，已经不是简单的 Backup 增强。

### 5.7 B13 Verdict

- **Release：2.0+ / future**
- **Complexity：High**
- **Risk：High**
- **Product value：潜在高，但当前没有用户规模、跨设备活跃度或冲突率证据**
- **Testing cost：高；需双设备、离线、重试、乱序、重复 mutation、删除/编辑交叉、版本升级与长时间 tombstone 测试**
- **Rationale：** 现在承担会同时改变数据模型、生命周期、删除语义和用户心智。应先用产品数据证明多设备场景，再作为独立项目设计，而不是塞进 Malo 1.1 Cloud Backup。

## 6. Backup Schema Version Decision

### Decision：**No，Malo 1.1 不需要 schemaVersion 2。**

- B11 删除的是 owner 的 backup rows 并更新 `users.backupMode`，不读取或改变 snapshot payload，可安全运行于 v1。
- B12 不进入 1.1；未来即使先做整份 history，也可保存原 schemaVersion 的 snapshot，但必须为多版本恢复建立 migration router。
- B13 需要的是新同步协议/记录模型，不能靠给现有整份 snapshot 加几个字段就解决。
- nickname 等到下一次真正 schema upgrade 一起加入。

因此 v1 的 collect/validate/restore 与 1 MiB 限制在 1.1 保持不动。

## 7. Cloud Data Model Recommendation

| Collection | Release / purpose | Owner & authorization | Required index | Retention |
|---|---|---|---|---|
| `users` | Current；身份与 Cloud Backup preference | `openid` 仅服务端读取；client 得到 `_id` 但不用于授权 | `openid` 唯一或至少高选择性索引；部署侧需确认 | 按账户/服务政策；consent metadata 应与处理记录要求一致 |
| `user_backups` | Current + 1.1；每 owner 的逻辑 latest v1 snapshot | `ownerOpenid = server OPENID`，`userId = users._id` | `ownerOpenid + updatedAt desc`；未来应修复重复并尽可能约束唯一 current | 保留到主动删除、服务终止或声明期限；B11 删除全部 owner rows |
| `backup_history` | **Future only**；最多 3 个有意义 checkpoint | 同样只允许服务端 OPENID 访问 | `ownerOpenid + createdAt desc`；可加 owner + contentHash | 建议最近 3 个且最多 90 天，最终由隐私/产品确认；随 B11 全删 |
| `sync_records` | **2.0+ only**；按 entity type/id 保存 current record/tombstone | 服务端 OPENID；不能信任 client owner | unique-ish `ownerOpenid + entityType + recordId`，另有 owner + serverRevision | 实体按用户生命周期；tombstone 有独立且足够长的 ack/retention 规则 |
| `sync_state` / mutation ledger | **2.0+ only**；server revision、幂等 mutation 与 device cursor metadata | 服务端 owner | owner + revision；owner + clientMutationId | 幂等窗口与活跃设备窗口，期限需压测后定义 |

**Malo 1.1 不新增 collection。** B11 复用 `users` 与 `user_backups`；不要提前创建空的 history/sync 表。

## 8. Privacy / User Control Audit

| Control | Existing | Missing / issue | Recommendation |
|---|---|---|---|
| Cloud Backup opt-in | Yes；server `unconfigured/enabled/disabled` | — | 保持显式 opt-in 与服务端 gate |
| 查看最近备份时间 | Yes | duplicate 状态未对普通用户解释 | B11 不扩大；运维侧关注 duplicate count |
| 立即备份 | Yes | 无 revision/conflict detection | v1 保持；不要宣传为同步 |
| 手动恢复 | Partial；主动本地清空后可恢复 | 普通有数据状态无安全 restore UI | B11 不改；History/force restore 另行设计 |
| 删除云备份 | **No** | 用户无法自助删除 retained backup | B11 1.1 增加，并自动关闭 backup |
| 关闭云备份 | Yes | 关闭后云端仍保留，当前文案已有提示 | 与删除操作持续分离 |
| 数据保存说明 | Partial | 缺少明确期限/删除范围与异常日志说明 | 发布 B11 前按真实后端策略补齐 |

推荐用户可见的三个并列概念：

1. “关闭自动云备份”——停止后续上传，云端现有备份保留。
2. “删除云端备份”——本机保留，云端备份删除，自动备份同时关闭。
3. “清空本机数据”——云端保留，并抑制自动恢复，除非用户手动恢复。

## 9. Failure Modes

| # | Failure mode | Current Protection | Future Needed Protection |
|---:|---|---|---|
| 1 | save 服务端成功但客户端超时并认为失败 | 下次 save 通常覆盖同一 logical latest，不会主动复制；但无 request id | `clientMutationId`/content hash，状态对账与幂等 ack |
| 2 | 两设备同时 save | 无；后成功更新整份 snapshot 获胜 | 至少 server revision + conditional write；真 sync 用记录级 merge |
| 3 | 删除后 `onHide` 自动重建 | 当前无 delete，若简单加 delete-only 必然存在 | B11 服务端先 disabled 再删；客户端立即更新 lifecycle state |
| 4 | restore 遇到旧/未知 schema | 精确拒绝非 v1，不会盲写 | 版本 router、逐版本 migration、不可迁移时可解释错误 |
| 5 | cloud snapshot 损坏 | server/client shape + size validation；恢复后语义校验与 rollback | 深度字段 schema、checksum/content hash、隔离坏备份 |
| 6 | payload/record 部分字段缺失 | 顶层数组存在性检查；元素深度有限 | 每类 record 的严格 validator 与默认/migration 规则 |
| 7 | 云端 backup 不存在 | `exists:false` / `CLOUD_BACKUP_NOT_FOUND`，本地为空时不上传空快照 | B11 让 delete 幂等；UI 区分“从未备份/已删除/查询失败” |
| 8 | 客户端伪造 userId/owner | 已保护：不接受 owner，服务端 OPENID 绑定 | 保持；所有新 action 同样禁止 client owner 参数 |
| 9 | 上传/下载网络中断 | 返回 cloud error，本地仍是权威 | 可恢复重试、幂等 mutation、退避与状态对账 |
| 10 | 主动清空本地后被自动恢复 | `recoverySuppressed` 阻止恢复与上传 | B11 成功后清理 stale suppression；所有新 lifecycle 测试此不变量 |
| 11 | 同 owner 出现重复 `user_backups` rows | 统计 duplicate count，读取最新一行 | B11 全删；部署侧检查索引/历史数据并提供安全去重策略 |
| 12 | restore 多 key 写入中途失败 | pre-restore snapshot + 尝试 rollback | staged restore marker/启动恢复检查；更深的 rollback 故障可观测性 |
| 13 | snapshot 超过 1 MiB | client/server 双重拒绝 | UI 容量提示、数据增长监控；未来拆分前先有迁移方案 |
| 14 | client 设备时钟错误 | cloud `updatedAt` 用 serverDate，但 record 冲突无保护 | 真 sync 只用 server revision 排序，client time 仅作展示/元数据 |
| 15 | preference 更新成功但客户端未收到响应 | 下次启动会重新读 server truth | mutation id + 主动 refresh；UI 不把超时直接当成未改变 |
| 16 | B11 删除重复 rows 时只删一部分 | 当前无保护 | disable-first；返回 partial error；按 owner 重试到零并复查 status |
| 17 | stale device 覆盖更新设备的数据 | 无 | conditional base revision，冲突分支或记录级 merge |
| 18 | 已删除记录被离线设备复活 | 无 tombstone，因此真 sync 下必然发生 | `deletedAt` + version + tombstone retention/ack |
| 19 | History 无限增长/保存重复快照 | 当前无 history | content hash、节流、最近 3 个 + 时间 retention、配额告警 |
| 20 | Delete 与已经通过 preference 检查的 in-flight save 竞态 | 当前无 delete；当前 save 的检查与写入不是一个事务 | save/delete 必须共享 user 文档事务或 generation fence；disable-first 后全删并复查零行 |

## 10. Decision Matrix and Recommended Malo 1.1 Cloud Scope

| Bonus | Product Value | Complexity | Risk | Recommended Release | Verdict |
|---|---|---|---|---|---|
| B11 Delete Backup | High | Medium | Medium | 1.1 | Implement next；仅 A 方案 |
| B12 Backup History | Unproven Medium | Medium | Medium | Defer / 1.2 discovery | Do not implement now |
| B13 Multi-device Sync | Potential High | High | High | 2.0+ / future | Separate project; do not implement as Backup v2 patch |

最终推荐的 Malo 1.1 Cloud Scope：

1. 保持 `schemaVersion: 1` 与现有 snapshot payload 不变。
2. 在 `syncBackup` 增加 server-owned `deleteBackup` action。
3. 删除时先把 `backupMode` 设为 disabled，再删除 owner 的全部 backup rows。
4. 本地数据保留；成功后清除 stale recovery suppression；未来重新启用必须再次明确 opt-in。
5. nickname 继续 Local-only，等下一次真正 schema v2 一起纳入。
6. oracle snapshot 继续排除，不做 migration。
7. History defer；先收集误删/误覆盖证据。
8. Multi-device Sync defer 到 2.0+，先做独立产品验证与协议设计。
9. 不新增 Cloud Collection。
10. 发布 B11 前让小程序内说明、保存期限和微信隐私保护指引与真实行为一致。

## 11. Next Implementation Plan — B11 Only

本节只定义下一轮计划，不在本次 audit 实现。

### 11.1 Files

预计最小修改范围：

- `cloudfunctions/syncBackup/index.js`
- `utils/cloud-backup.js`
- `utils/cloud-backup-lifecycle.js`
- `pages/about/index.js`
- `pages/about/index.wxml`
- `pages/about/index.wxss`（仅新增危险操作样式所需）
- 对应的测试/验收文档；如更新隐私文案，以现有隐私/关于页面为准

明确不改：`utils/backup-snapshot.js`、snapshot schema、用户身份模型、其他 Cloud Function、Backup/History collection 结构。

### 11.2 Cloud Function changes

1. 添加 `deleteBackup` route，仍在所有 action 前从 server context 获取 OPENID 并查 user。
2. 不解析 client owner/userId/backupId。
3. 先验证 Cloud Database transaction 的具体能力；将 `saveBackup` 的“读取 user mode + 写 current backup”放入共享 user read-set 的事务，或实现等价 server-owned generation fence，消除已过 gate 的 in-flight save。
4. delete 事务性更新 mode disabled；成功后查出并删除全部 `ownerOpenid` rows，并复查为零。
5. 零行按幂等成功处理；partial delete 保持 disabled，允许重试收敛。
6. 对 preference failure、transaction conflict exhaustion、delete failure、partial delete 分别返回可诊断 code；日志不得输出 snapshot 或私密内容。
7. 除并发栅栏外，保持现有 save/get/getStatus/getPreference/setPreference 对外语义与 v1 validation 不变。

### 11.3 Client changes

1. `cloud-backup.js` 增加无 owner 参数的 `deleteCloudBackup()` wrapper。
2. lifecycle 增加单一 in-flight destructive operation guard；操作期间阻止 `onHide` backup。
3. 成功后原子地更新内存状态为 disabled、`lastBackupAt = null`、无 backup，并清除本机 recovery suppression。
4. 失败后重新读取 server preference/status 对账；若 mode 已 disabled 但 delete 未完成，明确提示重试，不显示“已删除”。
5. About 页把“关闭自动备份”“删除云端备份”“清空本机数据”作为三个清晰动作；delete 使用 danger/ghost，不与普通 CTA 同权重。

### 11.4 Privacy copy

- 确认弹窗：云端删除、本机保留、自动备份同时关闭。
- 关闭备份文案：停止上传但现有云备份保留。
- 本机清空文案：本机删除、云端保留、不会自动恢复。
- 保存期限/删除结果按真实 Cloud Database、日志和运维备份策略表述。
- 发布前复核微信后台用户隐私保护指引中的处理目的、保存期限和删除路径；必要时提交更新。

### 11.5 Targeted test plan

Cloud Function / API：

1. enabled + 单 backup：删除成功、mode disabled、owner rows = 0。
2. enabled + 无 backup：幂等成功、mode disabled。
3. enabled + duplicate rows：全部删除，`deletedCount > 1`。
4. disabled + retained backup：仍可主动删除并保持 disabled。
5. 伪造 owner/userId/backupId 字段：被忽略或拒绝，绝不能影响其他 owner。
6. preference update 失败：不执行删除，返回明确错误。
7. 部分删除/查询失败：保持 disabled，返回 partial/failure；重试可收敛到零。
8. 与 save 并发：覆盖“save 在 delete 前/后/两者之间通过旧 gate”三种时序；旧状态事务提交必须冲突或先完成后被删除，最终 owner rows 恒为零。

Client / simulator / real-device：

9. 删除成功后本机 diary/wish/voice/custom card 均不变化。
10. 删除成功后立即切后台、再次启动，都不会重建 backup。
11. 成功后状态显示“已关闭/无云端备份”，最近备份时间清空。
12. 网络中断/超时后 UI 不虚假宣称成功，并能通过刷新对账。
13. intentional local clear → delete retained cloud：成功后 stale suppression 清理；再次开启时遵循本地有/无数据规则。
14. 关闭备份仍保留云数据；清本机仍保留云数据；三个动作回归互不混淆。
15. 窄屏下危险按钮与确认文案不截断，二次确认可取消，连续点击不会并发提交。
16. v1 save/get/restore、1 MiB 拒绝、损坏 snapshot rollback 全部回归通过。

### 11.6 Deployment and rollback plan

1. 先部署向后兼容的 Cloud Function action，再发布调用它的客户端。
2. 观察 delete success/failure/partial count 与重复 rows，但日志只记录 metadata/code。
3. 若出现客户端问题，先下线/隐藏客户端删除入口；服务端保留未被调用的兼容 action最安全。
4. 若必须回滚 Cloud Function，应先确保没有仍在调用 `deleteBackup` 的已发布客户端；不能通过回滚重新创建用户已删除的数据。
5. 已成功删除的 backup 不可恢复，回滚计划只恢复代码路径，不恢复私密内容。

## 12. Audit Status

- B11：Ready for a separate Malo 1.1 implementation round, subject to the API/UX/test constraints above.
- B12：Not ready for implementation; needs product evidence and retention decision.
- B13：Not ready for implementation; requires a separate 2.0+ sync architecture project.
- Production code modified in this audit：**No**。
