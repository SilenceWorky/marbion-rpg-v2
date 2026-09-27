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
    "rota-finalizador"
  );

profile.race =
  "Metamorfo";

const chestDefinition = {
  id:
    "seasonal:2026-12:chest:finroute",
  seasonId:
    "2026-12",
  order: 2,
  poolRevision: 11,
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
  revision: 11,
  seasonalChests: [
    {
      id:
        "seasonal:2026-12:chest:first01",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 11,
      name: "Baú de Pinheiro"
    },
    chestDefinition
  ],
  seasonalSkills: [],
  seasonalConsumables: [],
  seasonalPvpFinishers: [
    {
      id:
        "natal:nevasca",
      name:
        "Nevasca Final",
      introducedInSeasonalChestId:
        "seasonal:2026-12:chest:first01",
      introducedInSeasonalChestOrder:
        1
    },
    {
      id:
        "natal:rena",
      name:
        "Investida da Rena",
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
    0.55,
    0.99
  ]);

const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-finalizador&args=abrir%201"
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
      "rota-finalizador"
    )
  );

assert.equal(
  stored.pvpFinishers.owned.length,
  1
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .seasonId,
  "2026-12"
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .finisherId,
  "natal:rena",
  "Baú #2 deve poder sortear conteúdo #1+#2; RNG 0.99 escolhe o segundo novo"
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .source,
  "seasonal_chest"
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .seasonalChestId,
  chestDefinition.id
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .chestOrder,
  2
);
assert.equal(
  stored.pvpFinishers.owned[0]
    .poolRevision,
  11
);
const pending =
  stored.chests[0]
    .metadata.seasonal
    .pendingOpen;

assert.equal(
  pending.rewardPlan
    .rewards[1].type,
  "seasonal_pvp_finisher"
);
assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);
assert.equal(
  pending.rewardPlan
    .rewards[1].finisher.id,
  "natal:rena"
);
assert.deepEqual(
  pending.rewardPlan
    .appliedRewardIndexes,
  [0, 1]
);

assert.equal(
  stored.chests.length,
  1,
  "Baú Sazonal ainda não pode ser removido antes das demais categorias"
);

const retry =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-finalizador&args=abrir%201"
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
      "rota-finalizador"
    )
  );

assert.equal(
  retried.pvpFinishers.owned.length,
  1,
  "retry não pode duplicar Finalizador PvP Sazonal"
);
assert.equal(
  retried.pvpFinishers.owned[0]
    .finisherId,
  "natal:rena"
);
assert.equal(
  retried.chests[0]
    .metadata.seasonal
    .pendingOpen.rewardPlan
    .rewards[1].finisher.id,
  "natal:rena",
  "retry deve reutilizar o plano congelado sem reroll"
);

console.log(
  "OK: Finalizador PvP Sazonal resolvido, entregue e idempotente na rota real"
);
