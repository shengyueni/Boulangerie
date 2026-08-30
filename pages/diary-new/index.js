const {
  REASON_OPTIONS,
  IMPACT_LEVELS,
  SECONDARY_TAG_GROUPS,
  BODY_REACTION_OPTIONS,
  EMOTION_OPTIONS,
  TRIED_ACTION_OPTIONS
} = require("../../utils/constants");
const { createId, getDiaryEntryById, saveDiaryEntry, updateDiaryEntry } = require("../../utils/storage");
const { buildCompanion, getElodieVariantImage } = require("../../utils/characters");

function toOptions(labels, selected = []) {
  return labels.map((label) => ({ label, selected: selected.includes(label) }));
}

function joinSections(list, none) {
  const text = list.filter(Boolean).join("；");
  return text || none;
}

function buildFactMemo(entry) {
  const none = "这部分当时没有记录，也没关系。";
  if (entry.entryMode === "quick") {
    return [
      "事件事实：" + entry.summary,
      "影响程度：" + entry.impactLevel + " 级",
      "主要归因：" + entry.primaryReason,
      "整理状态：这是一条 30 秒记录，其他线索可以以后再慢慢整理。"
    ].join("\n");
  }
  return [
    "事件事实：" + entry.summary,
    "影响程度：" + entry.impactLevel + " 级",
    "主要归因：" + entry.primaryReason,
    "补充标签：" + (entry.secondaryTags.length ? entry.secondaryTags.join("、") : none),
    "身体 / 情绪反应：" + joinSections([
      entry.bodyReactions.length ? entry.bodyReactions.join("、") : "",
      entry.emotions.length ? entry.emotions.join("、") : ""
    ], none),
    "已尝试处理：" + (entry.triedActions.length ? entry.triedActions.join("、") : none),
    "下一步：" + (entry.nextStep || "先照顾好自己，再决定下一步。")
  ].join("\n");
}

Page({
  data: {
    formMode: "full",
    isUpgradingQuick: false,
    editingEntryId: "",
    editingCreatedAt: "",
    summary: "",
    type: "negative",
    entryKind: "decision_factor",
    impactLevel: 3,
    primaryReason: REASON_OPTIONS[0],
    secondaryTags: [],
    bodyReactions: [],
    emotions: [],
    triedActions: [],
    leaveReason: "",
    approachClue: "",
    nextStep: "",
    companion: buildCompanion("elodie", "diaryNew", {
      image: getElodieVariantImage("remind"),
      tag: "先写事实",
      size: "bust"
    }),
    reasonOptions: REASON_OPTIONS,
    impactLevels: IMPACT_LEVELS,
    tagOptions: toOptions(SECONDARY_TAG_GROUPS[REASON_OPTIONS[0]] || []),
    bodyReactionOptions: toOptions(BODY_REACTION_OPTIONS),
    emotionOptions: toOptions(EMOTION_OPTIONS),
    triedActionOptions: toOptions(TRIED_ACTION_OPTIONS)
  },

  onLoad(options) {
    const id = options && options.id ? options.id : "";
    if (!id) return;
    const entry = getDiaryEntryById(id);
    if (!entry || entry.entryMode !== "quick") return;
    const emotions = Array.isArray(entry.emotions) ? entry.emotions : [];
    const impactLevel = IMPACT_LEVELS.some((item) => item.value === Number(entry.impactLevel))
      ? Number(entry.impactLevel)
      : 3;
    const primaryReason = REASON_OPTIONS.includes(entry.primaryReason)
      ? entry.primaryReason
      : REASON_OPTIONS[0];
    const secondaryTags = Array.isArray(entry.secondaryTags) ? entry.secondaryTags : [];
    this.setData({
      formMode: "full",
      isUpgradingQuick: true,
      editingEntryId: entry.id,
      editingCreatedAt: entry.createdAt,
      summary: entry.summary || "",
      impactLevel,
      primaryReason,
      secondaryTags,
      tagOptions: toOptions(SECONDARY_TAG_GROUPS[primaryReason] || [], secondaryTags),
      emotions,
      emotionOptions: toOptions(EMOTION_OPTIONS, emotions)
    });
  },

  onSummaryInput(event) { this.setData({ summary: event.detail.value }); },
  onNextStepInput(event) { this.setData({ nextStep: event.detail.value }); },
  selectImpact(event) { this.setData({ impactLevel: Number(event.currentTarget.dataset.value) }); },

  selectFormMode(event) {
    const formMode = event.currentTarget.dataset.mode === "quick" ? "quick" : "full";
    this.setData({ formMode });
  },

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

    const isQuick = this.data.formMode === "quick";
    if (isQuick && (!this.data.primaryReason || !Number(this.data.impactLevel))) {
      wx.showToast({ title: "再选一下问题分类和事件等级。", icon: "none" });
      return;
    }
    const entry = {
      id: this.data.editingEntryId || createId("diary"),
      createdAt: this.data.editingCreatedAt || new Date().toISOString(),
      type: "negative",
      entryKind: this.data.entryKind,
      summary,
      impactLevel: this.data.impactLevel,
      primaryReason: this.data.primaryReason,
      secondaryTags: isQuick ? [] : this.data.secondaryTags,
      bodyReactions: isQuick ? [] : this.data.bodyReactions,
      emotions: this.data.emotions,
      triedActions: isQuick ? [] : this.data.triedActions,
      leaveReason: "",
      approachClue: "",
      nextStep: isQuick ? "" : this.data.nextStep.trim(),
      factMemo: ""
    };
    if (isQuick) entry.entryMode = "quick";
    entry.factMemo = buildFactMemo(entry);
    if (this.data.isUpgradingQuick) {
      const updatedEntry = updateDiaryEntry(this.data.editingEntryId, entry);
      if (!updatedEntry) {
        wx.showToast({ title: "没有找到这条记录，请返回后重试。", icon: "none" });
        return;
      }
    } else {
      saveDiaryEntry(entry);
    }
    wx.redirectTo({ url: "/pages/diary-saved/index?id=" + entry.id });
  }
});
