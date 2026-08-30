const { createId, getWishItems, saveWishItems } = require("../../utils/storage");

const TEMPLATE_GROUPS = [
  {
    title: "财务缓冲",
    note: "先看清基本开支和可支撑时间，不替你决定何时离开。",
    items: [
      { id: "finance-cost", title: "估算每月必要开支", type: "pre_exit", category: "钱与保障" },
      { id: "finance-runway", title: "确认现有储备大致可支撑多久", type: "pre_exit", category: "钱与保障" },
      { id: "finance-spend", title: "检查近期可暂缓的大额支出", type: "pre_exit", category: "钱与保障" }
    ]
  },
  {
    title: "工作材料",
    note: "只整理个人可合法保留的信息，不带走公司机密或受限资料。",
    items: [
      { id: "materials-resume", title: "更新简历", type: "pre_exit", category: "材料与机会" },
      { id: "materials-projects", title: "整理可公开描述的项目成果", type: "pre_exit", category: "材料与机会" },
      { id: "materials-personal", title: "备份个人可合法保留的工作成果信息", type: "pre_exit", category: "材料与机会" }
    ]
  },
  {
    title: "求职 / 下一步",
    note: "下一步可以是求职、学习，也可以先恢复，不必一次定完。",
    items: [
      { id: "next-direction", title: "写下下一阶段想尝试的方向", type: "pre_exit", category: "材料与机会" },
      { id: "next-roles", title: "浏览一轮相关岗位和要求", type: "pre_exit", category: "材料与机会" },
      { id: "next-people", title: "联系一位可信赖的人了解信息", type: "pre_exit", category: "关系支持" },
      { id: "next-interview", title: "整理面试可能用到的材料", type: "pre_exit", category: "材料与机会" }
    ]
  },
  {
    title: "离职流程",
    note: "以下只是核对提醒，不构成法律意见。",
    items: [
      { id: "process-rules", title: "查看劳动合同和公司离职流程", type: "pre_exit", category: "工作交接" },
      { id: "process-handover", title: "列出需要交接的工作", type: "pre_exit", category: "工作交接" },
      { id: "process-pay", title: "核对工资、假期等个人事项", type: "pre_exit", category: "钱与保障" }
    ]
  },
  {
    title: "生活与恢复",
    note: "把身体和日常也放进计划，而不只是工作安排。",
    items: [
      { id: "life-rest", title: "为睡眠和真正的休息留出时间", type: "pre_exit", category: "身体保护" },
      { id: "life-personal", title: "梳理医疗、保险等个人事务", type: "pre_exit", category: "身体保护" },
      { id: "life-gap", title: "做一份 gap 期间的基本生活计划", type: "pre_exit", category: "身体保护" }
    ]
  },
  {
    title: "离职后的第一阶段",
    note: "先给第一周和第一个月一个轻量轮廓，之后仍可调整。",
    items: [
      { id: "after-week", title: "写下离职后第一周想优先做的事", type: "post_exit", category: "general" },
      { id: "after-month", title: "写下离职后第一个月的生活重点", type: "post_exit", category: "general" },
      { id: "after-pace", title: "决定学习、求职与休息的大致节奏", type: "post_exit", category: "general" }
    ]
  }
];

function decorateGroups(existingItems, selectedIds) {
  const existingKeys = new Set(existingItems.map((item) => `${item.type}|${item.title}`));
  const selected = new Set(selectedIds);
  return TEMPLATE_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      alreadyAdded: existingKeys.has(`${item.type}|${item.title}`),
      selected: selected.has(item.id)
    }))
  }));
}

Page({
  data: {
    groups: [],
    selectedIds: [],
    selectedCount: 0
  },

  onShow() {
    const existingItems = getWishItems();
    const selectableIds = new Set(
      decorateGroups(existingItems, []).flatMap((group) => group.items.filter((item) => !item.alreadyAdded).map((item) => item.id))
    );
    const selectedIds = this.data.selectedIds.filter((id) => selectableIds.has(id));
    this.setData({
      groups: decorateGroups(existingItems, selectedIds),
      selectedIds,
      selectedCount: selectedIds.length
    });
  },

  toggleItem(event) {
    const id = event.currentTarget.dataset.id;
    if (event.currentTarget.dataset.added) return;
    const selected = new Set(this.data.selectedIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    const selectedIds = Array.from(selected);
    this.setData({
      groups: decorateGroups(getWishItems(), selectedIds),
      selectedIds,
      selectedCount: selectedIds.length
    });
  },

  addSelected() {
    if (!this.data.selectedIds.length) {
      wx.showToast({ title: "先选一两项也可以。", icon: "none" });
      return;
    }

    const existingItems = getWishItems();
    const existingKeys = new Set(existingItems.map((item) => `${item.type}|${item.title}`));
    const selected = new Set(this.data.selectedIds);
    const now = new Date().toISOString();
    const additions = TEMPLATE_GROUPS
      .flatMap((group) => group.items)
      .filter((item) => selected.has(item.id) && !existingKeys.has(`${item.type}|${item.title}`))
      .map((item) => ({
        id: createId("wish"),
        type: item.type,
        category: item.category,
        source: "resignation_template_1.1",
        title: item.title,
        completed: false,
        createdAt: now,
        completedAt: null
      }));

    if (!additions.length) {
      wx.showToast({ title: "所选事项已在计划里。", icon: "none" });
      this.onShow();
      return;
    }

    saveWishItems(additions.concat(existingItems));
    wx.showToast({ title: `已加入 ${additions.length} 项`, icon: "success" });
    setTimeout(() => wx.navigateBack(), 500);
  }
});
