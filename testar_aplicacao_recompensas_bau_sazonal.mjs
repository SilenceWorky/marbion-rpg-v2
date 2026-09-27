import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createSeasonalChestFromDefinition
} from "./src/systems/seasonal-chest-state.js";

import {
  applyResolvedSeasonalChestRewards
} from "./src/systems/seasonal-chest-reward-apply.js";


const profile =
  createBaseProfile(
    "aplica-sazonal"
  );

profile.elements = [
  "Fogo"
];

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:apply001",
      seasonId:
        "2026-12",
      order: 2,
      poolRevision: 9,
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

created.chest.metadata
  .seasonal.pendingOpen = {
    seasonId:
      "2026-12",
    seasonalChestId:
      "seasonal:2026-12:chest:apply001",
    chestOrder: 2,
    poolRevision: 9,
    createdAt: 200,
    rewardPlan: {
      rewards: [
        {
          type:
            "normal_xp",
          resolved: true,
          amount: 50
        },
        {
          type:
            "money",
          resolved: true,
          bronzeEquivalent: 20,
          money: {
            bronze: 0,
            silver: 2,
            gold: 0,
            platinum: 0
          }
        },
        {
          type:
            "seasonal_skill",
          resolved: true,
          seasonId:
            "2026-12",
          seasonalChestId:
            "seasonal:2026-12:chest:apply001",
          chestOrder: 2,
          poolRevision: 9,
          rarity:
            "Comum",
          skill: {
            id:
              "natal:chama-da-rena",
            element:
              "Fogo",
            name:
              "Chama da Rena",
            rarity:
              "Comum"
          }
        },
        {
          type:
            "seasonal_consumable",
          resolved: true,
          quantity: 1,
          consumable: {
            id:
              "natal:doce-comum",
            key:
              "natal:doce-comum",
            name:
              "Doce de Pinheiro",
            rarity:
              "Comum"
          }
        }
      ],
      hasUnresolvedRewards: true
    }
  };


const first =
  applyResolvedSeasonalChestRewards(
    profile,
    created.chest.id
  );

assert.equal(
  first.ok,
  true
);

assert.deepEqual(
  first.appliedRewardIndexes,
  [0, 1, 2, 3]
);

assert.deepEqual(
  first.unresolvedIndexes,
  []
);

assert.equal(
  first.fullyResolved,
  true
);

assert.equal(
  profile.xp,
  50
);

assert.equal(
  profile.money.silver,
  2
);

assert.equal(
  profile.skills.includes(
    "natal:chama-da-rena"
  ),
  true
);

assert.equal(
  profile.skillMeta[
    "natal:chama-da-rena"
  ].source,
  "seasonal_chest"
);

assert.equal(
  profile.inventory
    .consumables.length,
  1
);

assert.equal(
  profile.inventory
    .consumables[0].key,
  "natal:doce-comum"
);

assert.equal(
  profile.inventory
    .consumables[0].source,
  "seasonal_chest"
);

const snapshot = {
  xp:
    profile.xp,
  money:
    structuredClone(
      profile.money
    ),
  skills:
    structuredClone(
      profile.skills
    ),
  consumables:
    structuredClone(
      profile.inventory
        .consumables
    )
};


const second =
  applyResolvedSeasonalChestRewards(
    profile,
    created.chest.id
  );

assert.equal(
  second.ok,
  true
);

assert.deepEqual(
  second.appliedNow,
  []
);

assert.deepEqual(
  {
    xp:
      profile.xp,
    money:
      profile.money,
    skills:
      profile.skills,
    consumables:
      profile.inventory
        .consumables
  },
  snapshot,
  "retry não pode duplicar XP, dinheiro, habilidade nem consumível"
);

console.log(
  "✅ Aplicação idempotente de XP, dinheiro e habilidade do Baú Sazonal validada."
);
