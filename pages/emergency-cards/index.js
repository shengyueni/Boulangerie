const { EMERGENCY_CARDS } = require("../../utils/constants");
const { buildCompanion, getGapchickVariantImage } = require("../../utils/characters");
const {
  addWishItem,
  getWishItems,
  initializeDefaultWishItems,
  getCustomEmergencyCards,
  saveCustomEmergencyCard,
  deleteCustomEmergencyCard
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
    customCards: [],
    showCustomForm: false,
    customTitle: "",
    customContent: "",
    lastAdded: false,
    companion: buildCompanion("gapchick", "emergencyCards", {
      image: getGapchickVariantImage("drink"),
      tag: "先让身体落地",
      message: "先喝口水，先呼吸，先回到自己这里。",
      variant: "rest",
      size: "bust"
    })
  },

  onShow() {
    initializeDefaultWishItems();
    this.loadCustomCards();
  },

  loadCustomCards() {
    this.setData({ customCards: getCustomEmergencyCards() });
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

  openCustomForm() {
    this.setData({ showCustomForm: true });
  },

  closeCustomForm() {
    this.setData({ showCustomForm: false, customTitle: "", customContent: "" });
  },

  onCustomTitleInput(event) {
    this.setData({ customTitle: event.detail.value });
  },

  onCustomContentInput(event) {
    this.setData({ customContent: event.detail.value });
  },

  saveCustomCard() {
    const title = this.data.customTitle.trim();
    const content = this.data.customContent.trim();
    if (!title || !content) {
      wx.showToast({ title: "先写一点标题和内容吧。", icon: "none" });
      return;
    }

    saveCustomEmergencyCard({ title, content });
    this.setData({ showCustomForm: false, customTitle: "", customContent: "" });
    this.loadCustomCards();
    wx.showToast({ title: "已保存到本机。", icon: "none" });
  },

  deleteCustomCard(event) {
    const id = event.currentTarget.dataset.id;
    deleteCustomEmergencyCard(id);
    this.loadCustomCards();
    wx.showToast({ title: "已删除这张小卡。", icon: "none" });
  },

  goWishlist() {
    wx.switchTab({ url: "/pages/wishlist/index" });
  }
});
