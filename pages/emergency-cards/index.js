const { EMERGENCY_CARDS } = require("../../utils/constants");
const { addWishItem, initializeDefaultWishItems } = require("../../utils/storage");

function buildCards(expandedIndex = -1) {
  return EMERGENCY_CARDS.map((card, index) => ({
    ...card,
    expanded: index === expandedIndex
  }));
}

Page({
  data: {
    cards: buildCards()
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
    addWishItem(card.action, "post_exit");
    wx.showToast({
      title: "已经放进愿望清单。慢慢来，Croissant 会陪你。",
      icon: "none",
      duration: 2200
    });
  }
});
