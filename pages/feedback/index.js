const {
  createId,
  getTrialFeedbackPosts,
  saveTrialFeedbackPost,
  updateTrialFeedbackPost,
  deleteTrialFeedbackPost
} = require("../../utils/storage");
const { FEEDBACK_TYPES } = require("../../utils/constants");
const { submitCloudFeedback } = require("../../utils/cloud-feedback");
const { buildCompanion, getElodieVariantImage } = require("../../utils/characters");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.getMonth() + 1 + "-" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function normalizePost(post, submittingIds) {
  const status = post.submissionStatus;
  const isLegacyLocalOnly = !status;
  const isSubmitting = !!submittingIds[post.id];
  const statusText = isLegacyLocalOnly
    ? "旧版 · 仅本地"
    : status === "submitted"
      ? "已递出"
      : status === "pending"
        ? "等待递出"
        : "还在本机";
  return {
    ...post,
    displayDate: formatDate(post.createdAt),
    isLegacyLocalOnly,
    isSubmitted: status === "submitted",
    isSubmitting,
    canRetry: !isSubmitting && (status === "pending" || status === "failed"),
    statusText
  };
}

Page({
  data: {
    feedbackTypes: FEEDBACK_TYPES,
    activeType: FEEDBACK_TYPES[0],
    content: "",
    posts: [],
    submittingNewFeedback: false,
    submittingFeedbackIds: {},
    companion: buildCompanion("elodie", "diaryDetail", {
      image: getElodieVariantImage("think"),
      tag: "试用小纸条",
      message: "你的纸条只会在你明确点击递出后，才送给 Malo。"
    })
  },

  onShow() {
    this.refreshPosts();
  },

  refreshPosts() {
    const submittingIds = this.data.submittingFeedbackIds || {};
    this.setData({ posts: getTrialFeedbackPosts().map((post) => normalizePost(post, submittingIds)) });
  },

  setFeedbackSubmitting(id, isSubmitting) {
    const submittingFeedbackIds = { ...(this.data.submittingFeedbackIds || {}) };
    if (isSubmitting) submittingFeedbackIds[id] = true;
    else delete submittingFeedbackIds[id];
    this.setData({ submittingFeedbackIds });
    this.refreshPosts();
  },

  selectType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  onInput(event) {
    this.setData({ content: event.detail.value });
  },

  async deliverFeedback(post) {
    this.setFeedbackSubmitting(post.id, true);
    const result = await submitCloudFeedback(post);
    if (result.ok) {
      updateTrialFeedbackPost(post.id, {
        submissionStatus: "submitted",
        cloudFeedbackId: result.feedbackId,
        submittedAt: new Date().toISOString()
      });
    } else {
      updateTrialFeedbackPost(post.id, {
        submissionStatus: "failed",
        cloudFeedbackId: null,
        submittedAt: null
      });
    }
    this.setFeedbackSubmitting(post.id, false);
    wx.showToast({
      title: result.ok ? "小纸条递到了，谢谢你。" : "这张小纸条还留在本机，刚刚没有递出去。",
      icon: "none",
      duration: result.ok ? 2200 : 3000
    });
    return result;
  },

  async submitFeedback() {
    if (this.data.submittingNewFeedback) return;
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: "可以只写一点点，但先留下一句话吧。", icon: "none" });
      return;
    }
    const post = {
      id: createId("feedback"),
      type: this.data.activeType,
      content,
      createdAt: new Date().toISOString(),
      submissionStatus: "pending",
      cloudFeedbackId: null,
      submittedAt: null
    };
    saveTrialFeedbackPost(post);
    this.setData({ content: "", submittingNewFeedback: true });
    this.refreshPosts();
    await this.deliverFeedback(post);
    this.setData({ submittingNewFeedback: false });
  },

  async retryFeedback(event) {
    const id = event.currentTarget.dataset.id;
    const post = getTrialFeedbackPosts().find((item) => item.id === id);
    if (!post || !["pending", "failed"].includes(post.submissionStatus)) return;
    await this.deliverFeedback(post);
  },

  deletePost(event) {
    const id = event.currentTarget.dataset.id;
    const post = getTrialFeedbackPosts().find((item) => item.id === id);
    if (!post) return;
    const content = post.submissionStatus === "submitted"
      ? "只会从本机删除这张纸条；已经递给 Malo 的反馈不会从云端删除。"
      : "只会删除本机保存的这张纸条。删除后无法恢复。";
    wx.showModal({
      title: "从本机删除这张小纸条？",
      content,
      confirmText: "从本机删除",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        deleteTrialFeedbackPost(id);
        this.refreshPosts();
        wx.showToast({ title: "本机副本已经删除。", icon: "none" });
      }
    });
  },

  goAbout() {
    wx.navigateTo({ url: "/pages/about/index" });
  }
});
