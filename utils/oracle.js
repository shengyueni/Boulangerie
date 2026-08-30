const METRIC_POOLS = [
  {
    name: "耗电量",
    options: [
      { value: "很低", descriptions: ["今天可以整理一件拖着的小事，不必顺手接下全世界。", "电量还算宽裕，做完手边这件就可以先收工。", "今天有一点余裕，可以留一格给真正想做的事。", "节奏不必拉满，稳稳完成一件事就很不错。"] },
      { value: "适中", descriptions: ["可以处理一件小事，但别把自己塞满。", "电量够用，临时任务还是要看看是不是你的。", "今天适合按原计划走，额外加塞先别急着接。", "留一点空白给下班后的自己，不算浪费。"] },
      { value: "偏高", descriptions: ["今天不太适合继续硬扛。先把身体算进去。", "电量掉得有点快，能晚点处理的事不必全挤在今天。", "先把最必要的做完，剩下的可以排队。", "今天的待办不用全部通关，保留体力也是安排。"] },
      { value: "爆表", descriptions: ["先保住吃饭、睡觉和基本体面。别让工作把你整张脸借走。", "电量见底时，暂停一下不是偷懒，是避免彻底断电。", "今天先缩小任务半径，把人照顾好再说。", "能推迟的先推迟，今晚不必继续替工作值夜班。"] }
    ]
  },
  {
    name: "边界天气",
    options: [
      { value: "晴", descriptions: ["今天适合清楚表达自己的安排。", "边界能见度不错，把时间和分工说明白就好。", "可以坦然说出自己的优先级，不用绕很多弯。", "今天的“不方便”可以说得平静，也可以说得完整。"] },
      { value: "有雾", descriptions: ["答应别人之前，先给自己一点反应时间。", "有些要求听起来模糊，可以先问清楚。", "暂时看不清责任边界时，先别急着点头。", "这件事不一定需要你马上给答案。"] },
      { value: "小雨", descriptions: ["有人可能会把“顺手”说得很轻。", "小小的加塞也会占时间，先确认由谁负责。", "听见“帮一下”时，可以顺便问清做到什么程度。", "今天先照看自己的伞，不必替所有人挡雨。"] },
      { value: "打雷", descriptions: ["临时加塞和模糊责任，今天都先过一遍安检。", "声音再大也不等于责任自动落到你身上。", "遇到突然升级的要求，先留痕再确认下一步。", "雷声很响时更要慢一点，把事实和分工说清楚。"] }
    ]
  },
  {
    name: "废话云层",
    options: [
      { value: "稀薄", descriptions: ["今天适合把话听清楚，也给边界留个座。", "信息还算清爽，抓住事实就不用反复猜。", "云层不厚，沟通可以短一点、直接一点。", "今天少替一句话脑补，事情会轻很多。"] },
      { value: "飘过", descriptions: ["听见就好，不必急着自责。", "有些话只是路过，不必在心里给它长期工位。", "听到含糊评价时，可以先问一个具体例子。", "云飘过就让它飘过，不必每句都写进自我评价。"] },
      { value: "较浓", descriptions: ["模糊评价可以听见，但不必全部内化。", "废话有点多，先找出其中能核对的事实。", "别急着从语气猜结论，把要求拆成可确认的部分。", "今天适合少读空气，多问一句“具体指什么”。"] },
      { value: "厚云", descriptions: ["请把评价拆成事实，不要直接吞下去。", "云层很厚时，先记录原话和发生了什么。", "反复琢磨语气之前，先看看有没有明确的信息。", "听不懂不代表你有问题，也可能是对方没说清楚。"] }
    ]
  },
  {
    name: "顺毛概率",
    options: [
      { value: "微亮", descriptions: ["先做一件小到离谱的照顾。", "顺毛信号刚亮，喝口水也算认真回应。", "今天先把肩膀放下来一点点。", "不必立刻振作，给自己一个舒服的小动作就好。"] },
      { value: "中等", descriptions: ["一点点恢复也算恢复。", "状态正在慢慢归位，不用催它跑快。", "给下班后的时间留一点期待，顺毛会继续发生。", "今天的舒服不必宏大，一顿顺口的饭就算。"] },
      { value: "很有戏", descriptions: ["今天适合给自己安排一点喜欢的东西。", "顺毛概率不错，可以把一小段时间还给生活。", "有余力的话，去碰一件和工作无关的快乐。", "今天适合认真享受一点不讲效率的时间。"] },
      { value: "正在回暖", descriptions: ["你正在把自己从工作里捞回来。", "回暖已经发生，别急着把这点力气又全部交出去。", "今天的你有一点松动，也值得好好接住。", "生活感正在回来，慢慢待在这里就好。"] }
    ]
  },
  {
    name: "安全感库存",
    options: [
      { value: "充足", descriptions: ["今天可以慢慢想，不必急着逃。", "现实底座还稳，可以按自己的节奏观察。", "安全感有余量，今天不需要逼自己立刻决定。", "先把选择放在桌上看看，不必马上拿走哪一个。"] },
      { value: "够用", descriptions: ["保持观察，顺手整理一件准备项。", "库存还能支撑，补一小格准备会更踏实。", "今天可以核对一个现实信息，不用一次想完未来。", "安全感够用，记得别把所有余量都借给工作。"] },
      { value: "需要补货", descriptions: ["今天适合检查一个现实准备项。", "先补一点可确认的东西，比如时间、存款或下一步。", "不用急着做大决定，整理一项准备就有帮助。", "安全感偏少时，把未知变成清单会轻一点。"] },
      { value: "库存告急", descriptions: ["先别冲动决定，优先补现实安全感。", "库存偏低，今天先确认能依靠的人和资源。", "大决定可以等等，先把最基本的生活安排照看好。", "此刻更需要现实支点，不必靠硬撑证明自己。"] }
    ]
  }
];

