# Malo 1.1｜Release Evidence

记录日期：2026-08-31

分支：`feature/malo-1.1`

本文件记录 Malo 1.1 Release Fix Pass 已获得的证据。证据按来源区分；未执行的检查不会记为通过。

## 1. Automated

### Runtime version

- canonical version：`MVP 1.1`
- stage：`正式版`
- 普通用户 runtime 不再渲染 `MVP 1.0H`、`云备份发布候选版` 或 1.0H candidate 文案。

### Feedback compatibility

- `submitFeedback` 使用严格 allowlist，仅接受 `MVP 1.0H` 与 `MVP 1.1`。
- 兼容性测试共 7 个场景通过：1.0H 接受、1.1 接受、未知版本拒绝、空版本拒绝、既有字段与 trim/serverDate 行为保持、重复 `clientFeedbackId` 幂等行为保持、客户端不能伪造 owner。
- 1.1 客户端继续通过统一的 `APP_META.version` 发送版本，没有在 Feedback 页面新增第二份硬编码版本。

## 2. Simulator

- Release Fix Pass 未新增 UI 或数据结构。
- 版本常量和 Feedback compatibility 以静态检查及 Node targeted test 验证。
- 1.0H/1.1 真实 Feedback 提交留给下方 Real Cloud smoke，不以模拟器结果替代。

## 3. Real Cloud

### submitFeedback deployment

- 2026-08-31 15:39:47，`submitFeedback` 已单独上传并部署至当前 Production Cloud 环境，依赖由云端安装。
- Cloud Functions 列表确认 `submitFeedback` 最后更新时间已更新；`syncBackup` 与 `loginOrRegister` 时间戳未变化，本次未重新部署这两个函数。
- 为避免在生产 `feedback_posts` 中制造自动化测试数据，本轮没有代替用户提交真实 Feedback。部署后的两项推荐 smoke 仍待人工执行：
  - 1.0H 客户端提交一条测试 Feedback，确认 `appVersion = "MVP 1.0H"`。
  - 1.1 客户端提交一条测试 Feedback，确认 `appVersion = "MVP 1.1"`。

### B11 Cloud Backup deletion

以下为用户已经完成并确认的 Production Cloud / Manual Device evidence，本次仅归档，不修改 B11 runtime：

- 新版 `syncBackup` 已成功部署至 Production Cloud。
- 生产 1.0H 老客户端的 Cloud Backup 状态正常；立即备份成功；原 `user_backups` 正常更新时间；服务端自动生成 `backupGeneration`；`schemaVersion` 仍为 `1`。
- 1.1 B11 删除成功；对应 owner 的 `user_backups` 消失；本地内容保留；`users.backupMode = disabled`；`backupGeneration` 正常递增。
- 删除后重新主动开启成功；`backupMode = enabled`；`backupGeneration` 再次递增；`user_backups` 成功重新创建。
- 其他 owner 的 backup 未被删除。
- Cloud collections 未新增。

## 4. Manual Device

- B11 production 流程由用户在真实设备完成，结果见上方 Real Cloud 记录。
- Feedback 双版本真实 Cloud smoke 尚未记录为通过；必须使用 1.0H 与 1.1 客户端各提交一次并核对入库版本。

## 5. Privacy manual checklist

发布 1.1 前由管理员在微信公众平台人工确认：

- Cloud Backup 删除途径。
- 删除后本地内容保留。
- 删除后云备份关闭。
- 用户可再次主动开启 Cloud Backup。
- Feedback Cloud 的用途、保存期限与权利请求路径。
- `scope.writePhotosAlbum` 的用途与授权体验。
- nickname 为 Local-only，不读取或上传微信昵称。
- 不增加 B14、B15、B16 的隐私声明。

本次未修改微信公众平台配置。若平台核对发现与实际 runtime 不一致，应升级为发布阻塞项。

## 6. Release blocker reclassification

- P0：0。
- P1：0（P1-01、P1-02 已修复；P1-03 的 B11 production evidence 已归档）。
- P2：5，维持 Release Scope Freeze 中的 1.2 backlog，不在本轮处理。
- 部署后的 Feedback 双版本真实 Cloud smoke 是上传前人工回归项；当前没有代码兼容性 blocker，但未执行结果不得记为通过。

