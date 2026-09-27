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
    "rota-consumivel"
  );

profile.race =
  "Metamorfo";

const chestDefinition = {
  id:
    "seasonal:2026-12:chest:consroute",
  seasonId:
    "2026-12",
  order: 1,
  poolRevision: 8,
  name:
    "Baú de Pinheiro"
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
  revision: 8,
  seasonalChests: [
    chestDefinition
  ],
  seasonalSkills: [],
  seasonalConsumables: [
    {
      id:
        "natal:biscoito",
      key:
        "natal:biscoito",
      name:
        "Biscoito de Pinheiro",
      rarity:
        "Comum",
      introducedInSeasonalChestId:
        chestDefinition.id,
      introducedInSeasonalChestOrder:
        1
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
    0.20,
    0,
    0
  ]);

const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-consumivel&args=abrir%201"
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
      "rota-consumivel"
    )
  );

assert.equal(
  stored.inventory
    .consumables.length,
  1
);

assert.equal(
  stored.inventory
    .consumables[0].key,
  "natal:biscoito"
);

assert.equal(
  stored.inventory
    .consumables[0].source,
  "seasonal_chest"
);

const pending =
  stored.chests[0]
    .metadata.seasonal
    .pendingOpen;

assert.equal(
  pending.rewardPlan
    .rewards[1].type,
  "seasonal_consumable"
);

assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);

assert.deepEqual(
  pending.rewardPlan
    .appliedRewardIndexes,
  [0, 1]
);

const firstGrantId =
  stored.inventory
    .consumables[0].grantId;

const retry =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-consumivel&args=abrir%201"
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
      "rota-consumivel"
    )
  );

assert.equal(
  retried.inventory
    .consumables.length,
  1,
  "retry não pode duplicar o Consumível Sazonal"
);

assert.equal(
  retried.inventory
    .consumables[0].grantId,
  firstGrantId
);

console.log(
  "✅ Consumível Sazonal resolvido, entregue e idempotente na rota real."
);
