const {
  getRawDiaryEntries,
  getWishItems,
  createDefaultWishItems
} = require("./storage");

const SCHEMA_VERSION = 1;
const WISH_KEY = "malo_wish_items";
const DIARY_KEY = "malo_diary_entries";
const LOCAL_VOICE_KEY = "malo_local_voice_posts";
const CUSTOM_EMERGENCY_CARDS_KEY = "malo_custom_emergency_cards";
const DEFAULT_WISH_SOURCE = "default_0.3B";

function cloneJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function getStorageArray(key) {
  const value = wx.getStorageSync(key);
  return Array.isArray(value) ? cloneJsonValue(value) : [];
}

function isSystemDefaultWishItem(item) {
  return !!item && item.source === DEFAULT_WISH_SOURCE;
}

function normalizeWishItems(items) {
  const sourceItems = Array.isArray(items) ? items : [];
  return {
    userItems: cloneJsonValue(sourceItems.filter((item) => !isSystemDefaultWishItem(item))),
    defaultItemStates: sourceItems
      .filter(isSystemDefaultWishItem)
      .map((item) => ({
        id: item.id,
        completed: !!item.completed,
        completedAt: item.completedAt || null
      }))
  };
}

function collectBackupSnapshot() {
  return {
    schemaVersion: SCHEMA_VERSION,
    payload: {
      diaryEntries: cloneJsonValue(getRawDiaryEntries()),
      escapePlan: normalizeWishItems(getWishItems()),
      localVoicePosts: getStorageArray(LOCAL_VOICE_KEY),
      customEmergencyCards: getStorageArray(CUSTOM_EMERGENCY_CARDS_KEY)
    }
  };
}

function validateBackupSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return { valid: false, error: "Snapshot must be an object." };
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    return { valid: false, error: "Unsupported snapshot schemaVersion." };
  }

  const payload = snapshot.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, error: "Snapshot payload must be an object." };
  }
  if (!payload.escapePlan || typeof payload.escapePlan !== "object" || Array.isArray(payload.escapePlan)) {
    return { valid: false, error: "Snapshot escapePlan must be an object." };
  }

  const requiredArrays = [
    ["diaryEntries", payload.diaryEntries],
    ["localVoicePosts", payload.localVoicePosts],
    ["customEmergencyCards", payload.customEmergencyCards],
    ["escapePlan.userItems", payload.escapePlan.userItems],
    ["escapePlan.defaultItemStates", payload.escapePlan.defaultItemStates]
  ];
  const invalidField = requiredArrays.find((item) => !Array.isArray(item[1]));
  if (invalidField) {
    return { valid: false, error: invalidField[0] + " must be an array." };
  }

  return { valid: true, error: null };
}

function buildRestoredWishItems(escapePlan) {
  const defaults = createDefaultWishItems();
  const defaultIds = new Set(defaults.map((item) => item.id));
  const knownStates = new Map();
  let ignoredDefaultStateCount = 0;

  escapePlan.defaultItemStates.forEach((state) => {
    if (!state || !defaultIds.has(state.id)) {
      ignoredDefaultStateCount += 1;
      return;
    }
    knownStates.set(state.id, state);
  });

  const restoredDefaults = defaults.map((item) => {
    const state = knownStates.get(item.id);
    if (!state) return item;
    return {
      ...item,
      completed: !!state.completed,
      completedAt: state.completedAt || null
    };
  });

  return {
    items: restoredDefaults.concat(cloneJsonValue(escapePlan.userItems)),
    ignoredDefaultStateCount
  };
}

function restoreBackupSnapshot(snapshot) {
  const validation = validateBackupSnapshot(snapshot);
  if (!validation.valid) {
    return { success: false, error: validation.error, ignoredDefaultStateCount: 0 };
  }

  const payload = snapshot.payload;
  const restoredWish = buildRestoredWishItems(payload.escapePlan);

  try {
    wx.setStorageSync(DIARY_KEY, cloneJsonValue(payload.diaryEntries));
    wx.setStorageSync(WISH_KEY, restoredWish.items);
    wx.setStorageSync(LOCAL_VOICE_KEY, cloneJsonValue(payload.localVoicePosts));
    wx.setStorageSync(CUSTOM_EMERGENCY_CARDS_KEY, cloneJsonValue(payload.customEmergencyCards));
  } catch (error) {
    return {
      success: false,
      error: error && error.message ? error.message : "Snapshot restore failed.",
      ignoredDefaultStateCount: restoredWish.ignoredDefaultStateCount
    };
  }

  return {
    success: true,
    error: null,
    ignoredDefaultStateCount: restoredWish.ignoredDefaultStateCount
  };
}

function utf8ByteLength(value) {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index);
    if (codePoint <= 0x7f) bytes += 1;
    else if (codePoint <= 0x7ff) bytes += 2;
    else if (codePoint <= 0xffff) bytes += 3;
    else {
      bytes += 4;
      index += 1;
    }
  }
  return bytes;
}

function estimateSnapshotSize(snapshot) {
  try {
    return { estimatedBytes: utf8ByteLength(JSON.stringify(snapshot)), error: null };
  } catch (error) {
    return {
      estimatedBytes: null,
      error: error && error.message ? error.message : "Snapshot serialization failed."
    };
  }
}

module.exports = {
  SCHEMA_VERSION,
  isSystemDefaultWishItem,
  normalizeWishItems,
  collectBackupSnapshot,
  validateBackupSnapshot,
  restoreBackupSnapshot,
  estimateSnapshotSize
};
