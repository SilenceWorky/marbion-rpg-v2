import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  adminPvpApiRoute
} from "./src/routes/api-admin-pvp.js";

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
profile.pvp.wins = 27;
profile.pvp.losses = 11;
profile.pvp.duels = 38;
profile.pvp.streak = 4;
profile.pvp.bestStreak = 9;
profile.pvp.rating = 2450;
profile.pvp.peakRating = 2810;
profile.pvp.rank =
  "Corrompido I";
profile.pvp.prodigyPosition = 3;

store.set(
  "silenceworky",
  JSON.stringify(profile)
);

function adminUrl({
  actor = "silenceworky",
  key = "teste-seguro"
} = {}) {
  return (
    "https://worker.test/api/v1/admin/pvp" +
    `?actor=${encodeURIComponent(actor)}` +
    `&key=${encodeURIComponent(key)}`
  );
}

async function mutate(
  body,
  options = {}
) {
  const response =
    await adminPvpApiRoute(
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
        "reset-elo",
      user:
        "silenceworky"
    },
    {
      key: "incorreta"
    }
  );

assert.equal(
  unauthorized.response.status,
  401
);
assert.equal(
  unauthorized.payload.error,
  "UNAUTHORIZED"
);

const missing =
  await mutate({
    operation:
      "reset-elo",
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

const result =
  await mutate({
    operation:
      "reset-elo",
    user:
      "silenceworky"
  });

assert.equal(
  result.response.status,
  200
);
assert.equal(
  result.payload.ok,
  true
);
assert.equal(
  result.payload.operation,
  "reset-elo"
);
assert.equal(
  result.payload.before.rating,
  2450
);
assert.equal(
  result.payload.after.rating,
  1000
);
assert.equal(
  result.payload.after.displayRank,
  "Prata III"
);
assert.equal(
  result.payload.before.peakRating,
  2810
);
assert.equal(
  result.payload.after.peakRating,
  2810
);
assert.equal(
  result.payload.after.prodigyPosition,
  null
);

const saved =
  JSON.parse(
    store.get(
      "silenceworky"
    )
  );

assert.equal(
  saved.pvp.rating,
  1000
);
assert.equal(
  saved.pvp.rank,
  "Prata III"
);
assert.equal(
  saved.pvp.prodigyPosition,
  null
);

assert.equal(
  saved.pvp.wins,
  27
);
assert.equal(
  saved.pvp.losses,
  11
);
assert.equal(
  saved.pvp.duels,
  38
);
assert.equal(
  saved.pvp.streak,
  4
);
assert.equal(
  saved.pvp.bestStreak,
  9
);
assert.equal(
  saved.pvp.peakRating,
  2810
);

console.log(
  "✅ Reset administrativo de Elo validado."
);
