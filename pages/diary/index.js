const { getDiaryEntries } = require("../../utils/storage");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
}

function getMemoPreview(factMemo) {
  const memo = factMemo || "还没有生成事实纪要。";
  if (memo.length <= 86) return memo;
  return memo.slice(0, 86) + "...";
}

function normalizeEntry(entry) {
  const impactLevel = Number(entry.impactLevel || 0);
  return {
    ...entry,
    impactLevel,
    displayDate: formatDate(entry.createdAt),
    typeLabel: entry.type === "positive" ? "正面" : "负面",
    cardClass: entry.type === "positive" ? "smooth-note" : impactLevel >= 4 ? "worn-note high-impact" : "worn-note",
    impactClass: impactLevel >= 4 ? "orange" : "green",
    memoPreview: getMemoPreview(entry.factMemo)
  };
}

Page({
  data: {
    entries: []
  },

  onShow() {
    this.setData({
      entries: getDiaryEntries().map(normalizeEntry)
    });
  },

  goNew() {
    wx.navigateTo({
      url: "/pages/diary-new/index"
    });
  },

  goDetail(event) {
    wx.navigateTo({
      url: "/pages/diary-detail/index?id=" + event.currentTarget.dataset.id
    });
  }
});
