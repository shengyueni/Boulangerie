const METRIC_POOLS = [
  {
    name: "耗电量",
    options: [
      { value: "很低", description: "今天可以整理一件拖着的小事，不必顺手接下全世界。" },
      { value: "适中", description: "可以处理一件小事，但别把自己塞满。" },
      { value: "偏高", description: "今天不太适合继续硬扛。先把身体算进去。" },
      { value: "爆表", description: "先保住吃饭、睡觉和基本体面。别让工作把你整张脸借走。" }
    ]
  },
  {
    name: "边界天气",
    options: [
      { value: "晴", description: "今天适合清楚表达自己的安排。" },
      { value: "有雾", description: "答应别人之前，先给自己一点反应时间。" },
      { value: "小雨", description: "有人可能会把“顺手”说得很轻。" },
      { value: "打雷", description: "临时加塞和模糊责任，今天都先过一遍安检。" }
    ]
  },
  {
    name: "废话云层",
    options: [
      { value: "稀薄", description: "今天适合把话听清楚，也给边界留个座。" },
      { value: "飘过", description: "听见就好，不必急着自责。" },
      { value: "较浓", description: "模糊评价可以听见，但不必全部内化。" },
      { value: "厚云", description: "请把评价拆成事实，不要直接吞下去。" }
    ]
  },
  {
    name: "顺毛概率",
    options: [
      { value: "微亮", description: "先做一件小到离谱的照顾。" },
      { value: "中等", description: "一点点恢复也算恢复。" },
      { value: "很有戏", description: "今天适合给自己安排一点喜欢的东西。" },
      { value: "正在回暖", description: "你正在把自己从工作里捞回来。" }
    ]
  },
  {
    name: "安全感库存",
    options: [
      { value: "充足", description: "今天可以慢慢想，不必急着逃。" },
      { value: "够用", description: "保持观察，顺手整理一件准备项。" },
      { value: "需要补货", description: "今天适合检查一个现实准备项。" },
      { value: "库存告急", description: "先别冲动决定，优先补现实安全感。" }
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
  "今天先保护自己，不急着替世界找理由。"
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
  "进泡泡机，听听两位朋友怎么说。"
];

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

function getTodayOracle(date = new Date()) {
  const dateLabel = getDateKey(date);
  const seed = hashString(dateLabel);
  return {
    dateLabel,
    metrics: METRIC_POOLS.map((metric, index) => {
      const selected = pick(metric.options, seed, index + 1);
      return {
        name: metric.name,
        value: selected.value,
        description: selected.description
      };
    }),
    talisman: pick(TALISMANS, seed, 11),
    action: pick(ACTIONS, seed, 23)
  };
}

module.exports = {
  getTodayOracle
};