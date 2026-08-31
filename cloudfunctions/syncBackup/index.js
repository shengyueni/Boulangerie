const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");
const userBackups = db.collection("user_backups");
const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const SCHEMA_VERSION = 1;
const SUPPORTED_ACTIONS = new Set([
  "saveBackup",
  "deleteBackup",
  "getStatus",
  "getBackup",
  "getPreference",
  "setPreference"
]);
const BACKUP_CONSENT_VERSION = 1;
const TRANSACTION_RETRY_TIMES = 5;
const BACKUP_DELETE_BATCH_SIZE = 100;

function safeErrorDetails(error) {
  return {
    code: error && (error.errCode || error.code) ? (error.errCode || error.code) : "UNKNOWN",
    message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : "Unknown error"
  };
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return false;
  if (snapshot.schemaVersion !== SCHEMA_VERSION) return false;

  const payload = snapshot.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  if (!Array.isArray(payload.diaryEntries)) return false;
  if (!Array.isArray(payload.localVoicePosts)) return false;
  if (!Array.isArray(payload.customEmergencyCards)) return false;

  const escapePlan = payload.escapePlan;
  if (!escapePlan || typeof escapePlan !== "object" || Array.isArray(escapePlan)) return false;
  if (!Array.isArray(escapePlan.userItems)) return false;
  if (!Array.isArray(escapePlan.defaultItemStates)) return false;

  return true;
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

function estimateSnapshotBytes(snapshot) {
  try {
    return utf8ByteLength(JSON.stringify(snapshot));
  } catch (error) {
    return null;
  }
}

function normalizeAppVersion(value) {
  return typeof value === "string" && value.length <= 50 ? value : "unknown";
}

function createBusinessError(code, message) {
  const error = new Error(message);
  error.backupCode = code;
  return error;
}

function getDocumentData(result) {
  if (!result || !result.data) return null;
  if (Array.isArray(result.data)) return result.data[0] || null;
  return result.data;
}

function nextBackupGeneration(user) {
  const current = Number(user && user.backupGeneration);
  return Number.isSafeInteger(current) && current >= 0 ? current + 1 : 1;
}

function normalizeTransactionError(error, fallbackCode, fallbackMessage) {
  if (error && error.backupCode) {
    return { ok: false, code: error.backupCode, message: error.message || fallbackMessage };
  }
  console.error("syncBackup transaction failed", safeErrorDetails(error));
  return { ok: false, code: fallbackCode, message: fallbackMessage };
}

async function findCurrentUser(openid) {
  try {
    const result = await users.where({ openid }).limit(1).get();
    return { ok: true, user: result.data && result.data[0] ? result.data[0] : null };
  } catch (error) {
    console.error("syncBackup user query failed", safeErrorDetails(error));
    return { ok: false, code: "USER_QUERY_FAILED", message: "用户查询失败。" };
  }
}

async function findBackups(openid, errorCode) {
  try {
    const result = await userBackups
      .where({ ownerOpenid: openid })
      .orderBy("updatedAt", "desc")
      .get();
    return { ok: true, backups: Array.isArray(result.data) ? result.data : [] };
  } catch (error) {
    console.error("syncBackup backup query failed", safeErrorDetails(error));
    return { ok: false, code: errorCode, message: "云备份查询失败。" };
  }
}

function reportDuplicates(backups) {
  const duplicateBackupCount = Math.max(0, backups.length - 1);
  if (duplicateBackupCount) {
    console.warn("syncBackup found duplicate backup records", { duplicateBackupCount });
  }
  return duplicateBackupCount;
}

async function saveBackup(event, openid, user) {
  const snapshot = event.snapshot;
  if (!validateSnapshot(snapshot)) {
    return { ok: false, code: "INVALID_SNAPSHOT", message: "Snapshot 结构无效。" };
  }

  const snapshotBytes = estimateSnapshotBytes(snapshot);
  if (!Number.isInteger(snapshotBytes)) {
    return { ok: false, code: "INVALID_SNAPSHOT", message: "Snapshot 无法序列化。" };
  }
  if (snapshotBytes > MAX_SNAPSHOT_BYTES) {
    return {
      ok: false,
      code: "SNAPSHOT_TOO_LARGE",
      message: "Snapshot 超过上传上限。",
      estimatedBytes: snapshotBytes
    };
  }

  const backupQuery = await findBackups(openid, "BACKUP_QUERY_FAILED");
  if (!backupQuery.ok) return backupQuery;

  const duplicateBackupCount = reportDuplicates(backupQuery.backups);
  const currentBackup = backupQuery.backups[0];
  const appVersion = normalizeAppVersion(event.appVersion);
  const responseUpdatedAt = new Date().toISOString();
  const backupId = currentBackup ? currentBackup._id : user._id;
  const created = !currentBackup;
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = transaction.collection("users").doc(user._id);
      const transactionUser = getDocumentData(await userRef.get());
      if (!transactionUser || transactionUser.openid !== openid) {
        throw createBusinessError("USER_NOT_FOUND", "当前微信用户尚未注册。");
      }
      if (transactionUser.backupMode !== "enabled") {
        throw createBusinessError("BACKUP_DISABLED", "云端备份已关闭，不会重新创建备份。");
      }

      await userRef.update({
        data: {
          backupGeneration: nextBackupGeneration(transactionUser)
        }
      });

      const backupRef = transaction.collection("user_backups").doc(backupId);
      if (currentBackup) {
        await backupRef.update({
          data: {
            userId: user._id,
            schemaVersion: SCHEMA_VERSION,
            appVersion,
            snapshot,
            snapshotBytes,
            updatedAt: db.serverDate()
          }
        });
      } else {
        await backupRef.set({
          data: {
            userId: user._id,
            ownerOpenid: openid,
            schemaVersion: SCHEMA_VERSION,
            appVersion,
            snapshot,
            snapshotBytes,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        });
      }
    }, TRANSACTION_RETRY_TIMES);

    return {
      ok: true,
      backup: {
        backupId,
        created,
        updatedAt: responseUpdatedAt,
        snapshotBytes,
        duplicateBackupCount
      }
    };
  } catch (error) {
    return normalizeTransactionError(error, "BACKUP_SAVE_FAILED", "云备份保存失败。");
  }
}

