# Malo 1.1｜Final Regression

记录日期：2026-08-31

Runtime 基线：`feature/malo-1.1 @ f9396e0`

范围：Release Scope Freeze 中 A–X 共 24 个功能组。本轮未修改 runtime，未重复创建 Production Cloud / Feedback 测试数据；写入型功能通过隔离内存 Storage 桩验证，Simulator 仅使用现有本地数据，最后按用户确认执行 V 清空。

## 1. Executive result

- Final Regression status：**DEVICE GATES PENDING — no P0/P1 found**。
- Simulator / local automation：**21 / 24 PASS**。R、S、T 使用既有 Production evidence，不计为 Simulator PASS。
- Device release evidence：**6 / 6 PASS**。
- Real Cloud：**4 / 4 PASS**。
- Privacy / WeChat Console：用户已人工确认 **PASS**，本轮未重复。
- P0：**0**；P1：**0**；P2：**5**（维持既有 backlog，本轮未处理）。
- Codex 本轮负责的 14 项：**14 / 14 PASS**（B、D、F、G、H、I、J、K、M、N、O、Q、V、W）。
- 仍需用户真机确认：**2 项**，即 B 的 Preview 真机视觉确认、D 的真实相册权限闭环。

## 2. A–X regression matrix

| ID | Area | Result | Evidence |
|---|---|---|---|
| A | 5 TabBar | PASS | 今日、日记、计划、心声、百宝箱均可进入并渲染 |
| B | 首次引导 | PASS（Simulator）；Preview 视觉待确认 | iPhone 5 窄屏手动打开、关闭位置、单击热区、重载后不自动重现均 PASS |
| C | 今日职场猩象 | PASS | 日期、天气卡、陪伴文案及 CTA 正常 |
| D | 保存相册 | PASS（Simulator / static）；真机权限闭环待确认 | Simulator 生成 PNG 并进入保存交接；720×1180 绘制边界与完整内容自动断言 PASS；拒绝与“去设置”代码路径 PASS |
| E | Croissant | PASS | 累计磨损点、状态、图片、名称和 2×2 入口正常 |
| F | Full Diary | PASS | 隔离桩完成完整字段保存与事实纪要生成；iPhone 5 编辑器布局正常 |
| G | 30 秒记录 | PASS | 隔离桩完成 quick 保存，事实、等级、归因与可选情绪保留；Simulator 模式切换正常 |
| H | Quick → Full | PASS | 同 id 原地升级、无重复、createdAt / 事实 / 情绪保留、补充字段保存 |
| I | 日记详情 | PASS | 详情加载、复制、跳转、删除取消/确认及继续整理通过；iPhone 5 卡内 2×2 无溢出，删除为低权重 danger |
| J | Weekly Review | PASS | 近 7 天统计、最高影响事件跳转、nickname 与 fallback 通过；Simulator 页面正常 |
| K | Dashboard 7/30 | PASS | 7/30 切换、统计、重复归因、平均影响与最高事件跳转通过；窄屏无溢出 |
| L | 女性边界练习 | PASS | 页面、场景展开与返回正常 |
| M | 离职准备模板 | PASS | 模板选择、加入 Plan、已添加标识与去重通过；Simulator 路由正常 |
| N | Plan | PASS | 前/后离职切换、新增、完成、删除取消/确认、进度刷新通过；Simulator 页面正常 |
| O | Local Voice | PASS | 本地发布/展示、精选抱抱幂等、本地删除取消/确认通过；Simulator 页面正常 |
| P | Toolbox | PASS | shipping 卡片正常；普通用户无 assessment；无 B14/B15/B16 入口 |
| Q | Nickname | PASS | trim、16 字限制、保存、页面回读、清空与 fallback 通过；Simulator 页面正常 |
| R | Feedback Cloud | PASS — Production Evidence | 1.0H 与 1.1 Production Smoke PASS |
| S | Cloud Backup | PASS — Production Evidence | 普通关闭生命周期真机 PASS |
| T | B11 Delete | PASS — Production Evidence | Real Cloud delete lifecycle PASS |
| U | Privacy / WeChat Console | PASS — User Evidence | 用户已人工确认；本轮未重复 |
| V | Clear local / protection | PASS | Simulator 清空、recoverySuppressed、重载不恢复、空快照阻断通过 |
| W | Console | PASS with non-blocking warnings | 全程未见 Malo 业务 Error |
| X | Git / package | PASS | JS/JSON/routes/diff checks 与 package/Preview 既有证据通过 |

