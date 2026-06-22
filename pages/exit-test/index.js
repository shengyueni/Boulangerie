const {
  EXIT_TEST_QUESTIONS,
  EXIT_TEST_OPTIONS,
  EXIT_TEST_RESULTS
} = require("../../utils/constants");

function buildQuestions(selectedScores = []) {
  return EXIT_TEST_QUESTIONS.map((title, index) => ({
    title,
    selectedScore: selectedScores[index] || 0
  }));
}

function getResult(score) {
  return EXIT_TEST_RESULTS.find((item) => score >= item.min && score <= item.max) || EXIT_TEST_RESULTS[0];
}

Page({
  data: {
    questions: buildQuestions(),
    options: EXIT_TEST_OPTIONS,
    result: null,
    totalScore: 0
  },

  selectScore(event) {
    const index = Number(event.currentTarget.dataset.index);
    const score = Number(event.currentTarget.dataset.score);
    const questions = this.data.questions.map((item, itemIndex) => ({
      ...item,
      selectedScore: itemIndex === index ? score : item.selectedScore
    }));
    this.setData({ questions, result: null });
  },

  showResult() {
    const unanswered = this.data.questions.findIndex((item) => !item.selectedScore);
    if (unanswered >= 0) {
      wx.showToast({ title: `第 ${unanswered + 1} 题还没有选择。`, icon: "none" });
      return;
    }
    const totalScore = this.data.questions.reduce((total, item) => total + item.selectedScore, 0);
    this.setData({
      totalScore,
      result: getResult(totalScore)
    });
  },

  goDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  goWishlist() {
    wx.navigateTo({ url: "/pages/wishlist/index" });
  }
});
