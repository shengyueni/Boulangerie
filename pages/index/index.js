const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");
const { buildCompanion, getCroissantStateImage } = require("../../utils/characters");

function buildHomeCompanion(croissant) {
  return buildCompanion("croissant", "home", {
    image: getCroissantStateImage(croissant.statusKey),
    tag: "今日陪伴",
    size: "bust"
  });
}

Page({
  data: {
    appMeta: APP_META,
    oracle: getTodayOracle(),
    croissant: getCroissantReport([]),
    companion: buildHomeCompanion(getCroissantReport([]))
  },

  onShow() {
    const croissant = getCroissantReport(getDiaryEntries());
    this.setData({
      oracle: getTodayOracle(),
      croissant,
      companion: buildHomeCompanion(croissant)
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