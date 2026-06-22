const { getDiaryEntries } = require("../../utils/storage");

function getCroissantReport(entries) {
  const negativeWear = entries.reduce((total, entry) => {
    if (entry.type !== "negative") return total;
    return total + Number(entry.impactLevel || 0);
  }, 0);
  const positiveRelief = entries.filter((entry) => entry.type === "positive").length;
  const wear = Math.max(0, negativeWear - positiveRelief);

  let status = "毛很顺";
  if (wear >= 21) status = "进入保护模式";
  else if (wear >= 13) status = "被搓成毛球";
  else if (wear >= 6) status = "有点炸毛";

  return { wear, status };
}

function getTopReason(entries) {
  const counts = {};
  entries.forEach((entry) => {
    if (entry.primaryReason) {
      counts[entry.primaryReason] = (counts[entry.primaryReason] || 0) + 1;
    }
  });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  return sorted[0] || "还没有足够记录";
}

Page({
  data: {
    stats: {
      total: 0,
      negative: 0,
      positive: 0,
      highImpact30Days: 0,
      topReason: "还没有足够记录",
      wear: 0,
      status: "毛很顺"
    }
  },

  onShow() {
    const entries = getDiaryEntries();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const report = getCroissantReport(entries);

    this.setData({
      stats: {
        total: entries.length,
        negative: entries.filter((entry) => entry.type === "negative").length,
        positive: entries.filter((entry) => entry.type === "positive").length,
        highImpact30Days: entries.filter((entry) => {
          const created = new Date(entry.createdAt).getTime();
          return now - created <= thirtyDays && Number(entry.impactLevel) >= 4;
        }).length,
        topReason: getTopReason(entries),
        wear: report.wear,
        status: report.status
      }
    });
  }
});
