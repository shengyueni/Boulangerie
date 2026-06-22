const { DEFAULT_PLAN_ITEMS_03B } = require("./constants");
const DIARY_KEY = "malo_diary_entries";
const WISH_KEY = "malo_wish_items";
const WISH_INIT_KEY = "malo_wish_defaults_initialized";
const WISH_DEFAULT_VERSION_KEY = "malo_wish_defaults_version";
const LOCAL_VOICE_KEY = "malo_local_voice_posts";
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

function getDiaryEntryById(id) {
  return getDiaryEntries().find((entry) => entry.id === id) || null;
}

function saveDiaryEntry(entry) {
  const nextEntries = sortByNewest([entry].concat(getDiaryEntries()));
  wx.setStorageSync(DIARY_KEY, nextEntries);
  return nextEntries;
}

function deleteDiaryEntry(id) {
  const nextEntries = getDiaryEntries().filter((entry) => entry.id !== id);
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

function addWishItem(title, type = "post_exit") {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) return null;
  const item = {
    id: createId("wish"),
    type,
    title: cleanTitle,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  saveWishItems([item].concat(getWishItems()));
  return item;
}

function initializeDefaultWishItems() {
  const current = getWishItems();
  const version = wx.getStorageSync(WISH_DEFAULT_VERSION_KEY);
  const now = new Date().toISOString();
  const baseDefaults = DEFAULT_PLAN_ITEMS_03B || [];

  if (!current.length) {
    const defaults = baseDefaults.map((item, index) => ({
      id: 'wish_default_03b_' + (index + 1),
      type: item.type,
      category: item.category || '',
      source: 'default_0.3B',
      title: item.title,
      completed: false,
      createdAt: now,
      completedAt: null
    }));
    saveWishItems(defaults);
    wx.setStorageSync(WISH_INIT_KEY, true);
    wx.setStorageSync(WISH_DEFAULT_VERSION_KEY, '0.3B');
    return defaults;
  }

  if (version === '0.3B') return current;

  const existingTitles = current.map((item) => item.title);
  const additions = baseDefaults
    .filter((item) => !existingTitles.includes(item.title))
    .map((item, index) => ({
      id: createId('wish_default_03b_' + index),
      type: item.type,
      category: item.category || '',
      source: 'default_0.3B',
      title: item.title,
      completed: false,
      createdAt: now,
      completedAt: null
    }));
  const nextItems = additions.concat(current);
  saveWishItems(nextItems);
  wx.setStorageSync(WISH_INIT_KEY, true);
  wx.setStorageSync(WISH_DEFAULT_VERSION_KEY, '0.3B');
  return nextItems;
}

function clearLocalData() {
  wx.removeStorageSync(DIARY_KEY);
  wx.removeStorageSync(WISH_KEY);
  wx.removeStorageSync(WISH_INIT_KEY);
  wx.removeStorageSync(WISH_DEFAULT_VERSION_KEY);
  wx.removeStorageSync(LOCAL_VOICE_KEY);
}

function getLocalVoicePosts() {
  const posts = wx.getStorageSync(LOCAL_VOICE_KEY);
  return Array.isArray(posts) ? posts.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
}

function saveLocalVoicePost(post) {
  const nextPosts = [post].concat(getLocalVoicePosts());
  wx.setStorageSync(LOCAL_VOICE_KEY, nextPosts);
  return nextPosts;
}

function deleteLocalVoicePost(id) {
  const nextPosts = getLocalVoicePosts().filter((post) => post.id !== id);
  wx.setStorageSync(LOCAL_VOICE_KEY, nextPosts);
  return nextPosts;
}

module.exports = {
  createId,
  getDiaryEntries,
  getDiaryEntryById,
  saveDiaryEntry,
  deleteDiaryEntry,
  getWishItems,
  saveWishItems,
  addWishItem,
  initializeDefaultWishItems,
  clearLocalData,
  getLocalVoicePosts,
  saveLocalVoicePost,
  deleteLocalVoicePost
};
