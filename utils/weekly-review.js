const { REASON_OPTIONS } = require("./constants");

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function getRecentEntries(entries, now = Date.now()) {
  const start = now - WEEK_MS;
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const createdAt = new Date(entry && entry.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= start && createdAt <= now;
  });
}

function getReasonCounts(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    const reason = String(entry && entry.primaryReason || "未分类");
    counts.set(reason, (counts.get(reason) || 0) + 1);
  });
  const knownOrder = new Map(REASON_OPTIONS.map((reason, index) => [reason, index]));
  return Array.from(counts, ([reason, count]) => ({ reason, count })).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (knownOrder.get(a.reason) ?? 999) - (knownOrder.get(b.reason) ?? 999);
  });
}

function buildWeeklyReview(entries, now = Date.now()) {
  const recentEntries = getRecentEntries(entries, now);
  const reasonCounts = getReasonCounts(recentEntries);
  const impactEntries = recentEntries.filter((entry) => Number.isFinite(Number(entry && entry.impactLevel)));
  const averageImpact = impactEntries.length
    ? (impactEntries.reduce((sum, entry) => sum + Number(entry.impactLevel), 0) / impactEntries.length).toFixed(1)
    : "—";
  const highestEntry = recentEntries.reduce((highest, entry) => {
    if (!highest || Number(entry.impactLevel || 0) > Number(highest.impactLevel || 0)) return entry;
    return highest;
  }, null);

  return {
    total: recentEntries.length,
    topReason: reasonCounts.length ? reasonCounts[0].reason : "还没有记录",
    topReasonCount: reasonCounts.length ? reasonCounts[0].count : 0,
    averageImpact,
    highestEntry,
    repeatedReasons: reasonCounts.filter((item) => item.count >= 2),
    recentEntries
  };
}

module.exports = {
  DAY_MS,
  WEEK_MS,
  getRecentEntries,
  getReasonCounts,
  buildWeeklyReview
};
