const assert = require("assert");
const Module = require("module");
const path = require("path");

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function createDatabaseMock() {
  const state = {
    users: new Map(),
    user_backups: new Map()
  };
  const versions = {
    users: new Map(),
    user_backups: new Map()
  };
  let pauseNextSaveCommit = false;
  let pausedSaveResolve;
  let releaseSaveResolve;

  function version(collectionName, id) {
    return versions[collectionName].get(id) || 0;
  }

  function bumpVersion(collectionName, id) {
    versions[collectionName].set(id, version(collectionName, id) + 1);
  }

  function query(collectionName, filter = {}, limitCount = Infinity, sort = null) {
    let documents = Array.from(state[collectionName].values())
      .filter((document) => Object.entries(filter).every(([key, value]) => document[key] === value))
      .map(clone);
    if (sort) {
      const direction = sort.direction === "desc" ? -1 : 1;
      documents.sort((left, right) => {
        return String(left[sort.field] || "").localeCompare(String(right[sort.field] || "")) * direction;
      });
    }
    return documents.slice(0, limitCount);
  }

  function makeQuery(collectionName, filter) {
    let limitCount = Infinity;
    let sort = null;
    return {
      limit(value) {
        limitCount = value;
        return this;
      },
      orderBy(field, direction) {
        sort = { field, direction };
        return this;
      },
      async get() {
        return { data: query(collectionName, filter, limitCount, sort) };
      }
    };
  }

  function makeDirectDocument(collectionName, id) {
    return {
      async get() {
        return { data: clone(state[collectionName].get(id) || null) };
      },
      async update({ data }) {
        const current = state[collectionName].get(id);
        if (!current) throw new Error(`missing ${collectionName}/${id}`);
        state[collectionName].set(id, { ...current, ...clone(data), _id: id });
        bumpVersion(collectionName, id);
      },
      async set({ data }) {
        state[collectionName].set(id, { ...clone(data), _id: id });
        bumpVersion(collectionName, id);
      },
      async remove() {
        state[collectionName].delete(id);
        bumpVersion(collectionName, id);
      }
    };
  }

  function collection(collectionName) {
    return {
      where(filter) {
        return makeQuery(collectionName, filter);
      },
      doc(id) {
        return makeDirectDocument(collectionName, id);
      }
    };
  }

  function createTransaction() {
    const snapshots = {
      users: new Map(Array.from(state.users, ([id, value]) => [id, clone(value)])),
      user_backups: new Map(Array.from(state.user_backups, ([id, value]) => [id, clone(value)]))
    };
    const baseVersions = {
      users: new Map(),
      user_backups: new Map()
    };
    const writes = [];

    function transactionDocument(collectionName, id) {
      if (!baseVersions[collectionName].has(id)) {
        baseVersions[collectionName].set(id, version(collectionName, id));
      }
      return {
        async get() {
          return { data: clone(snapshots[collectionName].get(id) || null) };
        },
        async update({ data }) {
          if (!snapshots[collectionName].has(id)) throw new Error(`missing ${collectionName}/${id}`);
          writes.push({ type: "update", collectionName, id, data: clone(data) });
        },
        async set({ data }) {
          writes.push({ type: "set", collectionName, id, data: clone(data) });
        },
        async delete() {
          writes.push({ type: "delete", collectionName, id });
        }
      };
    }

    return {
      api: {
        collection(collectionName) {
          return {
            doc(id) {
              return transactionDocument(collectionName, id);
            }
          };
        }
      },
      writes,
      baseVersions
    };
  }

  async function maybePauseSave(transaction) {
    const writesBackup = transaction.writes.some((write) => write.collectionName === "user_backups");
    const keepsEnabled = transaction.writes.some((write) => {
      return write.collectionName === "users" && (!write.data || write.data.backupMode !== "disabled");
    });
    if (!pauseNextSaveCommit || !writesBackup || !keepsEnabled) return;
    pauseNextSaveCommit = false;
    await new Promise((resolve) => {
      releaseSaveResolve = resolve;
      if (pausedSaveResolve) pausedSaveResolve();
    });
  }

  async function runTransaction(callback, retryTimes = 3) {
    let lastConflict = null;
    for (let attempt = 0; attempt < retryTimes; attempt += 1) {
      const transaction = createTransaction();
      const callbackResult = await callback(transaction.api);
      await maybePauseSave(transaction);

      const conflicted = Object.entries(transaction.baseVersions).some(([collectionName, documentVersions]) => {
        return Array.from(documentVersions).some(([id, baseVersion]) => {
          return version(collectionName, id) !== baseVersion;
        });
      });
      if (conflicted) {
        lastConflict = new Error("DATABASE_TRANSACTION_CONFLICT");
        lastConflict.code = "DATABASE_TRANSACTION_CONFLICT";
        continue;
      }

      for (const write of transaction.writes) {
        if (write.type === "delete") {
          state[write.collectionName].delete(write.id);
        } else if (write.type === "set") {
          state[write.collectionName].set(write.id, { ...write.data, _id: write.id });
        } else {
          const current = state[write.collectionName].get(write.id);
          if (!current) throw new Error(`missing ${write.collectionName}/${write.id}`);
          state[write.collectionName].set(write.id, { ...current, ...write.data, _id: write.id });
        }
        bumpVersion(write.collectionName, write.id);
      }
      return { result: callbackResult };
    }
    throw lastConflict || new Error("DATABASE_TRANSACTION_CONFLICT");
  }

  return {
    state,
    db: {
      collection,
      runTransaction,
      serverDate() {
        return "SERVER_DATE";
      }
    },
    pauseNextSave() {
      pauseNextSaveCommit = true;
      return new Promise((resolve) => {
        pausedSaveResolve = resolve;
      });
    },
    releasePausedSave() {
      if (releaseSaveResolve) releaseSaveResolve();
    }
  };
}

