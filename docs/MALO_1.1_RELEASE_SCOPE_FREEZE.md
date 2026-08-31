# Malo 1.1｜Release Scope Freeze Audit

审计日期：2026-08-31

审计分支：`feature/malo-1.1`

审计起点：`e86d8f5`（1.0H production baseline / `master`）

审计时 HEAD：`b7cf8c9`

本文件冻结 Malo 1.1 的发布范围。它不授权修改生产代码、部署 Cloud Function 或变更微信公众平台配置。

## 1. Release baseline

- `master` 与 `mvp-1.0H-rc2-final` 均仍为 `e86d8f5`。
- 当前分支为 `feature/malo-1.1`，审计开始时 working tree clean。
- `e86d8f5..b7cf8c9` 共 37 个 commits，其中 34 个 commits 触及 runtime 文件；3 个仅涉及 docs/tests-only 范围。
- 总体 diff：65 files，约 4467 insertions / 185 deletions。
- Batch 4 checkpoint 为 `e970b1d`；Batch 5 Audit checkpoint 为 `b7cf8c9`。
- Freeze Audit 静态验证：42 个 JS 文件语法检查通过、全部 JSON 可解析、21 个 routes 页面文件完整；B11 server 18 组断言和 lifecycle 4 场景通过。

### Release blocker summary

当前不能直接进入最终 Full Regression：先完成一次严格受限的 Release Fix Pass，再从新的冻结 commit 开始回归。

1. 用户界面仍显示 `MVP 1.0H / 云备份发布候选版`。
2. `submitFeedback` 服务端只接受 `MVP 1.0H`；客户端版本字符串不能单独改为 1.1，否则 1.1 的 Feedback Cloud 会稳定失败。
3. 仓库可以证明 B11 代码与测试存在，但不能证明相同 revision 已部署到 Production Cloud；必须部署后做真实 Cloud smoke，且继续验证 1.0H 兼容。

## 2. Shipping features

### A. First-use / UX

- **Included in 1.1 — B05**：首页首次使用引导，自动状态与手动打开状态分离；首次关闭后不再自动出现，但可通过“查看引导”重开。
- 首页 Croissant 护身符动作区整理为 2×2；引导关闭控件为低权重圆形安全热区。
- **Included in 1.1 — B17**：日记保存成功页 CTA 重排并完成视觉收口。

### B. Diary

- **Included in 1.1 — B06**：新增 30 秒记录 `entryMode="quick"`。
- quick 保存事实、问题分类、事件等级和可选情绪；详情页明确标识快速记录。
- Quick → Full 复用同一条 diary id 原地升级，保留原事实/情绪，不复制第二条记录。
- 日记详情的复制、回日记本、去复盘台、删除统一为事实纪要卡底部 2×2 动作区；删除保持 danger/ghost 与二次确认。

### C. Daily Oracle

- **Included in 1.1 — B01**：今日职场猩象天气化、视觉层级与文案库扩充。
- **Included in 1.1 — B02**：用户主动把今日职场猩象海报保存到系统相册。
- 海报明确说明内容是每日陪伴，不是心理测量；不再产生新的内部 oracle 收藏。

### D. Croissant

- 累计展示为“累计磨损点：N”，不再暗示百分比。
- 算法、阈值、状态名称和状态图片未改变。

### E. Weekly Review / Dashboard

- **Included in 1.1 — B07**：轻量一周回顾，基于真实 diary 数据。
- **Included in 1.1 — B03**：7/30 天最近职场模式已合并进“吗喽复盘台”，包含记录数、平均事件等级、4–5 级事件、问题分布、重复问题、前段对比和最高影响记录。
- 独立 `pages/insights` 页面源码仍在，但普通用户入口已经移除；shipping surface 是 Dashboard 中的合并能力，不是独立 Insights 产品。

### F. Toolbox

