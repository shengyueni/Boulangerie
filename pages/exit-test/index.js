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
    this.setData({ questions, result: null, totalScore: 0 });
  },

  showResult() {
    const unanswered = this.data.questions.findIndex((item) => !item.selectedScore);
    if (unanswered >= 0) {
      wx.showToast({ title: "还有题目没有回答完，先慢慢选完，不用急。", icon: "none" });
      return;
    }
    const totalScore = this.data.questions.reduce((total, item) => total + item.selectedScore, 0);
    this.setData({
      totalScore,
      result: getResult(totalScore)
    });
  },

  resetTest() {
    this.setData({
      questions: buildQuestions(),
      result: null,
      totalScore: 0
    });
    wx.showToast({ title: "已经清空，可以重新慢慢测。", icon: "none" });
  },

  goDiary() {
    wx.navigateTo({ url: "/pages/diary-new/index" });
  },

  goWishlist() {
    wx.switchTab({ url: "/pages/wishlist/index" });
  }
});
