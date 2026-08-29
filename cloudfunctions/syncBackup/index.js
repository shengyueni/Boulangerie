const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");
const userBackups = db.collection("user_backups");
const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const SCHEMA_VERSION = 1;
const SUPPORTED_ACTIONS = new Set(["saveBackup", "getStatus"]);

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

  if (currentBackup) {
    try {
      await userBackups.doc(currentBackup._id).update({
        data: {
          userId: user._id,
          schemaVersion: SCHEMA_VERSION,
          appVersion,
          snapshot,
          snapshotBytes,
          updatedAt: db.serverDate()
        }
      });
    } catch (error) {
      console.error("syncBackup update failed", safeErrorDetails(error));
      return { ok: false, code: "BACKUP_UPDATE_FAILED", message: "云备份更新失败。" };
    }

    return {
      ok: true,
      backup: {
        backupId: currentBackup._id,
        created: false,
        updatedAt: responseUpdatedAt,
        snapshotBytes,
        duplicateBackupCount
      }
    };
  }

  try {
    const createdBackup = await userBackups.add({
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

    return {
      ok: true,
      backup: {
        backupId: createdBackup._id,
        created: true,
        updatedAt: responseUpdatedAt,
        snapshotBytes,
        duplicateBackupCount: 0
      }
    };
  } catch (error) {
    console.error("syncBackup creation failed", safeErrorDetails(error));
    return { ok: false, code: "BACKUP_CREATE_FAILED", message: "云备份创建失败。" };
  }
}

async function getStatus(openid) {
  const backupQuery = await findBackups(openid, "BACKUP_STATUS_FAILED");
  if (!backupQuery.ok) return backupQuery;

  const duplicateBackupCount = reportDuplicates(backupQuery.backups);
  const currentBackup = backupQuery.backups[0];
  if (!currentBackup) {
    return { ok: true, exists: false, backup: null };
  }

  return {
    ok: true,
    exists: true,
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

  if (event.action === "saveBackup") {
    return saveBackup(event, openid, userResult.user);
  }
  return getStatus(openid);
};
