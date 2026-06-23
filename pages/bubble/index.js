const { BUBBLES } = require("../../utils/constants");
const { buildCompanion, getCharacterLine, getLdVariantImage } = require("../../utils/characters");

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

function buildLdCompanion(groupKey, tag, variant, imageVariant) {
  return buildCompanion("ld", groupKey, {
    image: getLdVariantImage(imageVariant),
    tag,
    message: getCharacterLine(groupKey),
    variant,
    size: "bust"
  });
}

Page({
  data: {
    bubble: null,
    bubbleIndex: -1,
    poppedMessage: "",
    companion: buildLdCompanion("bubble", "LD 废话警报", "ld", "nonsense")
  },

  drawBubble() {
    const picked = pickBubble(this.data.bubbleIndex);
    this.setData({
      bubble: picked.bubble,
      bubbleIndex: picked.index,
      poppedMessage: "",
      companion: buildLdCompanion("bubble", "LD 废话警报", "ld", "nonsense")
    });
  },

  popLdBubble() {
    this.setData({
      poppedMessage: "已识别职场废话，建议不要内化。",
      companion: buildLdCompanion("bubbleAfterPop", "泡泡已破", "warning", "exposed")
    });
  }
});