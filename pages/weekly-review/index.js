const { getDiaryEntries, getMaloNickname } = require("../../utils/storage");
const { buildWeeklyReview } = require("../../utils/weekly-review");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function preview(value) {
  const text = String(value || "未填写事件摘要");
  return text.length > 64 ? text.slice(0, 64) + "…" : text;
}

Page({
  data: {
    hasRecords: false,
    total: 0,
    topReason: "还没有记录",
    topReasonCount: 0,
    averageImpact: "—",
    highestEntry: null,
    repeatedReasons: [],
    greeting: "先看见事实和重复，不急着替这一周下结论。"
  },

  onShow() {
    const nickname = getMaloNickname();
    const review = buildWeeklyReview(getDiaryEntries());
    const highestEntry = review.highestEntry ? {
      ...review.highestEntry,
      displayDate: formatDate(review.highestEntry.createdAt),
      summaryPreview: preview(review.highestEntry.summary)
    } : null;
    this.setData({
      hasRecords: review.total > 0,
      total: review.total,
      topReason: review.topReason,
      topReasonCount: review.topReasonCount,
      averageImpact: review.averageImpact,
      greeting: nickname
        ? `${nickname}，先看见事实和重复，不急着替这一周下结论。`
        : "先看见事实和重复，不急着替这一周下结论。",
      highestEntry,
      repeatedReasons: review.repeatedReasons
    });
  },

  openHighestEntry() {
    if (!this.data.highestEntry) return;
    wx.navigateTo({ url: "/pages/diary-detail/index?id=" + this.data.highestEntry.id });
  },

  writeDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  }
});
