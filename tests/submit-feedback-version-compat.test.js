const assert = require("assert");
const Module = require("module");
const path = require("path");

function createDatabaseMock() {
  const state = {
    users: [
      { _id: "user_a", openid: "openid_a" },
      { _id: "user_b", openid: "openid_b" }
    ],
    feedbackPosts: new Map()
  };

  function query(collectionName, filters) {
    const values = collectionName === "users"
      ? state.users
      : Array.from(state.feedbackPosts.values());
    return values.filter((item) => Object.keys(filters).every((key) => item[key] === filters[key]));
  }

  function collection(name) {
    return {
      where(filters) {
        return {
          limit(count) {
            return {
              async get() {
                return { data: query(name, filters).slice(0, count) };
              }
            };
          }
        };
      },
      doc(id) {
        return {
          async set({ data }) {
            state.feedbackPosts.set(id, { _id: id, ...data });
          }
        };
      }
    };
  }

  return {
    state,
    database: Object.assign(() => ({ collection, serverDate: () => "SERVER_DATE" }), {
      serverDate: () => "SERVER_DATE"
    })
  };
}

function createEvent(clientFeedbackId, appVersion, overrides = {}) {
  return {
    clientFeedbackId,
    type: "我觉得好用的地方",
    content: "  这条反馈会被 trim。  ",
    appVersion,
    clientCreatedAt: "2026-08-31T08:00:00.000Z",
    ...overrides
  };
}

async function main() {
  const databaseMock = createDatabaseMock();
  const context = { OPENID: "openid_a" };
  const cloudMock = {
    DYNAMIC_CURRENT_ENV: "test",
    init() {},
    database: databaseMock.database,
    getWXContext() {
      return context;
    }
  };

  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === "wx-server-sdk") return cloudMock;
    return originalLoad.call(this, request, parent, isMain);
  };

  const functionPath = path.resolve(__dirname, "../cloudfunctions/submitFeedback/index.js");
  delete require.cache[functionPath];
  const submitFeedback = require(functionPath);
  Module._load = originalLoad;

  const oldClient = await submitFeedback.main(createEvent("feedback_old", "MVP 1.0H"));
  assert.equal(oldClient.ok, true);

  const newClient = await submitFeedback.main(createEvent("feedback_new", "MVP 1.1"));
  assert.equal(newClient.ok, true);

  const countBeforeRejectedVersions = databaseMock.state.feedbackPosts.size;
  const unknownVersion = await submitFeedback.main(createEvent("feedback_unknown", "MVP 1.2-test"));
  assert.deepEqual(unknownVersion, { ok: false, code: "INVALID_APP_VERSION" });
  const emptyVersion = await submitFeedback.main(createEvent("feedback_empty", ""));
  assert.deepEqual(emptyVersion, { ok: false, code: "INVALID_APP_VERSION" });
  assert.equal(databaseMock.state.feedbackPosts.size, countBeforeRejectedVersions);

  const storedNewClient = Array.from(databaseMock.state.feedbackPosts.values())
    .find((post) => post.clientFeedbackId === "feedback_new");
  assert.equal(storedNewClient.userId, "user_a");
  assert.equal(storedNewClient.type, "我觉得好用的地方");
  assert.equal(storedNewClient.content, "这条反馈会被 trim。");
  assert.equal(storedNewClient.appVersion, "MVP 1.1");
  assert.equal(storedNewClient.clientCreatedAt, "2026-08-31T08:00:00.000Z");
  assert.equal(storedNewClient.createdAt, "SERVER_DATE");

  const duplicateCount = databaseMock.state.feedbackPosts.size;
  const duplicate = await submitFeedback.main(createEvent("feedback_new", "MVP 1.1"));
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(databaseMock.state.feedbackPosts.size, duplicateCount);

  const forgedOwner = await submitFeedback.main(createEvent("feedback_forged", "MVP 1.1", {
    ownerOpenid: "openid_b",
    userId: "user_b"
  }));
  assert.equal(forgedOwner.ok, true);
  const storedForged = Array.from(databaseMock.state.feedbackPosts.values())
    .find((post) => post.clientFeedbackId === "feedback_forged");
  assert.equal(storedForged.userId, "user_a");
  assert.equal(Object.prototype.hasOwnProperty.call(storedForged, "ownerOpenid"), false);

  console.log("submit-feedback-version-compat: 7 scenarios passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
