const { BUBBLES } = require("../../utils/constants");

Page({
  data: {
    bubble: null,
    bubbleIndex: -1,
    poppedMessage: ""
  },

  drawBubble() {
    let index = Math.floor(Math.random() * BUBBLES.length);
    if (BUBBLES.length > 1 && index === this.data.bubbleIndex) {
      index = (index + 1) % BUBBLES.length;
    }
    this.setData({
      bubble: BUBBLES[index],
      bubbleIndex: index,
      poppedMessage: ""
    });
  },

  popLdBubble() {
    this.setData({
      poppedMessage: "已识别职场废话，建议不要内化。"
    });
  }
});
