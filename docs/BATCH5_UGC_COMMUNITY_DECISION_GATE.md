# Malo 1.1｜Batch 5 UGC & Community Decision Gate

审计基线：`feature/malo-1.1` @ `e970b1d`

审计日期：2026-08-31

结论性质：产品、架构与发布 Gate；本文件本身不授权部署 Cloud Function、创建数据库集合或开放 UGC。

## 1. Current Voice System

### 用户当前看到什么

`pages/voice` 同时展示两类完全不同的内容：

1. “听听别的吗喽说了啥”：来自 `utils/constants.js` 中的 `FEATURED_VOICES`，共 6 条代码内静态文案。每条包含 `id`、`text`、`reply`。所谓“抱一抱”的状态和计数也只存在本机。
2. “我的本地心声”：用户在当前设备写入、查看和删除。内容通过 `utils/storage.js` 保存到本地 storage；页面明确说明不会被其他用户看到。主动开启 Cloud Backup 后，本地心声会进入恢复用 snapshot，但不会进入公共 feed。

当前没有：

- 云端投稿入口；
- 其他用户实时内容；
- 投稿审核状态；
- 公共内容举报、下架或用户删除流程；
- 用户主页、评论、回复、私信或关注；
- 对外展示的真实用户身份。

因此，当前“心声”不是 UGC 社区，而是“静态精选内容 + 私有本地记录”。

## 2. Current UGC Capability

### Feedback Cloud

`submitFeedback` 的唯一用途是用户主动递交产品试用反馈：

- collection：`feedback_posts`；
- 字段：`userId`、`clientFeedbackId`、`type`、`content`、`appVersion`、`clientCreatedAt`、`createdAt`；
- owner：Cloud Function 从 `getWXContext().OPENID` 查 `users`，再写入服务端解析出的 `userId`；客户端不能选择 owner；
- 服务端按 `userId + clientFeedbackId` 防重复；
- 内容不会公开，没有 moderation/publication status；
- 用户在客户端删除已递出的本地纸条，不会删除云端反馈。

`feedback_posts` 是产品反馈收件箱，不具备公共发布、审核、撤回或下架语义。**Feedback ≠ Community UGC**。B14 不应复用、迁移或扩写这个 collection，也不应把 `submitVoice` action 塞进 `submitFeedback`。

### Identity

- Cloud Function 可从可信微信上下文取得 OPENID，并映射到 `users._id`；这足以做匿名 owner 绑定、`listMine` 和 `deleteMine`。
- 客户端只获得 Malo `userId`，但授权必须继续以服务端 OPENID 为准，不能信任客户端传入的 `userId`、`ownerOpenid` 或投稿 id 所属关系。
- 当前没有公开身份需求，也没有手机号登录需求。
- Malo nickname 最多 16 个字符，只存在当前设备；页面明确承诺它不是登录身份或公开用户名。B14/B15 不得自动读取或公开该 nickname。
- 匿名投稿在技术上不需要手机号；公开卡片只应显示固定文案，例如“某只吗喽 / 匿名投稿”。

### Privacy

当前小程序内说明只覆盖：本地心声、Cloud Backup、试用反馈以及“不获取微信昵称、头像或手机号”。它没有声明“用户主动提交匿名心声”“人工审核”“可能公开展示”“撤回/删除”和相应保存期限。

如果未来实现 B14，必须在上线前：

1. 更新小程序内隐私说明，区分本地心声、匿名投稿、产品反馈和 Cloud Backup；
2. 说明投稿目的、审核、可能公开展示、匿名边界、保存期限以及撤回/删除方式；
3. 在微信公众平台人工复核并按真实处理活动更新《用户隐私保护指引》；不能仅凭代码文案声称平台配置已完成。

### Moderation / Admin

仓库中没有发现：

- `msgSecCheck` / `mediaCheckAsync` 或其他内容安全调用；
- UGC moderation collection/status；
- 人工审核页面或独立后台；
- report、takedown、blocked-content、appeal 或 moderation log；
- 可证明普通客户端无数据库直写权限的 Cloud Database rules 配置。

Cloud Database Console 可以成为 10–30 人阶段的最小人工审核工具，但只有同时满足以下条件才安全：投稿先经过服务端内容安全检查、默认 `pending`、客户端数据库规则禁止直接写 publication 字段、公共查询只返回 `approved`、操作者可留存基本审核记录。当前仓库无法证明这些部署侧条件已经成立。

