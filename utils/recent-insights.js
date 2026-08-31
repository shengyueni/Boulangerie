const DAY_MS = 24 * 60 * 60 * 1000;

function getEntriesInRange(entries, start, end) {
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const createdAt = new Date(entry && entry.createdAt).getTime();
    return Number.isFinite(createdAt) && createdAt >= start && createdAt <= end;
  });
}

function getReasonCounts(entries) {
  const counts = {};
  entries.forEach((entry) => {
    const reason = String(entry && entry.primaryReason || "未分类");
    counts[reason] = (counts[reason] || 0) + 1;
  });
  return Object.keys(counts)
    .map((reason) => ({ reason, count: counts[reason] }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason, "zh-CN"));
}

function getAverageImpact(entries) {
  const values = entries
    .map((entry) => Number(entry && entry.impactLevel))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getWearContribution(entries) {
  return entries.reduce((total, entry) => {
    if (entry && entry.type === "positive") return total - 1;
    if (entry && entry.type === "negative") return total + Number(entry.impactLevel || 0);
    return total;
  }, 0);
}

function summarize(entries) {
  const reasonCounts = getReasonCounts(entries);
  const averageImpactValue = getAverageImpact(entries);
  const highestEntry = entries.reduce((highest, entry) => {
    if (!highest || Number(entry && entry.impactLevel || 0) > Number(highest.impactLevel || 0)) return entry;
    return highest;
  }, null);
  return {
    total: entries.length,
    averageImpactValue,
    averageImpact: averageImpactValue === null ? "—" : averageImpactValue.toFixed(1),
    highImpactCount: entries.filter((entry) => Number(entry && entry.impactLevel) >= 4).length,
    topReason: reasonCounts.length ? reasonCounts[0].reason : "还没有记录",
    topReasonCount: reasonCounts.length ? reasonCounts[0].count : 0,
    repeatedReasons: reasonCounts.filter((item) => item.count >= 2),
    negativeCount: entries.filter((entry) => entry && entry.type === "negative").length,
    positiveCount: entries.filter((entry) => entry && entry.type === "positive").length,
    quickCount: entries.filter((entry) => entry && entry.entryMode === "quick").length,
    wearContribution: getWearContribution(entries),
    highestEntry
  };
}

function buildTrendNotes(current, previous, days) {
  const notes = [];
  if (!previous.total) {
    notes.push("前一段时间没有可比较的记录，先展示当前区间里真实发生的事。");
  } else {
    const totalDelta = current.total - previous.total;
    notes.push(totalDelta === 0
      ? `最近 ${days} 天的记录次数与前一段相同，都是 ${current.total} 件。`
      : `最近 ${days} 天记录 ${current.total} 件，比前一段${totalDelta > 0 ? "多" : "少"} ${Math.abs(totalDelta)} 件。`);

    const highDelta = current.highImpactCount - previous.highImpactCount;
    notes.push(highDelta === 0
      ? `4–5 级事件与前一段相同，都是 ${current.highImpactCount} 件。`
      : `4–5 级事件比前一段${highDelta > 0 ? "多" : "少"} ${Math.abs(highDelta)} 件。`);

    if (current.averageImpactValue !== null && previous.averageImpactValue !== null) {
      const impactDelta = current.averageImpactValue - previous.averageImpactValue;
      notes.push(Math.abs(impactDelta) < 0.05
        ? `平均事件等级与前一段相同，都是 ${current.averageImpact}。`
        : `平均事件等级为 ${current.averageImpact}，比前一段${impactDelta > 0 ? "高" : "低"} ${Math.abs(impactDelta).toFixed(1)}。`);
    }
  }

  if (current.topReasonCount >= 2) {
    notes.push(`${current.topReason}相关的问题重复出现了 ${current.topReasonCount} 次。`);
  } else if (current.topReasonCount === 1) {
    notes.push(`最近记录里，${current.topReason}出现 1 次。`);
  }
  return notes.slice(0, 4);
}

function buildRecentInsights(entries, days = 7, now = Date.now()) {
  const safeDays = days === 30 ? 30 : 7;
  const currentStart = now - safeDays * DAY_MS;
  const previousStart = currentStart - safeDays * DAY_MS;
  const currentEntries = getEntriesInRange(entries, currentStart, now);
  const previousEntries = getEntriesInRange(entries, previousStart, currentStart - 1);
  const current = summarize(currentEntries);
  const previous = summarize(previousEntries);
  return {
    days: safeDays,
    hasRecords: current.total > 0,
    hasComparison: previous.total > 0,
    ...current,
    previous,
    trendNotes: current.total ? buildTrendNotes(current, previous, safeDays) : []
  };
}

module.exports = {
  DAY_MS,
  getEntriesInRange,
  getReasonCounts,
  getWearContribution,
  buildRecentInsights
};
