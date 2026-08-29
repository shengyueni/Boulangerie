const { ensureCloudIdentity } = require("./utils/cloud-auth");
const cloudBackupLifecycle = require("./utils/cloud-backup-lifecycle");

const CLOUD_ENV = "cloud1-d7giej4xy92b740d4";

function createCloudError(code, message) {
  return { code, message };
}

App({
  globalData: {
    cloudBackupLifecycle: cloudBackupLifecycle.getLifecycleState(),
    cloudIdentity: {
      status: "idle",
      userId: null,
      isNewUser: false,
      error: null
    }
  },

  onLaunch() {
    cloudBackupLifecycle.subscribeLifecycle((state) => {
      this.globalData.cloudBackupLifecycle = state;
    });

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
        cloudBackupLifecycle.initializeCloudBackupLifecycle();
        return;
      }

      this.globalData.cloudIdentity = {
        status: "failed",
        userId: null,
        isNewUser: false,
        error: identity.error
      };
    });
  },

  onHide() {
    cloudBackupLifecycle.handleAppHide();
  }
});
