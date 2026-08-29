const crypto = require("crypto");
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const users = db.collection("users");
const feedbackPosts = db.collection("feedback_posts");
const MAX_FEEDBACK_CONTENT_LENGTH = 2000;
const APP_VERSION = "MVP 1.0H";
const FEEDBACK_TYPES = [
  "我觉得好用的地方",
  "我觉得别扭的地方",
  "我遇到的小 bug",
  "我希望之后增加的内容",
  "我不确定，但想说两句"
];

function fail(code) {
  return { ok: false, code };
}

function validateInput(event) {
  const clientFeedbackId = typeof event.clientFeedbackId === "string" ? event.clientFeedbackId.trim() : "";
  const content = typeof event.content === "string" ? event.content.trim() : "";
  const appVersion = typeof event.appVersion === "string" ? event.appVersion.trim() : "";
  const clientCreatedAt = typeof event.clientCreatedAt === "string" ? event.clientCreatedAt.trim() : "";

  if (!clientFeedbackId || clientFeedbackId.length > 120 || !/^[A-Za-z0-9_-]+$/.test(clientFeedbackId)) return fail("INVALID_FEEDBACK_ID");
  if (!FEEDBACK_TYPES.includes(event.type)) return fail("INVALID_TYPE");
  if (!content) return fail("EMPTY_CONTENT");
  if (content.length > MAX_FEEDBACK_CONTENT_LENGTH) return fail("CONTENT_TOO_LONG");
  if (appVersion !== APP_VERSION) return fail("INVALID_APP_VERSION");
  if (!clientCreatedAt || Number.isNaN(Date.parse(clientCreatedAt))) return fail("INVALID_CREATED_AT");

  return {
    ok: true,
    value: { clientFeedbackId, type: event.type, content, appVersion, clientCreatedAt }
  };
}

function buildFeedbackId(userId, clientFeedbackId) {
  const digest = crypto.createHash("sha256").update(`${userId}:${clientFeedbackId}`).digest("hex");
  return `feedback_${digest.slice(0, 40)}`;
}

exports.main = async (event = {}) => {
  try {
    const wxContext = cloud.getWXContext();
    const OPENID = wxContext.OPENID;
    if (!OPENID) return fail("OPENID_UNAVAILABLE");

    const validation = validateInput(event);
    if (!validation.ok) return validation;

    const userResult = await users.where({ openid: OPENID }).limit(1).get();
    const user = userResult.data && userResult.data[0];
    if (!user || !user._id) return fail("USER_NOT_FOUND");

    const input = validation.value;
    const feedbackId = buildFeedbackId(user._id, input.clientFeedbackId);
    const existing = await feedbackPosts.where({
      userId: user._id,
      clientFeedbackId: input.clientFeedbackId
    }).limit(1).get();

    if (existing.data && existing.data.length) {
      return { ok: true, duplicate: true, feedbackId: existing.data[0]._id };
    }

    await feedbackPosts.doc(feedbackId).set({
      data: {
        userId: user._id,
        clientFeedbackId: input.clientFeedbackId,
        type: input.type,
        content: input.content,
        appVersion: input.appVersion,
        clientCreatedAt: input.clientCreatedAt,
        createdAt: db.serverDate()
      }
    });

    return { ok: true, duplicate: false, feedbackId };
  } catch (error) {
    console.error("submitFeedback failed", error && error.code || "UNEXPECTED_ERROR");
    return fail("SUBMIT_FAILED");
  }
};
