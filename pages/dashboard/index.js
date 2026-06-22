const {
  REASON_OPTIONS,
  PROTECTION_ADVICE
} = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");

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
    percent: item.count ? Math.round((item.count / max) * 100) : 0
  }));
}

Page({
  data: {
    hasRecords: false,
    croissant: getCroissantReport([]),
    stats: {
      total: 0,
      negative: 0,
      positive: 0,
      highImpact30Days: 0,
      topReason: "还没有足够记录",
      advice: "本周先保护好自己。第一步不是判断，而是记录。"
    },
    reasonDistribution: []
  },

  onShow() {
    const entries = getDiaryEntries();
    const hasRecords = entries.length > 0;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const croissant = getCroissantReport(entries);
    const reasonDistribution = withPercent(getReasonCounts(entries));
    const topReason = getTopReason(reasonDistribution);

    this.setData({
      hasRecords,
      croissant,
      stats: {
        total: entries.length,
        negative: entries.filter((entry) => entry.type === "negative").length,
        positive: entries.filter((entry) => entry.type === "positive").length,
        highImpact30Days: entries.filter((entry) => {
          const created = new Date(entry.createdAt).getTime();
          return now - created <= thirtyDays && Number(entry.impactLevel) >= 4;
        }).length,
        topReason,
        advice: hasRecords
          ? PROTECTION_ADVICE[topReason] || "本周先保护好自己。第一步不是判断，而是记录。"
          : "本周先保护好自己。第一步不是判断，而是记录。"
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
