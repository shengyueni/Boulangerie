const { APP_META } = require("../../utils/constants");
const { getDiaryEntries, getMaloNickname } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");
const { POSTER_HEIGHT, POSTER_SCALE, POSTER_WIDTH, drawOraclePoster } = require("../../utils/oracle-poster");
const cloudBackupLifecycle = require("../../utils/cloud-backup-lifecycle");

const FIRST_USE_GUIDE_KEY = "hasSeenFirstUseGuide";

Page({
  data: {
    appMeta: APP_META,
    nickname: "",
    oracle: getTodayOracle(),
    isSavingOraclePoster: false,
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
      nickname: getMaloNickname(),
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
      nickname: getMaloNickname(),
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
    if (this.data.isSavingOraclePoster) return;
    wx.getSetting({
      success: (settings) => {
        if (settings.authSetting["scope.writePhotosAlbum"] === false) {
          this.showAlbumPermissionGuide();
          return;
        }
        this.generateAndSaveOraclePoster();
      },
      fail: () => this.generateAndSaveOraclePoster()
    });
  },

  generateAndSaveOraclePoster() {
    this.setData({ isSavingOraclePoster: true });
    wx.showLoading({ title: "正在生成卡片", mask: true });
    this.createOraclePoster()
      .then((filePath) => new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject });
      }))
      .then(() => {
        wx.showToast({ title: "今天的职场天气已经收进相册啦。", icon: "none" });
      })
      .catch((error) => {
        const message = String((error && error.errMsg) || error || "");
        if (/auth deny|auth denied|authorize:fail/i.test(message)) {
          this.showAlbumPermissionGuide();
          return;
        }
        wx.showToast({ title: "保存没有成功，请稍后再试。", icon: "none" });
      })
      .then(() => {
        wx.hideLoading();
        this.setData({ isSavingOraclePoster: false });
      });
  },

  createOraclePoster() {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .in(this)
        .select("#oraclePosterCanvas")
        .fields({ node: true, size: true })
        .exec((result) => {
          const canvas = result && result[0] && result[0].node;
          if (!canvas) {
            reject(new Error("oracle poster canvas unavailable"));
            return;
          }
          canvas.width = POSTER_WIDTH * POSTER_SCALE;
          canvas.height = POSTER_HEIGHT * POSTER_SCALE;
          const context = canvas.getContext("2d");
          context.scale(POSTER_SCALE, POSTER_SCALE);
          drawOraclePoster(context, this.data.oracle);
          wx.canvasToTempFilePath({
            canvas,
            fileType: "png",
            success: (response) => resolve(response.tempFilePath),
            fail: reject
          }, this);
        });
    });
  },

  showAlbumPermissionGuide() {
    wx.showModal({
      title: "还不能保存到相册",
      content: "可以在设置里允许访问相册，再回来保存今天的卡片。",
      cancelText: "暂不设置",
      confirmText: "去设置",
      success: (result) => {
        if (result.confirm) wx.openSetting();
      }
    });
  },

  goInsights() {
    wx.navigateTo({ url: "/pages/insights/index" });
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
