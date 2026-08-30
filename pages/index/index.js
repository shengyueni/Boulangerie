const { APP_META } = require("../../utils/constants");
const { getDiaryEntries, getOracleSnapshots, saveOracleSnapshot } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");
const cloudBackupLifecycle = require("../../utils/cloud-backup-lifecycle");

const FIRST_USE_GUIDE_KEY = "hasSeenFirstUseGuide";

Page({
  data: {
    appMeta: APP_META,
    oracle: getTodayOracle(),
    isTodayOracleSaved: false,
    croissant: getCroissantReport([]),
    showAutomaticFirstUseGuide: false,
    showManualFirstUseGuide: false,
    todayStatusButtons: [
      { label: "写日记", action: "record" },
      { label: "急救一下", action: "emergency" },
      { label: "查看计划", action: "plan" },
      { label: "查看引导", action: "guide" }
    ]
  },

  onLoad() {
    this.pageVisible = true;
    this.setData({
      showAutomaticFirstUseGuide: wx.getStorageSync(FIRST_USE_GUIDE_KEY) !== true,
      showManualFirstUseGuide: false
    });
    this.unsubscribeCloudBackup = cloudBackupLifecycle.subscribeLifecycle(() => {
      this.maybePromptCloudBackup();
    });
  },

  onShow() {
    this.pageVisible = true;
    const oracle = getTodayOracle();
    const croissant = getCroissantReport(getDiaryEntries());
    this.setData({
      oracle,
      isTodayOracleSaved: getOracleSnapshots().some((item) => item.dateLabel === oracle.dateLabel),
      croissant
    });
    this.maybePromptCloudBackup();
  },

  onHide() {
    this.pageVisible = false;
  },

  onUnload() {
    this.pageVisible = false;
    if (this.unsubscribeCloudBackup) this.unsubscribeCloudBackup();
  },

  maybePromptCloudBackup() {
    if (!this.pageVisible) return;
    cloudBackupLifecycle.maybePromptBackupOptIn(() => {
      return new Promise((resolve) => {
        wx.showModal({
          title: "要开启云端备份吗？",
          content: "开启后，你的日记、本地心声、出走清单和自定义急救卡会与你的小程序微信身份关联并备份到云端，用于清除缓存或更换设备后恢复。\n\nMalo 不需要获取你的微信昵称、头像或手机号。\n\n你也可以暂不开启，继续只保存在本机。",
          cancelText: "暂不开启",
          confirmText: "开启备份",
          success: (result) => resolve(result.confirm ? "enabled" : "disabled"),
          fail: () => resolve(null)
        });
      });
    });
  },

  recordToday() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  saveTodayOracle() {
    const result = saveOracleSnapshot(this.data.oracle);
    if (!result.snapshot) {
      wx.showToast({ title: "今天暂时没有可以收下的内容。", icon: "none" });
      return;
    }
    this.setData({ isTodayOracleSaved: true });
    wx.showToast({ title: result.created ? "今天收好啦。" : "今天已经收好啦。", icon: "none" });
  },

  dismissFirstUseGuide() {
    if (this.data.showAutomaticFirstUseGuide) {
      wx.setStorageSync(FIRST_USE_GUIDE_KEY, true);
    }
    this.setData({
      showAutomaticFirstUseGuide: false,
      showManualFirstUseGuide: false
    });
  },

  openFirstUseGuide() {
    this.setData({ showManualFirstUseGuide: true }, () => {
      wx.pageScrollTo({ scrollTop: 0, duration: 300 });
    });
  },

  startFirstDiary() {
    this.dismissFirstUseGuide();
    this.recordToday();
  },

  goDashboard() {
    wx.navigateTo({ url: "/pages/dashboard/index" });
  },

  goEmergency() {
    wx.navigateTo({ url: "/pages/emergency-cards/index" });
  },

  goPlan() {
    wx.switchTab({ url: "/pages/wishlist/index" });
  },

  handleCroissantAction(event) {
    const action = event.detail.action;
    if (action === "record") this.recordToday();
    if (action === "emergency") this.goEmergency();
    if (action === "plan") this.goPlan();
    if (action === "guide") this.openFirstUseGuide();
  }
});