## 3. Codex 本轮逐项 Evidence

### B｜首次引导 — PASS

- 实际操作：iPhone 5（320×568）Simulator 手动点击“查看引导”，检查卡片和右上角关闭控件；单击关闭；重载小程序。
- Evidence：关闭按钮位于卡片右上安全区、不压标题；小图标配有足够圆形热区；一次点击关闭；重载后未自动重新出现。隔离桩另确认手动状态不改变 `hasSeenFirstUseGuide=true`。
- 剩余：Preview 真机只需做一次最终视觉确认。

### D｜保存相册 — PASS（Simulator / static）

- 实际操作：Simulator 点击“保存到相册”，Canvas 完成生成并进入 PNG 保存交接；未把 Simulator 当作真机权限结果。自动桩执行完整 poster renderer，并验证拒绝分支弹窗与“去设置”回调。
- Evidence：画布为 720×1180；标题、日期、5 个指标、Croissant、护身符、推荐行动、免责声明及页脚均执行绘制，文本最大纵坐标 1102，小于 1180，无纵向截断；Simulator 生成了 PNG 文件交接。
- 剩余：真机“拒绝 → 设置 → 重新允许 → 保存”人工 Gate。

### F｜Full Diary — PASS

- 实际操作：隔离 Storage 桩创建完整记录，保存事实、影响、归因、补充标签、身体反应、情绪、已尝试处理与下一步；Simulator 检查编辑器。
- Evidence：保存对象和完整事实纪要断言通过；窄屏字段和 Full/Quick 切换无溢出。

### G｜30 秒记录 — PASS

- 实际操作：隔离桩切换 quick，保存事实、4 级、工作量、可选情绪。
- Evidence：`entryMode="quick"`、事实、等级、归因、情绪和 30 秒事实纪要断言通过；Simulator quick 布局正常。

### H｜Quick → Full — PASS

- 实际操作：载入上一条 quick，补充完整字段并保存。
- Evidence：记录数量不变，id 与 createdAt 不变；原事实和情绪保留；`entryMode` 不再为 quick；下一步等完整字段保存成功。

### I｜日记详情 — PASS

- 实际操作：加载详情、复制事实纪要、回日记本、去 Dashboard；分别执行删除取消与确认；验证 quick 的继续整理路由。
- Evidence：全部事件断言通过；iPhone 5 上四个动作位于事实纪要卡底部 2×2，文案未截断，删除按钮为红色低权重 ghost，二次确认仍在。

### J｜Weekly Review — PASS

- 实际操作：隔离桩构造近 7 天重复归因与最高影响记录；测试 nickname 与清空后的 fallback；Simulator 从日记本进入。
- Evidence：总数、平均影响、最高事件、重复原因、跳转和问候语断言通过；页面窄屏正常。

### K｜Dashboard 7/30 — PASS

- 实际操作：隔离桩构造 7 天、30 天和范围外记录；切换 30 天与 7 天；打开最高事件；Simulator 实际切换“近 7 天”。
- Evidence：30 天 3 条、7 天 2 条、7 天平均影响 4.0、工作量重复 2 次及最高事件跳转断言通过。

### M｜离职准备模板 — PASS

- 实际操作：隔离桩选择财务模板、加入 Plan、再次载入并尝试重复加入；Simulator 从 Plan 打开模板页。
- Evidence：首次加入 1 项；再次显示“已添加”；重复操作没有创建第二项；路由及窄屏列表正常。

### N｜Plan — PASS

- 实际操作：隔离桩新增“FR-N 隔离计划”、完成、删除取消、删除确认、切换离职后清单；Simulator 检查进度和模板入口。
- Evidence：新增、completedAt、取消保护、确认删除、进度刷新与前/后离职文案断言通过。

### O｜Local Voice — PASS

- 实际操作：隔离桩新增本地心声、连续抱抱同一精选内容、删除取消与确认；Simulator 检查精选列表。
- Evidence：本地内容保存/删除通过；重复抱抱不重复增加计数；无 Cloud / Feedback 调用。

### Q｜Nickname — PASS

- 实际操作：隔离桩测试 trim、16 字、保存、页面回读、清空；Simulator 从百宝箱进入。
- Evidence：全部断言通过；页面明确显示仅用于 Malo 内称呼，不读取微信昵称。

### V｜Clear local / recovery protection — PASS