async function getStatus(openid, user) {
  const backupQuery = await findBackups(openid, "BACKUP_STATUS_FAILED");
  if (!backupQuery.ok) return backupQuery;

  const duplicateBackupCount = reportDuplicates(backupQuery.backups);
  const currentBackup = backupQuery.backups[0];
  if (!currentBackup) {
    return {
      ok: true,
      exists: false,
      backupEnabled: user.backupMode === "enabled",
      mode: getPreference(user).mode,
      backup: null
    };
  }

  return {
    ok: true,
    exists: true,
    backupEnabled: user.backupMode === "enabled",
    mode: getPreference(user).mode,
    backup: {
      backupId: currentBackup._id,
      schemaVersion: currentBackup.schemaVersion,
      appVersion: currentBackup.appVersion,
      snapshotBytes: currentBackup.snapshotBytes,
      createdAt: currentBackup.createdAt,
      updatedAt: currentBackup.updatedAt,
      duplicateBackupCount
    }
  };
}

async function getBackup(openid) {
  const backupQuery = await findBackups(openid, "BACKUP_QUERY_FAILED");
  if (!backupQuery.ok) return backupQuery;

  const duplicateBackupCount = reportDuplicates(backupQuery.backups);
  const currentBackup = backupQuery.backups[0];
  if (!currentBackup) {
    return { ok: true, exists: false, backup: null };
  }

  if (!validateSnapshot(currentBackup.snapshot)) {
    return {
      ok: false,
      code: "INVALID_CLOUD_SNAPSHOT",
      message: "云端 Snapshot 结构无效。"
    };
  }

  const snapshotBytes = estimateSnapshotBytes(currentBackup.snapshot);
  if (!Number.isInteger(snapshotBytes)) {
    return {
      ok: false,
      code: "INVALID_CLOUD_SNAPSHOT",
      message: "云端 Snapshot 无法序列化。"
    };
  }
  if (snapshotBytes > MAX_SNAPSHOT_BYTES) {
    return {
      ok: false,
      code: "CLOUD_SNAPSHOT_TOO_LARGE",
      message: "云端 Snapshot 超过下载上限。",
      estimatedBytes: snapshotBytes
    };
  }

  return {
    ok: true,
    exists: true,
    backup: {
      backupId: currentBackup._id,
      schemaVersion: currentBackup.snapshot.schemaVersion,
      appVersion: currentBackup.appVersion,
      snapshotBytes,
      createdAt: currentBackup.createdAt,
      updatedAt: currentBackup.updatedAt,
      duplicateBackupCount,
      snapshot: currentBackup.snapshot
    }
  };
}

function getPreference(user) {
  const mode = user.backupMode === "enabled" || user.backupMode === "disabled"
    ? user.backupMode
    : "unconfigured";
  return {
    ok: true,
    mode,
    consentVersion: mode === "unconfigured" ? null : (user.backupConsentVersion || null),
    consentUpdatedAt: mode === "unconfigured" ? null : (user.backupConsentUpdatedAt || null)
  };
}

