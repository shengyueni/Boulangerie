const {
  saveCloudBackup,
  getCloudBackupStatus,
  getCloudBackupPreference,
  setCloudBackupPreference,
  restoreCloudBackup,
  hasMeaningfulLocalData
} = require("./cloud-backup");
const { collectBackupSnapshot } = require("./backup-snapshot");

const RECOVERY_SUPPRESSION_KEY = "malo_cloud_recovery_suppressed";

const lifecycleState = {
  status: "idle",
  preference: "unknown",
  recoveryStatus: "idle",
  recoveryChecked: false,
  recoverySuppressed: false,
  backupInFlight: false,
  restoreInFlight: false,
  lastBackupAt: null,
  lastRestoreAt: null,
  error: null,
  promptInFlight: false,
  promptShownThisSession: false
};

const listeners = new Set();
let initializationPromise = null;
let backupPromise = null;
let restorePromise = null;

function getLifecycleState() {
  return { ...lifecycleState };
}

function notifyStateChange() {
  const state = getLifecycleState();
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      // A page listener must never break backup lifecycle work.
    }
  });
}

function updateState(patch) {
  Object.assign(lifecycleState, patch);
  notifyStateChange();
}

function subscribeLifecycle(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  listener(getLifecycleState());
  return () => listeners.delete(listener);
}

function createFailure(code, message) {
  return { ok: false, code, message };
}

function readRecoverySuppressed() {
  try {
    return wx.getStorageSync(RECOVERY_SUPPRESSION_KEY) === true;
  } catch (error) {
    return false;
  }
}