- **Included in 1.1 — B08**：女性职场边界练习。
- 百宝箱保留泡泡机、呼吸练习、急救卡、出走小技能、nickname、隐私说明与试用反馈。
- legacy 离职状态自测从普通用户可见列表中移除。

### G. Plans

- **Included in 1.1 — B09**：离职准备模板，可选择性加入现有 Plan；继续使用 `malo_wish_items`，没有新 schema。

### H. Personalization

- **Included in 1.1 — B04**：可选 Malo nickname，最多 16 个 Unicode 字符。
- nickname 仅保存在当前设备，不读取微信昵称，不作为身份或公开用户名；用于首页陪伴、Croissant 提醒和 Weekly Review。

### I. Cloud Backup

- **Included in 1.1 — B11**：管理云备份与删除云端备份。
- 删除由 `syncBackup.deleteBackup` 取得服务端 OPENID，先关闭 Backup 并增加 server-owned generation，再删除当前 owner 的全部 `user_backups`，复查为零。
- 删除只影响云端副本；本机内容保留。删除后 onHide 不会立即重建，重新开启后才可再次保存。
- Backup snapshot 继续是 `schemaVersion: 1`。

### J. Privacy

- 小程序内说明新增 Backup 关闭与删除的区别、删除后保留本机内容、自动备份同时关闭以及管理入口。
- nickname 页面和隐私页说明 nickname Local-only，不读取微信昵称、头像或手机号。

### K. Voice / Community

- 1.1 继续 shipping 静态 `FEATURED_VOICES` 与用户本地心声。
- **B14、B15 没有 runtime implementation**。没有投稿入口、公共 UGC feed、评论、回复、私信、关注或手机号。

### L. Assessment

- **B10 仅 Design only**。新版自查只有设计文档；legacy `pages/exit-test` 源码与 route 保留 dormant，但普通用户入口已移除。

### M. Technical / Docs

- 新增 B10 redesign、Cloud v2 audit、B11 privacy control、UGC/community decision gate 与 B11 targeted tests。
- 这些文档和 future architecture 不代表 B10/B12/B13/B14/B15 已上线。

## 3. 17 Bonus final disposition

| Bonus | Final Status | Runtime in 1.1? | Notes |
|---|---|---:|---|
| B01 今日职场猩象天气化 | ✅ Implemented | Yes | 首页视觉与内容增强 |
| B02 保存今日职场猩象卡片 | ✅ Implemented | Yes | 最终形态为保存图片到系统相册；内部 snapshot UI 已撤回 |
| B03 今日职场猩象历史趋势 | ✅ Implemented | Yes | 基于真实 diary 的 7/30 天模式，合并进 Dashboard |
| B04 Malo nickname | ✅ Implemented | Yes | Local-only，不是微信身份 |
| B05 首次使用引导线 | ✅ Implemented | Yes | 自动一次 + 手动重开状态分离 |
| B06 日记轻量化 | ✅ Implemented | Yes | 30 秒记录、字段对齐、Quick → Full 原地升级 |
| B07 一周回顾 | ✅ Implemented | Yes | 真实 diary 数据，独立 weekly-review 页面 |
| B08 女性职场边界练习 | ✅ Implemented | Yes | Toolbox 可见 |
| B09 离职准备模板 | ✅ Implemented | Yes | 可选加入现有 Plan |
| B10 新版离职状态自查 | 📝 Design only | No | redesign 文档保留；legacy assessment hidden |
| B11 Delete Cloud Backup | ✅ Implemented | Yes | 代码完成；Production deployment/smoke 仍是 release gate |
| B12 Backup History | ⏭ Deferred | No | 至少 1.2 再基于需求证据评估 |
| B13 Multi-device Sync | ⏭ Deferred | No | 2.0+ 独立协议与数据模型项目 |
| B14 Curated Voice Submission | 📝 Design only | No | 推荐 1.2；UGC gates 未满足 |
| B15 Open Community | ⏭ Deferred | No | 2.0+；不进入 1.1 |
| B16 Phone Number | 🧊 Frozen | No | 当前无最小必要性 |
| B17 日记保存成功页 CTA | ✅ Implemented | Yes | 保存后动作区完成重排 |

