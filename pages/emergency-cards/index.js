const { EMERGENCY_CARDS } = require("../../utils/constants");
const {
  addWishItem,
  getWishItems,
  initializeDefaultWishItems
} = require("../../utils/storage");

function buildCards(expandedIndex = -1) {
  return EMERGENCY_CARDS.map((card, index) => ({
    ...card,
    expanded: index === expandedIndex
  }));
}

Page({
  data: {
    cards: buildCards(),
    lastAdded: false
  },

  onShow() {
    initializeDefaultWishItems();
  },

  toggleCard(event) {
    const index = Number(event.currentTarget.dataset.index);
    const isExpanded = this.data.cards[index] && this.data.cards[index].expanded;
    this.setData({
      cards: buildCards(isExpanded ? -1 : index)
    });
  },

  addAction(event) {
    const index = Number(event.currentTarget.dataset.index);
    const card = this.data.cards[index];
    if (!card) return;

    const exists = getWishItems().some((item) => item.title === card.action);
    if (exists) {
      wx.showToast({ title: "这个小动作已经在愿望清单里了。", icon: "none" });
      this.setData({ lastAdded: true });
      return;
    }

    addWishItem(card.action, "post_exit");
    this.setData({ lastAdded: true });
    wx.showToast({
      title: "已经放进愿望清单。慢慢来，Croissant 会陪你。",
      icon: "none",
      duration: 2200
    });
  },

  goWishlist() {
    wx.switchTab({ url: "/pages/wishlist/index" });
  }
});
