const { getMaloNickname, normalizeMaloNickname, saveMaloNickname } = require("../../utils/storage");

Page({
  data: {
    nickname: "",
    savedNickname: "",
    remaining: 16
  },

  onShow() {
    const nickname = getMaloNickname();
    this.setData({
      nickname,
      savedNickname: nickname,
      remaining: 16 - Array.from(nickname).length
    });
  },

  onNicknameInput(event) {
    const nickname = normalizeMaloNickname(event.detail.value);
    this.setData({
      nickname,
      remaining: 16 - Array.from(nickname).length
    });
  },

  saveNickname() {
    const nickname = saveMaloNickname(this.data.nickname);
    this.setData({
      nickname,
      savedNickname: nickname,
      remaining: 16 - Array.from(nickname).length
    });
    wx.showToast({ title: nickname ? "Malo 记住这个称呼啦。" : "称呼已经清空。", icon: "none" });
  },

  clearNickname() {
    saveMaloNickname("");
    this.setData({ nickname: "", savedNickname: "", remaining: 16 });
    wx.showToast({ title: "称呼已经清空。", icon: "none" });
  },

  goBack() {
    wx.navigateBack();
  }
});
