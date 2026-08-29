function createFailure(code, message) {
  return {
    ok: false,
    userId: null,
    isNewUser: false,
    error: {
      code,
      message
    }
  };
}

function ensureCloudIdentity() {
  if (!wx.cloud || typeof wx.cloud.callFunction !== "function") {
    return Promise.resolve(createFailure("CLOUD_UNAVAILABLE", "微信云开发能力不可用。"));
  }

  return wx.cloud.callFunction({
    name: "loginOrRegister"
  }).then((response) => {
    const result = response && response.result;
    if (!result || result.ok !== true || !result.userId) {
      return createFailure(
        result && result.code ? result.code : "IDENTITY_FAILED",
        result && result.message ? result.message : "微信身份识别失败。"
      );
    }

    return {
      ok: true,
      userId: result.userId,
      isNewUser: !!result.isNewUser,
      error: null
    };
  }).catch((error) => {
    return createFailure(
      error && error.errCode ? error.errCode : "IDENTITY_CALL_FAILED",
      error && error.errMsg
        ? error.errMsg
        : (error && error.message ? error.message : "微信身份云函数调用失败。")
    );
  });
}

module.exports = {
  ensureCloudIdentity
};
