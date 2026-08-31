const assert = require("assert");
const Module = require("module");
const path = require("path");

function createWxMock() {
  const storage = new Map();
  return {
    storage,
    api: {
      getStorageSync(key) {
        return storage.get(key);
      },
      setStorageSync(key, value) {
        storage.set(key, value);
      },
      removeStorageSync(key) {
        storage.delete(key);
      }
    }
  };
}

function meaningfulSnapshot() {
  return {
    schemaVersion: 1,
    payload: {
      diaryEntries: [{ id: "diary_local" }],
      escapePlan: { userItems: [{ id: "wish_local" }], defaultItemStates: [] },
      localVoicePosts: [{ id: "voice_local" }],
      customEmergencyCards: [{ id: "card_local" }]
    }
  };
}

function emptySnapshot() {
  return {
    schemaVersion: 1,
    payload: {
      diaryEntries: [],
      escapePlan: { userItems: [], defaultItemStates: [] },
      localVoicePosts: [],
      customEmergencyCards: []
    }
  };
}

function loadLifecycle(cloudBackupStub, snapshot) {
  const lifecyclePath = path.resolve(__dirname, "../utils/cloud-backup-lifecycle.js");
  delete require.cache[lifecyclePath];
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (parent && parent.filename === lifecyclePath && request === "./cloud-backup") {
      return cloudBackupStub;
    }
    if (parent && parent.filename === lifecyclePath && request === "./backup-snapshot") {
      return { collectBackupSnapshot: () => snapshot };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  const lifecycle = require(lifecyclePath);
  Module._load = originalLoad;
  return lifecycle;
}

function createCloudBackupStub(initialMode = "enabled") {
  const server = {
    mode: initialMode,
    exists: initialMode === "enabled",
    saveCalls: 0,
    deleteCalls: 0,
    restoreCalls: 0,
    lastSnapshot: null
  };
  return {
    server,
    async getCloudBackupPreference() {
      return { ok: true, mode: server.mode };
    },
    async setCloudBackupPreference(mode) {
      server.mode = mode;
      return { ok: true, mode };
    },
    async getCloudBackupStatus() {
      return {
        ok: true,
        exists: server.exists,
        backupEnabled: server.mode === "enabled",
        mode: server.mode,
        backup: server.exists ? { updatedAt: "2026-08-31T10:00:00.000Z" } : null
      };
    },
    async saveCloudBackup() {
      server.saveCalls += 1;
      if (server.mode !== "enabled") {
        return { ok: false, code: "BACKUP_DISABLED", message: "disabled" };
      }
      server.exists = true;
      return { ok: true, backup: { updatedAt: "2026-08-31T10:01:00.000Z" } };
    },
    async deleteCloudBackup() {
      server.deleteCalls += 1;
      server.mode = "disabled";
      const deleted = server.exists;
      server.exists = false;
      return {
        ok: true,
        deleted,
        deletedCount: deleted ? 1 : 0,
        backupEnabled: false,
        mode: "disabled"
      };
    },
    async restoreCloudBackup() {
      server.restoreCalls += 1;
      if (!server.exists) return { ok: false, code: "CLOUD_BACKUP_NOT_FOUND" };
      return { ok: true, restored: true };
    },
    hasMeaningfulLocalData(snapshot) {
      return snapshot.payload.diaryEntries.length > 0
        || snapshot.payload.escapePlan.userItems.length > 0
        || snapshot.payload.localVoicePosts.length > 0
        || snapshot.payload.customEmergencyCards.length > 0;
    }
  };
}

async function testDeleteAndReEnable() {
  const wxMock = createWxMock();
  global.wx = wxMock.api;
  const cloudBackupStub = createCloudBackupStub("enabled");
  const localSnapshot = meaningfulSnapshot();
  const localBefore = JSON.stringify(localSnapshot);
  const lifecycle = loadLifecycle(cloudBackupStub, localSnapshot);

  wxMock.storage.set(lifecycle.RECOVERY_SUPPRESSION_KEY, true);
  await lifecycle.initializeCloudBackupLifecycle();
  assert.equal(lifecycle.getLifecycleState().recoverySuppressed, true);

  const deleted = await lifecycle.deleteCloudBackupData();
  assert.equal(deleted.ok, true);
  assert.equal(cloudBackupStub.server.mode, "disabled");
  assert.equal(cloudBackupStub.server.exists, false);
  assert.equal(lifecycle.getLifecycleState().preference, "disabled");
  assert.equal(lifecycle.getLifecycleState().backupExists, false);
  assert.equal(lifecycle.getLifecycleState().recoverySuppressed, false);
  assert.equal(wxMock.storage.has(lifecycle.RECOVERY_SUPPRESSION_KEY), false);
  assert.equal(JSON.stringify(localSnapshot), localBefore);

  const saveCountAfterDelete = cloudBackupStub.server.saveCalls;
  const hidden = await lifecycle.handleAppHide();
  assert.equal(hidden.ok, false);
  assert.equal(hidden.code, "BACKUP_NOT_ENABLED");
  assert.equal(cloudBackupStub.server.saveCalls, saveCountAfterDelete);

  const enabled = await lifecycle.setCloudBackupMode("enabled");
  assert.equal(enabled.ok, true);
  assert.equal(enabled.recovery.outcome, "local_present");
  assert.equal(enabled.initialBackup.ok, true);
  assert.equal(cloudBackupStub.server.mode, "enabled");
  assert.equal(cloudBackupStub.server.exists, true);
  assert.equal(lifecycle.getLifecycleState().backupExists, true);

  const refreshed = await lifecycle.refreshCloudBackupStatus();
  assert.equal(refreshed.ok, true);
  assert.equal(lifecycle.getLifecycleState().lastBackupAt, "2026-08-31T10:00:00.000Z");
}

async function testDeleteBlocksNewLocalBackup() {
  const wxMock = createWxMock();
  global.wx = wxMock.api;
  const cloudBackupStub = createCloudBackupStub("enabled");
  let resolveDelete;
  cloudBackupStub.deleteCloudBackup = async () => {
    cloudBackupStub.server.deleteCalls += 1;
    await new Promise((resolve) => {
      resolveDelete = resolve;
    });
    cloudBackupStub.server.mode = "disabled";
    cloudBackupStub.server.exists = false;
    return { ok: true, deleted: true, deletedCount: 1, backupEnabled: false, mode: "disabled" };
  };
  const lifecycle = loadLifecycle(cloudBackupStub, meaningfulSnapshot());
  await lifecycle.initializeCloudBackupLifecycle();

  const deleting = lifecycle.deleteCloudBackupData();
  await Promise.resolve();
  const blocked = await lifecycle.handleAppHide();
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, "BACKUP_DELETE_IN_PROGRESS");
  assert.equal(cloudBackupStub.server.saveCalls, 0);
  resolveDelete();
  await deleting;
}

