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
    "rota-cosmetico"
  );

profile.race =
  "Metamorfo";

const chestDefinition = {
  id:
    "seasonal:2026-12:chest:cosroute",
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
        "seasonal:2026-12:chest:firstcos",
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
  seasonalCosmetics: [
    {
      id:
        "natal:cachecol",
      name:
        "Cachecol Congelado",
      slot: "accessory",
      introducedInSeasonalChestId:
        "seasonal:2026-12:chest:firstcos",
      introducedInSeasonalChestOrder:
        1
    },
    {
      id:
        "natal:bota",
      name:
        "Bota Invernal",
      slot: "shoes",
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
    0.85,
    0.99
  ]);

const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-cosmetico&args=abrir%201"
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
      "rota-cosmetico"
    )
  );

assert.equal(
  stored.cosmetics.owned.length,
  1
);

assert.equal(
  stored.cosmetics.owned[0]
    .seasonId,
  "2026-12"
);

assert.equal(
  stored.cosmetics.owned[0]
    .cosmeticId,
  "natal:bota"
);

assert.equal(
  stored.cosmetics.owned[0]
    .name,
  "Bota Invernal"
);
assert.equal(
  stored.cosmetics.owned[0]
    .slot,
  "shoes"
);

assert.equal(
  stored.cosmetics.owned[0]
    .source,
  "seasonal_chest"
);

assert.equal(
  stored.cosmetics.owned[0]
    .seasonalChestId,
  chestDefinition.id
);

assert.equal(
  stored.cosmetics.owned[0]
    .chestOrder,
  2
);

assert.equal(
  stored.cosmetics.owned[0]
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
  "seasonal_cosmetic"
);

assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);

assert.equal(
  pending.rewardPlan
    .rewards[1].cosmetic.id,
  "natal:bota"
);
assert.equal(
  pending.rewardPlan
    .rewards[1].cosmetic.slot,
  "shoes"
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
      "https://worker.test/bau?user=rota-cosmetico&args=abrir%201"
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
      "rota-cosmetico"
    )
  );

assert.equal(
  retried.cosmetics.owned.length,
  1,
  "retry não pode duplicar Cosmético Sazonal"
);

assert.equal(
  retried.cosmetics.owned[0]
    .cosmeticId,
  "natal:bota"
);

assert.equal(
  retried.chests[0]
    .metadata.seasonal
    .pendingOpen.rewardPlan
    .rewards[1].cosmetic.id,
  "natal:bota",
  "retry deve reutilizar o plano congelado sem reroll"
);


console.log(
  "OK: Cosmético Sazonal resolvido, entregue e idempotente na rota real"
);
