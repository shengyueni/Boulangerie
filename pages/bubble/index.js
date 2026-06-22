const { BUBBLES } = require("../../utils/constants");

function pickBubble(currentIndex) {
  const ldBubbles = BUBBLES.map((bubble, index) => ({ bubble, index })).filter((item) => item.bubble.tone === "ld");
  const gentleBubbles = BUBBLES.map((bubble, index) => ({ bubble, index })).filter((item) => item.bubble.tone !== "ld");
  const pool = Math.random() < 0.2 && ldBubbles.length ? ldBubbles : gentleBubbles;
  let picked = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && picked.index === currentIndex) {
    const nextIndex = (pool.findIndex((item) => item.index === picked.index) + 1) % pool.length;
    picked = pool[nextIndex];
  }
  return picked;
}

Page({
  data: {
    bubble: null,
    bubbleIndex: -1,
    poppedMessage: ""
  },

  drawBubble() {
    const picked = pickBubble(this.data.bubbleIndex);
    this.setData({
      bubble: picked.bubble,
      bubbleIndex: picked.index,
      poppedMessage: ""
    });
  },

  popLdBubble() {
    this.setData({
      poppedMessage: "已识别职场废话，建议不要内化。"
    });
  }
});
