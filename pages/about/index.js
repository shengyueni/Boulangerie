const { APP_META } = require("../../utils/constants");
const { clearLocalData } = require("../../utils/storage");

Page({
  data: {
    appMeta: APP_META
  },

  clearData() {
    wx.showModal({
      title: "确认清空",
      content: "这会删除本设备上的日记和愿望清单，删除后无法恢复。确定要清空吗？",
      confirmText: "清空",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        clearLocalData();
        wx.showToast({
          title: "本地数据已清空。",
          icon: "none"
        });
      }
    });
  },

  goFeedback() {
    wx.navigateTo({ url: "/pages/feedback/index" });
  }
});
