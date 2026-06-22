const { getDiaryEntryById } = require("../../utils/storage");
function preview(text) { const value = text || "这条记录还没有事实纪要。"; return value.length > 120 ? value.slice(0, 120) + "..." : value; }
Page({
  data: { id: "", entry: null, message: "", memoPreview: "" },
  onLoad(options) {
    const id = options && options.id ? options.id : "";
    const entry = getDiaryEntryById(id);
    this.setData({
      id,
      entry,
      message: entry && entry.type === "positive" ? "Croissant 顺毛了一点。你也替自己留住了一点亮光。" : "Croissant 受到了一点磨损。但这件事已经不再只是在你身体里打转。",
      memoPreview: preview(entry && entry.factMemo)
    });
  },
  goDetail() { wx.redirectTo({ url: "/pages/diary-detail/index?id=" + this.data.id }); },
  goDashboard() { wx.redirectTo({ url: "/pages/dashboard/index" }); },
  goBubble() { wx.redirectTo({ url: "/pages/bubble/index" }); },
  goPlan() { wx.redirectTo({ url: "/pages/wishlist/index?type=pre_exit" }); }
});
