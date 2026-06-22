const { getDiaryEntryById, deleteDiaryEntry } = require("../../utils/storage");
const EMPTY_TEXT = "这部分当时没有记录，也没关系。";
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value || ""; return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0"); }
function joinList(list) { return Array.isArray(list) && list.length ? list.join("、") : EMPTY_TEXT; }
function normalizeEntry(entry) { if (!entry) return null; return { ...entry, displayDate: formatDate(entry.createdAt), typeLabel: entry.type === "positive" ? "正面记录" : "负面记录", tagsText: joinList(entry.secondaryTags), bodyReactionsText: joinList(entry.bodyReactions), emotionsText: joinList(entry.emotions), triedActionsText: joinList(entry.triedActions), nextStepText: entry.nextStep || "先照顾好自己，再决定下一步。" }; }
Page({
  data: { id: "", entry: null },
  onLoad(options) { const id = options && options.id ? options.id : ""; this.setData({ id, entry: normalizeEntry(getDiaryEntryById(id)) }); },
  copyFactMemo() { const factMemo = this.data.entry && this.data.entry.factMemo; if (!factMemo) { wx.showToast({ title: "这条记录还没有生成事实纪要。", icon: "none" }); return; } wx.setClipboardData({ data: factMemo, success() { wx.showToast({ title: "事实纪要已复制。", icon: "none" }); }, fail() { wx.showToast({ title: "复制失败，请稍后再试。", icon: "none" }); } }); },
  deleteEntry() { wx.showModal({ title: "确认删除", content: "删除后无法恢复，确定要删除这条记录吗？", confirmText: "删除", confirmColor: "#e9785f", success: (res) => { if (!res.confirm) return; deleteDiaryEntry(this.data.id); wx.showToast({ title: "这条记录已经删除。", icon: "none" }); setTimeout(() => { wx.redirectTo({ url: "/pages/diary/index" }); }, 500); } }); },
  goDiary() { wx.redirectTo({ url: "/pages/diary/index" }); },
  goDashboard() { wx.redirectTo({ url: "/pages/dashboard/index" }); }
});
