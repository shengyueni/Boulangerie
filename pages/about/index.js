const { APP_META } = require("../../utils/constants");
const { clearLocalData } = require("../../utils/storage");
const { buildCompanion, getElodieVariantImage } = require("../../utils/characters");
const cloudBackupLifecycle = require("../../utils/cloud-backup-lifecycle");

function formatCloudTime(value) {
  if (!value) return "尚未完成第一次备份";
  const date = new Date(value && value.$date ? value.$date : value);
  if (Number.isNaN(date.getTime())) return "备份时间暂不可用";
  const pad = (number) => String(number).padStart(2, "0");
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
    + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

function buildCloudBackupCard(state) {
  const loading = state.status === "idle" || state.status === "loading";
  const unavailable = state.status === "failed" && state.preference === "unknown";
  const enabled = state.preference === "enabled";
  const suppressed = enabled && state.recoverySuppressed;
  let statusText = "未开启";
  let detailText = "开启后，可在清除缓存或更换设备后恢复核心记录。";

  if (loading) {
    statusText = "正在读取状态…";
    detailText = "Malo 的本地功能可以继续正常使用。";
  } else if (unavailable) {
    statusText = "暂时无法读取";
    detailText = "云端状态暂时不可用，本地内容不受影响。";
  } else if (suppressed) {
    statusText = "已开启 · 恢复已暂停";
    detailText = "本地记录已被主动清空。你的云端备份仍然保留，目前不会自动恢复或覆盖。";
  } else if (enabled && state.recoveryStatus === "failed") {
    statusText = "已开启";
    detailText = "最近一次恢复没有成功，本地内容不会因此被删除。";
  } else if (enabled) {
    statusText = "已开启";
    detailText = "本地优先；离开小程序时会尝试更新云端备份。";
  }

  return {
    loading,
    enabled,
    suppressed,
    statusText,
    detailText,
    lastBackupText: formatCloudTime(state.lastBackupAt),
    showEnable: !loading && !unavailable && !enabled,
    showBackup: enabled
      && !suppressed
      && state.recoveryChecked
      && state.recoveryStatus !== "failed"
      && !state.restoreInFlight,
    showDisable: enabled,
    showRestore: suppressed
  };
}

Page({
  data: {
    appMeta: APP_META,
    companion: buildCompanion("elodie", "diaryDetail", {
      image: getElodieVariantImage("think"),
      tag: "清醒说明",
      message: "Elodie 在这里负责把边界说清楚：是否开启云端备份由你决定，工具也不会替你决定人生。"
    }),
    cloudBackup: buildCloudBackupCard(cloudBackupLifecycle.getLifecycleState()),
    backupActionInFlight: false
  },

  onLoad() {
    this.unsubscribeCloudBackup = cloudBackupLifecycle.subscribeLifecycle((state) => {
      this.setData({ cloudBackup: buildCloudBackupCard(state) });
    });
  },

  onShow() {
    const app = getApp();
    if (app.globalData.cloudIdentity && app.globalData.cloudIdentity.status === "ready") {
      cloudBackupLifecycle.initializeCloudBackupLifecycle().then(() => {
        if (cloudBackupLifecycle.getLifecycleState().preference === "enabled") {
          cloudBackupLifecycle.refreshCloudBackupStatus();
        }
      });
    }
  },

  onUnload() {
    if (this.unsubscribeCloudBackup) this.unsubscribeCloudBackup();
  },

  showBackupToast(success, successTitle) {
    wx.showToast({
      title: success ? successTitle : "云端操作暂时没有成功，本地内容不受影响",
      icon: "none",
      duration: success ? 1800 : 2600
    });
  },

  async enableCloudBackup() {
    if (this.data.backupActionInFlight) return;
    this.setData({ backupActionInFlight: true });
    const result = await cloudBackupLifecycle.setCloudBackupMode("enabled");
    this.setData({ backupActionInFlight: false });
    const firstBackupFailed = result.ok && result.initialBackup && !result.initialBackup.ok;
    this.showBackupToast(result.ok && !firstBackupFailed, "云端备份已开启");
  },

  async backupNow() {
    if (this.data.backupActionInFlight) return;
    this.setData({ backupActionInFlight: true });
    const result = await cloudBackupLifecycle.backupNow("manual_about");
    this.setData({ backupActionInFlight: false });
    this.showBackupToast(result.ok, "已完成云端备份");
  },

  disableCloudBackup() {
    if (this.data.backupActionInFlight) return;
    wx.showModal({
      title: "关闭云端备份？",
      content: "关闭后，Malo 将停止新的云端备份和自动恢复。\n\n当前已有的云端备份暂时不会被删除。",
      cancelText: "继续使用备份",
      confirmText: "关闭云备份",
      confirmColor: "#e9785f",
      success: async (modalResult) => {
        if (!modalResult.confirm) return;
        this.setData({ backupActionInFlight: true });
        const result = await cloudBackupLifecycle.setCloudBackupMode("disabled");
        this.setData({ backupActionInFlight: false });
        this.showBackupToast(result.ok, "云端备份已关闭");
      }
    });
  },

  async restoreAfterClear() {
    if (this.data.backupActionInFlight) return;
    this.setData({ backupActionInFlight: true });
    const result = await cloudBackupLifecycle.restoreAfterIntentionalClear();
    this.setData({ backupActionInFlight: false });
    this.showBackupToast(result.ok, "已恢复你的云端记录");
  },

  clearData() {
    wx.showModal({
      title: "确认清空",
      content: "这会清空当前设备上的日记、愿望清单、本地心声和试用反馈。已有云端备份不会被删除，也不会在之后偷偷自动恢复。确定要继续吗？",
      confirmText: "清空",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        clearLocalData();
        cloudBackupLifecycle.markIntentionalLocalClear();
        wx.showToast({
          title: "本地数据已清空。希望现实世界也能这么一键清理，但很遗憾，它通常不配合。",
          icon: "none",
          duration: 2600
        });
      }
    });
  },

  goFeedback() {
    wx.navigateTo({ url: "/pages/feedback/index" });
  }
});
