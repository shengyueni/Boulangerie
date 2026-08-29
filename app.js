const { ensureCloudIdentity } = require("./utils/cloud-auth");
const cloudBackup = require("./utils/cloud-backup");

const CLOUD_ENV = "cloud1-d7giej4xy92b740d4";

function createCloudError(code, message) {
  return { code, message };
}

App({
  globalData: {
    // Development-only manual hooks. Nothing here uploads automatically.
    __devCloudBackup: {
      saveCloudBackup: cloudBackup.saveCloudBackup,
      getCloudBackupStatus: cloudBackup.getCloudBackupStatus,
      downloadCloudBackup: cloudBackup.downloadCloudBackup,
      restoreCloudBackup: cloudBackup.restoreCloudBackup
    },
    cloudIdentity: {
      status: "idle",
      userId: null,
      isNewUser: false,
      error: null
    }
  },

  onLaunch() {
    if (!wx.cloud || typeof wx.cloud.init !== "function") {
      this.globalData.cloudIdentity = {
        status: "failed",
        userId: null,
        isNewUser: false,
        error: createCloudError("CLOUD_UNAVAILABLE", "微信云开发能力不可用。")
      };
      return;
    }

    try {
      wx.cloud.init({ env: CLOUD_ENV });
    } catch (error) {
      this.globalData.cloudIdentity = {
        status: "failed",
        userId: null,
        isNewUser: false,
        error: createCloudError(
          "CLOUD_INIT_FAILED",
          error && error.message ? error.message : "微信云开发初始化失败。"
        )
      };
      return;
    }

    this.globalData.cloudIdentity = {
      status: "loading",
      userId: null,
      isNewUser: false,
      error: null
    };

    ensureCloudIdentity().then((identity) => {
      if (identity.ok) {
        this.globalData.cloudIdentity = {
          status: "ready",
          userId: identity.userId,
          isNewUser: identity.isNewUser,
          error: null
        };
        return;
      }

      this.globalData.cloudIdentity = {
        status: "failed",
        userId: null,
        isNewUser: false,
        error: identity.error
      };
    });
  }
});
