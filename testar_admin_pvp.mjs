import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  adminPvpApiRoute
} from "./src/routes/api-admin-pvp.js";

const store = new Map();
const coordinatorRequests = [];

const env = {
  MARBION_ADMIN_KEY:
    "teste-seguro",
  PVP_COORDINATOR: {
    idFromName(name) {
      return name;
    },
    get(id) {
      if (
        id ===
        "marbion-global-pvp"
      ) {
        return {
          async fetch(request) {
            const url =
              new URL(
                request.url
              );

            coordinatorRequests.push({
              user:
                url.searchParams.get(
                  "user"
                ),
              scope:
                url.searchParams.get(
                  "scope"
                ),
              extra:
                url.searchParams.get(
                  "extra"
                )
            });

            return Response.json({
              ok: true,
              inBattle: false,
              user:
                url.searchParams.get(
                  "user"
                ),
              scope:
                url.searchParams.get(
                  "scope"
                )
            });
          }
        };
      }

      return {
        async fetch() {
          return Response.json({
            profileStore: false,
            ok: false
          });
        }
      };
    }
  },
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


function readProfile(user) {
  return JSON.parse(
    store.get(user)
  );
}

function writeProfile(
  user,
  value
) {
  store.set(
    user,
    JSON.stringify(value)
  );
}

let timed =
  readProfile(
    "silenceworky"
  );

timed.lastDaily = 123;
timed.lastCheckin = 456;
timed.lastXpChest = 789;
timed.lastReroll = 321;
timed.lastHpHeal = 654;

writeProfile(
  "silenceworky",
  timed
);

for (
  const [
    scope,
    field
  ] of [
    ["daily", "lastDaily"],
    ["checkin", "lastCheckin"],
    ["xpchest", "lastXpChest"],
    ["reroll", "lastReroll"],
    ["hpheal", "lastHpHeal"]
  ]
) {
  const beforeCoordinator =
    coordinatorRequests.length;

  const reset =
    await mutate({
      operation:
        "reset-time",
      user:
        "silenceworky",
      scope
    });

  assert.equal(
    reset.response.status,
    200
  );
  assert.equal(
    reset.payload.scope,
    scope
  );
  assert.equal(
    readProfile(
      "silenceworky"
    )[field],
    0
  );
  assert.equal(
    coordinatorRequests.length,
    beforeCoordinator
  );
}

timed =
  readProfile(
    "silenceworky"
  );

timed.equippedSkills = [
  "Fogo:Chama_Teste",
  "Fogo:Explosao_Teste",
  null,
  null
];
timed.skillCooldowns = {
  "Fogo:Chama_Teste": 8,
  "Fogo:Explosao_Teste": 3
};

writeProfile(
  "silenceworky",
  timed
);

const slotReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "habilidade",
    extra: 2
  });

assert.equal(
  slotReset.response.status,
  200
);
assert.equal(
  slotReset.payload.slot,
  2
);
assert.equal(
  slotReset.payload.skillId,
  "Fogo:Explosao_Teste"
);
assert.equal(
  readProfile(
    "silenceworky"
  ).skillCooldowns[
    "Fogo:Explosao_Teste"
  ],
  undefined
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "habilidade"
);
assert.equal(
  coordinatorRequests.at(-1)
    .extra,
  "2"
);

const invalidSlot =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "habilidade",
    extra: 5
  });

assert.equal(
  invalidSlot.response.status,
  400
);
assert.equal(
  invalidSlot.payload.error,
  "INVALID_SLOT"
);

timed =
  readProfile(
    "silenceworky"
  );

timed.skillCooldowns = {
  "Fogo:Chama_Teste": 9,
  "Fogo:Explosao_Teste": 4
};

writeProfile(
  "silenceworky",
  timed
);

const allSkillsReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "habilidades"
  });

assert.equal(
  allSkillsReset.response.status,
  200
);
assert.deepEqual(
  readProfile(
    "silenceworky"
  ).skillCooldowns,
  {}
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "habilidades"
);

const meditationReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "meditar"
  });

assert.equal(
  meditationReset.response.status,
  200
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "meditar"
);

timed =
  readProfile(
    "silenceworky"
  );

timed.pvp.afkPenaltyLevel = 3;
timed.pvp.afkBlockedUntil = 9999;
timed.pvp.afkProbationUntil = 9999;
timed.pvp.afkLastIncidentAt = 9999;

writeProfile(
  "silenceworky",
  timed
);

const afkReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "afk"
  });

assert.equal(
  afkReset.response.status,
  200
);

timed =
  readProfile(
    "silenceworky"
  );

assert.equal(
  timed.pvp.afkPenaltyLevel,
  0
);
assert.equal(
  timed.pvp.afkBlockedUntil,
  0
);
assert.equal(
  timed.pvp.afkProbationUntil,
  0
);
assert.equal(
  timed.pvp.afkLastIncidentAt,
  0
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "afk"
);

const opponent =
  createBaseProfile(
    "oponente"
  );

opponent.race =
  "Terrariano";
opponent.pvp.recentOpponents = {
  silenceworky: [
    Date.now()
  ]
};

timed.pvp.recentOpponents = {
  oponente: [
    Date.now()
  ]
};

writeProfile(
  "silenceworky",
  timed
);
writeProfile(
  "oponente",
  opponent
);

const beforeAntiFarmCoordinator =
  coordinatorRequests.length;

const antiFarmReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "antifarm",
    extra:
      "@oponente"
  });

assert.equal(
  antiFarmReset.response.status,
  200
);
assert.equal(
  antiFarmReset.payload.opponent,
  "oponente"
);
assert.equal(
  Object.prototype.hasOwnProperty.call(
    readProfile(
      "silenceworky"
    ).pvp.recentOpponents,
    "oponente"
  ),
  false
);
assert.equal(
  Object.prototype.hasOwnProperty.call(
    readProfile(
      "oponente"
    ).pvp.recentOpponents,
    "silenceworky"
  ),
  false
);
assert.equal(
  coordinatorRequests.length,
  beforeAntiFarmCoordinator
);

timed =
  readProfile(
    "silenceworky"
  );

timed.lastCombat = 1234;
timed.skillCooldowns = {
  "Fogo:Chama_Teste": 5
};
timed.pvp.afkPenaltyLevel = 2;

writeProfile(
  "silenceworky",
  timed
);

const pvpReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "pvp"
  });

assert.equal(
  pvpReset.response.status,
  200
);
assert.equal(
  readProfile(
    "silenceworky"
  ).lastCombat,
  0
);
assert.deepEqual(
  readProfile(
    "silenceworky"
  ).skillCooldowns,
  {}
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "pvp"
);

timed =
  readProfile(
    "silenceworky"
  );

timed.lastCombat = 1;
timed.lastCheckin = 2;
timed.lastDaily = 3;
timed.lastXpChest = 4;
timed.lastReroll = 5;
timed.lastHpHeal = 6;
timed.skillCooldowns = {
  "Fogo:Chama_Teste": 7
};

writeProfile(
  "silenceworky",
  timed
);

const everythingReset =
  await mutate({
    operation:
      "reset-time",
    user:
      "silenceworky",
    scope:
      "tudo"
  });

assert.equal(
  everythingReset.response.status,
  200
);

timed =
  readProfile(
    "silenceworky"
  );

for (
  const field of [
    "lastCombat",
    "lastCheckin",
    "lastDaily",
    "lastXpChest",
    "lastReroll",
    "lastHpHeal"
  ]
) {
  assert.equal(
    timed[field],
    0
  );
}

assert.deepEqual(
  timed.skillCooldowns,
  {}
);
assert.equal(
  coordinatorRequests.at(-1)
    .scope,
  "tudo"
);

console.log(
  "✅ Resets administrativos de tempo validados."
);
