const { APP_META, FEEDBACK_TYPES } = require("./constants");

const MAX_FEEDBACK_CONTENT_LENGTH = 2000;

function validateFeedback(feedback) {
  if (!feedback || typeof feedback !== "object") return "INVALID_FEEDBACK";
  if (typeof feedback.id !== "string" || !feedback.id.trim()) return "INVALID_FEEDBACK_ID";
  if (!FEEDBACK_TYPES.includes(feedback.type)) return "INVALID_TYPE";
  if (typeof feedback.content !== "string" || !feedback.content.trim()) return "EMPTY_CONTENT";
  if (feedback.content.trim().length > MAX_FEEDBACK_CONTENT_LENGTH) return "CONTENT_TOO_LONG";
  if (typeof feedback.createdAt !== "string" || Number.isNaN(Date.parse(feedback.createdAt))) return "INVALID_CREATED_AT";
  return "";
}

async function submitCloudFeedback(feedback) {
  const validationError = validateFeedback(feedback);
  if (validationError) return { ok: false, code: validationError };

  try {
    const response = await wx.cloud.callFunction({
      name: "submitFeedback",
      data: {
        clientFeedbackId: feedback.id.trim(),
        type: feedback.type,
        content: feedback.content.trim(),
        appVersion: APP_META.version,
        clientCreatedAt: feedback.createdAt
      }
    });
    const result = response && response.result;
    if (!result || result.ok !== true || typeof result.feedbackId !== "string") {
      return { ok: false, code: result && result.code || "SUBMIT_FAILED" };
    }
    return {
      ok: true,
      duplicate: result.duplicate === true,
      feedbackId: result.feedbackId
    };
  } catch (error) {
    return { ok: false, code: "CLOUD_UNAVAILABLE" };
  }
}

module.exports = {
  MAX_FEEDBACK_CONTENT_LENGTH,
  validateFeedback,
  submitCloudFeedback
};
