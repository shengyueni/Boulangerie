const { SKILL_CARDS } = require("../../utils/constants");
Page({
  data: { skills: SKILL_CARDS },
  copySkill(event) { const index = Number(event.currentTarget.dataset.index); const item = this.data.skills[index]; if (!item) return; wx.setClipboardData({ data: item.content, success() { wx.showToast({ title: "这条小技能已复制。", icon: "none" }); }, fail() { wx.showToast({ title: "复制失败，请稍后再试。", icon: "none" }); } }); }
});
