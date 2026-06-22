const {
  REASON_OPTIONS,
  IMPACT_LEVELS,
  SECONDARY_TAG_GROUPS,
  BODY_REACTION_OPTIONS,
  EMOTION_OPTIONS,
  TRIED_ACTION_OPTIONS
} = require("../../utils/constants");
const { createId, saveDiaryEntry } = require("../../utils/storage");

function toOptions(labels, selected = []) {
  return labels.map((label) => ({ label, selected: selected.includes(label) }));
}

function buildFactMemo(entry) {
  const none = "这部分当时没有记录，也没关系。";
  return [
    "事件时间：" + entry.createdAt,
    "事件简述：" + entry.summary,
    "影响等级：" + entry.impactLevel,
    "主要原因：" + entry.primaryReason,
    "记录类型：" + (entry.type === "negative" ? "负面记录" : "正面记录"),
    "补充标签：" + (entry.secondaryTags.length ? entry.secondaryTags.join("、") : none),
    "身体反应：" + (entry.bodyReactions.length ? entry.bodyReactions.join("、") : none),
    "情绪：" + (entry.emotions.length ? entry.emotions.join("、") : none),
    "已尝试处理：" + (entry.triedActions.length ? entry.triedActions.join("、") : none),
    "对我的影响：" + (entry.type === "negative" ? "这件事消耗了我，需要被认真看见。" : "这件事给了我一点支持和能量。"),
    "下一步我可以做：" + (entry.nextStep || "先照顾好自己，再决定下一步。")
  ].join("\n");
}

Page({
  data: {
    summary: "",
    type: "negative",
    impactLevel: 3,
    primaryReason: REASON_OPTIONS[0],
    secondaryTags: [],
    bodyReactions: [],
    emotions: [],
    triedActions: [],
    nextStep: "",
    reasonOptions: REASON_OPTIONS,
    impactLevels: IMPACT_LEVELS,
    tagOptions: toOptions(SECONDARY_TAG_GROUPS[REASON_OPTIONS[0]] || []),
    bodyReactionOptions: toOptions(BODY_REACTION_OPTIONS),
    emotionOptions: toOptions(EMOTION_OPTIONS),
    triedActionOptions: toOptions(TRIED_ACTION_OPTIONS)
  },

  onSummaryInput(event) { this.setData({ summary: event.detail.value }); },
  onNextStepInput(event) { this.setData({ nextStep: event.detail.value }); },
  selectType(event) { this.setData({ type: event.currentTarget.dataset.type }); },
  selectImpact(event) { this.setData({ impactLevel: Number(event.currentTarget.dataset.value) }); },

  selectReason(event) {
    const primaryReason = event.currentTarget.dataset.reason;
    this.setData({ primaryReason, secondaryTags: [], tagOptions: toOptions(SECONDARY_TAG_GROUPS[primaryReason] || []) });
  },

  toggleListValue(listName, optionName, value) {
    const current = this.data[listName];
    const next = current.includes(value) ? current.filter((item) => item !== value) : current.concat(value);
    this.setData({
      [listName]: next,
      [optionName]: this.data[optionName].map((item) => ({ ...item, selected: next.includes(item.label) }))
    });
  },

  toggleTag(event) { this.toggleListValue("secondaryTags", "tagOptions", event.currentTarget.dataset.tag); },
  toggleBodyReaction(event) { this.toggleListValue("bodyReactions", "bodyReactionOptions", event.currentTarget.dataset.value); },
  toggleEmotion(event) { this.toggleListValue("emotions", "emotionOptions", event.currentTarget.dataset.value); },
  toggleTriedAction(event) { this.toggleListValue("triedActions", "triedActionOptions", event.currentTarget.dataset.value); },

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
      bodyReactions: this.data.bodyReactions,
      emotions: this.data.emotions,
      triedActions: this.data.triedActions,
      nextStep: this.data.nextStep.trim(),
      factMemo: ""
    };
    entry.factMemo = buildFactMemo(entry);
    saveDiaryEntry(entry);
    wx.redirectTo({ url: "/pages/diary-saved/index?id=" + entry.id });
  }
});
