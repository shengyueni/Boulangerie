const { TOOLBOX_ITEMS } = require("../../utils/constants");
Page({
  data: { items: TOOLBOX_ITEMS.concat([
    { title: "隐私与安全说明", subtitle: "看看数据存在哪里、这个工具不能替你做什么", path: "/pages/about/index", color: "plain", enabled: true },
    { title: "试用反馈", subtitle: "复制 6 个问题，帮 Croissant 试走这一步", path: "/pages/feedback/index", color: "green", enabled: true }
  ]) },
  openTool(event) { const item = this.data.items[event.currentTarget.dataset.index]; if (!item || !item.enabled) { wx.showToast({ title: "这个入口还在准备中。", icon: "none" }); return; } wx.navigateTo({ url: item.path }); }
});