async function testExistingRestoreRules() {
  const wxMock = createWxMock();
  global.wx = wxMock.api;
  const cloudBackupStub = createCloudBackupStub("enabled");
  const lifecycle = loadLifecycle(cloudBackupStub, emptySnapshot());
  const initialized = await lifecycle.initializeCloudBackupLifecycle();
  assert.equal(initialized.ok, true);
  assert.equal(initialized.recovery.outcome, "restored");
  assert.equal(cloudBackupStub.server.restoreCalls, 1);

  lifecycle.markIntentionalLocalClear();
  const blocked = await lifecycle.handleAppHide();
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, "RECOVERY_SUPPRESSED");
}

async function testDeleteRequestContainsNoOwner() {
  const wxMock = createWxMock();
  let requestData = null;
  wxMock.api.cloud = {
    async callFunction(options) {
      requestData = options.data;
      return {
        result: {
          ok: true,
          deleted: true,
          deletedCount: 1,
          backupEnabled: false,
          mode: "disabled"
        }
      };
    }
  };
  global.wx = wxMock.api;
  const cloudBackupPath = path.resolve(__dirname, "../utils/cloud-backup.js");
  delete require.cache[cloudBackupPath];
  const cloudBackup = require(cloudBackupPath);
  const result = await cloudBackup.deleteCloudBackup();
  assert.equal(result.ok, true);
  assert.deepEqual(requestData, { action: "deleteBackup" });
  assert.equal(Object.prototype.hasOwnProperty.call(requestData, "ownerOpenid"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(requestData, "userId"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(requestData, "backupId"), false);
}

async function main() {
  await testDeleteAndReEnable();
  await testDeleteBlocksNewLocalBackup();
  await testExistingRestoreRules();
  await testDeleteRequestContainsNoOwner();
  console.log("cloud-backup-lifecycle-b11: 4 scenarios passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
