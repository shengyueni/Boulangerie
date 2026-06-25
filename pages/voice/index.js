const { FEATURED_VOICES, LOCAL_VOICE_PREFIXES } = require("../../utils/constants");
const { createId, getLocalVoicePosts, saveLocalVoicePost, deleteLocalVoicePost, getFeaturedVoiceHugMap, hugFeaturedVoice } = require("../../utils/storage");

function createAnonymousId() {
  const prefix = LOCAL_VOICE_PREFIXES[Math.floor(Math.random() * LOCAL_VOICE_PREFIXES.length)];
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return prefix + " " + suffix;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.getMonth() + 1 + "-" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function buildFeaturedVoices(hugMap) {
  return FEATURED_VOICES.map((voice) => {
    const hug = hugMap[voice.id] || {};
    const count = Number(hug.count || 0);
    return {
      ...voice,
      hugged: !!hug.hugged,
      hugCount: count,
      hugLabel: hug.hugged ? "已抱抱" : "抱一抱",
      hugCountLabel: count ? count + " 个抱抱" : ""
    };
  });
}

Page({
  data: {
    featuredVoices: buildFeaturedVoices(getFeaturedVoiceHugMap()),
    localPosts: [],
    content: "",
    showComposer: false
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const hugMap = getFeaturedVoiceHugMap();
    this.setData({
      featuredVoices: buildFeaturedVoices(hugMap),
      localPosts: getLocalVoicePosts().map((post) => ({ ...post, displayDate: formatDate(post.createdAt) }))
    });
  },

  hugVoice(event) {
    const id = event.currentTarget.dataset.id;
    const wasHugged = !!(getFeaturedVoiceHugMap()[id] || {}).hugged;
    const hugMap = hugFeaturedVoice(id);
    this.setData({ featuredVoices: buildFeaturedVoices(hugMap) });
    wx.showToast({ title: wasHugged ? "已经抱过这条心声了。" : "抱抱已存在本机。", icon: "none" });
  },

  onInput(event) {
    this.setData({ content: event.detail.value });
  },

  toggleComposer() {
    this.setData({ showComposer: !this.data.showComposer });
  },

  saveLocalVoice() {
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: "先写下一句想放下的话。", icon: "none" });
      return;
    }

    saveLocalVoicePost({
      id: createId("voice"),
      anonymousId: createAnonymousId(),
      content,
      createdAt: new Date().toISOString()
    });
    this.setData({ content: "", showComposer: false });
    this.refresh();
    wx.showToast({ title: "已经放进我的本地心声。", icon: "none", duration: 2200 });
  },

  deletePost(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "确认删除",
      content: "确定要删除这条本地心声吗？删除后无法恢复。",
      confirmText: "删除",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        deleteLocalVoicePost(id);
        this.refresh();
        wx.showToast({ title: "这条心声已经删除。", icon: "none" });
      }
    });
  }
});