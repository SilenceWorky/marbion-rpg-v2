import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  adminCharacterActionsApiRoute
} from "./src/routes/api-admin-character-actions.js";

const store = new Map();

const env = {
  MARBION_ADMIN_KEY:
    "teste-seguro",
  MARBION_USERS_V2: {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async list() {
      return {
        keys: [],
        list_complete: true
      };
    }
  }
};

const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.race = "Terrariano";
profile.strength = 19;
profile.magicStrength = 17;
profile.speed = 23;
profile.evasion = 14;
profile.accuracy = 97;
profile.defense = 16;
profile.statusPoints = 8;

store.set(
  "silenceworky",
  JSON.stringify(profile)
);

function adminUrl({
  actor = "silenceworky",
  key = "teste-seguro"
} = {}) {
  return (
    "https://worker.test/api/v1/admin/character-actions" +
    `?actor=${encodeURIComponent(actor)}` +
    `&key=${encodeURIComponent(key)}`
  );
}

async function mutate(
  body,
  options = {}
) {
  const response =
    await adminCharacterActionsApiRoute(
      new Request(
        adminUrl(options),
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify(body)
        }
      ),
      env
    );

  return {
    response,
    payload:
      await response.json()
  };
}

const unauthorized =
  await mutate(
    {
      operation:
        "reset-status",
      user:
        "silenceworky"
    },
    {
      key:
        "incorreta"
    }
  );

assert.equal(
  unauthorized.response.status,
  401
);

const missing =
  await mutate({
    operation:
      "reset-status",
    user:
      "naoexiste"
  });

assert.equal(
  missing.response.status,
  404
);
assert.equal(
  missing.payload.error,
  "CHARACTER_NOT_FOUND"
);

const reset =
  await mutate({
    operation:
      "reset-status",
    user:
      "silenceworky"
  });

assert.equal(
  reset.response.status,
  200
);
assert.equal(
  reset.payload.ok,
  true
);
assert.deepEqual(
  reset.payload.before,
  {
    strength: 19,
    magicStrength: 17,
    speed: 23,
    evasion: 14,
    accuracy: 97,
    defense: 16,
    statusPoints: 8
  }
);
assert.deepEqual(
  reset.payload.after,
  {
    strength: 5,
    magicStrength: 5,
    speed: 5,
    evasion: 5,
    accuracy: 90,
    defense: 5,
    statusPoints: 0
  }
);

let saved =
  JSON.parse(
    store.get(
      "silenceworky"
    )
  );

assert.equal(
  saved.strength,
  5
);
assert.equal(
  saved.magicStrength,
  5
);
assert.equal(
  saved.speed,
  5
);
assert.equal(
  saved.evasion,
  5
);
assert.equal(
  saved.accuracy,
  90
);
assert.equal(
  saved.defense,
  5
);
assert.equal(
  saved.statusPoints,
  0
);

const invalidPoints =
  await mutate({
    operation:
      "add-status-points",
    user:
      "silenceworky",
    amount: 0
  });

assert.equal(
  invalidPoints.response.status,
  400
);
assert.equal(
  invalidPoints.payload.error,
  "INVALID_STATUS_POINTS"
);

const addPoints =
  await mutate({
    operation:
      "add-status-points",
    user:
      "silenceworky",
    amount: 12
  });

assert.equal(
  addPoints.response.status,
  200
);
assert.equal(
  addPoints.payload.beforeStatusPoints,
  0
);
assert.equal(
  addPoints.payload.added,
  12
);
assert.equal(
  addPoints.payload.statusPoints,
  12
);

const addMore =
  await mutate({
    operation:
      "add-status-points",
    user:
      "silenceworky",
    amount: 3
  });

assert.equal(
  addMore.response.status,
  200
);
assert.equal(
  addMore.payload.beforeStatusPoints,
  12
);
assert.equal(
  addMore.payload.statusPoints,
  15
);

saved =
  JSON.parse(
    store.get(
      "silenceworky"
    )
  );

assert.equal(
  saved.statusPoints,
  15
);

console.log(
  "✅ Ações administrativas de Status validadas."
);
