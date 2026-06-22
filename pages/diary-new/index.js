const { REASON_OPTIONS, IMPACT_LEVELS, SECONDARY_TAGS } = require("../../utils/constants");
const { createId, saveDiaryEntry } = require("../../utils/storage");

function buildFactMemo(entry) {
  return `事件时间：${entry.createdAt}
事件简述：${entry.summary}
影响等级：${entry.impactLevel}
主要原因：${entry.primaryReason}
记录类型：${entry.type === "negative" ? "负面记录" : "正面记录"}
补充标签：${entry.secondaryTags.length ? entry.secondaryTags.join("、") : "暂无"}
对我的影响：${entry.type === "negative" ? "这件事消耗了我，需要被认真看见。" : "这件事给了我一点支持和能量。"}
下一步我可以做：${entry.nextStep || "先照顾好自己，再决定下一步。"}`;
}

Page({
  data: {
    summary: "",
    type: "negative",
    impactLevel: 3,
    primaryReason: REASON_OPTIONS[0],
    secondaryTags: [],
    nextStep: "",
    reasonOptions: REASON_OPTIONS,
    impactLevels: IMPACT_LEVELS,
    tagOptions: SECONDARY_TAGS.map((label) => ({ label, selected: false }))
  },

  onSummaryInput(event) {
    this.setData({ summary: event.detail.value });
  },

  onNextStepInput(event) {
    this.setData({ nextStep: event.detail.value });
  },

  selectType(event) {
    this.setData({ type: event.currentTarget.dataset.type });
  },

  selectImpact(event) {
    this.setData({ impactLevel: Number(event.currentTarget.dataset.value) });
  },

  selectReason(event) {
    this.setData({ primaryReason: event.currentTarget.dataset.reason });
  },

  toggleTag(event) {
    const tag = event.currentTarget.dataset.tag;
    const exists = this.data.secondaryTags.includes(tag);
    const secondaryTags = exists
      ? this.data.secondaryTags.filter((item) => item !== tag)
      : this.data.secondaryTags.concat(tag);
    this.setData({
      secondaryTags,
      tagOptions: this.data.tagOptions.map((item) => ({
        ...item,
        selected: secondaryTags.includes(item.label)
      }))
    });
  },

  saveEntry() {
    const summary = this.data.summary.trim();
    if (!summary) {
      wx.showToast({ title: "先写一点发生了什么吧。", icon: "none" });
      return;
    }

    const entry = {
      id: createId("diary"),
      createdAt: new Date().toISOString(),
      type: this.data.type,
      summary,
      impactLevel: this.data.impactLevel,
      primaryReason: this.data.primaryReason,
      secondaryTags: this.data.secondaryTags,
      bodyReactions: [],
      emotions: [],
      triedActions: [],
      nextStep: this.data.nextStep.trim(),
      factMemo: ""
    };

    entry.factMemo = buildFactMemo(entry);
    saveDiaryEntry(entry);

    wx.showToast({
      title: entry.type === "negative" ? "Croissant 受到了一点磨损。" : "Croissant 顺毛了一点。",
      icon: "none"
    });

    setTimeout(() => {
      wx.redirectTo({ url: "/pages/diary/index" });
    }, 600);
  }
});

