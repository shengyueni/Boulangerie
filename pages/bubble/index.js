const GAPCHICK_BUBBLES = [
  {
    speaker: "Gapchick",
    tag: "暂停一下",
    type: "gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    text: "先停一小会儿。世界不会因为你少硬撑五分钟就塌掉，虽然它有时候很会装。"
  },
  {
    speaker: "Gapchick",
    tag: "喘口气",
    type: "gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    text: "你不用马上把自己整理好。先把肩膀放下来一点，也算是在回到自己身边。"
  },
  {
    speaker: "Gapchick",
    tag: "身体优先",
    type: "gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    text: "如果身体已经在抗议，就先别把它当成不懂事。它只是比你更早说了实话。"
  },
  {
    speaker: "Gapchick",
    tag: "不用表演",
    type: "gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    text: "你可以不那么能干一会儿。这里没人给你发绩效表，谢天谢地。"
  },
  {
    speaker: "Gapchick",
    tag: "允许疲惫",
    type: "gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    text: "你不是因为脆弱才累。反复忍耐本来就会耗电。"
  }
];

const ELODIE_BUBBLES = [
  {
    speaker: "Elodie",
    tag: "先写事实",
    type: "elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    text: "先别急着证明自己有没有道理。只写发生了什么，已经是在把混乱往外挪。"
  },
  {
    speaker: "Elodie",
    tag: "看见边界",
    type: "elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    text: "让你反复不舒服的事，通常不是小事。它可能正好碰到了你的边界。"
  },
  {
    speaker: "Elodie",
    tag: "不用急着决定",
    type: "elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    text: "现在不需要立刻决定离不离开。你可以先收集证据，等自己看清。"
  },
  {
    speaker: "Elodie",
    tag: "放远一点",
    type: "elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    text: "不是每一句扔到你身上的话，都配变成你的自我评价。先放远一点看。"
  },
  {
    speaker: "Elodie",
    tag: "留一点证据",
    type: "elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    text: "当你开始怀疑自己的感受时，记录会帮你留住现场。人脑在压力下很会替别人开脱。"
  }
];

function pick(list, avoidIndex = -1) {
  if (!Array.isArray(list) || !list.length) return { item: null, index: -1 };
  if (list.length === 1) return { item: list[0], index: 0 };

  let index = Math.floor(Math.random() * list.length);
  if (index === avoidIndex) index = (index + 1) % list.length;

  return { item: list[index], index };
}

Page({
  data: {
    machineImage: "/pages/bubble/assets/bubble-machine.png",
    currentBubble: null,
    hasBubble: false,
    isPopping: false,
    isAnimating: false,
    lastBubbleKey: "",
    lastGapchickIndex: -1,
    lastElodieIndex: -1
  },

  onLoad() {
    this.setData({
      currentBubble: null,
      hasBubble: false,
      isPopping: false,
      isAnimating: false
    });
  },

  handleBubbleMachineTap() {
    if (this.data.isAnimating) return;

    if (!this.data.hasBubble) {
      this.generateBubble();
      return;
    }

    this.setData({
      isPopping: true,
      isAnimating: true
    });

    setTimeout(() => {
      this.generateBubble({ keepAnimating: true });
      this.setData({
        isPopping: false,
        isAnimating: false
      });
    }, 220);
  },

  generateBubble(options = {}) {
    const useGapchick = Math.random() < 0.5;
    const source = useGapchick ? GAPCHICK_BUBBLES : ELODIE_BUBBLES;
    const avoidIndex = useGapchick ? this.data.lastGapchickIndex : this.data.lastElodieIndex;
    const picked = pick(source, avoidIndex);

    if (!picked.item) return;

    const bubble = Object.assign({}, picked.item, {
      key: `${picked.item.type}-${picked.index}-${Date.now()}`
    });

    this.setData({
      currentBubble: bubble,
      hasBubble: true,
      isAnimating: !!options.keepAnimating,
      lastBubbleKey: bubble.key,
      lastGapchickIndex: useGapchick ? picked.index : this.data.lastGapchickIndex,
      lastElodieIndex: useGapchick ? this.data.lastElodieIndex : picked.index
    });
  }
});
