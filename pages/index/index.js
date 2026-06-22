const { APP_META } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");

Page({
  data: {
    appMeta: APP_META,
    croissant: getCroissantReport([]),
    navItems: [
      { label: "写一条日记", alias: "记录处", subtitle: "把今天发生的事先放下来。", path: "/pages/diary-new/index", color: "orange", size: "large" },
      { label: "吗喽的日记本", alias: "档案袋", subtitle: "看看那些不是你幻想出来的消耗。", path: "/pages/diary/index", color: "blue" },
      { label: "决心仪表盘", alias: "复盘台", subtitle: "看见反复出现的模式。", path: "/pages/dashboard/index", color: "green" },
      { label: "吗喽的泡泡机", alias: "泡泡站", subtitle: "摇一颗小小的安慰。", path: "/pages/bubble/index", color: "pink" },
      { label: "出走计划", alias: "计划屋", subtitle: "把出走变成可以准备的事。", path: "/pages/wishlist/index", color: "purple" },
      { label: "百宝箱", alias: "工具箱", subtitle: "呼吸、自测和急救卡片都在这里。", path: "/pages/toolbox/index", color: "gold", size: "wide" },
      { label: "心声", alias: "树洞口", subtitle: "先看看别的吗喽也在想什么。", path: "/pages/voice/index", color: "blue" },
      { label: "隐私与安全说明", alias: "守则页", subtitle: "看看数据都放在哪里。", path: "/pages/about/index", color: "green" },
      { label: "试用反馈", alias: "回信口", subtitle: "帮 Croissant 试走这一步。", path: "/pages/feedback/index", color: "pink" }
    ]
  },

  onShow() {
    this.setData({ croissant: getCroissantReport(getDiaryEntries()) });
  },

  goTo(event) {
    wx.navigateTo({ url: event.currentTarget.dataset.path });
  }
});
