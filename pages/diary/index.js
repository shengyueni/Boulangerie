const { getDiaryEntries } = require("../../utils/storage");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getMemoPreview(factMemo) {
  const memo = factMemo || "";
  if (memo.length <= 80) return memo;
  return `${memo.slice(0, 80)}...`;
}

Page({
  data: {
    entries: []
  },

  onShow() {
    const entries = getDiaryEntries().map((entry) => ({
      ...entry,
      displayDate: formatDate(entry.createdAt),
      typeLabel: entry.type === "positive" ? "正面" : "负面",
      memoPreview: getMemoPreview(entry.factMemo)
    }));
    this.setData({ entries });
  },

  goNew() {
    wx.navigateTo({
      url: "/pages/diary-new/index"
    });
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/diary-detail/index?id=${event.currentTarget.dataset.id}`
    });
  }
});
