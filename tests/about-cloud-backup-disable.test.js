const assert = require("assert");
const Module = require("module");
const path = require("path");

async function main() {
  const pagePath = path.resolve(__dirname, "../pages/about/index.js");
  let pageDefinition = null;
  let requestedMode = null;
  let modalOptions = null;
  let toastOptions = null;

  const lifecycleStub = {
    getLifecycleState() {
      return {
        status: "ready",
        preference: "enabled",
        recoveryStatus: "ready",
        recoveryChecked: true,
        recoverySuppressed: false,
        restoreInFlight: false,
        backupExists: true,
        lastBackupAt: "2026-08-31T10:00:00.000Z"
      };
    },
    async setCloudBackupMode(mode) {
      requestedMode = mode;
      return { ok: true, mode };
    }
  };

  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (parent && parent.filename === pagePath && request === "../../utils/cloud-backup-lifecycle") {
      return lifecycleStub;
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  global.Page = (definition) => {
    pageDefinition = definition;
  };
  global.wx = {
    showModal(options) {
      modalOptions = options;
      if ([...options.cancelText].length > 4 || [...options.confirmText].length > 4) return;
      options.success({ confirm: true, cancel: false });
    },
    showToast(options) {
      toastOptions = options;
    }
  };

  delete require.cache[pagePath];
  require(pagePath);
  Module._load = originalLoad;

  assert.ok(pageDefinition);
  const page = {
    ...pageDefinition,
    data: JSON.parse(JSON.stringify(pageDefinition.data)),
    setData(patch) {
      Object.assign(this.data, patch);
    }
  };

  assert.equal(page.data.cloudBackup.showDisable, true);
  assert.equal(page.data.backupActionInFlight, false);
  page.disableCloudBackup();
  await new Promise((resolve) => setImmediate(resolve));

  assert.ok(modalOptions);
  assert.ok([...modalOptions.cancelText].length <= 4);
  assert.ok([...modalOptions.confirmText].length <= 4);
  assert.equal(requestedMode, "disabled");
  assert.equal(page.data.backupActionInFlight, false);
  assert.equal(toastOptions.title, "云端备份已关闭");
  console.log("about-cloud-backup-disable: modal and disable flow passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
