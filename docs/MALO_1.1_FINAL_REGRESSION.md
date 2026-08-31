# Malo 1.1｜Final Regression

记录日期：2026-08-31

Runtime 基线：`feature/malo-1.1 @ f9396e0`

范围：Release Scope Freeze 中 A–X 共 24 个功能组。本文只汇总本轮实测与既有 Release Evidence；未执行的人工步骤不会记为通过。本轮未修改 runtime，未重复创建 Production Cloud / Feedback 测试数据。

## 1. Executive result

- Final Regression status：**INCOMPLETE — no new P0/P1 found**。
- Simulator：**9 / 24 PASS**；15 个功能组尚未完成本轮规定的全部人工断言；0 个明确 FAIL。
- Device release evidence：**6 / 6 PASS**（仅指下文列明的既有真机 Release gates，不等同于 A–X 全量真机回归）。
- Real Cloud：**4 / 4 PASS**。
- P0：**0**。
- P1：**0**。
- P2：**5**，维持 Release Scope Freeze 中的既有 backlog，本轮未处理。
- 最终发布判断：**NO-GO for Release Candidate sign-off**。原因是 A–X 人工回归与微信公众平台 Console gates 尚未全部留证，不是发现了新的 runtime blocker。

## 2. A–X regression matrix

状态说明：

- **PASS**：本轮或可明确继承的同一 runtime build 人工证据覆盖了该功能组的核心断言。
- **PARTIAL**：页面、路由或部分路径通过，但未覆盖该组全部破坏性、权限或数据变更断言。
- **STATIC / AUTOMATED ONLY**：源码或自动测试通过，不能替代要求的模拟器/真机操作。
- **PRODUCTION EVIDENCE**：真实设备与 Production Cloud 已验证；本轮不重复写入生产数据。

| ID | Area | Simulator / local result | Device / Cloud evidence | Verdict |
|---|---|---|---|---|
| A | 5 TabBar | 今日、日记、计划、心声、百宝箱均可进入并渲染 | 未完成 A–X 全量真机 sweep | PASS |
| B | 首次引导 | 手动“查看引导”可重开；右上角低权重小圆形关闭控件位置正常；关闭后回到首页；未重置 `hasSeenFirstUseGuide` | 窄屏最终确认仍应纳入发布前人工 checklist | PASS |
| C | 今日职场猩象 | 日期、天气卡、非测量陪伴文案、CTA 正常渲染 | 未完整重跑 | PASS |
| D | 保存相册 | 本轮未触发系统相册权限，也未测试允许/拒绝/再次设置分支 | 微信 Console 权限说明仍待管理员确认 | PARTIAL |
| E | Croissant | 显示“累计磨损点：29”；状态、图片、名称与 2×2 入口正常；旧百分比解释不存在 | 未完整重跑阈值边界 | PASS |
| F | Full diary | 日记 Tab 与既有记录可见 | 未重跑完整保存/编辑/删除生命周期 | PARTIAL |
| G | 30 秒记录 | `entryMode="quick"`、字段保存与详情标签经源码检查存在 | 未重跑创建与详情人工断言 | STATIC / AUTOMATED ONLY |
| H | Quick → Full | 同 id 编辑入口、quick 数据预填与保存转 full 路径经源码检查存在 | 未重跑原地升级、无重复、createdAt 保留人工断言 | STATIC / AUTOMATED ONLY |
| I | 日记详情 | 2×2 动作区、danger/ghost 删除、二次确认与原业务 handler 经源码检查存在 | 未重跑窄屏、复制、跳转、删除人工断言 | STATIC / AUTOMATED ONLY |
| J | Weekly Review | route/page 完整；此前页面可进入 | 未覆盖空态/有数据/最高影响跳转/nickname fallback 全套断言 | PARTIAL |
| K | Dashboard 7/30 | route/page 与统计实现完整 | 未覆盖 7/30、分布、对比、空态与最高事件全套人工断言 | STATIC / AUTOMATED ONLY |
| L | 女性边界练习 | 页面正常进入；场景可展开；返回正常 | 未完整重跑所有场景 | PASS |
| M | 离职准备模板 | route/page 完整，继续复用现有 Plan storage | 未重跑选择、去重、Plan 跳转与 Cloud restore | STATIC / AUTOMATED ONLY |
| N | Plan | Tab、前/后离职分组与既有进度正常渲染 | 未重跑添加/完成/删除 | PARTIAL |
| O | Local Voice | 精选与本地心声页面正常渲染 | 未重跑新增/删除/抱抱/Backup opt-in | PARTIAL |
| P | Toolbox | 页面与全部 shipping 卡片正常；普通用户列表无 assessment；无 B14/B15/B16 入口 | 分包迁移后的 breathing / emergency-cards 角色图片真机 PASS | PASS |
| Q | Nickname | route、16 字限制、trim/clear/local-only 文案与首页/周回顾消费路径经源码检查存在 | 未重跑保存/清空/fallback | STATIC / AUTOMATED ONLY |
| R | Feedback Cloud | 7 场景兼容测试 PASS | 1.0H Production Smoke PASS；1.1 Production Smoke PASS | PRODUCTION EVIDENCE |
| S | Cloud Backup | disable handler targeted test PASS；未从模拟器重复调用生产 Cloud | 普通关闭生命周期真机 PASS | PRODUCTION EVIDENCE |
| T | B11 Delete | B11 lifecycle 5 场景及 server compatibility tests PASS | Real Cloud delete lifecycle PASS | PRODUCTION EVIDENCE |
| U | Privacy page | 页面正常进入；Backup/Feedback/nickname/删除说明与 runtime 一致 | 微信 Console 文本仍待管理员核对 | PASS |
| V | Clear local / protection | lifecycle 自动测试覆盖 suppression、防重建与重新开启 | 未执行破坏性的真机清空/恢复 | STATIC / AUTOMATED ONLY |
| W | Console | 页面可继续渲染与导航，未见 Malo 业务栈错误 | DevTools 重启出现一次 `WAServiceMainContext.js` timeout 及 preload warnings；恢复后未稳定复现 | PASS with non-blocking warning |
| X | Git/package | JS syntax 44/44、JSON 30/30、routes 21/21、`git diff --check` PASS | main package 1772.4 KB；Preview upload PASS；4 个迁移角色图片真机 PASS | PASS |

