function getWear(entries) {
  const negativeWear = entries.reduce((total, entry) => {
    if (entry.type !== "negative") return total;
    return total + Number(entry.impactLevel || 0);
  }, 0);
  const positiveRelief = entries.filter((entry) => entry.type === "positive").length;
  return Math.max(0, negativeWear - positiveRelief);
}

const STATUS_COPY = [
  {
    key: "smooth",
    min: 0,
    max: 5,
    name: "毛很顺",
    className: "status-smooth",
    explanation: "Croissant 现在还算松弛。请继续把自己照顾好，不要等到耗尽才开始记录。",
    advice: "今天可以记录一件让你顺毛的小事。"
  },
  {
    key: "ruffled",
    min: 6,
    max: 12,
    name: "有点炸毛",
    className: "status-ruffled",
    explanation: "Croissant 最近有点炸毛。可能有些事情正在反复蹭到你的边界。",
    advice: "先写下来，不急着判断自己是不是太敏感。"
  },
  {
    key: "ball",
    min: 13,
    max: 20,
    name: "被揉成毛球",
    className: "status-ball",
    explanation: "Croissant 已经被工作揉成毛球。它不是小题大做，它是在提醒你：这里确实有消耗。",
    advice: "请认真看看最近的高影响事件，别把它们都吞回身体里。"
  },
  {
    key: "protect",
    min: 21,
    max: Infinity,
    name: "进入保护模式",
    className: "status-protect",
    explanation: "Croissant 进入保护模式。现在最重要的不是继续硬撑，而是先保护你的身体、尊严和现实安全感。",
    advice: "先找一个可信任的人说说，也可以开始整理离职前准备。"
  }
];

function getCroissantReport(entries) {
  const wear = getWear(Array.isArray(entries) ? entries : []);
  const status = STATUS_COPY.find((item) => wear >= item.min && wear <= item.max) || STATUS_COPY[0];
  return {
    wear,
    status: status.name,
    statusKey: status.key,
    statusClass: status.className,
    explanation: status.explanation,
    advice: status.advice
  };
}

module.exports = {
  getCroissantReport,
  STATUS_COPY
};
