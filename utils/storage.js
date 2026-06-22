const DIARY_KEY = "malo_diary_entries";
const WISH_KEY = "malo_wish_items";
const WISH_INIT_KEY = "malo_wish_defaults_initialized";

const DEFAULT_WISHES = [
  { type: "pre_exit", title: "计算生活费缓冲" },
  { type: "pre_exit", title: "更新简历" },
  { type: "pre_exit", title: "整理作品集" },
  { type: "pre_exit", title: "保存重要工作材料" },
  { type: "pre_exit", title: "找一个可信任的人聊聊状态" },
  { type: "post_exit", title: "连续睡满三天" },
  { type: "post_exit", title: "晒太阳" },
  { type: "post_exit", title: "去喜欢的咖啡馆写东西" },
  { type: "post_exit", title: "做自己的项目 demo" },
  { type: "post_exit", title: "找回“我喜欢的生活”" }
];

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortByNewest(entries) {
  return entries.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getDiaryEntries() {
  const entries = wx.getStorageSync(DIARY_KEY);
  return Array.isArray(entries) ? sortByNewest(entries) : [];
}

function saveDiaryEntry(entry) {
  const nextEntries = sortByNewest([entry].concat(getDiaryEntries()));
  wx.setStorageSync(DIARY_KEY, nextEntries);
  return nextEntries;
}

function getWishItems() {
  const items = wx.getStorageSync(WISH_KEY);
  return Array.isArray(items) ? items : [];
}

function saveWishItems(items) {
  const nextItems = Array.isArray(items) ? items : [];
  wx.setStorageSync(WISH_KEY, nextItems);
  return nextItems;
}

function initializeDefaultWishItems() {
  const hasInitialized = wx.getStorageSync(WISH_INIT_KEY);
  const current = getWishItems();
  if (hasInitialized || current.length) {
    if (current.length && !hasInitialized) {
      wx.setStorageSync(WISH_INIT_KEY, true);
    }
    return current;
  }

  const now = new Date().toISOString();
  const defaults = DEFAULT_WISHES.map((item, index) => ({
    id: `wish_default_${index + 1}`,
    type: item.type,
    title: item.title,
    completed: false,
    createdAt: now,
    completedAt: null
  }));
  saveWishItems(defaults);
  wx.setStorageSync(WISH_INIT_KEY, true);
  return defaults;
}

module.exports = {
  createId,
  getDiaryEntries,
  saveDiaryEntry,
  getWishItems,
  saveWishItems,
  initializeDefaultWishItems
};
