const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");
const { CHARACTERS, buildCompanion } = require("../../utils/characters");
Page({
  data: {
    appMeta: APP_META,
    oracle: getTodayOracle(),
    croissant: getCroissantReport([]),
    companion: buildCompanion("croissant", "home", {
      image: CHARACTERS.croissant.bust,
      tag: "今日陪伴",
      size: "bust"
    })
  },

  onShow() {
    this.setData({
      oracle: getTodayOracle(),
      croissant: getCroissantReport(getDiaryEntries())
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
  }
});
