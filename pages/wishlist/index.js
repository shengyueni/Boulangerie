const { PLAN_CATEGORIES } = require("../../utils/constants");
const { createId, getWishItems, saveWishItems, initializeDefaultWishItems } = require("../../utils/storage");

function getProgressText(percent) {
  if (percent === 0) return "出走计划还没开始。没关系，第一步可以小到离谱。";
  if (percent <= 40) return "你已经开始把出走从情绪变成准备。";
  if (percent <= 80) return "这不是冲动，这是你一点点搭起来的过渡容器。";
  return "Croissant 已经收拾好很多东西了。你正在把人生从工作手里拿回来。";
}
function groupItems(items, categories) { return categories.map((category) => ({ category, items: items.filter((item) => (item.category || "未分类") === category) })).filter((group) => group.items.length); }

Page({
  data: { items: [], activeType: "pre_exit", newTitle: "", newCategory: "钱与保障", categories: PLAN_CATEGORIES.pre_exit, groups: [], total: 0, completed: 0, percent: 0, progressText: "" },
  onLoad(options) { if (options && options.type) this.setData({ activeType: options.type }); },
  onShow() { initializeDefaultWishItems(); this.refresh(); },
  refresh() {
    const items = getWishItems();
    const categories = PLAN_CATEGORIES[this.data.activeType] || PLAN_CATEGORIES.pre_exit;
    const scoped = items.filter((item) => item.type === this.data.activeType);
    const total = items.length;
    const completed = items.filter((item) => item.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    this.setData({ items, categories, newCategory: categories.includes(this.data.newCategory) ? this.data.newCategory : categories[0], groups: groupItems(scoped, categories.concat("未分类")), total, completed, percent, progressText: getProgressText(percent) });
  },
  switchTab(event) { const activeType = event.currentTarget.dataset.type; const categories = PLAN_CATEGORIES[activeType]; this.setData({ activeType, categories, newCategory: categories[0], newTitle: "" }); this.refresh(); },
  selectCategory(event) { this.setData({ newCategory: event.currentTarget.dataset.category }); },
  onInput(event) { this.setData({ newTitle: event.detail.value }); },
  addItem() {
    const title = this.data.newTitle.trim();
    if (!title) { wx.showToast({ title: "先写下一个小计划。", icon: "none" }); return; }
    const item = { id: createId("wish"), type: this.data.activeType, category: this.data.newCategory, source: "user", title, completed: false, createdAt: new Date().toISOString(), completedAt: null };
    saveWishItems([item].concat(this.data.items));
    this.setData({ newTitle: "" }); this.refresh();
    wx.showToast({ title: "已经加入出走计划。", icon: "none" });
  },
  toggleItem(event) {
    const id = event.currentTarget.dataset.id;
    const items = this.data.items.map((item) => item.id !== id ? item : { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : null });
    saveWishItems(items); this.refresh();
  },
  deleteItem(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({ title: "确认删除", content: "确定要删除这个计划事项吗？", confirmText: "删除", confirmColor: "#e9785f", success: (res) => { if (!res.confirm) return; saveWishItems(this.data.items.filter((item) => item.id !== id)); this.refresh(); wx.showToast({ title: "这个事项已经删除。", icon: "none" }); } });
  }
});
