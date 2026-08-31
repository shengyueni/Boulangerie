const { REASON_OPTIONS, PROTECTION_ADVICE } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { buildCompanion, getCharacterLine, getCroissantStateImage } = require("../../utils/characters");
const { DAY_MS, buildRecentInsights } = require("../../utils/recent-insights");

const RANGES = [
  { key: "7", label: "近 7 天", days: 7 },
  { key: "30", label: "近 30 天", days: 30 }
];
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return (date.getMonth() + 1) + "-" + date.getDate(); }
function getReasonCounts(entries) { return REASON_OPTIONS.map((reason) => ({ reason, count: entries.filter((entry) => entry.primaryReason === reason).length, percent: 0 })); }
function withPercent(items) { const max = Math.max(...items.map((item) => item.count), 1); return items.map((item) => ({ ...item, percent: item.count ? Math.round((item.count / max) * 100) : 0 })); }
function preview(text) { const value = text || "没有写下事件描述"; return value.length > 34 ? value.slice(0, 34) + "..." : value; }
function buildDashboardCompanion(croissant) { return buildCompanion("croissant", "dashboard." + croissant.statusKey, { image: getCroissantStateImage(croissant.statusKey), tag: "Croissant 状态陪伴", message: getCharacterLine("dashboard." + croissant.statusKey), size: "bust" }); }

Page({
  data: { ranges: RANGES, activeRange: "30", hasRecords: false, croissant: getCroissantReport([]), companion: buildDashboardCompanion(getCroissantReport([])), stats: { total: 0, averageImpact: "—", reasonTypes: 0, highImpactCount: 0, topReason: "还没有足够记录", topReasonCount: 0, advice: "先保护好自己。第一步不是判断，而是记录。" }, reasonDistribution: [], repeatedReasons: [], trendNotes: [], highestEntry: null },
  onShow() { this.refresh(); },
  switchRange(event) { this.setData({ activeRange: event.currentTarget.dataset.key }); this.refresh(); },
  refresh() {
    const days = this.data.activeRange === "7" ? 7 : 30;
    const now = Date.now();
    const entries = getDiaryEntries().filter((entry) => {
      const createdAt = new Date(entry && entry.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= now - days * DAY_MS && createdAt <= now;
    });
    const report = buildRecentInsights(getDiaryEntries(), days, now);
    const hasRecords = report.hasRecords;
    const croissant = getCroissantReport(entries);
    const reasonDistribution = withPercent(getReasonCounts(entries));
    const highestEntry = report.highestEntry ? { ...report.highestEntry, displayDate: formatDate(report.highestEntry.createdAt), summaryPreview: preview(report.highestEntry.summary) } : null;
    this.setData({
      hasRecords,
      croissant,
      companion: buildDashboardCompanion(croissant),
      stats: { total: report.total, averageImpact: report.averageImpact, reasonTypes: reasonDistribution.filter((item) => item.count > 0).length, highImpactCount: report.highImpactCount, topReason: report.topReason, topReasonCount: report.topReasonCount, advice: hasRecords ? PROTECTION_ADVICE[report.topReason] || croissant.advice : "先保护好自己。第一步不是判断，而是记录。" },
      reasonDistribution,
      repeatedReasons: report.repeatedReasons,
      trendNotes: report.trendNotes,
      highestEntry
    });
  },
  openHighestEntry() { if (this.data.highestEntry) wx.navigateTo({ url: "/pages/diary-detail/index?id=" + this.data.highestEntry.id }); },
  goDiary() { wx.switchTab({ url: "/pages/diary/index" }); },
  goNewDiary() { wx.navigateTo({ url: "/pages/diary-new/index" }); },
  goExitTest() { wx.navigateTo({ url: "/pages/exit-test/index" }); }
});