const TALISMANS = [
  "你的身体不是公司资产。",
  "不舒服本身就是一种信息。",
  "你可以先不决定，但不要假装没发生。",
  "清醒不是冷漠，是终于把自己算进去。",
  "你不是情绪太多，你可能只是接收了太多噪音。",
  "别把别人的混乱，登记成自己的责任。",
  "你不需要用过度懂事证明价值。",
  "把人生从工作手里拿回来一点点。",
  "能离开是一种能力，能准备好再离开也是。",
  "今天先保护自己，不急着替世界找理由。",
  "你可以认真对待自己的感受，也可以晚一点下结论。",
  "一句说不清的要求，不值得你整晚猜。",
  "先把事实放稳，再决定要不要回应。",
  "休息不需要等到所有事情都做完。",
  "你的时间也需要被礼貌对待。",
  "没有立刻答应，不等于你不配合。",
  "把边界说清楚，是在照顾合作，也是在照顾自己。",
  "今天不用表现得无坚不摧。",
  "允许事情暂时没有答案。",
  "工作是生活的一部分，不是你的全部说明书。"
];

const ACTIONS = [
  "记录一件影响你判断的具体事件。",
  "把一句模糊评价拆成事实。",
  "检查一个现实准备项：存款、简历、合同、社保或证据。",
  "给自己留十分钟，不处理任何人的临时加塞。",
  "今天先少接一个不属于你的锅。",
  "写下一个你更想离开的具体理由。",
  "做一件小到离谱、但能让身体松一点的事。",
  "把“我是不是太敏感”换成“这件事具体发生了什么”。",
  "给一个请求留出回复时间，不要立刻答应。",
  "进泡泡机，听听两位朋友怎么说。",
  "今天先别急着答应额外的事。",
  "有些要求听起来模糊，可以先问清楚。",
  "这件事不一定需要你马上给答案。",
  "先把事实记下来，也是一种保护。",
  "给今天的任务排一次真正的先后顺序。",
  "下班前写下明天再处理的一件事。",
  "把一个模糊的截止时间问具体。",
  "为午饭或喝水留出十分钟不被打扰的时间。",
  "把一个额外请求改成稍后再回复。",
  "写下一件今天不需要由你负责的事。"
];

const METRIC_VISUALS = {
  "耗电量": { key: "energy" },
  "边界天气": { key: "weather", icons: { "晴": "☀", "有雾": "≋", "小雨": "☂", "打雷": "⚡" } },
  "废话云层": { key: "cloud" },
  "顺毛概率": {
    key: "fur",
    images: [
      "/assets/characters/croissant-state-frizzy-bust.png",
      "/assets/characters/croissant-state-protect-bust.png",
      "/assets/characters/croissant-state-smooth-bust.png",
      "/assets/characters/croissant-state-smooth-bust.png"
    ]
  },
  "安全感库存": { key: "safety", reverseLevel: true }
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function getDateKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick(list, seed, salt) {
  return list[(seed + salt * 17) % list.length];
}

function mixCopySeed(seed, salt) {
  let value = (seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function getTodayOracle(date = new Date()) {
  const dateLabel = getDateKey(date);
  const seed = hashString(dateLabel);
  return {
    dateLabel,
    metrics: METRIC_POOLS.map((metric, index) => {
      const selected = pick(metric.options, seed, index + 1);
      const selectedIndex = metric.options.indexOf(selected);
      const visual = METRIC_VISUALS[metric.name];
      const visualLevel = visual && visual.reverseLevel ? metric.options.length - selectedIndex : selectedIndex + 1;
      return {
        name: metric.name,
        value: selected.value,
        description: pick(selected.descriptions, mixCopySeed(seed, 101 + index * 11 + selectedIndex), 0),
        visualKey: visual && visual.key,
        visualLevel,
        visualIcon: visual && visual.icons ? visual.icons[selected.value] : "",
        visualImage: visual && visual.images ? visual.images[selectedIndex] : ""
      };
    }),
    talisman: pick(TALISMANS, seed, 11),
    action: pick(ACTIONS, seed, 23)
  };
}

module.exports = {
  getTodayOracle
};
