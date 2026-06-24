const SOOTHE_BUBBLES = [
  { speaker: "Gapchick", tag: "先喘口气", text: "你不用马上把自己整理好。先把肩膀放下来一点，也算是在回到自己身边。" },
  { speaker: "Gapchick", tag: "慢一点", text: "今天不必急着变强。能承认自己累了，已经不是一件小事。" },
  { speaker: "Gapchick", tag: "身体优先", text: "如果身体已经在抗议，就先别把它当成不懂事。它只是比你更早说了实话。" },
  { speaker: "Gapchick", tag: "暂停一下", text: "先停一小会儿。世界不会因为你少硬撑五分钟就塌掉，虽然它有时候很会装。" },
  { speaker: "Gapchick", tag: "不用表演", text: "你可以不那么能干一会儿。这里没人给你发绩效表，谢天谢地。" },
  { speaker: "Gapchick", tag: "把气吐掉", text: "把那口憋住的气慢慢吐出去。不是所有东西都要留在身体里过夜。" },
  { speaker: "Gapchick", tag: "照顾自己", text: "先喝点水，吃点东西，或者只是坐着。人不是靠意志力充电的，真遗憾。" },
  { speaker: "Gapchick", tag: "允许疲惫", text: "你不是因为脆弱才累。反复忍耐本来就会耗电。" }
];

const CLARITY_BUBBLES = [
  { speaker: "Elodie", tag: "先写事实", text: "先别急着证明自己有没有道理。只写发生了什么，已经是在把混乱往外挪。" },
  { speaker: "Elodie", tag: "看见边界", text: "让你反复不舒服的事，通常不是小事。它可能正好碰到了你的边界。" },
  { speaker: "Elodie", tag: "分清归因", text: "把一句话分成两半看：哪一半是事实，哪一半只是对方丢过来的情绪。" },
  { speaker: "Elodie", tag: "不用急着决定", text: "现在不需要立刻决定离不离开。你可以先收集证据，等自己看清。" },
  { speaker: "Elodie", tag: "现实准备", text: "真正的准备通常很小：一条记录、一份简历、一次确认存款。小到不像英雄，但有用。" },
  { speaker: "Elodie", tag: "不是太敏感", text: "如果一件事总让你怀疑自己是不是太敏感，它可能更值得被认真记录。" },
  { speaker: "Elodie", tag: "把话放远", text: "不是每一句扔到你身上的话，都配变成你的自我评价。先放远一点看。" },
  { speaker: "Elodie", tag: "留一点证据", text: "当你开始怀疑自己的感受时，记录会帮你留住现场。人脑在压力下很会替别人开脱。" }
];

const LD_BUBBLES = [
  { speaker: "LD", tag: "废话乱入", text: "年轻人就是要多承担一点。" },
  { speaker: "LD", tag: "废话乱入", text: "这个事情你自己再理解一下。" },
  { speaker: "LD", tag: "废话乱入", text: "我们不是加班，是一起打胜仗。" },
  { speaker: "LD", tag: "废话乱入", text: "你要提高一下主人翁意识。" },
  { speaker: "LD", tag: "废话乱入", text: "这个问题你先从自己身上找原因。" },
  { speaker: "LD", tag: "废话乱入", text: "我不是批评你，我是帮你成长。" },
  { speaker: "LD", tag: "废话乱入", text: "大家都很忙，不要只看自己的感受。" },
  { speaker: "LD", tag: "废话乱入", text: "这点压力都承受不了，以后怎么办？" }
];

const LD_HINTS = [
  "这句先不用吞下去。它更像一团空气，不像事实。",
  "识别即可，不必内化。它吵了一下，但不需要住进你心里。",
  "这句话可以先放旁边。不是每个声音都值得你回应。",
  "它看起来很大，其实站不太稳。让它飘走。"
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
    machineImage: "/assets/bubble/bubble-machine.png",
    sootheBubble: SOOTHE_BUBBLES[0],
    clarityBubble: CLARITY_BUBBLES[0],
    ldBubble: null,
    ldHint: "",
    hasLdBubble: false,
    lastSootheIndex: 0,
    lastClarityIndex: 0,
    lastLdIndex: -1
  },

  onLoad() {
    this.generateBubbles(false);
  },

  generateBubbles(allowLd = true) {
    const soothe = pick(SOOTHE_BUBBLES, this.data.lastSootheIndex);
    const clarity = pick(CLARITY_BUBBLES, this.data.lastClarityIndex);
    const hasLdBubble = allowLd && Math.random() < 0.18;
    const ld = hasLdBubble ? pick(LD_BUBBLES, this.data.lastLdIndex) : { item: null, index: this.data.lastLdIndex };
    const hint = hasLdBubble ? pick(LD_HINTS).item : "";

    this.setData({
      sootheBubble: soothe.item,
      clarityBubble: clarity.item,
      ldBubble: ld.item,
      ldHint: hint,
      hasLdBubble,
      lastSootheIndex: soothe.index,
      lastClarityIndex: clarity.index,
      lastLdIndex: ld.index
    });
  },

  handleRegenerate() {
    this.generateBubbles(true);
  },

  handleGoDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  handleCollect() {
    wx.showToast({ title: "收下了。先让它们陪你一会儿。", icon: "none" });
  }
});
