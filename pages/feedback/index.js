const {
  createId,
  getTrialFeedbackPosts,
  saveTrialFeedbackPost,
  deleteTrialFeedbackPost
} = require("../../utils/storage");
const { buildCompanion, getElodieVariantImage } = require("../../utils/characters");

const FEEDBACK_TYPES = [
  "我觉得好用的地方",
  "我觉得别扭的地方",
  "我遇到的小 bug",
  "我希望之后增加的内容",
  "我不确定，但想说两句"
];

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.getMonth() + 1 + "-" + date.getDate() + " " + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function normalizePost(post) {
  return {
    ...post,
    displayDate: formatDate(post.createdAt)
  };
}

Page({
  data: {
    feedbackTypes: FEEDBACK_TYPES,
    activeType: FEEDBACK_TYPES[0],
    content: "",
    posts: [],
    companion: buildCompanion("elodie", "diaryDetail", {
      image: getElodieVariantImage("think"),
      tag: "试用小纸条",
      message: "Elodie 会帮你把试用感受先收在本机，不急着上传给任何地方。"
    })
  },

  onShow() {
    this.refreshPosts();
  },

  refreshPosts() {
    this.setData({
      posts: getTrialFeedbackPosts().map(normalizePost)
    });
  },

  selectType(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  onInput(event) {
    this.setData({ content: event.detail.value });
  },

  saveFeedback() {
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: "可以只写一点点，但先留下一句话吧。", icon: "none" });
      return;
    }

    saveTrialFeedbackPost({
      id: createId("feedback"),
      type: this.data.activeType,
      content,
      createdAt: new Date().toISOString()
    });

    this.setData({ content: "" });
    this.refreshPosts();
    wx.showToast({
      title: "已保存。谢谢你帮吗喽把路上的小石子捡起来。",
      icon: "none",
      duration: 2400
    });
  },

  deletePost(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除这张小纸条？",
      content: "它只保存在当前设备。删除后就找不回来了。",
      confirmText: "删除",
      confirmColor: "#e9785f",
      success: (res) => {
        if (!res.confirm) return;
        deleteTrialFeedbackPost(id);
        this.refreshPosts();
        wx.showToast({ title: "这张小纸条已经删除。", icon: "none" });
      }
    });
  },

  goAbout() {
    wx.navigateTo({ url: "/pages/about/index" });
  }
});
