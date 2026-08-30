const { TOOLBOX_ITEMS } = require("../../utils/constants");
const { getMaloNickname } = require("../../utils/storage");

const EXTRA_TOOLS = [
  { title: "吗喽的泡泡机", subtitle: "吹出两句朋友的话，偶尔飘过一点噪音", path: "/pages/bubble/index", color: "pink", enabled: true },
  { title: "Malo 怎么称呼你？", subtitle: "留一个只存在本机、可以随时修改的称呼", path: "/pages/nickname/index", color: "green", enabled: true },
  { title: "隐私与安全说明", subtitle: "看看数据存在哪里、这个工具不能替你做什么", path: "/pages/about/index", color: "plain", enabled: true }
];
const TAB_PATHS = [
  "/pages/index/index",
  "/pages/diary/index",
  "/pages/wishlist/index",
  "/pages/toolbox/index",
  "/pages/voice/index"
];
const VISIBLE_TOOLBOX_ITEMS = TOOLBOX_ITEMS.filter((item) => item.path !== "/pages/exit-test/index");

function buildToolItems(nickname) {
  return EXTRA_TOOLS.slice(0, 1)
    .concat(VISIBLE_TOOLBOX_ITEMS, EXTRA_TOOLS.slice(1))
    .map((item) => item.path === "/pages/nickname/index" ? {
      ...item,
      subtitle: nickname ? `当前：${nickname}` : "还没有设置，留一个只存在本机的称呼"
    } : item);
}

Page({
  data: { items: buildToolItems("") },
  onShow() {
    this.setData({ items: buildToolItems(getMaloNickname()) });
  },
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