async function setPreference(event, user) {
  if (event.mode !== "enabled" && event.mode !== "disabled") {
    return {
      ok: false,
      code: "INVALID_PREFERENCE_MODE",
      message: "不支持的云备份偏好。"
    };
  }

  const responseUpdatedAt = new Date().toISOString();
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = transaction.collection("users").doc(user._id);
      const transactionUser = getDocumentData(await userRef.get());
      if (!transactionUser) {
        throw createBusinessError("USER_NOT_FOUND", "当前微信用户尚未注册。");
      }
      await userRef.update({
        data: {
          backupMode: event.mode,
          backupGeneration: nextBackupGeneration(transactionUser),
          backupConsentVersion: BACKUP_CONSENT_VERSION,
          backupConsentUpdatedAt: db.serverDate()
        }
      });
    }, TRANSACTION_RETRY_TIMES);
  } catch (error) {
    return normalizeTransactionError(error, "PREFERENCE_UPDATE_FAILED", "云备份偏好保存失败。");
  }

  return {
    ok: true,
    mode: event.mode,
    consentVersion: BACKUP_CONSENT_VERSION,
    consentUpdatedAt: responseUpdatedAt
  };
}

async function disableBackupWithFence(openid, user) {
  const responseUpdatedAt = new Date().toISOString();
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = transaction.collection("users").doc(user._id);
      const transactionUser = getDocumentData(await userRef.get());
      if (!transactionUser || transactionUser.openid !== openid) {
        throw createBusinessError("USER_NOT_FOUND", "当前微信用户尚未注册。");
      }
      await userRef.update({
        data: {
          backupMode: "disabled",
          backupGeneration: nextBackupGeneration(transactionUser),
          backupConsentVersion: BACKUP_CONSENT_VERSION,
          backupConsentUpdatedAt: db.serverDate()
        }
      });
    }, TRANSACTION_RETRY_TIMES);
  } catch (error) {
    return normalizeTransactionError(error, "BACKUP_DISABLE_FAILED", "无法安全关闭云端备份。");
  }

  return { ok: true, consentUpdatedAt: responseUpdatedAt };
}

async function deleteAllBackups(openid) {
  let deletedCount = 0;
  try {
    while (true) {
      const result = await userBackups
        .where({ ownerOpenid: openid })
        .limit(BACKUP_DELETE_BATCH_SIZE)
        .get();
      const backups = Array.isArray(result.data) ? result.data : [];
      if (!backups.length) break;

      for (const backup of backups) {
        if (!backup || !backup._id) continue;
        await userBackups.doc(backup._id).remove();
        deletedCount += 1;
      }
    }

    const verification = await userBackups
      .where({ ownerOpenid: openid })
      .limit(1)
      .get();
    if (Array.isArray(verification.data) && verification.data.length) {
      return {
        ok: false,
        code: "BACKUP_DELETE_PARTIAL",
        message: "云端备份未能全部删除，请重试。",
        deletedCount
      };
    }
    return { ok: true, deletedCount };
  } catch (error) {
    console.error("syncBackup delete failed", safeErrorDetails(error));
    return {
      ok: false,
      code: "BACKUP_DELETE_FAILED",
      message: "云端备份删除未完成，请重试。",
      deletedCount
    };
  }
}

async function deleteBackup(openid, user) {
  const disabled = await disableBackupWithFence(openid, user);
  if (!disabled.ok) return disabled;

  const deletion = await deleteAllBackups(openid);
  if (!deletion.ok) {
    return {
      ...deletion,
      backupEnabled: false,
      mode: "disabled"
    };
  }

  return {
    ok: true,
    deleted: deletion.deletedCount > 0,
    deletedCount: deletion.deletedCount,
    backupEnabled: false,
    mode: "disabled",
    consentVersion: BACKUP_CONSENT_VERSION,
    consentUpdatedAt: disabled.consentUpdatedAt
  };
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext && wxContext.OPENID;
  if (!openid) {
    return { ok: false, code: "OPENID_UNAVAILABLE", message: "无法取得可信微信身份。" };
  }

  if (!SUPPORTED_ACTIONS.has(event.action)) {
    return { ok: false, code: "INVALID_ACTION", message: "不支持的云备份操作。" };
  }

  const userResult = await findCurrentUser(openid);
  if (!userResult.ok) return userResult;
  if (!userResult.user) {
    return { ok: false, code: "USER_NOT_FOUND", message: "当前微信用户尚未注册。" };
  }

  if (event.action === "getBackup" && userResult.user.backupMode !== "enabled") {
    return { ok: false, code: "BACKUP_NOT_ENABLED", message: "当前用户尚未开启云备份。" };
  }

  if (event.action === "saveBackup") {
    return saveBackup(event, openid, userResult.user);
  }
  if (event.action === "getStatus") {
    return getStatus(openid, userResult.user);
  }
  if (event.action === "getBackup") {
    return getBackup(openid);
  }
  if (event.action === "getPreference") {
    return getPreference(userResult.user);
  }
  if (event.action === "deleteBackup") {
    return deleteBackup(openid, userResult.user);
  }
  return setPreference(event, userResult.user);
};
