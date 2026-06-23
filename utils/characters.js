const CHARACTERS = {
  croissant: {
    key: "croissant",
    name: "Croissant",
    avatar: "/assets/characters/croissant-avatar.png",
    bust: "/assets/characters/croissant-bust.png",
    role: "用户自己的内在小动物 / 当前状态"
  },
  elodie: {
    key: "elodie",
    name: "Elodie",
    avatar: "/assets/characters/elodie-avatar.png",
    bust: "/assets/characters/elodie-bust.png",
    role: "清醒提醒 / 事实整理"
  },
  gapchick: {
    key: "gapchick",
    name: "Gapchick",
    avatar: "/assets/characters/gapchick-avatar.png",
    bust: "/assets/characters/gapchick-bust.png",
    role: "休息恢复 / 生命力重建"
  },
  ld: {
    key: "ld",
    name: "LD",
    avatar: "/assets/characters/ld-avatar.png",
    bust: "/assets/characters/ld-bust.png",
    role: "职场废话与压迫来源"
  }
};

const CHARACTER_COPY = {
  home: [
    "Croissant 在这里。今天先保护自己，不急着做决定。",
    "先看看自己还剩多少电，再决定今天要处理什么。",
    "你可以先记录，不用立刻解释自己。",
    "今天的出走不一定是离开，也可以是把注意力从消耗里拿回来一点。",
    "你不需要马上变好，先让自己别继续被消耗。",
    "如果今天很乱，就先留下一个最具体的事。",
    "Croissant 没有催你。它只是陪你看一眼今天的自己。",
    "今天先把自己算进去，再考虑那些没完没了的事。"
  ],
  dashboard: {
    smooth: "Croissant 今天毛还算顺。请继续把自己照顾好，不要等到耗尽才开始记录。",
    ruffled: "Croissant 有点炸毛。可能有些事情正在反复蹭到你的边界。",
    ball: "Croissant 已经被工作揉成毛球。它不是小题大做，它是在提醒你这里确实有消耗。",
    protect: "Croissant 进入保护模式。现在最重要的不是继续硬撑，而是先保护身体、尊严和现实安全感。"
  },
  diaryNew: [
    "Elodie 提醒：先写发生了什么，再写它让你哪里不舒服。",
    "不需要一次写得很完整，先把最清楚的一点留下来。",
    "事实不是为了证明你脆弱，而是为了帮你看清发生了什么。",
    "如果你不知道怎么写，就从“谁、什么时候、说了什么”开始。",
    "先不用判断自己是不是太敏感，先把事情放到纸面上。",
    "你可以只写一点点。记录不是考试。",
    "把感受写下来，不是添麻烦，是把自己接回来。",
    "今天先整理一件事，不需要整理整个人生。"
  ],
  diaryDetail: [
    "Elodie 帮你把混乱整理成了事实。",
    "这份纪要不是为了攻击谁，是为了让你看清自己经历了什么。",
    "当事情被写清楚，它就不只是在身体里打转了。",
    "你不需要把每一次不舒服都解释成自己太脆弱。",
    "事实会帮你站稳一点。",
    "请把模糊评价拆开看，别直接吞下去。",
    "这不是审判，这是整理。",
    "你正在把感受变成可观察的线索。"
  ],
  safety: [
    "不急着决定离开，也不假装一切没发生。",
    "先补现实安全感，再讨论下一步。",
    "身体、证据、钱和支持系统，都值得被认真看见。",
    "清醒不是冷漠，是终于把自己算进去。",
    "你可以慢慢准备，不需要被任何一句话推着走。"
  ],
  diarySavedNegative: [
    "Croissant 在这里。这件事现在不再只是你一个人在身体里转了。",
    "Croissant 受到了一点磨损，但你已经把它写下来了。",
    "这不是小题大做。你是在替自己留下线索。",
    "你已经把混乱从身体里拿出来了一点。",
    "今天先到这里也可以。记录本身已经是在保护自己。"
  ],
  diarySavedPositive: [
    "Croissant 顺毛了一点。你也替自己留住了一点亮光。",
    "这点亮光值得被保存，不用假装它不重要。",
    "Croissant 今天轻了一点。谢谢你没有只记录痛苦。",
    "你正在把人生从工作手里拿回来一点点。",
    "这件小事也算数。顺毛就是从这些地方开始的。"
  ],
  breathing: [
    "Gapchick 陪你慢一点。",
    "不用马上变好，先让身体知道现在是安全的。",
    "先吸气。今天不需要一边崩溃一边表现得很高效。",
    "你可以暂停一下，不必向任何人解释。",
    "身体不是公司资产，先把呼吸拿回来。",
    "慢一点也没关系。恢复不是 KPI。",
    "先喝口水，先呼吸，先回到自己这里。",
    "今天可以只做一件小小的自我照顾。"
  ],
  emergencyCards: [
    "Gapchick 把毯子递过来了。你可以先停一下。",
    "现在最重要的不是讲道理，是让自己安全一点。",
    "如果很难受，请先联系一个现实中可信任的人。",
    "你不需要独自把所有情绪扛完。",
    "先让身体落地，再处理事情。",
    "今天先不解决人生，先照顾当下这一分钟。",
    "你可以慢一点，真的可以。",
    "先把自己从那句话里捞出来。"
  ],
  positive: [
    "这点亮光值得被你留住。",
    "今天不是只有消耗，也有一点点生活还在。",
    "Gapchick 说：这件小事也算数。",
    "顺毛不是大事发生后才可以开始。",
    "你正在慢慢把节奏找回来。"
  ],
  wishlist: [
    "重建生活不是一天完成的，先把一件小事放回自己手里。",
    "不是所有准备都要很宏大，今天先做一个现实小动作。",
    "出走不是冲动，是慢慢把路看清。",
    "你可以边准备边休息，不需要把自己逼成另一个项目。",
    "Gapchick 说：离开消耗以后，也要记得把生活接回来。"
  ],
  bubble: [
    "LD 刚刚释放了一句职场废话。",
    "已识别职场废话，建议不要内化。",
    "这更像一句模糊评价，不是你的事实。",
    "请注意：这句话可能正在把责任推给你。",
    "听见即可，不必自动认领。",
    "这句话听起来很有道理，但可能没有具体信息。",
    "请把它拆成事实，不要直接吞下去。",
    "职场废话浓度升高，建议启动泡泡机。",
    "“这是成长机会”不自动等于“你必须硬扛”。",
    "“大家都一样”不等于“你不该难受”。"
  ],
  bubbleAfterPop: [
    "泡泡已破。它没有你想象中那么坚固。",
    "这句话已经从事实里被分离出来了。",
    "很好，识别它，而不是吸收它。",
    "它只是一句模糊评价，不是你的全部。",
    "你不用把别人的混乱登记成自己的责任。"
  ]
};

function resolveCopyGroup(groupKey) {
  return groupKey.split(".").reduce((group, key) => group && group[key], CHARACTER_COPY);
}

function getCharacterLine(groupKey, indexOrSeed = 0) {
  const group = resolveCopyGroup(groupKey);
  if (Array.isArray(group)) {
    const index = Math.abs(Number(indexOrSeed) || 0) % group.length;
    return group[index];
  }
  if (typeof group === "string") return group;
  return "";
}

function buildCompanion(characterKey, groupKey, options = {}) {
  const character = CHARACTERS[characterKey];
  return {
    image: options.image || character.avatar,
    name: character.name,
    tag: options.tag || character.role,
    message: options.message || getCharacterLine(groupKey, options.seed || 0),
    subMessage: options.subMessage || "",
    variant: options.variant || characterKey,
    size: options.size || "avatar"
  };
}

module.exports = {
  CHARACTERS,
  CHARACTER_COPY,
  getCharacterLine,
  buildCompanion
};
