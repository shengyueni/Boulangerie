const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { getTodayOracle } = require("../../utils/oracle");
const { getCharacterLine, getCroissantStateImage } = require("../../utils/characters");

function buildTodayStatus(croissant) {
  return {
    image: getCroissantStateImage(croissant.statusKey),
    message: getCharacterLine("home", croissant.wear),
    advice: croissant.advice
  };
}

Page({
  data: {
    appMeta: APP_META,
    oracle: getTodayOracle(),
    croissant: getCroissantReport([]),
    todayStatus: buildTodayStatus(getCroissantReport([]))
  },

  onShow() {
    const croissant = getCroissantReport(getDiaryEntries());
    this.setData({
      oracle: getTodayOracle(),
      croissant,
      todayStatus: buildTodayStatus(croissant)
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
