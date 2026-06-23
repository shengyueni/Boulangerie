const { getDiaryEntryById } = require("../../utils/storage");
const { CHARACTERS, buildCompanion } = require("../../utils/characters");

function preview(text) {
  const value = text || "这条记录还没有事实纪要。";
  return value.length > 120 ? value.slice(0, 120) + "..." : value;
}

function buildSavedCompanion(entry) {
  if (entry && entry.type === "positive") {
    return buildCompanion("gapchick", "positive", {
      image: CHARACTERS.gapchick.avatar,
      tag: "亮光已保存"
    });
  }
  return buildCompanion("croissant", "diarySavedNegative", {
    image: CHARACTERS.croissant.bust,
    size: "bust",
    tag: "已经被接住"
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
      message: entry && entry.type === "positive" ? "Croissant 顺毛了一点。你也替自己留住了一点亮光。" : "Croissant 受到了一点磨损。但这件事已经不再只是在你身体里打转。",
      memoPreview: preview(entry && entry.factMemo),
      companion: buildSavedCompanion(entry)
    });
  },
  goDetail() { wx.redirectTo({ url: "/pages/diary-detail/index?id=" + this.data.id }); },
  goDashboard() { wx.redirectTo({ url: "/pages/dashboard/index" }); },
  goBubble() { wx.redirectTo({ url: "/pages/bubble/index" }); },
  goPlan() { wx.switchTab({ url: "/pages/wishlist/index" }); }
});