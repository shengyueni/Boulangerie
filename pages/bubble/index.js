const { BUBBLES } = require("../../utils/constants");
const { buildCompanion, getCharacterLine, getLdVariantImage } = require("../../utils/characters");

function pickBubble(currentIndex) {
  const ldPool = BUBBLES.map((bubble, index) => ({ bubble, index })).filter((item) => item.bubble.tone === "ld");
  const pool = ldPool.length ? ldPool : BUBBLES.map((bubble, index) => ({ bubble, index }));
  let picked = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && picked.index === currentIndex) {
    const nextIndex = (pool.findIndex((item) => item.index === picked.index) + 1) % pool.length;
    picked = pool[nextIndex];
  }
  return picked;
}

function getBubbleCategory(text) {
  if (/急|很快|今天先处理|改一下/.test(text)) return "KPI 压迫";
  if (/你自己|主动|不要总想着|大家都是/.test(text)) return "责任转移";
  if (/年轻人|成长|锻炼人/.test(text)) return "空泛鼓励";
  if (/怎么做了这么久|太计较/.test(text)) return "情绪操控";
  return "模糊评价";
}

function getLdImageVariant(category, popped) {
  if (popped) return "exposed";
  if (["责任转移", "KPI 压迫"].includes(category)) return "blame";
  return "nonsense";
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

function buildSpecimen(picked) {
  const category = getBubbleCategory(picked.bubble.text);
  return {
    ...picked.bubble,
    category
  };
}

Page({
  data: {
    bubble: null,
    bubbleIndex: -1,
    popped: false,
    companion: buildLdCompanion("bubble", "LD 废话来源", "ld", "nonsense")
  },

  drawBubble() {
    const picked = pickBubble(this.data.bubbleIndex);
    const bubble = buildSpecimen(picked);
    this.setData({
      bubble,
      bubbleIndex: picked.index,
      popped: false,
      companion: buildLdCompanion("bubble", "LD 废话来源", "ld", getLdImageVariant(bubble.category, false))
    });
  },

  popLdBubble() {
    const bubble = this.data.bubble;
    if (!bubble) return;
    this.setData({
      popped: true,
      companion: buildLdCompanion("bubbleAfterPop", "泡泡已破", "warning", getLdImageVariant(bubble.category, true))
    });
  },

  goDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  acknowledge() {
    wx.showToast({ title: "知道了，不把它吞下去。", icon: "none" });
  }
});
