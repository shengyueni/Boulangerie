const {
  REASON_OPTIONS,
  PROTECTION_ADVICE
} = require("../../utils/constants");
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

function getReasonCounts(entries) {
  return REASON_OPTIONS.map((reason) => ({
    reason,
    count: entries.filter((entry) => entry.primaryReason === reason).length,
    percent: 0
  }));
}

function getTopReason(reasonDistribution) {
  const sorted = reasonDistribution.slice().sort((a, b) => b.count - a.count);
  return sorted[0] && sorted[0].count ? sorted[0].reason : "还没有足够记录";
}

function withPercent(reasonDistribution) {
  const max = Math.max(...reasonDistribution.map((item) => item.count), 1);
  return reasonDistribution.map((item) => ({
    ...item,
    percent: Math.round((item.count / max) * 100)
  }));
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
      status: "毛很顺",
      advice: "先记录几条真实发生的事，Croissant 会慢慢看见规律。"
    },
    reasonDistribution: []
  },

  onShow() {
    const entries = getDiaryEntries();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const report = getCroissantReport(entries);
    const reasonDistribution = withPercent(getReasonCounts(entries));
    const topReason = getTopReason(reasonDistribution);

    this.setData({
      stats: {
        total: entries.length,
        negative: entries.filter((entry) => entry.type === "negative").length,
        positive: entries.filter((entry) => entry.type === "positive").length,
        highImpact30Days: entries.filter((entry) => {
          const created = new Date(entry.createdAt).getTime();
          return now - created <= thirtyDays && Number(entry.impactLevel) >= 4;
        }).length,
        topReason,
        wear: report.wear,
        status: report.status,
        advice: PROTECTION_ADVICE[topReason] || "先记录几条真实发生的事，Croissant 会慢慢看见规律。"
      },
      reasonDistribution
    });
  },

  goNewDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  goExitTest() {
    wx.navigateTo({ url: "/pages/exit-test/index" });
  }
});
