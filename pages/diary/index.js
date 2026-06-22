const { REASON_OPTIONS } = require("../../utils/constants");
const { getDiaryEntries } = require("../../utils/storage");

function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value || ""; return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(); }
function getMemoPreview(factMemo) { const memo = factMemo || "还没有生成事实纪要。"; return memo.length <= 86 ? memo : memo.slice(0, 86) + "..."; }
function normalizeEntry(entry) { const impactLevel = Number(entry.impactLevel || 0); return { ...entry, impactLevel, displayDate: formatDate(entry.createdAt), typeLabel: entry.type === "positive" ? "正面" : "负面", cardClass: entry.type === "positive" ? "smooth-note" : impactLevel >= 4 ? "worn-note high-impact" : "worn-note", impactClass: impactLevel >= 4 ? "orange" : "green", memoPreview: getMemoPreview(entry.factMemo) }; }

Page({
  data: {
    allEntries: [], entries: [], activeFilter: "all", activeReason: "all",
    typeFilters: [
      { key: "all", label: "全部" }, { key: "negative", label: "负面记录" }, { key: "positive", label: "正面记录" }, { key: "high", label: "高影响记录" }
    ],
    reasonFilters: ["全部原因"].concat(REASON_OPTIONS)
  },
  onShow() { const allEntries = getDiaryEntries().map(normalizeEntry); this.setData({ allEntries }); this.applyFilters(); },
  applyFilters() {
    const entries = this.data.allEntries.filter((entry) => {
      const typeOk = this.data.activeFilter === "all" || entry.type === this.data.activeFilter || (this.data.activeFilter === "high" && entry.impactLevel >= 4);
      const reasonOk = this.data.activeReason === "all" || entry.primaryReason === this.data.activeReason;
      return typeOk && reasonOk;
    });
    this.setData({ entries });
  },
  switchTypeFilter(event) { this.setData({ activeFilter: event.currentTarget.dataset.key }); this.applyFilters(); },
  switchReasonFilter(event) { const reason = event.currentTarget.dataset.reason; this.setData({ activeReason: reason === "全部原因" ? "all" : reason }); this.applyFilters(); },
  goNew() { wx.navigateTo({ url: "/pages/diary-new/index" }); },
  goDetail(event) { wx.navigateTo({ url: "/pages/diary-detail/index?id=" + event.currentTarget.dataset.id }); }
});