function createSnapshot(label) {
  return {
    schemaVersion: 1,
    payload: {
      diaryEntries: [{ id: label, entryKind: "decision_factor", createdAt: "2026-01-01T00:00:00.000Z" }],
      escapePlan: { userItems: [], defaultItemStates: [] },
      localVoicePosts: [],
      customEmergencyCards: []
    }
  };
}

async function main() {
  const databaseMock = createDatabaseMock();
  const context = { OPENID: "openid_a" };
  const cloudMock = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database() {
      return databaseMock.db;
    },
    getWXContext() {
      return context;
    }
  };

  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === "wx-server-sdk") return cloudMock;
    return originalLoad.call(this, request, parent, isMain);
  };

  const functionPath = path.resolve(__dirname, "../cloudfunctions/syncBackup/index.js");
  delete require.cache[functionPath];
  const syncBackup = require(functionPath);
  Module._load = originalLoad;

  databaseMock.state.users.set("user_a", {
    _id: "user_a",
    openid: "openid_a",
    backupMode: "enabled"
  });
  databaseMock.state.users.set("user_b", {
    _id: "user_b",
    openid: "openid_b",
    backupMode: "enabled",
    backupGeneration: 7
  });
  databaseMock.state.users.set("user_c", {
    _id: "user_c",
    openid: "openid_c",
    backupMode: "enabled",
    backupGeneration: 4
  });
  databaseMock.state.user_backups.set("backup_a_1", {
    _id: "backup_a_1",
    ownerOpenid: "openid_a",
    userId: "user_a",
    schemaVersion: 1,
    snapshot: createSnapshot("old-a"),
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  databaseMock.state.user_backups.set("backup_b_1", {
    _id: "backup_b_1",
    ownerOpenid: "openid_b",
    userId: "user_b",
    schemaVersion: 1,
    snapshot: createSnapshot("old-b"),
    updatedAt: "2026-01-01T00:00:00.000Z"
  });
  databaseMock.state.user_backups.set("user_c", {
    _id: "user_c",
    ownerOpenid: "openid_c",
    userId: "user_c",
    schemaVersion: 1,
    snapshot: createSnapshot("old-c"),
    updatedAt: "2026-01-01T00:00:00.000Z"
  });

  context.OPENID = "openid_c";
  const oldClientDisable = await syncBackup.main({ action: "setPreference", mode: "disabled" });
  assert.equal(oldClientDisable.ok, true);
  assert.equal(databaseMock.state.users.get("user_c").backupMode, "disabled");
  assert.equal(databaseMock.state.users.get("user_c").backupGeneration, 5);
  assert.equal(databaseMock.state.user_backups.has("user_c"), true);
  const preservedUpdatedAt = databaseMock.state.user_backups.get("user_c").updatedAt;

  const blockedAfterDisable = await syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("must-not-save"),
    appVersion: "Malo 1.0H"
  });
  assert.equal(blockedAfterDisable.ok, false);
  assert.equal(blockedAfterDisable.code, "BACKUP_DISABLED");
  assert.equal(databaseMock.state.user_backups.get("user_c").updatedAt, preservedUpdatedAt);

  const disabledStatus = await syncBackup.main({ action: "getStatus" });
  assert.equal(disabledStatus.ok, true);
  assert.equal(disabledStatus.exists, true);
  assert.equal(disabledStatus.backupEnabled, false);
  assert.equal(disabledStatus.mode, "disabled");

  const reenabledAfterDisable = await syncBackup.main({ action: "setPreference", mode: "enabled" });
  assert.equal(reenabledAfterDisable.ok, true);
  assert.equal(databaseMock.state.users.get("user_c").backupMode, "enabled");
  assert.equal(databaseMock.state.users.get("user_c").backupGeneration, 6);
  const savedAfterReenable = await syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("new-c"),
    appVersion: "Malo 1.1"
  });
  assert.equal(savedAfterReenable.ok, true);
  assert.equal(databaseMock.state.user_backups.get("user_c").snapshot.payload.diaryEntries[0].id, "new-c");

  context.OPENID = "openid_a";

  const forgedDelete = await syncBackup.main({
    action: "deleteBackup",
    ownerOpenid: "openid_b",
    userId: "user_b",
    backupId: "backup_b_1"
  });
  assert.equal(forgedDelete.ok, true);
  assert.equal(forgedDelete.deleted, true);
  assert.equal(databaseMock.state.user_backups.has("backup_a_1"), false);
  assert.equal(databaseMock.state.user_backups.has("backup_b_1"), true);
  assert.equal(databaseMock.state.users.get("user_a").backupMode, "disabled");
  assert.equal(databaseMock.state.users.get("user_a").backupGeneration, 1);

  const repeatDelete = await syncBackup.main({ action: "deleteBackup" });
  assert.equal(repeatDelete.ok, true);
  assert.equal(repeatDelete.deleted, false);
  assert.equal(repeatDelete.deletedCount, 0);

  const disabledSave = await syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("blocked"),
    appVersion: "Malo 1.1"
  });
  assert.equal(disabledSave.ok, false);
  assert.equal(disabledSave.code, "BACKUP_DISABLED");
  assert.equal(databaseMock.state.user_backups.has("user_a"), false);

  const enabled = await syncBackup.main({ action: "setPreference", mode: "enabled" });
  assert.equal(enabled.ok, true);
  const recreated = await syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("new-a"),
    appVersion: "Malo 1.1"
  });
  assert.equal(recreated.ok, true);
  assert.equal(recreated.backup.backupId, "user_a");
  const recreatedBackup = databaseMock.state.user_backups.get("user_a");
  assert.equal(recreatedBackup.ownerOpenid, "openid_a");
  assert.equal(recreatedBackup.schemaVersion, 1);

  const status = await syncBackup.main({ action: "getStatus" });
  assert.equal(status.ok, true);
  assert.equal(status.exists, true);
  assert.equal(status.backupEnabled, true);
  assert.equal(status.mode, "enabled");

  const paused = databaseMock.pauseNextSave();
  const racingSavePromise = syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("racing-a"),
    appVersion: "Malo 1.1"
  });
  await paused;
  const racingDelete = await syncBackup.main({ action: "deleteBackup" });
  assert.equal(racingDelete.ok, true);
  databaseMock.releasePausedSave();
  const racingSave = await racingSavePromise;
  assert.equal(racingSave.ok, false);
  assert.equal(racingSave.code, "BACKUP_DISABLED");
  assert.equal(databaseMock.state.users.get("user_a").backupMode, "disabled");
  assert.equal(
    Array.from(databaseMock.state.user_backups.values()).some((backup) => backup.ownerOpenid === "openid_a"),
    false
  );

  const lateSave = await syncBackup.main({
    action: "saveBackup",
    snapshot: createSnapshot("late-a"),
    appVersion: "Malo 1.1"
  });
  assert.equal(lateSave.ok, false);
  assert.equal(lateSave.code, "BACKUP_DISABLED");

  const disabledDownload = await syncBackup.main({ action: "getBackup" });
  assert.equal(disabledDownload.ok, false);
  assert.equal(disabledDownload.code, "BACKUP_NOT_ENABLED");

  const finalStatus = await syncBackup.main({ action: "getStatus" });
  assert.equal(finalStatus.ok, true);
  assert.equal(finalStatus.exists, false);
  assert.equal(finalStatus.backupEnabled, false);
  assert.equal(finalStatus.mode, "disabled");

  context.OPENID = "openid_b";
  const userBDownload = await syncBackup.main({ action: "getBackup" });
  assert.equal(userBDownload.ok, true);
  assert.equal(userBDownload.exists, true);
  assert.equal(userBDownload.backup.backupId, "backup_b_1");
  assert.equal(userBDownload.backup.snapshot.schemaVersion, 1);

  console.log("sync-backup-b11: disable, delete, race, and compatibility scenarios passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
