const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection("users");

function safeErrorDetails(error) {
  return {
    code: error && (error.errCode || error.code) ? (error.errCode || error.code) : "UNKNOWN",
    message: error && (error.errMsg || error.message) ? (error.errMsg || error.message) : "Unknown error"
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext && wxContext.OPENID;

  if (!openid) {
    return {
      ok: false,
      code: "OPENID_UNAVAILABLE",
      message: "无法取得可信微信身份。"
    };
  }

  let existingUsers;
  try {
    existingUsers = await users.where({ openid }).limit(1).get();
  } catch (error) {
    console.error("loginOrRegister user query failed", safeErrorDetails(error));
    return {
      ok: false,
      code: "USER_QUERY_FAILED",
      message: "用户查询失败。"
    };
  }

  const existingUser = existingUsers.data && existingUsers.data[0];
  if (existingUser) {
    try {
      await users.doc(existingUser._id).update({
        data: {
          lastSeenAt: db.serverDate()
        }
      });
    } catch (error) {
      console.error("loginOrRegister user update failed", safeErrorDetails(error));
      return {
        ok: false,
        code: "USER_UPDATE_FAILED",
        message: "用户访问时间更新失败。"
      };
    }

    return {
      ok: true,
      isNewUser: false,
      userId: existingUser._id
    };
  }

  try {
    const createdUser = await users.add({
      data: {
        openid,
        status: "active",
        createdAt: db.serverDate(),
        lastSeenAt: db.serverDate()
      }
    });

    return {
      ok: true,
      isNewUser: true,
      userId: createdUser._id
    };
  } catch (error) {
    console.error("loginOrRegister user creation failed", safeErrorDetails(error));
    return {
      ok: false,
      code: "USER_CREATE_FAILED",
      message: "用户创建失败。"
    };
  }
};
