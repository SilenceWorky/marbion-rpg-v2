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

      assert.equal(
        url.pathname,
        "/season/content/revision"
      );

      assert.equal(
        url.searchParams.get("year"),
        "2026"
      );

      assert.equal(
        url.searchParams.get("month"),
        "12"
      );

      assert.equal(
        url.searchParams.get("revision"),
        "5"
      );

      return Response.json({
        ok: true,
        content:
          structuredClone(
            seasonContent
          )
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
    "rota-sazonal"
  );

profile.race =
  "Metamorfo";

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:route001",
      seasonId:
        "2026-12",
      order: 2,
      poolRevision: 5,
      name:
        "Baú Rena"
    },
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
  revision: 5,
  seasonalChests: [
    {
      id:
        "seasonal:2026-12:chest:route001",
      seasonId:
        "2026-12",
      order: 2,
      poolRevision: 5,
      name:
        "Baú Rena"
    }
  ],
  seasonalSkills: [
    {
      id:
        "natal:chama-da-rena",
      element:
        "Fogo",
      name:
        "Chama da Rena",
      rarity:
        "Comum",
      introducedInSeasonalChestId:
        "seasonal:2026-12:chest:route001",
      introducedInSeasonalChestOrder:
        2
    }
  ]
};

profile.elements = [
  "Fogo"
];

const env =
  createEnv(
    profile,
    seasonContent
  );

const originalRandom =
  Math.random;

Math.random =
  () => 0;

const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=rota-sazonal&args=abrir%201"
    ),
    env
  );

Math.random =
  originalRandom;

assert.equal(
  await response.text(),
  "📦 @rota-sazonal, Baú Rena teve a abertura registrada. O plano de recompensas foi congelado e as recompensas sazonais disponíveis foram resolvidas com o catálogo histórico correto."
);

const stored =
  JSON.parse(
    env.store.get(
      "rota-sazonal"
    )
  );

assert.equal(
  stored.chests.length,
  1,
  "o Baú Sazonal não deve ser consumido antes da finalização sazonal"
);

const pending =
  stored.chests[0]
    .metadata.seasonal
    .pendingOpen;

assert.equal(
  pending.seasonId,
  "2026-12"
);

assert.equal(
  pending.seasonalChestId,
  "seasonal:2026-12:chest:route001"
);

assert.equal(
  pending.chestOrder,
  2
);

assert.equal(
  pending.poolRevision,
  5
);

assert.equal(
  pending.rewardPlan
    .rewards[1].type,
  "seasonal_skill"
);

assert.equal(
  pending.rewardPlan
    .rewards[1].resolved,
  true
);

assert.equal(
  pending.rewardPlan
    .rewards[1].skill.id,
  "natal:chama-da-rena"
);

assert.equal(
  pending.rewardPlan
    .rewards[1].poolRevision,
  5
);

console.log(
  "✅ Rota do Baú Sazonal separada do fluxo Atômico e pendingOpen persistido."
);
