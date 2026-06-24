const { REASON_OPTIONS, PROTECTION_ADVICE } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");
const { buildCompanion, getCharacterLine, getCroissantStateImage } = require("../../utils/characters");

const RANGES = [
  { key: "7", label: "近 7 天", days: 7 },
  { key: "30", label: "近 30 天", days: 30 },
  { key: "all", label: "全部", days: 0 }
];
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return (date.getMonth() + 1) + "-" + date.getDate(); }
function inRange(entry, rangeKey) { if (rangeKey === "all") return true; const range = RANGES.find((item) => item.key === rangeKey) || RANGES[1]; const created = new Date(entry.createdAt).getTime(); return Date.now() - created <= range.days * 24 * 60 * 60 * 1000; }
function getReasonCounts(entries) { return REASON_OPTIONS.map((reason) => ({ reason, count: entries.filter((entry) => entry.primaryReason === reason).length, percent: 0 })); }
function withPercent(items) { const max = Math.max(...items.map((item) => item.count), 1); return items.map((item) => ({ ...item, percent: item.count ? Math.round((item.count / max) * 100) : 0 })); }
function getTopReason(distribution) { const sorted = distribution.slice().sort((a, b) => b.count - a.count); return sorted[0] && sorted[0].count ? sorted[0].reason : "还没有足够记录"; }
function preview(text) { const value = text || "没有写下事件描述"; return value.length > 34 ? value.slice(0, 34) + "..." : value; }
function getTendency(entries, croissant, highImpactCount, topReason) {
  if (!entries.length) return { title: "还没有足够记录", text: "现在还不急着判断。先写下一条真实发生的事，让混乱有个落脚点。" };
  if (croissant.statusKey === "protect" || (topReason === "成长与转向" && entries.length >= 3)) return { title: "启动过渡计划", text: "你可能已经不只是想逃离，而是在寻找新的生活结构。先别硬跳，也别无限拖延，先给自己搭一座小桥。" };
  if (highImpactCount >= 3 || croissant.statusKey === "ball") return { title: "整理事实和准备", text: "这已经不太像单次情绪波动。适合开始整理事实纪要、现实缓冲和下一步选择。" };
  if (highImpactCount >= 2 && ["尊严与边界", "关系压力", "身心消耗"].includes(topReason)) return { title: "开始保护边界", text: "这些消耗不是凭空出现的。你可以先记录事实，减少自责，把边界慢慢拿回来。" };
  return { title: "先休息观察", text: "现在可能还不适合立刻做重大决定。先观察这些不舒服会不会反复出现。" };
}
function buildReview(entries, topReason, croissant) { if (!entries.length) return "这段时间还没有记录。先给混乱一个落脚点，Croissant 会慢慢陪你看清楚。"; return "这段时间你记录了 " + entries.length + " 件事，其中最常出现的是「" + topReason + "」。Croissant 现在是「" + croissant.status + "」。先别急着判断自己是不是太敏感，反复出现的线索本来就该被看见。"; }
function buildDashboardCompanion(croissant) { return buildCompanion("croissant", "dashboard." + croissant.statusKey, { image: getCroissantStateImage(croissant.statusKey), tag: "Croissant 状态陪伴", message: getCharacterLine("dashboard." + croissant.statusKey), size: "bust" }); }

Page({
  data: { ranges: RANGES, activeRange: "30", hasRecords: false, croissant: getCroissantReport([]), companion: buildDashboardCompanion(getCroissantReport([])), stats: { total: 0, decisionFactors: 0, legacyPositive: 0, highImpact30Days: 0, topReason: "还没有足够记录", advice: "本周先保护好自己。第一步不是判断，而是记录。" }, reasonDistribution: [], highImpactEntries: [], tendency: {}, reviewText: "" },
  onShow() { this.refresh(); },
  switchRange(event) { this.setData({ activeRange: event.currentTarget.dataset.key }); this.refresh(); },
  refresh() {
    const entries = getDiaryEntries().filter((entry) => inRange(entry, this.data.activeRange));
    const hasRecords = entries.length > 0;
    const croissant = getCroissantReport(entries);
    const reasonDistribution = withPercent(getReasonCounts(entries));
    const topReason = getTopReason(reasonDistribution);
    const highImpactEntries = entries.filter((entry) => Number(entry.impactLevel) >= 4).slice(0, 5).map((entry) => ({ ...entry, displayDate: formatDate(entry.createdAt), summaryPreview: preview(entry.summary) }));
    const tendency = getTendency(entries, croissant, highImpactEntries.length, topReason);
    this.setData({
      hasRecords,
      croissant,
      companion: buildDashboardCompanion(croissant),
      stats: { total: entries.length, decisionFactors: entries.filter((entry) => entry.type === "negative").length, legacyPositive: entries.filter((entry) => entry.type === "positive").length, highImpact30Days: highImpactEntries.length, topReason, advice: hasRecords ? PROTECTION_ADVICE[topReason] || croissant.advice : "本周先保护好自己。第一步不是判断，而是记录。" },
      reasonDistribution,
      highImpactEntries,
      tendency,
      reviewText: buildReview(entries, topReason, croissant)
    });
  },
  goDetail(event) { wx.navigateTo({ url: "/pages/diary-detail/index?id=" + event.currentTarget.dataset.id }); },
  goNewDiary() { wx.navigateTo({ url: "/pages/diary-new/index" }); },
  goExitTest() { wx.navigateTo({ url: "/pages/exit-test/index" }); }
});
