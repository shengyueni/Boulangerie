const CHARACTERS = {
  croissant: {
    name: "Croissant",
    title: "主角吗喽",
    color: "#f6a6b8",
    description: "代表正在努力保护自己的你。0.1 只保留文字状态，不放形象图。"
  },
  ld: {
    name: "LD",
    title: "黑猩猩",
    color: "#3f342d",
    description: "职场压迫、荒谬 KPI 和突然冒出来的负能量来源。"
  },
  elodie: {
    name: "Elodie",
    title: "绿色猫头鹰",
    color: "#9ccf9a",
    description: "清醒、鼓励、智慧和温柔提醒。"
  },
  gapchick: {
    name: "Gapchick",
    title: "粉色的鸡",
    color: "#f6a6b8",
    description: "休息、自我关怀和慢慢找回生活节奏。"
  }
};

const REASON_OPTIONS = [
  "身心消耗",
  "尊严与边界",
  "关系压力",
  "制度与公平",
  "钱与保障",
  "成长与转向"
];

const IMPACT_LEVELS = [
  { value: 1, label: "1级：轻微刺痛" },
  { value: 2, label: "2级：明显不舒服" },
  { value: 3, label: "3级：影响了一整天" },
  { value: 4, label: "4级：严重消耗身心" },
  { value: 5, label: "5级：已经到了必须处理的程度" }
];

const SECONDARY_TAGS = [
  "加班",
  "沟通消耗",
  "被否定",
  "边界被越过",
  "身体报警",
  "被支持",
  "看见希望",
  "需要休息"
];

const BUBBLES = [
  {
    source: "Gapchick",
    type: "粉色泡泡 · 自我关怀",
    tone: "care",
    color: "#f6a6b8",
    text: "今天你已经很棒了。睡前泡个脚，让身体先下班。"
  },
  {
    source: "Gapchick",
    type: "粉色泡泡 · 自我关怀",
    tone: "care",
    color: "#f6a6b8",
    text: "先喝水，再处理人生。顺序不能乱。"
  },
  {
    source: "Gapchick",
    type: "粉色泡泡 · 自我关怀",
    tone: "care",
    color: "#f6a6b8",
    text: "你不是废物，你是电量过低。"
  },
  {
    source: "Elodie",
    type: "绿色泡泡 · 鼓励提醒",
    tone: "encourage",
    color: "#9ccf9a",
    text: "抛掉预设，忘掉结果，再试试看吧。"
  },
  {
    source: "Elodie",
    type: "绿色泡泡 · 鼓励提醒",
    tone: "encourage",
    color: "#9ccf9a",
    text: "不是每条路都要走到尽头，才配换方向。"
  },
  {
    source: "Elodie",
    type: "绿色泡泡 · 鼓励提醒",
    tone: "encourage",
    color: "#9ccf9a",
    text: "你可以慢一点，但不要把自己弄丢。"
  },
  {
    source: "LD",
    type: "黑色泡泡 · 职场负能量",
    tone: "ld",
    color: "#3f342d",
    text: "你这个事情怎么还没弄完？"
  },
  {
    source: "LD",
    type: "黑色泡泡 · 职场负能量",
    tone: "ld",
    color: "#3f342d",
    text: "你要主动一点。"
  },
  {
    source: "LD",
    type: "黑色泡泡 · 职场负能量",
    tone: "ld",
    color: "#3f342d",
    text: "年轻人不要太计较。"
  },
  {
    source: "LD",
    type: "黑色泡泡 · 职场负能量",
    tone: "ld",
    color: "#3f342d",
    text: "这个很简单，你怎么做了这么久？"
  }
];

const TOOLBOX_ITEMS = [
  "深呼吸练习",
  "离职状态自测",
  "情绪急救卡片",
  "skills 链接"
];

module.exports = {
  CHARACTERS,
  REASON_OPTIONS,
  IMPACT_LEVELS,
  SECONDARY_TAGS,
  BUBBLES,
  TOOLBOX_ITEMS
};
