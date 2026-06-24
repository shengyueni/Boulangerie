const { APP_META } = require("../../utils/constants");
const { clearLocalData } = require("../../utils/storage");
const { buildCompanion, getElodieVariantImage } = require("../../utils/characters");

Page({
  data: {
    appMeta: APP_META,
    companion: buildCompanion("elodie", "diaryDetail", {
      image: getElodieVariantImage("think"),
      tag: "清醒说明",
      message: "Elodie 在这里负责把边界说清楚：数据留在本机，工具也不会替你决定人生。"
    })
  },

  clearData() {
    wx.showModal({
      title: "确认清空",
      content: "这些内容只保存在当前设备。清空后，日记、愿望清单、测试内容、树洞内容和试用反馈可能无法恢复。确定要继续吗？",
      confirmText: "清空",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        clearLocalData();
        wx.showToast({
          title: "本地数据已清空。希望现实世界也能这么一键清理，但很遗憾，它通常不配合。",
          icon: "none",
          duration: 2600
        });
      }
    });
  },

  goFeedback() {
    wx.navigateTo({ url: "/pages/feedback/index" });
  }
});
