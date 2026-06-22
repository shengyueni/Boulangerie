const APP_META = {
  appName: "吗喽的出走",
  slogan: "保护好你的猩",
  version: "0.2.2",
  stage: "试用准备版"
};

const CHARACTERS = {
  croissant: {
    name: "Croissant",
    title: "主角吗喽",
    color: "#f6a6b8",
    description: "代表正在努力保护自己的你。0.2 仍只保留文字状态，不放形象图。"
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
  { source: "Gapchick", type: "粉色泡泡 · 自我关怀", tone: "care", color: "#f6a6b8", text: "今天你已经很棒了。睡前泡个脚，让身体先下班。" },
  { source: "Gapchick", type: "粉色泡泡 · 自我关怀", tone: "care", color: "#f6a6b8", text: "先喝水，再处理人生。顺序不能乱。" },
  { source: "Gapchick", type: "粉色泡泡 · 自我关怀", tone: "care", color: "#f6a6b8", text: "你不是废物，你是电量过低。" },
  { source: "Elodie", type: "绿色泡泡 · 鼓励提醒", tone: "encourage", color: "#9ccf9a", text: "抛掉预设，忘掉结果，再试试看吧。" },
  { source: "Elodie", type: "绿色泡泡 · 鼓励提醒", tone: "encourage", color: "#9ccf9a", text: "不是每条路都要走到尽头，才配换方向。" },
  { source: "Elodie", type: "绿色泡泡 · 鼓励提醒", tone: "encourage", color: "#9ccf9a", text: "你可以慢一点，但不要把自己弄丢。" },
  { source: "LD", type: "黑色泡泡 · 职场负能量", tone: "ld", color: "#3f342d", text: "你这个事情怎么还没弄完？" },
  { source: "LD", type: "黑色泡泡 · 职场负能量", tone: "ld", color: "#3f342d", text: "你要主动一点。" },
  { source: "LD", type: "黑色泡泡 · 职场负能量", tone: "ld", color: "#3f342d", text: "年轻人不要太计较。" },
  { source: "LD", type: "黑色泡泡 · 职场负能量", tone: "ld", color: "#3f342d", text: "这个很简单，你怎么做了这么久？" }
];

const TOOLBOX_ITEMS = [
  { title: "深呼吸练习", subtitle: "4-4-6，把自己从工作现场里拿回来一点", path: "/pages/breathing/index", color: "green", enabled: true },
  { title: "离职状态自测", subtitle: "看见自己更接近哪种过渡状态", path: "/pages/exit-test/index", color: "pink", enabled: true },
  { title: "情绪急救卡片", subtitle: "自责、害怕、无力时先接住自己", path: "/pages/emergency-cards/index", color: "yellow", enabled: true },
  { title: "skills 链接", subtitle: "后续版本上线", path: "", color: "plain", enabled: false }
];

const PROTECTION_ADVICE = {
  "身心消耗": "本周最需要保护的是你的身体。先别急着证明自己还能撑。",
  "尊严与边界": "本周最需要保护的是你的边界。反复让你变小的地方，值得被认真记录。",
  "关系压力": "本周最需要保护的是你的社交能量。不是所有人的情绪都该由你接住。",
  "制度与公平": "本周最需要保护的是你的判断力。系统混乱不是你的个人失败。",
  "钱与保障": "本周最需要保护的是你的现实安全感。先算清楚缓冲，再决定下一步。",
  "成长与转向": "本周最需要保护的是你的未来感。你不是只想逃离，你也在寻找新的方向。"
};

const EXIT_TEST_QUESTIONS = [
  "我想离职主要不是因为某一天的事件，而是长期积累的疲惫。",
  "这份工作已经明显影响我的睡眠、食欲、身体状态或情绪稳定。",
  "我在工作中经常感到尊严受损、边界被侵犯或不被尊重。",
  "即使短暂休息后，我想到回到工作里仍然感到抗拒。",
  "我已经很难从这份工作里获得成长感、价值感或意义感。",
  "我不是只想逃离痛苦，我也隐约知道自己想奔向什么。",
  "如果现在离开，我至少有一点现实缓冲或可以开始准备缓冲。",
  "我已经开始搜集信息、整理简历、作品集、申请材料或其他转向准备。",
  "我身边至少有一个人可以听我说真实状态。",
  "比起继续硬撑，我更想为自己设计一个安全的过渡计划。"
];

const EXIT_TEST_OPTIONS = [
  { score: 1, label: "完全不是" },
  { score: 2, label: "有一点" },
  { score: 3, label: "说不清" },
  { score: 4, label: "比较符合" },
  { score: 5, label: "非常符合" }
];

const EXIT_TEST_RESULTS = [
  {
    min: 10,
    max: 20,
    title: "短期波动观察型",
    text: "你现在可能处在一段明显不舒服的阶段，但还不一定需要立刻做重大决定。先观察频率，照顾身体，把最近发生的事记录下来。",
    suggestions: ["连续记录 7 天日记", "暂时不要在情绪最高点做决定", "先做一次睡眠和身体恢复"]
  },
  {
    min: 21,
    max: 32,
    title: "工作消耗累积型",
    text: "这不是一时矫情，你的消耗可能已经积累了一段时间。现在最重要的不是责备自己，而是看清楚哪些事情正在反复伤害你。",
    suggestions: ["查看决心仪表盘", "整理高影响事件", "开始列离职前准备清单"]
  },
  {
    min: 33,
    max: 42,
    title: "认真准备转向型",
    text: "你可能已经不只是想逃离，而是在认真考虑换一种生活结构。现在适合从情绪判断进入现实准备。",
    suggestions: ["计算生活费缓冲", "更新简历或作品集", "设计离职后 30 天计划"]
  },
  {
    min: 43,
    max: 50,
    title: "过渡计划启动型",
    text: "你已经有比较明确的离开或转向倾向。现在不要靠冲动硬跳，也不要继续无限拖延。你需要的是一个更安全的过渡计划。",
    suggestions: ["明确离职前最后 3 件事", "找可信任的人讨论计划", "给自己设定一个准备时间表"]
  }
];

const EMERGENCY_CARDS = [
  {
    title: "我是不是很没用？",
    hold: "你不是没用，你可能只是已经被消耗太久了。",
    reframe: "人在长期压力下会变慢、变钝、变得不像自己。这不是能力消失，而是系统过载。",
    action: "今天只完成一件很小的事，比如洗澡、吃饭、整理桌面的一角。"
  },
  {
    title: "我是不是只是逃避？",
    hold: "想离开不一定是逃避，也可能是你终于识别出这里不适合你。",
    reframe: "真正的问题不是‘我是不是逃避’，而是‘我有没有在为下一步做准备’。",
    action: "写下：如果我不留在这里，我想把时间还给哪三件事？"
  },
  {
    title: "我今天什么都没做怎么办？",
    hold: "什么都没做的一天，也可能是在恢复电量。",
    reframe: "休息不是进度的反面。对一个被耗空的人来说，休息本身就是修复。",
    action: "把今天的目标缩小到离谱：喝水、吃东西、早点躺下。"
  },
  {
    title: "别人都在前进，我好嫉妒怎么办？",
    hold: "嫉妒不说明你坏，它经常说明你也很想拥有某种可能。",
    reframe: "你看到的不是别人赢了，而是一个愿望被照亮了。那不是判决书，是路标。",
    action: "写下：我嫉妒的不是那个人，而是她身上的哪种自由、作品或状态？"
  },
  {
    title: "我爸妈不理解我怎么办？",
    hold: "被重要的人不理解，会很痛。这不代表你的感受不成立。",
    reframe: "有些人会先用安全感理解世界，而你正在用生命感理解自己。你们的语言暂时不同。",
    action: "先不要试图一次说服他们。写一版只讲事实和计划的说明，给自己看。"
  },
  {
    title: "我想离职，但我很害怕怎么办？",
    hold: "害怕不是失败，它说明你知道这件事很重要。",
    reframe: "离职不是从悬崖上跳下去。你可以先搭一座很小的桥。",
    action: "今天只做一个准备动作：算钱、改简历、问一个问题、整理一条事实纪要。"
  }
];

const FEEDBACK_QUESTIONS = [
  "1. 你打开后，能不能立刻看懂这是做什么的？",
  "2. 你最想点哪个模块？",
  "3. 写日记这一步有没有压力？",
  "4. 哪一句文案让你觉得它懂你？",
  "5. 哪个地方让你困惑、不想继续、觉得多余？",
  "6. 你会不会愿意第二天再打开？"
];

module.exports = {
  APP_META,
  CHARACTERS,
  REASON_OPTIONS,
  IMPACT_LEVELS,
  SECONDARY_TAGS,
  BUBBLES,
  TOOLBOX_ITEMS,
  PROTECTION_ADVICE,
  EXIT_TEST_QUESTIONS,
  EXIT_TEST_OPTIONS,
  EXIT_TEST_RESULTS,
  EMERGENCY_CARDS,
  FEEDBACK_QUESTIONS
};
