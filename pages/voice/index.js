const { FEATURED_VOICES, LOCAL_VOICE_PREFIXES } = require("../../utils/constants");
const { createId, getLocalVoicePosts, saveLocalVoicePost, deleteLocalVoicePost } = require("../../utils/storage");
function createAnonymousId() { const prefix = LOCAL_VOICE_PREFIXES[Math.floor(Math.random() * LOCAL_VOICE_PREFIXES.length)]; const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0"); return prefix + " " + suffix; }
function formatDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return date.getMonth() + 1 + "-" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0"); }
Page({
  data: { featuredVoices: FEATURED_VOICES, localPosts: [], content: "" },
  onShow() { this.refresh(); },
  refresh() { this.setData({ localPosts: getLocalVoicePosts().map((post) => ({ ...post, displayDate: formatDate(post.createdAt) })) }); },
  onInput(event) { this.setData({ content: event.detail.value }); },
  publishLocal() { const content = this.data.content.trim(); if (!content) { wx.showToast({ title: "先写下一句想放下的话。", icon: "none" }); return; } saveLocalVoicePost({ id: createId("voice"), anonymousId: createAnonymousId(), content, createdAt: new Date().toISOString() }); this.setData({ content: "" }); this.refresh(); wx.showToast({ title: "已经放进本地树洞。它只存在这台设备上。", icon: "none", duration: 2400 }); },
  deletePost(event) { const id = event.currentTarget.dataset.id; wx.showModal({ title: "确认删除", content: "确定要删除这条本地心声吗？删除后无法恢复。", confirmText: "删除", confirmColor: "#e9785f", success: (res) => { if (!res.confirm) return; deleteLocalVoicePost(id); this.refresh(); wx.showToast({ title: "这条心声已经删除。", icon: "none" }); } }); }
});