## 3. WeChat UGC Requirement Audit

### 可确认的最低要求

微信官方提供服务端文本内容安全接口 `msgSecCheck`，场景覆盖用户发表的评论、论坛或社交日志内容。腾讯资料也将公开可访问的用户生成文本列为内容安全审核场景。对 Malo 而言，机器检查应在 Cloud Function 侧完成，失败时 fail closed；机器通过也只代表可以进入人工 `pending` 队列，不能直接等同于 Malo 的最终收录审批。

微信隐私保护机制要求开发者按实际处理的个人信息与实际使用的隐私接口完善指引；平台自动检测可能遗漏，仍需开发者人工核对。

可信来源：

- [微信开放文档：文本内容安全识别 msgSecCheck](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/sec-center/sec-check/msgSecCheck.html)
- [腾讯云：小程序隐私保护指引适配说明](https://cloud.tencent.com/document/product/1301/97930)
- [腾讯云：文本审核及 UGC 适用场景](https://cloud.tencent.com/document/product/436/134931)

### 公开展示还需要的产品/运营能力

即使采用“投稿 → 人工审核 → 精选发布”，至少仍需：

- 服务端 owner 绑定、内容安全检查、默认 pending；
- 人工审批与 removed/takedown 路径；
- 用户查看自己的状态并撤回/删除；
- 公共查询只返回 approved，且不返回 owner 标识；
- 节流、防重复、操作日志和故障时 fail closed；
- 清晰的隐私、社区边界与运营联系人；
- 发布类目和提审材料的人工确认。

### Unknown

截至本次审计，可访问的微信/Tencent 官方材料不足以可靠证明以下两点：

1. 经过人工精选、无互动的匿名公开内容，是否可以在 1.1 不提供内容级最小举报入口；
2. Malo 当前微信公众平台已选服务类目，是否覆盖这种 curated UGC 展示。

这两项必须由小程序管理员在微信公众平台及提审流程中人工确认。不能因内容经过人工审核就假定举报可以 defer，也不能从仓库推断线上类目配置。

### 复杂度判断

“投稿 → 机器检查 → pending → 人工审核 → approved 精选”明显低于实时树洞，因为它没有实时传播、互动关系、热度和持续对话。但它仍是公开 UGC：内容安全、撤回、下架、隐私、类目和运营责任不会消失。

当前不存在必须为了 Malo 1.1 原有功能而补齐的 UGC 后台；只要 1.1 继续维持静态精选与本地心声，就不需要新增审核系统。

## 4. B14 Audit — Curated Voice Submission

### Product Value

**Medium**。

- 与当前 `FEATURED_VOICES` 和“匿名陪伴 / 不孤独”价值自然衔接；
- 比开放树洞更符合 Malo 当前规模；
- 但仓库中的试用反馈或审计材料没有提供“内测用户明确喜欢并要求投稿”的可验证证据，因此不能评为 High。

### 最小产品流程（未来实现约束）

用户进入心声 → “递一张匿名心声” → 输入文本 → 确认匿名及审核说明 → 服务端内容安全检查 → 独立 collection 保存为 `pending` → 用户看到“已经递给 Malo 啦，审核后才可能出现在心声里。” → 人工审核 → `approved` 后进入精选。

禁止实时发布、评论、点赞、回复、私信、关注、主页、排行与热度算法。现有本机“抱一抱”不得被包装成跨用户点赞。

### 建议数据模型

独立 collection：`voice_submissions`。

| 字段 | 规则 |
|---|---|
| `_id` | 服务端生成或确定性生成 |
| `ownerOpenid` | 仅服务端从微信上下文写入；不返回公共 feed |
| `userId` | 可选内部 owner 映射；不返回公共 feed |
| `clientPostId` | 必填；owner 范围内唯一 |
| `content` | trim 后非空；建议 20–500 个 Unicode 字符 |
| `status` | `pending / approved / rejected / removed`；客户端提交时固定为 pending |
| `createdAt` | serverDate |
| `reviewedAt` | 仅受控人工操作写入 |
| `publishedAt` | 仅受控人工操作写入 |
| `reviewNote` | 可选、内部可见 |
| `appVersion` | 客户端版本，经服务端规范化 |
| `moderationResult` | 内容安全结果摘要；不得代替人工审批 |
| `removedAt` | rejected/removed 或用户删除时按保留政策处理 |

客户端绝不能设置 `approved`、`reviewedAt` 或 `publishedAt`。

### 投稿限制

- trim 后为空直接拦截；
- 建议 20–500 字，减少无意义短内容与敏感长文审查负担；
- `clientPostId` 仅允许安全字符并限制长度，以 owner + id 建立幂等；
- 提交按钮 in-flight 锁；服务端再做最小速率限制，例如每 owner 每 10 分钟 1 条、每日最多 5 条，具体阈值上线前验证；
- 内容安全调用失败时不保存为可发布内容，也不绕过检查。

不为 MVP 建复杂封禁或账号处罚系统。

### 用户内容控制

未来最低必须提供：

- `listMine`：查看 pending/approved/rejected/removed 状态；
- `deleteMine`：服务端按当前 OPENID 校验 owner；
- pending 可撤回；
- approved 删除后必须立即不再出现在公共 feed，并转 removed 或按明确政策物理删除；
- 用户 A 永远不能读取或删除用户 B 的投稿详情。

无法提供用户删除自己投稿的能力时，不得上线 B14。

### 举报与管理端

- 内容级举报是否为微信对 curated UGC 的硬性要求：**Unknown，发布前必须人工确认**。
- 即使政策最终允许 defer，Malo 的敏感职场内容仍建议在首个公开版本提供最小“举报这条内容”及开发者处理路径。
- 对 10–30 用户阶段，Cloud Database Console 可以作为最小人工审批界面，不应为了 MVP 制作完整 CMS。
- 但 Console 方案必须配合数据库权限验证、机器内容安全、固定 pending、公共查询过滤和基本审核记录。普通客户端不能拥有 approve/reject/publish action。

### B14 Verdict

- Release：**1.2**
- Product Value：**Medium**
- Complexity：**Medium**
- Risk：**High（当前）；完成内容安全、权限、举报/类目确认后可降为 Medium）**
- Decision：**Design only**

不进入 1.1 Implementation，原因是当前内容安全调用、可证明的数据库权限、用户云端删除、公共举报路径均不存在，且举报/类目政策仍为 Unknown。它不满足“Content moderation 路径明确”和“发布前隐私范围已确认”的全部 Gate 条件。

## 5. B15 Audit — Open Community

真正开放社区至少需要：稳定 feed 与 pagination、机器和人工审核、举报、用户删除、紧急下架、spam/rate limit、用户屏蔽、违规内容处理、moderation log、管理端、社区规范、隐私与 retention、申诉策略、身份滥用治理、未成年人风险评估，以及敏感情绪内容的升级与危机处理边界。

Malo 还需特别处理职场冲突、性别经历、边界侵犯、强烈情绪和心理压力。实时传播会显著放大诽谤、可识别第三方信息、报复性曝光、骚扰和情绪伤害风险，不能当普通留言板。

| 维度 | B14 Curated Submission | B15 Open Community |
|---|---|---|
| 产品价值 | 提供被看见和陪伴，保持 Malo 编辑边界 | 更强连接，但容易偏离个人记录核心 |
| 运营成本 | 小规模人工精选可控 | 持续值守、举报、申诉和危机处理 |
| 审核责任 | 发布前单向审批 | 发布前后持续审核，传播速度更快 |
| 技术复杂度 | 独立提交、我的投稿、精选读取 | feed、分页、关系/互动、反滥用、完整后台 |
| 发布风险 | Medium–High | High |

### B15 Verdict

- Recommended Release：**2.0+**
- Complexity：**High**
- Risk：**High**
- Decision：**Design only / 不进入 1.1**

重新评估前提：B14 至少稳定运营一个完整周期，有真实投稿量、审核时效、举报/下架数据和明确社区运营 owner；否则继续 defer。

## 6. B16 Audit — Phone Number

| 需求 | 当前是否需要手机号 | 结论 |
|---|---|---|
| 登录身份 | No | OPENID 已足够 |
| Cloud Backup | No | OPENID owner 已足够 |
| 匿名投稿 | No | 服务端 OPENID 可做内部 owner，公开无需手机号 |
| UGC 审核管理员 | No | 管理员权限不应通过普通用户手机号建立 |
| 账户恢复 | No current evidence | 当前恢复绑定同一微信身份；没有跨微信恢复需求证据 |
| 人工陪跑/付费服务 | Not in 1.1 | 当前没有该服务 |

手机号会新增更高隐私成本：微信授权与平台指引、明确且最小必要的目的、访问权限、保存期限、删除路径、泄露响应和提审说明。当前没有“非收不可”的需求，不能因为未来可能有用而收集。

### B16 Verdict

- Decision：**Freeze**
- 当前 Product Value：**Low**
- Complexity：**Medium**
- Privacy / Release Risk：**High**
- Recommended Release：**Future，且仅在触发条件出现后重新 Gate**

重新开启的明确触发条件至少满足其一：

1. 用户主动申请人工陪跑或客服联系，手机号对履约确属最小必要；
2. 合法合规的付费服务明确要求电话联系或验证；
3. 有验证过的跨微信身份账户恢复需求，且没有更低敏感度替代方案；
4. 法务、隐私、保存和删除方案以及微信平台配置均已明确。

## 7. Decision Matrix

| Bonus | Product Value | Complexity | Risk | Recommended Release | Verdict |
|---|---|---|---|---|---|
| B14 Curated Voice Submission | Medium | Medium | High current / Medium after gates | 1.2 | Design only |
| B15 Open Community | Medium | High | High | 2.0+ | Design only |
| B16 Phone Number | Low current | Medium | High privacy cost | Future | Freeze |

本 Gate 为此前尚未最终决策的 B14/B15/B16 提供了明确结论；结合 Batch 1–4 已完成结论，17 个 Bonus 均已有 release disposition。

## 8. Recommended Malo 1.1 UGC Scope

Malo 1.1 最终 UGC Scope 为：

- 保留代码内静态 `FEATURED_VOICES`；
- 保留用户自己的本地心声及其 Cloud Backup opt-in 恢复行为；
- 保留独立的产品反馈 Cloud 通道；
- 不增加云端心声投稿；
- 不增加其他用户内容 feed；
- 不增加公开身份、评论、点赞、回复、私信、关注、举报系统或手机号。

也就是说，Malo 1.1 不成为 UGC 发布平台或开放社区。

## 9. Privacy Impact

本次仅增加审计文档，不改变实际数据处理活动，因此不需要修改 1.1 当前运行时隐私文案，也不新增微信后台个人信息类型。

如果未来开启 B14，必须先完成：匿名投稿用途、人工审核和可能公开展示、owner 内部绑定、内容安全处理、保存期限、撤回/删除、公开字段白名单、举报/下架渠道，以及微信公众平台指引和类目的人工确认。手机号与 Local nickname 必须继续排除在公共内容之外。

## 10. Implementation Decision

**B14 Implementation skipped。**

触发的 Stop/Gate 条件：

- 当前无法建立已验证的内容安全调用路径；
- 仓库无法证明普通客户端没有直接数据库 approve 权限；
- 当前没有云端投稿的用户删除/撤回能力；
- 举报是否可 defer 与服务类目要求仍为 Unknown。

因此本轮只提交 Audit，不创建 `voice_submissions`，不新增 `submitVoice`，不修改心声 UI、Feedback、Cloud Backup、Identity 或 Privacy runtime。

## 11. Deferred Future Architecture

未来 B14 重新 Gate 时，建议拆为：

1. `submitVoice` Cloud Function：`submit / listMine / deleteMine / listApproved`；所有 action 从服务端 OPENID 绑定 owner。
2. `voice_submissions` 独立 collection；公共 response 使用字段白名单，永不返回 owner、userId、手机号或 nickname。
3. 服务端 `msgSecCheck` fail-closed；通过后仍固定 pending。
4. Cloud Console 作为初期人工审核工具；只能由受控开发者把 pending 改为 approved/rejected，记录 reviewedAt/publishedAt。
5. 公共 feed 只读取 approved；rejected/removed/pending 永不公开。
6. 用户可查看自己的状态并删除/撤回；approved 删除后立即从公共 feed 消失。
7. 根据微信平台人工确认结果实现最小内容举报和下架闭环。
8. 独立回归 Feedback 与 Cloud Backup，确保 `feedback_posts`、`submitFeedback`、`syncBackup` 和 backup schema 不变。

重新进入实现前必须补齐测试：正常/空/超长/重复投稿、owner 绑定、跨用户隔离、pending/rejected/removed 不公开、approved 才公开、用户删除 pending/approved、Cloud failure、重复点击、静态精选兼容、Feedback/Backup 不受影响及无 blocking console error。
