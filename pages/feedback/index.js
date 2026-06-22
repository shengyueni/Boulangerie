const { FEEDBACK_QUESTIONS } = require("../../utils/constants");

Page({
  data: {
    questions: FEEDBACK_QUESTIONS
  },

  copyQuestions() {
    wx.setClipboardData({
      data: FEEDBACK_QUESTIONS.join("\n"),
      success() {
        wx.showToast({
          title: "反馈问题已复制。谢谢你愿意帮 Croissant 试走这一步。",
          icon: "none",
          duration: 2400
        });
      },
      fail() {
        wx.showToast({
          title: "复制失败，请稍后再试。",
          icon: "none"
        });
      }
    });
  }
});
