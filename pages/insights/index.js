const { getDiaryEntries } = require("../../utils/storage");
const { buildRecentInsights } = require("../../utils/recent-insights");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function preview(value, length = 58) {
  const text = String(value || "未填写事件摘要");
  return text.length > length ? text.slice(0, length) + "…" : text;
}

Page({
  data: {
    activeDays: 7,
    rangeOptions: [
      { days: 7, label: "最近 7 天" },
      { days: 30, label: "最近 30 天" }
    ],
    hasRecords: false,
    total: 0,
    averageImpact: "—",
    highImpactCount: 0,
    topReason: "还没有记录",
    topReasonCount: 0,
    wearContributionText: "0",
    repeatedReasons: [],
    trendNotes: [],
    highestEntry: null
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const report = buildRecentInsights(getDiaryEntries(), this.data.activeDays);
    const highestEntry = report.highestEntry ? {
      ...report.highestEntry,
      displayDate: formatDate(report.highestEntry.createdAt),
      summaryPreview: preview(report.highestEntry.summary)
    } : null;
    const wear = report.wearContribution;
    this.setData({
      hasRecords: report.hasRecords,
      total: report.total,
      averageImpact: report.averageImpact,
      highImpactCount: report.highImpactCount,
      topReason: report.topReason,
      topReasonCount: report.topReasonCount,
      wearContributionText: wear > 0 ? `+${wear}` : String(wear),
      repeatedReasons: report.repeatedReasons,
      trendNotes: report.trendNotes,
      highestEntry
    });
  },

  switchRange(event) {
    const activeDays = Number(event.currentTarget.dataset.days) === 30 ? 30 : 7;
    if (activeDays === this.data.activeDays) return;
    this.setData({ activeDays }, () => this.refresh());
  },

  openHighestEntry() {
    if (!this.data.highestEntry) return;
    wx.navigateTo({ url: "/pages/diary-detail/index?id=" + this.data.highestEntry.id });
  },

  writeDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  }
});
