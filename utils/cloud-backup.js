const { APP_META } = require("./constants");
const {
  collectBackupSnapshot,
  validateBackupSnapshot,
  estimateSnapshotSize
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

module.exports = {
  MAX_SNAPSHOT_BYTES,
  saveCloudBackup,
  getCloudBackupStatus
};
