const {
  createId,
  getWishItems,
  saveWishItems,
  initializeDefaultWishItems
} = require("../../utils/storage");

Page({
  data: {
    items: [],
    activeType: "pre_exit",
    activeTitle: "离职前要做的事",
    newTitle: "",
    preItems: [],
    postItems: [],
    visibleItems: []
  },

  onShow() {
    initializeDefaultWishItems();
    this.refresh();
  },

  refresh() {
    const items = getWishItems();
    this.setData({
      items,
      preItems: items.filter((item) => item.type === "pre_exit"),
      postItems: items.filter((item) => item.type === "post_exit"),
      visibleItems: items.filter((item) => item.type === this.data.activeType)
    });
  },

  switchTab(event) {
    const activeType = event.currentTarget.dataset.type;
    this.setData({
      activeType,
      activeTitle: activeType === "pre_exit" ? "离职前要做的事" : "离职后想做的事",
      newTitle: ""
    });
    this.refresh();
  },

  onInput(event) {
    this.setData({ newTitle: event.detail.value });
  },

  addItem() {
    const title = this.data.newTitle.trim();
    if (!title) {
      wx.showToast({ title: "先写下一个小愿望", icon: "none" });
      return;
    }

    const item = {
      id: createId("wish"),
      type: this.data.activeType,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    saveWishItems([item].concat(this.data.items));
    this.setData({ newTitle: "" });
    this.refresh();
    wx.showToast({ title: "已经加入愿望清单。", icon: "none" });
  },

  toggleItem(event) {
    const id = event.currentTarget.dataset.id;
    const items = this.data.items.map((item) => {
      if (item.id !== id) return item;
      const completed = !item.completed;
      if (completed) {
        wx.showToast({
          title: "Croissant 顺毛了一点。你正在把人生从工作手里一点点拿回来。",
          icon: "none",
          duration: 2200
        });
      }
      return {
        ...item,
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };
    });
    saveWishItems(items);
    this.refresh();
  },

  deleteItem(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "确定要删除这个愿望吗？",
      confirmText: "删除",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        saveWishItems(this.data.items.filter((item) => item.id !== id));
        this.refresh();
        wx.showToast({ title: "这个愿望已经删除。", icon: "none" });
      }
    });
  }
});
