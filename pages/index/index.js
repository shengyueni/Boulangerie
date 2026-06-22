const { APP_META, CHARACTERS } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");

function getCroissantStatus(entries) {
  const negativeWear = entries.reduce((total, entry) => {
    if (entry.type !== "negative") return total;
    return total + Number(entry.impactLevel || 0);
  }, 0);
  const positiveRelief = entries.filter((entry) => entry.type === "positive").length;
  const wear = Math.max(0, negativeWear - positiveRelief);

  if (wear <= 5) return "毛很顺";
  if (wear <= 12) return "有点炸毛";
  if (wear <= 20) return "被搓成毛球";
  return "进入保护模式";
}

Page({
  data: {
    croissant: CHARACTERS.croissant,
    appMeta: APP_META,
    status: "毛很顺",
    navItems: [
      { label: "写一条日记", path: "/pages/diary-new/index", color: "pink" },
      { label: "看我的决心仪表盘", path: "/pages/dashboard/index", color: "green" },
      { label: "摇一颗泡泡", path: "/pages/bubble/index", color: "yellow" },
      { label: "打开愿望清单", path: "/pages/wishlist/index", color: "pink" },
      { label: "打开百宝箱", path: "/pages/toolbox/index", color: "green" },
      { label: "听听吗喽的心声", path: "/pages/voice/index", color: "yellow" }
    ]
  },

  onShow() {
    this.setData({
      status: getCroissantStatus(getDiaryEntries())
    });
  },

  goTo(event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.path
    });
  }
});