## 4. Runtime surface

### User-visible routes

5 个 TabBar：

- `pages/index/index` — 今日
- `pages/diary/index` — 日记
- `pages/wishlist/index` — 计划
- `pages/voice/index` — 心声
- `pages/toolbox/index` — 百宝箱

1.1 新增并 shipping 的 subpackage 页面：

- `pages/boundary-practice/index`
- `pages/resignation-templates/index`
- `pages/weekly-review/index`
- `pages/nickname/index`

上述页面的 `.js / .json / .wxml / .wxss` 均存在，且 route 已写入 `app.json`。

### Dormant routes

- `pages/insights/index`：route 和四个页面文件存在，但当前没有普通用户导航入口；其高价值能力已经迁入 Dashboard。
- `pages/exit-test/index`：route 和源码保留；`TOOLBOX_ITEMS` 中仍为 `enabled:false`，同时 Toolbox 在构造普通用户列表时明确过滤该 path。Dashboard 中残留未绑定的 `goExitTest()` 方法，但 WXML 没有触发入口。

### Confirmed absent from runtime

- B14 投稿入口、`voice_submissions`、`submitVoice`：不存在。
- B15 公共社区/feed/互动：不存在。
- 手机号与 `getPhoneNumber`：不存在。
- `backup_history` collection/runtime：不存在。
- `sync_records`、record merge 或 multi-device sync runtime：不存在。

`app.json` 中所有 21 个当前 routes 的 `.js / .json / .wxml / .wxss` 完整性检查通过。没有发现误暴露的 B14/B15/B16 页面。

## 5. Local storage

| Storage key / field | Baseline | Purpose | User content? | Cloud Backup | Local-only | Clear local data |
|---|---|---|---:|---:|---:|---:|
| `malo_diary_entries` | 1.0H | 日记与 quick/full 记录 | Yes | Yes | No | Yes |
| diary `entryMode` field | 1.1 | `quick` 标识；full 无需该值 | Yes, within diary | Yes, via diary array | No | With diary |
| `malo_wish_items` | 1.0H | Plan、自定义计划、B09 加入项 | Yes | Yes | No | Yes |
| `malo_wish_defaults_initialized` | 1.0H | 默认计划初始化标记 | No | No | Yes | Yes |
| `malo_wish_defaults_version` | 1.0H | 默认计划版本 | No | No | Yes | Yes |
| `malo_local_voice_posts` | 1.0H | 用户私有本地心声 | Yes | Yes | No when opted in | Yes |
| `malo_trial_feedback_posts` | 1.0H | Feedback 本地队列和状态 | Yes | No | Yes | Yes |
| `malo_featured_voice_hugs` | 1.0H | 静态精选的本机抱抱状态 | No/Preference | No | Yes | Yes |
| `malo_diary_cleanup_version` | 1.0H | 内部 cleanup marker | No | No | Yes | Yes |
| `malo_custom_emergency_cards` | 1.0H | 自定义急救卡 | Yes | Yes | No | Yes |
| `malo_cloud_recovery_suppressed` | 1.0H | 主动清空后的恢复/上传保护 | No/Operational | No | Yes | Clear flow intentionally sets true; not removed by `clearLocalData()` |
| `hasSeenFirstUseGuide` | 1.1 | 首次引导只自动显示一次 | No/UI preference | No | Yes | No |
| `malo_oracle_snapshots` | 1.1 dormant | 旧内部 oracle 收藏 | No, deterministic content | No | Yes | Yes |
| `malo_nickname` | 1.1 | 用户给 Malo 的本地称呼 | Yes/Preference | No | Yes | Yes |

### Storage conclusions

