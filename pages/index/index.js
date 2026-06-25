const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");


Page({
  data: {
    appMeta: APP_META,
    oracle: getTodayOracle(),
    croissant: getCroissantReport([]),
    todayStatusButtons: [
      { label: "写日记", action: "record" },
      { label: "急救一下", action: "emergency" },
      { label: "查看计划", action: "plan" }
    ]
  },

  onShow() {
    const croissant = getCroissantReport(getDiaryEntries());
    this.setData({
      oracle: getTodayOracle(),
      croissant
    });
  },

  recordToday() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
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
  }
});
