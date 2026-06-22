const { TOOLBOX_ITEMS } = require("../../utils/constants");

Page({
  data: {
    items: TOOLBOX_ITEMS
  },

  showComingSoon() {
    wx.showToast({
      title: "这个工具会在 0.2 版本上线。",
      icon: "none"
    });
  }
});