### Simulator count rationale

仅 A、B、C、E、L、P、U、W、X 计为 Simulator/local PASS，共 **9 / 24**。PARTIAL、STATIC / AUTOMATED ONLY 与 PRODUCTION EVIDENCE 都没有被冒充为 Simulator PASS。

## 3. Automated gates

- `tests/about-cloud-backup-disable.test.js`：PASS。
- `tests/cloud-backup-lifecycle-b11.test.js`：5 scenarios PASS。
- `tests/submit-feedback-version-compat.test.js`：7 scenarios PASS。
- `tests/sync-backup-b11.test.js`：disable、delete、race、1.0H compatibility PASS。
- JS syntax：44 / 44 PASS。
- JSON parse：30 / 30 PASS。
- Route completeness：21 / 21 PASS。
- `git diff --check`：PASS。
- `schemaVersion`：仍为 `1`。
- assessment：`enabled: false`；Toolbox 继续显式过滤 `/pages/exit-test/index`。
- B14 / B15 / B16：未发现 shipping runtime 入口。

## 4. Device and Real Cloud evidence

### Device release gates — 6 / 6 PASS

1. Feedback MVP 1.0H Production Smoke：PASS。
2. Feedback MVP 1.1 Production Smoke：PASS。
3. B11 Delete 真实 Cloud 生命周期：PASS。
4. 普通“关闭云端备份”真实设备生命周期：PASS。
5. Preview upload 与主包门禁：PASS，main package 1772.4 KB。
6. 分包迁移角色图片：diary-new / Elodie、diary-saved / Elodie、breathing / Gapchick、emergency-cards / Gapchick 均真机 PASS。

### Real Cloud workflows — 4 / 4 PASS