- Quick diary 没有新增独立 storage key；它是既有 diary 对象的 additive `entryMode` 字段，并随完整 diary array 进入 v1 snapshot。
- `malo_oracle_snapshots` helper/key 仍在，但当前没有 runtime caller，不会继续产生新 snapshot；历史值会在“清空本地数据”时删除。
- 保存到系统相册的 Oracle 图片不属于小程序 storage，也不进入 Cloud Backup；Malo 清空本地数据不会删除用户相册中的图片。
- nickname 和首次引导状态不进入 Cloud Backup。
- `utils/backup-snapshot.js` 从 1.0H 到当前没有变化；`SCHEMA_VERSION` 仍为 `1`，payload 仍只有 diary、用户 Plan/default states、local voice、custom emergency cards。

## 6. Cloud architecture

### Application-used Cloud Functions

| Function | 1.1 state | Main data |
|---|---|---|
| `loginOrRegister` | Unchanged from 1.0H | `users`；server OPENID → internal userId |
| `submitFeedback` | Runtime logic unchanged, but version allowlist still 1.0H-only | `feedback_posts` |
| `syncBackup` | B11 changed | `users`、`user_backups` |

仓库只能证明应用调用这三个 Cloud Functions 和当前源码 revision；它不能证明 Production Cloud 已部署哪个 revision。真实部署状态必须通过 Cloud Console 和 production smoke 人工确认。

### syncBackup changes in 1.1

- 新增 `deleteBackup`。
- `saveBackup`、`setPreference` 与删除 fencing 使用 user document transaction 和服务端 `backupGeneration`。
- `getStatus` additive 返回 `backupEnabled` 和 `mode`。
- 删除先关闭 backup，再删除当前 OPENID 的全部 backup rows；客户端不能指定 owner/userId/backupId。
- 没有修改 snapshot schema 或 payload。

### 1.0H compatibility evidence

- 1.0H 实际使用的 `saveBackup / getStatus / getBackup / getPreference / setPreference` 全部保留。
- 旧 request 不需要 generation；缺失 generation 时服务端下一值为 `1`。
- 旧成功 response 保持兼容；`getStatus` 变化为 additive，1.0H 显式挑选旧字段。
- B11 targeted tests：`sync-backup-b11` 18 组断言通过；lifecycle B11 4 场景通过。
- 已完成静态 1.0H Production Compatibility Gate，代码结论为 SAFE TO DEPLOY；但静态 Gate 不等于已部署或已完成 Production smoke。

### Collections

- `users`：OPENID owner、internal user id、backup preference/consent 与 B11 generation。
- `user_backups`：当前 owner 的 snapshot v1。
- `feedback_posts`：主动提交的产品反馈。
- 1.1 新增 collection：**0**。
- B12 `backup_history` 和 B13 `sync_records` 只存在于 future design 文档，没有进入 runtime。

## 7. Privacy checklist

| Topic | Classification | Release action |
|---|---|---|
| 用户主动创建的 diary/Plan/local voice/custom cards | Needs WeChat Console Review | 确认微信指引中的处理内容、目的和 Cloud Backup opt-in 与实际一致 |
| 用户主动提交的试用反馈 | Already Covered + Console Review | in-app 已区分 Feedback 与 Backup；复核 purpose、retention、controller deletion/contact path |
| OPENID / internal userId | Needs WeChat Console Review | 确认只用于身份绑定、Feedback owner 和 Backup owner，不向 UI 公开 OPENID |
| B11 Cloud Backup 删除 | Already Covered + Console Review | in-app 路径已写明；平台指引需同步删除途径与关闭 backup 的语义 |
| 数据保存期限 | Needs WeChat Console Review + In-app Copy Review | 仓库没有可验证的统一期限；必须与真实 Cloud/运维策略一致，不能承诺超出能力的即时不可恢复删除 |
| 删除途径 | Needs WeChat Console Review | 本地清除和 Backup 删除已提供；Feedback 云端删除/权利请求途径需确认平台文本是否完整 |
| nickname Local-only | Already Covered / No Change Needed | nickname 页面和隐私页已说明；不上传、不读取微信昵称 |
| 保存到相册 | Needs WeChat Console Review | 核对 `scope.writePhotosAlbum` / 保存相册用途说明和用户授权体验；图片只在用户点击后生成并保存 |
| B14/B15/B16 | No Change Needed | 未实施，不得增加投稿、社区或手机号隐私声明 |