function writeRecoverySuppressed(value) {
  try {
    if (value) wx.setStorageSync(RECOVERY_SUPPRESSION_KEY, true);
    else wx.removeStorageSync(RECOVERY_SUPPRESSION_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

function inspectLocalData() {
  try {
    const snapshot = collectBackupSnapshot();
    return {
      ok: true,
      snapshot,
      meaningful: hasMeaningfulLocalData(snapshot)
    };
  } catch (error) {
    return createFailure(
      "LOCAL_SNAPSHOT_FAILED",
      error && error.message ? error.message : "无法检查本地数据。"
    );
  }
}

async function runRestore(options = {}) {
  if (restorePromise) return restorePromise;
  if (lifecycleState.preference !== "enabled") {
    return createFailure("BACKUP_NOT_ENABLED", "云备份尚未开启。");
  }

  updateState({
    restoreInFlight: true,
    recoveryStatus: "checking",
    error: null
  });

  restorePromise = (async () => {
    const result = await restoreCloudBackup();
    if (result.ok && result.restored) {
      if (options.clearSuppressionOnSuccess) writeRecoverySuppressed(false);
      updateState({
        recoveryStatus: "restored",
        recoveryChecked: true,
        recoverySuppressed: options.clearSuppressionOnSuccess ? false : readRecoverySuppressed(),
        lastRestoreAt: new Date().toISOString(),
        error: null
      });
      return result;
    }

    if (result.code === "CLOUD_BACKUP_NOT_FOUND") {
      updateState({
        recoveryStatus: "no_backup",
        recoveryChecked: true,
        error: null
      });
      return result;
    }

    updateState({
      recoveryStatus: "failed",
      recoveryChecked: true,
      error: result
    });
    return result;
  })().finally(() => {
    restorePromise = null;
    updateState({ restoreInFlight: false });
  });

  return restorePromise;
}

async function checkRecoveryForEnabledMode() {
  const suppressed = readRecoverySuppressed();
  updateState({
    recoverySuppressed: suppressed,
    recoveryChecked: false,
    error: null
  });

  if (suppressed) {
    updateState({
      recoveryStatus: "suppressed",
      recoveryChecked: true
    });
    return { ok: true, outcome: "suppressed" };
  }

  const local = inspectLocalData();
  if (!local.ok) {
    updateState({
      recoveryStatus: "failed",
      recoveryChecked: true,
      error: local
    });
    return local;
  }

  if (local.meaningful) {
    updateState({
      recoveryStatus: "local_present",
      recoveryChecked: true
    });
    return { ok: true, outcome: "local_present" };
  }

  const restored = await runRestore();
  return {
    ...restored,
    outcome: restored.ok ? "restored" : (
      restored.code === "CLOUD_BACKUP_NOT_FOUND" ? "no_backup" : "failed"
    )
  };
}

function initializeCloudBackupLifecycle() {
  if (initializationPromise) return initializationPromise;

  updateState({ status: "loading", error: null });
  initializationPromise = (async () => {
    const preference = await getCloudBackupPreference();
    if (!preference.ok) {
      updateState({
        status: "failed",
        preference: "unknown",
        recoveryChecked: false,
        error: preference
      });
      return preference;
    }

    updateState({
      status: "ready",
      preference: preference.mode,
      recoverySuppressed: readRecoverySuppressed(),
      error: null
    });

    if (preference.mode !== "enabled") {
      updateState({
        recoveryStatus: "idle",
        recoveryChecked: true
      });
      return { ok: true, preference: preference.mode };
    }

    const recovery = await checkRecoveryForEnabledMode();
    return { ok: true, preference: preference.mode, recovery };
  })().finally(() => {
    if (lifecycleState.status === "failed") initializationPromise = null;
  });

  return initializationPromise;
}

function backupNow(reason = "manual") {
  if (backupPromise) return backupPromise;
  if (lifecycleState.preference !== "enabled") {
    return Promise.resolve(createFailure("BACKUP_NOT_ENABLED", "云备份尚未开启。"));
  }
  if (!lifecycleState.recoveryChecked) {
    return Promise.resolve(createFailure("RECOVERY_PENDING", "恢复检查尚未完成。"));
  }
  if (lifecycleState.restoreInFlight) {
    return Promise.resolve(createFailure("RESTORE_IN_PROGRESS", "云端恢复正在进行。"));
  }
  if (lifecycleState.recoverySuppressed || readRecoverySuppressed()) {
    updateState({ recoverySuppressed: true, recoveryStatus: "suppressed" });
    return Promise.resolve(createFailure("RECOVERY_SUPPRESSED", "主动清空后不会自动上传空数据。"));
  }

  updateState({ backupInFlight: true, error: null });
  backupPromise = (async () => {
    const result = await saveCloudBackup();
    if (result.ok) {
      updateState({
        lastBackupAt: result.backup && result.backup.updatedAt
          ? result.backup.updatedAt
          : new Date().toISOString(),
        error: null
      });
    } else {
      updateState({ error: { ...result, reason } });
    }
    return result;
  })().finally(() => {
    backupPromise = null;
    updateState({ backupInFlight: false });
  });

  return backupPromise;
}

async function setCloudBackupMode(mode) {
  const preference = await setCloudBackupPreference(mode);
  if (!preference.ok) {
    updateState({ error: preference });
    return preference;
  }

  updateState({
    status: "ready",
    preference: mode,
    error: null
  });

  if (mode === "disabled") {
    updateState({
      recoveryStatus: "idle",
      recoveryChecked: true
    });
    return { ok: true, mode };
  }

  const recovery = await checkRecoveryForEnabledMode();
  let initialBackup = null;
  if (recovery.outcome === "local_present") {
    initialBackup = await backupNow("initial_opt_in");
  }

  return {
    ok: true,
    mode,
    recovery,
    initialBackup
  };
}

function handleAppHide() {
  return backupNow("app_hide");
}

async function refreshCloudBackupStatus() {
  if (lifecycleState.preference !== "enabled") {
    return createFailure("BACKUP_NOT_ENABLED", "云备份尚未开启。");
  }
  const result = await getCloudBackupStatus();
  if (result.ok && result.exists && result.backup) {
    updateState({ lastBackupAt: result.backup.updatedAt || null, error: null });
  } else if (!result.ok) {
    updateState({ error: result });
  }
  return result;
}

async function maybePromptBackupOptIn(showPrompt) {
  if (lifecycleState.status !== "ready" || lifecycleState.preference !== "unconfigured") {
    return { ok: true, prompted: false };
  }
  if (lifecycleState.promptInFlight || lifecycleState.promptShownThisSession) {
    return { ok: true, prompted: false };
  }
  if (typeof showPrompt !== "function") {
    return createFailure("PROMPT_UNAVAILABLE", "无法显示云备份选择。");
  }

  updateState({
    promptInFlight: true,
    promptShownThisSession: true
  });

  try {
    const choice = await showPrompt();
    if (choice !== "enabled" && choice !== "disabled") {
      return { ok: true, prompted: true, choice: null };
    }
    const result = await setCloudBackupMode(choice);
    return { ...result, prompted: true, choice };
  } finally {
    updateState({ promptInFlight: false });
  }
}

function markIntentionalLocalClear() {
  const saved = writeRecoverySuppressed(true);
  updateState({
    recoverySuppressed: true,
    recoveryStatus: "suppressed",
    recoveryChecked: true,
    error: saved ? null : createFailure("SUPPRESSION_WRITE_FAILED", "无法保存恢复抑制状态。")
  });
  return saved;
}

async function restoreAfterIntentionalClear() {
  if (lifecycleState.preference !== "enabled") {
    return createFailure("BACKUP_NOT_ENABLED", "云备份尚未开启。");
  }
  if (!lifecycleState.recoverySuppressed && !readRecoverySuppressed()) {
    return createFailure("RECOVERY_NOT_SUPPRESSED", "当前不处于主动清空保护状态。");
  }
  return runRestore({ clearSuppressionOnSuccess: true });
}

module.exports = {
  RECOVERY_SUPPRESSION_KEY,
  getLifecycleState,
  subscribeLifecycle,
  initializeCloudBackupLifecycle,
  setCloudBackupMode,
  maybePromptBackupOptIn,
  backupNow,
  handleAppHide,
  refreshCloudBackupStatus,
  markIntentionalLocalClear,
  restoreAfterIntentionalClear
};