- 实际操作：在所有依赖本地数据的测试完成后，经用户动作时确认，在 Simulator 点击“清空本地数据”并确认；随后重载并进入日记本。
- Evidence：
  - 清空后 Cloud Backup 卡立即显示“已开启 · 恢复已暂停”，证明 `recoverySuppressed` 生效。
  - 重载后 Croissant 累计磨损为 0，日记本为空态，旧记录没有自动恢复。
  - 未点击立即备份、恢复云端、关闭备份或删除云端备份。
  - `cloud-backup-lifecycle-b11.test.js` 5 场景 PASS，覆盖 intentional clear 后不自动 restore、onHide 不上传空 snapshot、只有用户主动恢复/重新开启才解除抑制。

### W｜Console — PASS with non-blocking warnings

- 实际操作：全程保持 DevTools Console 可见，跨 Tab、分包页面、详情、Dashboard、Weekly Review、Canvas 与清空/重载观察。
- Evidence：未见 Malo 业务栈 Error。
- 非阻塞告警：
  - `WAServiceMainContext.js` / `WAAutoService.js` preload informational warning。
  - `cropRectRealtimeAction: fail not support`（Simulator 能力告警）。
  - 一次 `[Perf][pages/diary/index] Page.onShow took 50ms`。
  - Canvas 保存对话框被取消后产生一次 `showLoading 与 hideLoading 必须配对使用`；重载后未持续出现，属于本轮取消桌面保存交接所致。

## 4. Automated gates

- 本轮临时隔离回归：B、D、F、G、H、I、J、K、M、N、O、Q、V 共 **13 / 13 PASS**；Cloud 调用 0，Feedback 调用 0；临时脚本已删除。
- `tests/cloud-backup-lifecycle-b11.test.js`：5 scenarios PASS。
- `tests/about-cloud-backup-disable.test.js`：PASS（仅复用已有自动测试，未调用生产 Cloud）。
- `tests/submit-feedback-version-compat.test.js`：既有 7 scenarios PASS。
- `tests/sync-backup-b11.test.js`：既有 disable、delete、race、1.0H compatibility PASS。
- JS syntax：44 / 44 PASS。
- JSON parse：30 / 30 PASS。
- Route completeness：21 / 21 PASS。
- `schemaVersion`：仍为 `1`。

## 5. Existing Release Evidence

### Device release gates — 6 / 6 PASS

1. Feedback MVP 1.0H Production Smoke：PASS。
2. Feedback MVP 1.1 Production Smoke：PASS。
3. B11 Delete 真实 Cloud 生命周期：PASS。
4. 普通 Cloud Backup 关闭 → 保留 snapshot → 重开 → 立即备份：PASS。
5. Preview upload：PASS；main package 1772.4 KB。
6. 分包迁移角色图片真机：PASS。

### Real Cloud workflows — 4 / 4 PASS

| Workflow | Result |
|---|---|
| Feedback from MVP 1.0H | PASS |
| Feedback from MVP 1.1 | PASS |
| B11 Delete lifecycle | PASS |
| Ordinary Cloud Backup disable → retain snapshot → re-enable → immediate backup | PASS |

本轮没有重复制造任何 Production Cloud / Feedback 数据。

## 6. Privacy and version

- Privacy / WeChat Console：用户已人工确认 PASS。
- 全项目未发现读取剪切板调用；只有用户主动触发的 `wx.setClipboardData` 写入，因此“开发者读取你的剪切板”与实际 runtime 不相符。
- 相册只在用户主动点击“保存到相册”后使用。
- nickname 只保存在本机，不读取微信昵称、头像或手机号。
- Runtime version：`MVP 1.1`；Stage：`正式版`。
- main package：1772.4 KB；Preview upload PASS。
- 本轮 Production code modified：**No**。
- 本轮 Cloud / Backup / Feedback / Identity modified：**No**。

## 7. Defects and final recommendation

- P0：**0**。
- P1：**0**。
- P2：**5**，不在本轮处理。
- Blocking bugs：**None found**。

当前仍需两个人工真机 Gate：

1. B：Preview 真机确认首次引导关闭按钮最终视觉位置与热区。
2. D：真实手机完成“拒绝 → 设置 → 重新允许 → 保存”权限闭环。

在这两项完成前：**NO-GO for final Release Candidate sign-off（仅因真机证据未闭环）**。

两项均 PASS 且无新增 P0/P1 后：可直接改判 **GO**，无需重复 Feedback、B11、Cloud Backup Disable、Package Size 或 Production Cloud 测试。