| Workflow | Result |
|---|---|
| Feedback from MVP 1.0H | PASS |
| Feedback from MVP 1.1 | PASS |
| B11 Delete lifecycle | PASS |
| Ordinary Cloud Backup disable → retain snapshot → re-enable → immediate backup | PASS |

普通关闭闭环的已确认事实：`users.backupMode` 变为 `disabled`；`backupGeneration` 正常递增；原 `user_backups` snapshot 保留；关闭期间未自动删除或重建；再次主动开启后恢复 `enabled`，立即备份成功，`updatedAt` 从 17:19:38 更新到 17:29:59；本地数据正常。

## 5. Manual WeChat Console gates

以下配置无法从仓库或模拟器证明，仍需管理员在微信公众平台留证：

1. 隐私保护指引中的数据类型、处理目的、保存期限与删除/权利请求路径。
2. `scope.writePhotosAlbum` 的用途说明以及允许、拒绝、再次设置体验。
3. Cloud Backup 关闭与删除的不同语义；删除保留本机内容且同时关闭自动备份。
4. 版本、服务类目、体验流程和审核备注与 1.1 shipping surface 一致。
5. Production Cloud Functions revision 与已验收的 `submitFeedback` / `syncBackup` revision 一致。

状态：**PENDING MANUAL EVIDENCE**。尚未发现明确配置错误，因此当前不计为 P1；如果平台内容与 runtime 不一致，应立即升级为 P1。

## 6. Privacy result

- 全项目未发现 `wx.getClipboardData` 或其他读取剪切板调用。
- 发现的剪切板 API 只有 `wx.setClipboardData`，位于日记详情“复制事实纪要”和出走小技能“复制”操作，均由用户主动触发，只写入剪切板。
- 因此微信隐私指引中的“开发者读取你的剪切板”与当前实际 runtime **不相符，应保持未声明/移除**；本结论不代替管理员在微信公众平台的最终核对。
- 相册仅在用户主动点击“保存到相册”后使用 `scope.writePhotosAlbum` / `wx.saveImageToPhotosAlbum`。
- nickname 仅保存在本机；不读取微信昵称、头像或手机号。

## 7. Version and package

- Runtime version：`MVP 1.1`。
- Stage：`正式版`。
- runtime 中的 `MVP 1.0H` 只保留在 `submitFeedback` 服务端兼容 allowlist，属于预期向后兼容，不是用户可见版本回归。
- main package：**1772.4 KB**，低于 2048 KB 上限。
- Preview upload：**PASS**。
- Runtime 功能因本轮 Final Regression 发生变化：**No**。
- Cloud / Backup / Feedback / Identity 因本轮发生变化：**No**。

## 8. Defects and warnings

### P0 — 0

未发现数据丢失、白屏、越权或核心入口缺失。

### P1 — 0

Cloud Backup Disable P1 已由 `f9396e0 fix(backup): restore cloud backup disable flow` 修复并真机确认关闭。

### P2 — 5

维持 Release Scope Freeze：README 过时、project description 过时、insights dormant、legacy assessment / 未绑定 method dormant、oracle snapshot helper/key dormant。本轮不处理。

### Known non-blocking warnings

- Windows 重启后从任务栏恢复微信开发者工具时出现一次 `SystemError (appServiceSDKScriptError) timeout`，栈仅指向 `WAServiceMainContext.js:1`；随后页面和导航恢复，未稳定复现 Malo 业务错误。
- DevTools 报 `WAServiceMainContext.js` / `WAAutoService.js` preload informational warnings。
- 既有 text / user-select informational warning 不在本轮处理范围。
- 当前无法稳定复现的 routeDone / webviewId system error 不追查。

## 9. Final recommendation

**NO-GO for Malo 1.1 Release Candidate sign-off at this moment.**

代码、Production Cloud、Feedback compatibility、B11 Delete、普通 Backup 关闭、包体积与 Preview 均没有已知 P0/P1；阻塞最终签字的是证据完整性：需要完成剩余 15 个功能组的规定 Simulator/Device 人工断言，并补齐微信公众平台 Console 截图/记录。完成这些人工门禁且没有新 P0/P1 后，可直接改判 GO；无需再次制造 Production Cloud / Feedback 测试数据。
