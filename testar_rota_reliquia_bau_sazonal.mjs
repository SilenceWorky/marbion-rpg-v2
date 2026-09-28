import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createSeasonalChestFromDefinition
} from "./src/systems/seasonal-chest-state.js";

import {
  chestRoute
} from "./src/routes/chest.js";


function sequenceRandom(values) {
  let index = 0;

  return () => {
    if (index >= values.length) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    return values[index++];
  };
}


function createEnv(
  profile,
  seasonContent
) {
  const store =
    new Map([
      [
        profile.user,
        JSON.stringify(profile)
      ]
    ]);

  const coordinator = {
    async fetch(request) {
      const url =
        new URL(request.url);

      if (
        url.pathname ===
        "/season/content/revision"
      ) {
        return Response.json({
          ok: true,
          content:
            structuredClone(
              seasonContent
            )
        });
      }

      return Response.json({
        profileStore: false
      });
    }
  };

  return {
    store,
    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },

      get(id) {
        if (
          id ===
          "marbion-global-pvp"
        ) {
          return coordinator;
        }

        return {
          async fetch() {
            return Response.json({
              profileStore: false
            });
          }
        };
      }
    },
    MARBION_USERS_V2: {
      async get(key) {
        return (
          store.get(key) ??
          null
        );
      },

      async put(
        key,
        value
      ) {
        store.set(
          key,
          value
        );
      },

      async delete(key) {
        store.delete(key);
      }
    }
  };
}


const profile =
  createBaseProfile(
    "rota-reliquiao"
  );

profile.race =
  "Metamorfo";

const chestDefinition = {
  id:
    "seasonal:2026-12:chest:relicroute",
  seasonId:
    "2026-12",
  order: 2,
  poolRevision: 13,
  name:
    "Baú Rena"
};

const created =
  createSeasonalChestFromDefinition(
    profile,
    chestDefinition,
    {
      createdAt: 100
    }
  );

assert.equal(
  created.ok,
  true
);

const seasonContent = {
  id: "2026-12",
  revision: 13,
  seasonalChests: [
    {
      id:
        "seasonal:2026-12:chest:firstrelic",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 13,
      name: "Baú de Pinheiro"
    },
    chestDefinition
  ],
  seasonalSkills: [],
  seasonalConsumables: [],
  seasonalPvpFinishers: [],
  seasonalVictoryMessages: [],
  seasonalCosmetics: [],
  seasonalRelics: [
    {
      id:
        "jardim:fragmento",
      name:
        "Fragmento do Jardim",
      description:
        "Um fragmento antigo.",
      lore:
        "Vestigio do jardim original.",
      introducedInSeasonalChestId:
        "seasonal:2026-12:chest:firstrelic",
      introducedInSeasonalChestOrder:
        1
    },
    {
      id:
        "jardim:semente",
      name:
        "Semente Primeva",
      description:
        "Uma semente petrificada.",
      lore:
        "Nunca germinou desde a queda do jardim.",
      introducedInSeasonalChestId:
        chestDefinition.id,
      introducedInSeasonalChestOrder:
        2
    }
  ]
};

const env =
  createEnv(
    profile,
    seasonContent
  );

const originalRandom =
  Math.random;

Math.random =
  sequenceRandom([
    0,
    0,
    0.95,
    0.99
  ]);

const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-reliquiao&args=abrir%201"
    ),
    env
  );

Math.random =
  originalRandom;

assert.equal(
  response.status,
  200
);

const stored =
  JSON.parse(
    env.store.get(
      "rota-reliquiao"
    )
  );

assert.equal(
  stored.relics.owned.length,
  1
);

assert.equal(
  stored.relics.owned[0]
    .seasonId,
  "2026-12"
);

assert.equal(
  stored.relics.owned[0]
    .relicId,
  "jardim:semente"
);

assert.equal(
  stored.relics.owned[0]
    .name,
  "Semente Primeva"
);
assert.equal(
  stored.relics.owned[0]
    .lore,
  "Nunca germinou desde a queda do jardim."
);

assert.equal(
  stored.relics.owned[0]
    .source,
  "seasonal_chest"
);

assert.equal(
  stored.relics.owned[0]
    .seasonalChestId,
  chestDefinition.id
);

assert.equal(
  stored.relics.owned[0]
    .chestOrder,
  2
);

assert.equal(
  stored.relics.owned[0]
    .poolRevision,
  13
);

const pending =
  stored.chests[0]
    .metadata.seasonal
    .pendingOpen;

assert.equal(
  pending.rewardPlan
    .rewards[1].type,
  "seasonal_relic"
);

assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);

assert.equal(
  pending.rewardPlan
    .rewards[1].relic.id,
  "jardim:semente"
);
assert.equal(
  pending.rewardPlan
    .rewards[1].relic.lore,
  "Nunca germinou desde a queda do jardim."
);

assert.deepEqual(
  pending.rewardPlan
    .appliedRewardIndexes,
  [0, 1]
);

assert.equal(
  stored.chests.length,
  1,
  "Baú Sazonal ainda permanece enquanto a implementação geral não finaliza o consumo"
);


const retry =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-reliquiao&args=abrir%201"
    ),
    env
  );

assert.equal(
  retry.status,
  200
);

const retried =
  JSON.parse(
    env.store.get(
      "rota-reliquiao"
    )
  );

assert.equal(
  retried.relics.owned.length,
  1,
  "retry não pode duplicar Relíquia Sazonal"
);

assert.equal(
  retried.relics.owned[0]
    .relicId,
  "jardim:semente"
);

assert.equal(
  retried.chests[0]
    .metadata.seasonal
    .pendingOpen.rewardPlan
    .rewards[1].relic.id,
  "jardim:semente",
  "retry deve reutilizar o plano congelado sem reroll"
);


console.log(
  "OK: Relíquia Sazonal resolvida, entregue e idempotente na rota real"
);
