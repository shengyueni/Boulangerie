const { getDiaryEntryById } = require("../../utils/storage");
const { buildCompanion, getCroissantStateImage, getElodieVariantImage } = require("../../utils/characters");

function preview(text) {
  const value = text || "这条记录还没有事实纪要。";
  return value.length > 120 ? value.slice(0, 120) + "..." : value;
}

function buildSavedCompanion(entry) {
  if (entry && Number(entry.impactLevel) >= 4) {
    return buildCompanion("croissant", "diarySavedNegative", {
      image: getCroissantStateImage("ball"),
      tag: "已经被接住",
      message: "Croissant 收到了这条记录。它不急着替你做决定，只是陪你把事情放到桌面上看清楚。",
      size: "bust"
    });
  }
  return buildCompanion("elodie", "diarySavedNegative", {
    image: getElodieVariantImage("encourage"),
    tag: "已经被接住",
    message: "这件事已经被放到纸面上了。先不用立刻解释完，能看清一点也算一点。",
    size: "bust"
  });
}

Page({
  data: { id: "", entry: null, message: "", memoPreview: "", companion: null },
  onLoad(options) {
    const id = options && options.id ? options.id : "";
    const entry = getDiaryEntryById(id);
    this.setData({
      id,
      entry,
      message: "Croissant 收到了这条记录。它不急着替你做决定，只是陪你把事情放到桌面上看清楚。",
      memoPreview: preview(entry && entry.factMemo),
      companion: buildSavedCompanion(entry)
    });
  },
  goDetail() { wx.redirectTo({ url: "/pages/diary-detail/index?id=" + this.data.id }); },
  goDashboard() { wx.redirectTo({ url: "/pages/dashboard/index" }); },
  goBubble() { wx.redirectTo({ url: "/pages/bubble/index" }); },
  goPlan() { wx.switchTab({ url: "/pages/wishlist/index" }); }
});