发布前必须由管理员在微信公众平台实际检查，仓库审计不能替代平台配置截图与审核结果。

## 8. Old-version copy audit

### A. Must fix before 1.1 upload

1. `utils/constants.js:4-5`
   - 当前：`version: "MVP 1.0H"`、`stage: "云备份发布候选版"`。
   - 该值通过首页和隐私页对普通用户显示。
   - 建议：Release Fix Pass 统一为最终 1.1 产品版本与发布阶段文案。

2. `pages/index/index.wxml:108`
   - 显示 `当前版本：{{appMeta.version}} {{appMeta.stage}}`。
   - 模板本身可保留，但最终渲染不得继续是 1.0H/候选版。

3. `cloudfunctions/submitFeedback/index.js:10`
   - 服务端只接受 `APP_VERSION = "MVP 1.0H"`。
   - 禁止只替换为 1.1，因为同一 Cloud 环境中的 1.0H 仍会提交旧值。
   - 最小安全修复：服务端 additive 接受 1.0H 与最终 1.1 字符串，客户端再发送最终 1.1；完成旧客户端兼容测试后部署。

### B. Historical/planning material — do not mass-edit for release

- `docs/BATCH4_CLOUD_ARCHITECTURE_AUDIT.md` 中的 1.0H 对照属于历史基线，必须保留。
- B10、B11、Batch 5 audit 中的版本/Release 描述属于决策记录，不应批量替换。
- `DESIGN_NOTES.md` 中旧阶段的“试用版/不上传”是历史设计记录；不进入小程序包。若未来整理，应保留时间语境，不做无差别替换。

### C. Stale developer metadata / non-user copy

- `README.md:7` 仍写 `MVP 0.9E`，且 `README.md:56/201` 仍描述“不上传/无 Cloud”；已与当前产品不符。P2，建议 1.2 文档清理或在 Release Fix Pass 仅做独立 docs commit，不能与 production fix 混合。
- `project.config.json.description` 仍为“吗喽的出走 MVP 0.1”。不展示给普通用户，P2。

## 9. Dormant code

| Item | Classification | Recommendation |
|---|---|---|
| `pages/insights` route/page | Keep dormant | 普通入口已移除，高价值逻辑已进 Dashboard；1.1 发布前不要为清理 route 冒险 |
| `pages/exit-test` legacy route/page | Keep dormant | B10 仍是 design only；当前明确隐藏，保留用于未来 redesign 对照 |
| Dashboard 未绑定 `goExitTest()` | Safe cleanup before release, but P2 only | 不影响普通用户；禁止为了洁癖阻塞 1.1，可放 1.2 cleanup |
| `malo_oracle_snapshots` helpers/key | Keep dormant / 1.2 cleanup | 当前无 caller，排除 Backup，clearLocalData 覆盖；不做 migration |
| `docs/B10_RESIGNATION_SELF_CHECK_REDESIGN.md` | Do not touch before release | 有效 design artifact，不是 shipping feature |

## 10. Release blockers

### P0 — 0

静态审计没有发现已知数据丢失、核心白屏、Cloud owner 越权或五个 TabBar 根页面缺失。

### P1 — 3

