# Malo 1.1｜RC1 Freeze

1. **RC commit**：`8ef4e98`；Final Regression 已验证的 RC 基线，冻结后未修改 runtime。

2. **Release scope**：Shipping 为 B01–B09、B11、B17；B10/B14 仅保留设计或 dormant 源码，B12/B13/B15 deferred，B16 frozen；普通用户无 legacy assessment、UGC/community 或手机号入口。

3. **Regression result**：Final Regression **PASS — GO**；Simulator/local `21/24 PASS`，Device/manual `8/8 PASS`，Real Cloud `4/4 PASS`，WeChat Console PASS。RC 静态门禁通过：44 个 JS、30 个 JSON、21 条 routes、10 个 TabBar assets、23 个 WXML，以及 `git diff --check`。

4. **Production Cloud evidence**：Feedback MVP 1.0H / MVP 1.1 Production Smoke PASS；B11 Delete lifecycle PASS；Cloud Backup Disable、generation 递增、保留 snapshot、重新开启与立即备份闭环 PASS。`loginOrRegister` 未改；`schemaVersion = 1`；runtime collections 仍仅为 `users`、`user_backups`、`feedback_posts`。

5. **Package size**：main package `1772.4 KB`，Preview upload PASS；5 个 TabBar 页面与图标完整，分包 routes 与四个迁移角色图片资源完整。

6. **Privacy**：WeChat Console 人工核对 PASS；不读取剪切板，仅在用户主动操作时写入；相册权限“拒绝 → 去设置 → 重新允许 → 保存”真机闭环 PASS；nickname Local-only；Backup、Feedback 与删除路径和实际功能一致。

7. **Defects**：P0 = `0`，P1 = `0`，P2 = `5`；P2 保留到后续 backlog，本次未处理。

8. **RC tag**：`malo-1.1-rc1` 固定指向 `8ef4e98`；标签在本冻结文档提交之前创建，不移动、不覆盖。

9. **Merge readiness**：Ready to merge `feature/malo-1.1` → `master`，但必须等待明确的后续指令；本次未 merge、rebase、squash 或 amend，`master` 未修改。

10. **Upload readiness**：Ready for Malo 1.1 RC upload/review after the explicit merge/upload instruction；本次未上传、未提交审核、未创建 final release tag。
