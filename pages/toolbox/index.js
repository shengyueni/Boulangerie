const { TOOLBOX_ITEMS } = require("../../utils/constants");

Page({
  data: {
    items: TOOLBOX_ITEMS
  },

  openTool(event) {
    const item = this.data.items[event.currentTarget.dataset.index];
    if (!item || !item.enabled) {
      wx.showToast({
        title: "skills 链接会在后续版本上线。",
        icon: "none"
      });
      return;
    }
    wx.navigateTo({ url: item.path });
  }
});