1. **User-visible version identity stale**：1.1 包仍会显示 `MVP 1.0H / 云备份发布候选版`。
2. **Feedback version contract blocks a naive version bump**：客户端改 1.1 后，现有 `submitFeedback` 会返回 `INVALID_APP_VERSION`；必须 additive 兼容 1.0H 与 1.1。
3. **B11 Production deployment status unproven**：仓库与 tests 通过不等于 Production Cloud 已部署；在真实 Cloud 完成 delete → no recreation → re-enable smoke 前，B11 不能视为 release-verified。

### P2 — 5

1. README 当前版本及 Cloud/privacy 描述过时。
2. `project.config.json.description` 仍为 MVP 0.1。
3. 独立 Insights page/route dormant。
4. legacy assessment route 与未绑定 method dormant。
5. oracle snapshot helper/key dormant。

P2 全部进入 1.2 backlog；禁止借 Release Fix Pass 做无关清理。

### Manual release gates not counted as proven defects

- 微信公众平台隐私保护指引、相册权限用途、数据期限和删除路径必须人工核对。
- 服务类目、版本描述、体验流程和审核备注必须与实际 shipping surface 一致。
- 若 Console Review 发现缺失，则相应项升级为 P1，完成前不得上传。

## 11. Final regression checklist

计划规模：24 个功能组，建议约 70 个断言；至少覆盖窄屏/常规屏两种设备尺寸、全新/有本地数据/有 Cloud Backup 三类账号状态。环境标记可重复。

| ID | Area | Core checks | Simulator | Device | Real Cloud | WeChat Console |
|---|---|---|:---:|:---:|:---:|:---:|
| A | 5 TabBar | 今日/日记/计划/心声/百宝箱可进入、返回和 tab 状态正常 | ✓ | ✓ |  |  |
| B | 首次引导 | 新安装自动一次、关闭后不再自动、手动重开、2×2、窄屏关闭按钮 | ✓ | ✓ |  |  |
| C | 今日职场猩象 | 日期稳定、视觉、文案、非测量说明、CTA | ✓ | ✓ |  |  |
| D | 保存相册 | Canvas 海报、授权允许/拒绝/再次设置、图片清晰、不截字 | ✓ | ✓ |  | ✓ |
| E | Croissant | 累计磨损点、状态阈值/图片/名称不回归 | ✓ | ✓ |  |  |
| F | Full diary | 全字段保存、列表、详情、编辑/删除 | ✓ | ✓ |  |  |
| G | 30 秒记录 | 事实/分类/等级/可选情绪、entryMode、详情标识 | ✓ | ✓ |  |  |
| H | Quick → Full | 同 id 原地升级、保留字段、不产生重复记录、createdAt 保留 | ✓ | ✓ |  |  |
| I | 日记详情 | 2×2 动作、复制、跳转、danger 删除与二次确认、窄屏 | ✓ | ✓ |  |  |
| J | Weekly Review | 有数据/空态、真实记录、最高影响跳转、nickname fallback | ✓ | ✓ |  |  |
| K | Dashboard 7/30 | 指标、分布、重复问题、对比、空态、最高事件 | ✓ | ✓ |  |  |
| L | 女性边界练习 | 场景切换、练习流程、返回、无数据写坏 | ✓ | ✓ |  |  |
| M | 离职准备模板 | 预览、选择加入、去重、进入现有 Plan、Cloud restore | ✓ | ✓ | ✓ |  |
| N | Plan | 前/后离职 tabs、添加/完成/删除、默认项兼容 | ✓ | ✓ | ✓ |  |
| O | Local Voice | 静态精选、本地心声、删除、抱抱仅本机、Backup opt-in | ✓ | ✓ | ✓ |  |
| P | Toolbox | 所有 shipping 入口；legacy assessment 不可见；无 B14/B15/B16 | ✓ | ✓ |  |  |
| Q | Nickname | 16 字、trim、清空、首页/Weekly 使用、fallback、Local-only | ✓ | ✓ |  |  |
| R | Feedback Cloud | 新 1.1 request 成功、1.0H request 继续成功、重复 id、失败重试 | ✓ | ✓ | ✓ | ✓ |
| S | Cloud Backup | opt-in、launch restore、onHide、立即备份、关闭、状态 | ✓ | ✓ | ✓ | ✓ |
| T | B11 Delete | 删除全部 rows、local 保留、mode disabled、onHide 不重建、重开再建、跨 owner 隔离 | ✓ | ✓ | ✓ | ✓ |
| U | Privacy page | Backup/Feedback/nickname/删除文案与实际一致，无 UGC/手机号虚假声明 | ✓ | ✓ |  | ✓ |
| V | Clear local / protection | 清本地、recoverySuppressed、防自动恢复/空上传、手动恢复 | ✓ | ✓ | ✓ |  |
| W | Console | 无 blocking error；无 routeDone/webviewId 稳定复现；权限拒绝可恢复 | ✓ | ✓ | ✓ | ✓ |
| X | Git/package | clean tree、正确 HEAD/tag、master untouched、routes/files、上传包不含 docs/raw assets | ✓ |  |  | ✓ |

