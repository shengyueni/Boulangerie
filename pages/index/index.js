const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");

Page({
  data: {
    appMeta: APP_META,
    croissant: getCroissantReport([]),
    navItems: [
      { label: "写一条日记", subtitle: "把今天发生的事先放下来。", path: "/pages/diary-new/index", color: "pink", size: "large" },
      { label: "吗喽的日记本", subtitle: "看看那些不是你幻想出来的消耗。", path: "/pages/diary/index", color: "paper" },
      { label: "决心仪表盘", subtitle: "看见反复出现的模式。", path: "/pages/dashboard/index", color: "green" },
      { label: "吗喽的泡泡机", subtitle: "摇一颗小小的安慰。", path: "/pages/bubble/index", color: "yellow" },
      { label: "愿望清单", subtitle: "把出走变成可以准备的事。", path: "/pages/wishlist/index", color: "pink" },
      { label: "百宝箱", subtitle: "呼吸、自测和急救卡片都在这里。", path: "/pages/toolbox/index", color: "green", size: "wide" },
      { label: "心声", subtitle: "先看看别的吗喽也在想什么。", path: "/pages/voice/index", color: "paper" },
      { label: "隐私与安全说明", subtitle: "看看数据都放在哪里。", path: "/pages/about/index", color: "yellow" },
      { label: "试用反馈", subtitle: "帮 Croissant 试走这一步。", path: "/pages/feedback/index", color: "pink" }
    ]
  },

  onShow() {
    this.setData({
      croissant: getCroissantReport(getDiaryEntries())
    });
  },

  goTo(event) {
    wx.navigateTo({
      url: event.currentTarget.dataset.path
    });
  }
});
