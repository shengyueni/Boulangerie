const { REASON_OPTIONS } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");
const { getCroissantReport } = require("../../utils/croissant");

function stripLegacyMemo(text) { const blocked = [/^\s*\u8ba9\u6211\u5728\u610f\u7684\u7ebf\u7d22\uff1a/, /^\s*\u60f3\u9760\u8fd1\u7684\u65b9\u5411\uff1a/]; return String(text || "").split("\n").filter((line) => !blocked.some((pattern) => pattern.test(line))).join("\n"); }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value || ""; return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(); }
function getMemoPreview(factMemo) { const memo = stripLegacyMemo(factMemo) || "还没有生成事实纪要。"; return memo.length <= 86 ? memo : memo.slice(0, 86) + "..."; }
function getTypeLabel() { return "日记记录"; }
function normalizeEntry(entry) { const impactLevel = Number(entry.impactLevel || 0); return { ...entry, impactLevel, displayDate: formatDate(entry.createdAt), typeLabel: getTypeLabel(), cardClass: impactLevel >= 4 ? "worn-note high-impact" : "worn-note", impactClass: impactLevel >= 4 ? "orange" : "green", memoPreview: getMemoPreview(entry.factMemo) }; }
function buildDashboardSummary(entries) {
  const croissant = getCroissantReport(entries);
  return {
    status: croissant.status,
    statusKey: croissant.statusKey,
    wear: croissant.wear,
    text: entries.length ? croissant.explanation : "还没有足够记录形成趋势。先写下一件真实发生的事就好。",
    total: entries.length,
    statusClass: croissant.statusClass
  };
}

Page({
  data: {
    allEntries: [], entries: [], activeFilter: "all", activeReason: "all",
    dashboardSummary: buildDashboardSummary([]),
    summaryButtons: [
      { label: "查看决心仪表盘", action: "dashboard" },
      { label: "写一条日记", action: "new" }
    ],
    typeFilters: [
      { key: "all", label: "全部" }, { key: "decision", label: "日记记录" }, { key: "high", label: "重要记录" }
    ],
    reasonFilters: ["全部归因"].concat(REASON_OPTIONS)
  },
  onShow() { const allEntries = getDiaryEntries().map(normalizeEntry); this.setData({ allEntries, dashboardSummary: buildDashboardSummary(allEntries) }); this.applyFilters(); },
  applyFilters() {
    const entries = this.data.allEntries.filter((entry) => {
      const typeOk = this.data.activeFilter === "all" || this.data.activeFilter === "decision" || (this.data.activeFilter === "high" && entry.impactLevel >= 4);
      const reasonOk = this.data.activeReason === "all" || entry.primaryReason === this.data.activeReason;
      return typeOk && reasonOk;
    });
    this.setData({ entries });
  },
  switchTypeFilter(event) { this.setData({ activeFilter: event.currentTarget.dataset.key }); this.applyFilters(); },
  switchReasonFilter(event) { const reason = event.currentTarget.dataset.reason; this.setData({ activeReason: reason === "全部归因" ? "all" : reason }); this.applyFilters(); },
  goNew() { wx.navigateTo({ url: "/pages/diary-new/index" }); },
  goDashboard() { wx.navigateTo({ url: "/pages/dashboard/index" }); },
  handleCroissantAction(event) { const action = event.detail.action; if (action === "dashboard") this.goDashboard(); if (action === "new") this.goNew(); },
  goDetail(event) { wx.navigateTo({ url: "/pages/diary-detail/index?id=" + event.currentTarget.dataset.id }); }
});