### Regression sequencing

1. Release Fix Pass：只处理 P1-01/P1-02，并记录 B11 Cloud deployment revision。
2. Static gate：JS syntax、JSON parse、route completeness、targeted Node tests、1.0H compatibility tests。
3. Simulator：完成 A–X 中所有 Simulator 项。
4. Device：窄屏 + 常规屏，重点 B/D/I/Q。
5. Real Cloud：专用账号完成 R/S/T/V，并验证 1.0H production client。
6. WeChat Console：隐私指引、相册权限用途、版本/类目/审核备注、Cloud Function revision。
7. 仅修 P0/P1；新发现 P2 进入 1.2 backlog。

## 12. Go / No-Go criteria

### SHIPPING

- B01 Daily Oracle weather visual
- B02 Oracle poster save to album
- B03 real diary 7/30 insights merged into Dashboard
- B04 Local-only nickname
- B05 first-use guide
- B06 quick diary + in-place Quick → Full
- B07 Weekly Review
- B08 workplace boundary practice
- B09 resignation preparation templates
- B11 Cloud Backup deletion
- B17 diary saved/detail action improvements
- Croissant cumulative wording and supporting UI polish

### DESIGN ONLY

- B10 resignation self-check redesign
- B14 moderated anonymous voice submission
- B12/B13 future architecture descriptions are design material only, not runtime

### DEFERRED

- B12 Backup History — >= 1.2 discovery
- B13 true multi-device Sync — 2.0+
- B15 open community — 2.0+

### FROZEN

- B16 phone number — reopen only for a validated minimum-necessary service need

### REMOVED / HIDDEN

- legacy resignation assessment ordinary-user entry
- standalone Insights ordinary-user entry
- internal Oracle snapshot collection UI and new snapshot generation

### Go criteria for Final Regression

- P1-01 and P1-02 fixed in a minimal, reviewed Release Fix Pass.
- `submitFeedback` accepts both deployed 1.0H and final 1.1 version strings before the 1.1 client switches.
- B11 Production `syncBackup` revision is known and 1.0H compatibility smoke passes.
- 微信 Console manual privacy/permission review has no unresolved required item.
- working tree clean and a new immutable release candidate checkpoint exists.

### No-Go criteria for 1.1 upload

- Any P0 or unresolved P1.
- 1.1 still renders 1.0H/candidate copy.
- Feedback fails from either 1.0H or 1.1.
- B11 delete recreates onHide, deletes another owner, or is not deployed.
- Console privacy configuration does not match actual record, Feedback, OPENID, Backup deletion or photo-album behavior.
- Full Regression contains a stable core-flow failure.

### Current recommendation

- Ready for Release Fix Pass：**Yes**。
- Ready for Final Regression：**No, until the three P1 gates are closed**。
- Ready for 1.1 upload：**No**。
- Scope itself is frozen：只允许修复上述 P1，不再加入新功能或 P2 polish。
