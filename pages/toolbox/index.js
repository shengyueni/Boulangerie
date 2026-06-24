const { TOOLBOX_ITEMS } = require("../../utils/constants");

const EXTRA_TOOLS = [
  { title: "吗喽的泡泡机", subtitle: "摇一颗小小的安慰，戳破一句职场废话", path: "/pages/bubble/index", color: "pink", enabled: true },
  { title: "隐私与安全说明", subtitle: "看看数据存在哪里、这个工具不能替你做什么", path: "/pages/about/index", color: "plain", enabled: true }
];
const TAB_PATHS = [
  "/pages/index/index",
  "/pages/diary/index",
  "/pages/wishlist/index",
  "/pages/toolbox/index",
  "/pages/voice/index"
];

Page({
  data: { items: EXTRA_TOOLS.slice(0, 1).concat(TOOLBOX_ITEMS, EXTRA_TOOLS.slice(1)) },
  openTool(event) {
    const item = this.data.items[event.currentTarget.dataset.index];
    if (!item || !item.enabled) {
      wx.showToast({ title: "这个入口还在准备中。", icon: "none" });
      return;
    }
    if (TAB_PATHS.includes(item.path)) {
      wx.switchTab({ url: item.path });
      return;
    }
    wx.navigateTo({ url: item.path });
  },
  openFeedback() {
    wx.navigateTo({ url: "/pages/feedback/index" });
  }
});
