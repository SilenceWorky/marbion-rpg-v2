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
    "rota-mensagem"
  );

profile.race =
  "Metamorfo";

const chestDefinition = {
  id:
    "seasonal:2026-12:chest:msgroute",
  seasonId:
    "2026-12",
  order: 2,
  poolRevision: 12,
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
  revision: 12,
  seasonalChests: [
    {
      id:
        "seasonal:2026-12:chest:firstmsg",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 12,
      name: "Baú de Pinheiro"
    },
    chestDefinition
  ],
  seasonalSkills: [],
  seasonalConsumables: [],
  seasonalPvpFinishers: [],
  seasonalVictoryMessages: [
    {
      id:
        "natal:neve",
      text:
        "A neve cai sobre mais uma vitória!",
      introducedInSeasonalChestId:
        "seasonal:2026-12:chest:firstmsg",
      introducedInSeasonalChestOrder:
        1
    },
    {
      id:
        "natal:rena",
      text:
        "A rena chegou primeiro à vitória!",
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
    0.75,
    0.99
  ]);
const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-mensagem&args=abrir%201"
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
      "rota-mensagem"
    )
  );

assert.equal(
  stored.victoryMessages.owned.length,
  1
);

assert.equal(
  stored.victoryMessages.owned[0]
    .seasonId,
  "2026-12"
);

assert.equal(
  stored.victoryMessages.owned[0]
    .messageId,
  "natal:rena"
);
assert.equal(
  stored.victoryMessages.owned[0]
    .text,
  "A rena chegou primeiro à vitória!"
);

assert.equal(
  stored.victoryMessages.owned[0]
    .source,
  "seasonal_chest"
);

assert.equal(
  stored.victoryMessages.owned[0]
    .seasonalChestId,
  chestDefinition.id
);

assert.equal(
  stored.victoryMessages.owned[0]
    .chestOrder,
  2
);

assert.equal(
  stored.victoryMessages.owned[0]
    .poolRevision,
  12
);

const pending =
  stored.chests[0]
    .metadata.seasonal
    .pendingOpen;

assert.equal(
  pending.rewardPlan
    .rewards[1].type,
  "seasonal_victory_message"
);
assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);

assert.equal(
  pending.rewardPlan
    .rewards[1].message.id,
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
      "https://worker.test/bau?user=rota-mensagem&args=abrir%201"
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
      "rota-mensagem"
    )
  );

assert.equal(
  retried.victoryMessages.owned.length,
  1,
  "retry não pode duplicar Mensagem de Vitória Sazonal"
);

assert.equal(
  retried.victoryMessages.owned[0]
    .messageId,
  "natal:rena"
);

assert.equal(
  retried.chests[0]
    .metadata.seasonal
    .pendingOpen.rewardPlan
    .rewards[1].message.id,
  "natal:rena",
  "retry deve reutilizar o plano congelado sem reroll"
);


console.log(
  "OK: Mensagem de Vitória Sazonal resolvida, entregue e idempotente na rota real"
);
