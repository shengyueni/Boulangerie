const { APP_META } = require("./constants");
const {
  collectBackupSnapshot,
  validateBackupSnapshot,
  estimateSnapshotSize,
  restoreBackupSnapshot
} = require("./backup-snapshot");

const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const FUNCTION_NAME = "syncBackup";

function createFailure(code, message, extra = {}) {
  return {
    ok: false,
    code,
    message,
    ...extra
  };
}

function canCallCloudFunction() {
  return !!wx.cloud && typeof wx.cloud.callFunction === "function";
}

function normalizeCloudError(error) {
  return createFailure(
    error && error.errCode ? error.errCode : "CLOUD_CALL_FAILED",
    error && error.errMsg
      ? error.errMsg
      : (error && error.message ? error.message : "云备份调用失败。")
  );
}

async function saveCloudBackup() {
  let snapshot;
  try {
    snapshot = collectBackupSnapshot();
  } catch (error) {
    return createFailure(
      "INVALID_LOCAL_SNAPSHOT",
      error && error.message ? error.message : "无法生成本地 Snapshot。"
    );
  }

  const validation = validateBackupSnapshot(snapshot);
  if (!validation.valid) {
    return createFailure("INVALID_LOCAL_SNAPSHOT", validation.error || "本地 Snapshot 无效。");
  }

  const size = estimateSnapshotSize(snapshot);
  if (size.error || !Number.isInteger(size.estimatedBytes)) {
    return createFailure("INVALID_LOCAL_SNAPSHOT", size.error || "无法估算 Snapshot 大小。");
  }
  if (size.estimatedBytes > MAX_SNAPSHOT_BYTES) {
    return createFailure("SNAPSHOT_TOO_LARGE", "Snapshot 超过上传上限。", {
      estimatedBytes: size.estimatedBytes
    });
  }

  if (!canCallCloudFunction()) {
    return createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。");
  }

  try {
    const response = await wx.cloud.callFunction({
      name: FUNCTION_NAME,
      data: {
        action: "saveBackup",
        snapshot,
        estimatedBytes: size.estimatedBytes,
        appVersion: APP_META.version
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true || !result.backup) {
      return createFailure(
        result && result.code ? result.code : "CLOUD_BACKUP_FAILED",
        result && result.message ? result.message : "云备份保存失败。",
        result && Number.isInteger(result.estimatedBytes)
          ? { estimatedBytes: result.estimatedBytes }
          : {}
      );
    }

    return {
      ok: true,
      backup: {
        backupId: result.backup.backupId,
        created: !!result.backup.created,
        updatedAt: result.backup.updatedAt,
        snapshotBytes: result.backup.snapshotBytes,
        duplicateBackupCount: Number(result.backup.duplicateBackupCount || 0)
      }
    };
  } catch (error) {
    return normalizeCloudError(error);
  }
}

async function getCloudBackupStatus() {
  if (!canCallCloudFunction()) {
    return createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。");
  }

  try {
    const response = await wx.cloud.callFunction({
      name: FUNCTION_NAME,
      data: {
        action: "getStatus"
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true) {
      return createFailure(
        result && result.code ? result.code : "BACKUP_STATUS_FAILED",
        result && result.message ? result.message : "云备份状态查询失败。"
      );
    }

    return {
      ok: true,
      exists: !!result.exists,
      backup: result.backup ? {
        backupId: result.backup.backupId,
        schemaVersion: result.backup.schemaVersion,
        appVersion: result.backup.appVersion,
        snapshotBytes: result.backup.snapshotBytes,
        createdAt: result.backup.createdAt,
        updatedAt: result.backup.updatedAt,
        duplicateBackupCount: Number(result.backup.duplicateBackupCount || 0)
      } : null
    };
  } catch (error) {
    return normalizeCloudError(error);
  }
}

async function getCloudBackupPreference() {
  if (!canCallCloudFunction()) {
    return createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。");
  }

  try {
    const response = await wx.cloud.callFunction({
      name: FUNCTION_NAME,
      data: {
        action: "getPreference"
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true) {
      return createFailure(
        result && result.code ? result.code : "PREFERENCE_QUERY_FAILED",
        result && result.message ? result.message : "云备份偏好读取失败。"
      );
    }

    const mode = result.mode === "enabled" || result.mode === "disabled"
      ? result.mode
      : "unconfigured";
    return {
      ok: true,
      mode,
      consentVersion: mode === "unconfigured" ? null : (result.consentVersion || null),
      consentUpdatedAt: mode === "unconfigured" ? null : (result.consentUpdatedAt || null)
    };
  } catch (error) {
    return normalizeCloudError(error);
  }
}

async function setCloudBackupPreference(mode) {
  if (mode !== "enabled" && mode !== "disabled") {
    return createFailure("INVALID_PREFERENCE_MODE", "云备份偏好只能是 enabled 或 disabled。");
  }
  if (!canCallCloudFunction()) {
    return createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。");
  }

  try {
    const response = await wx.cloud.callFunction({
      name: FUNCTION_NAME,
      data: {
        action: "setPreference",
        mode
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true) {
      return createFailure(
        result && result.code ? result.code : "PREFERENCE_UPDATE_FAILED",
        result && result.message ? result.message : "云备份偏好保存失败。"
      );
    }

    return {
      ok: true,
      mode: result.mode,
      consentVersion: result.consentVersion,
      consentUpdatedAt: result.consentUpdatedAt
    };
  } catch (error) {
    return normalizeCloudError(error);
  }
}

async function downloadCloudBackup() {
  if (!canCallCloudFunction()) {
    return createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。");
  }

  try {
    const response = await wx.cloud.callFunction({
      name: FUNCTION_NAME,
      data: {
        action: "getBackup"
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true) {
      return createFailure(
        result && result.code ? result.code : "BACKUP_DOWNLOAD_FAILED",
        result && result.message ? result.message : "云备份下载失败。",
        result && Number.isInteger(result.estimatedBytes)
          ? { estimatedBytes: result.estimatedBytes }
          : {}
      );
    }
    if (!result.exists) {
      return { ok: true, exists: false, backup: null };
    }

    const backup = result.backup;
    const snapshot = backup && backup.snapshot;
    const validation = validateBackupSnapshot(snapshot);
    if (!validation.valid) {
      return createFailure(
        "INVALID_DOWNLOADED_SNAPSHOT",
        validation.error || "下载的 Snapshot 无效。"
      );
    }

    const size = estimateSnapshotSize(snapshot);
    if (size.error || !Number.isInteger(size.estimatedBytes)) {
      return createFailure(
        "INVALID_DOWNLOADED_SNAPSHOT",
        size.error || "无法估算下载 Snapshot 的大小。"
      );
    }
    if (size.estimatedBytes > MAX_SNAPSHOT_BYTES) {
      return createFailure(
        "DOWNLOADED_SNAPSHOT_TOO_LARGE",
        "下载的 Snapshot 超过恢复上限。",
        { estimatedBytes: size.estimatedBytes }
      );
    }

    return {
      ok: true,
      exists: true,
      backup: {
        backupId: backup.backupId,
        schemaVersion: backup.schemaVersion,
        appVersion: backup.appVersion,
        snapshotBytes: size.estimatedBytes,
        createdAt: backup.createdAt,
        updatedAt: backup.updatedAt,
        duplicateBackupCount: Number(backup.duplicateBackupCount || 0),
        snapshot
      }
    };
  } catch (error) {
    return normalizeCloudError(error);
  }
}

function hasMeaningfulLocalData(snapshot) {
  const validation = validateBackupSnapshot(snapshot);
  if (!validation.valid) return false;

  const payload = snapshot.payload;
  const escapePlan = payload.escapePlan;
  const hasDefaultWishState = escapePlan.defaultItemStates.some((item) => {
    return !!item && (!!item.completed || !!item.completedAt);
  });

  return payload.diaryEntries.length > 0
    || escapePlan.userItems.length > 0
    || hasDefaultWishState
    || payload.localVoicePosts.length > 0
    || payload.customEmergencyCards.length > 0;
}

function jsonEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function snapshotsSemanticallyEquivalent(source, restored, ignoredDefaultStateCount) {
  if (!validateBackupSnapshot(source).valid || !validateBackupSnapshot(restored).valid) return false;

  const sourcePayload = source.payload;
  const restoredPayload = restored.payload;
  if (!jsonEqual(sourcePayload.diaryEntries, restoredPayload.diaryEntries)) return false;
  if (!jsonEqual(sourcePayload.localVoicePosts, restoredPayload.localVoicePosts)) return false;
  if (!jsonEqual(sourcePayload.customEmergencyCards, restoredPayload.customEmergencyCards)) return false;
  if (!jsonEqual(sourcePayload.escapePlan.userItems, restoredPayload.escapePlan.userItems)) return false;

  const restoredStates = new Map(
    restoredPayload.escapePlan.defaultItemStates.map((item) => [item && item.id, item])
  );
  let ignoredStates = 0;
  const matched = sourcePayload.escapePlan.defaultItemStates.every((sourceState) => {
    const restoredState = sourceState && restoredStates.get(sourceState.id);
    if (!restoredState) {
      ignoredStates += 1;
      return true;
    }
    return !!sourceState.completed === !!restoredState.completed
      && (sourceState.completedAt || null) === (restoredState.completedAt || null);
  });

  return matched && ignoredStates === Number(ignoredDefaultStateCount || 0);
}

function rollbackLocalSnapshot(preRestoreSnapshot) {
  try {
    const rollbackResult = restoreBackupSnapshot(preRestoreSnapshot);
    if (!rollbackResult || rollbackResult.success !== true) return false;

    const rollbackSnapshot = collectBackupSnapshot();
    return validateBackupSnapshot(rollbackSnapshot).valid
      && snapshotsSemanticallyEquivalent(
        preRestoreSnapshot,
        rollbackSnapshot,
        rollbackResult.ignoredDefaultStateCount
      );
  } catch (error) {
    return false;
  }
}

async function restoreCloudBackup(options = {}) {
  const downloaded = await downloadCloudBackup();
  if (!downloaded.ok) return downloaded;
  if (!downloaded.exists || !downloaded.backup) {
    return createFailure("CLOUD_BACKUP_NOT_FOUND", "当前微信用户没有可恢复的云备份。");
  }

  let preRestoreSnapshot;
  try {
    preRestoreSnapshot = collectBackupSnapshot();
  } catch (error) {
    return createFailure(
      "LOCAL_SNAPSHOT_FAILED",
      error && error.message ? error.message : "无法生成恢复前的本地 Snapshot。"
    );
  }

  const preRestoreValidation = validateBackupSnapshot(preRestoreSnapshot);
  if (!preRestoreValidation.valid) {
    return createFailure(
      "LOCAL_SNAPSHOT_FAILED",
      preRestoreValidation.error || "恢复前的本地 Snapshot 无效。"
    );
  }

  const force = !!options && options.force === true;
  if (hasMeaningfulLocalData(preRestoreSnapshot) && !force) {
    return createFailure("LOCAL_DATA_EXISTS", "本地已有 Malo 核心数据，必须显式 force 才能覆盖。");
  }

  let restoreResult;
  let restoreSucceeded = false;
  try {
    restoreResult = restoreBackupSnapshot(downloaded.backup.snapshot);
    if (!restoreResult || restoreResult.success !== true) {
      throw new Error("Snapshot restore returned a failure result.");
    }

    const postRestoreSnapshot = collectBackupSnapshot();
    restoreSucceeded = validateBackupSnapshot(postRestoreSnapshot).valid
      && snapshotsSemanticallyEquivalent(
        downloaded.backup.snapshot,
        postRestoreSnapshot,
        restoreResult.ignoredDefaultStateCount
      );
  } catch (error) {
    restoreSucceeded = false;
  }

  if (!restoreSucceeded) {
    const rolledBack = rollbackLocalSnapshot(preRestoreSnapshot);
    return createFailure(
      rolledBack ? "RESTORE_FAILED_ROLLED_BACK" : "RESTORE_FAILED_ROLLBACK_FAILED",
      rolledBack ? "云备份恢复失败，本地数据已回滚。" : "云备份恢复和本地回滚均失败。"
    );
  }

  return {
    ok: true,
    restored: true,
    backup: {
      backupId: downloaded.backup.backupId,
      appVersion: downloaded.backup.appVersion,
      schemaVersion: downloaded.backup.schemaVersion,
      snapshotBytes: downloaded.backup.snapshotBytes,
      updatedAt: downloaded.backup.updatedAt
    },
    restore: {
      ignoredDefaultStateCount: Number(restoreResult.ignoredDefaultStateCount || 0)
    }
  };
}

module.exports = {
  MAX_SNAPSHOT_BYTES,
  saveCloudBackup,
  getCloudBackupStatus,
  getCloudBackupPreference,
  setCloudBackupPreference,
  downloadCloudBackup,
  restoreCloudBackup,
  hasMeaningfulLocalData,
  snapshotsSemanticallyEquivalent
};
