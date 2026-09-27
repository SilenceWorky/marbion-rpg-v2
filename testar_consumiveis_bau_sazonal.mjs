import assert from "node:assert/strict";

import {
  SEASONAL_CHEST_CONSUMABLE_RARITY_POOL
} from "./src/config/seasonal-chest-rewards.js";

import {
  getEligibleSeasonalChestConsumables,
  resolveSeasonalChestConsumableRewards
} from "./src/systems/seasonal-chest-consumable-resolver.js";


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


assert.deepEqual(
  SEASONAL_CHEST_CONSUMABLE_RARITY_POOL
    .map(entry => [
      entry.rarity,
      entry.weight
    ]),
  [
    ["Comum", 0.399],
    ["Raro", 0.30],
    ["Super Raro", 0.20],
    ["Mítico", 0.08],
    ["Lendário", 0.02],
    ["Único", 0.001]
  ]
);


const chest1 = {
  id:
    "seasonal:2026-12:chest:cons001",
  seasonId:
    "2026-12",
  order: 1,
  poolRevision: 6,
  name:
    "Baú de Pinheiro"
};

const chest2 = {
  id:
    "seasonal:2026-12:chest:cons002",
  seasonId:
    "2026-12",
  order: 2,
  poolRevision: 6,
  name:
    "Baú Rena"
};

const seasonContent = {
  id: "2026-12",
  revision: 6,
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalConsumables: [
    {
      id:
        "natal:doce-comum",
      name:
        "Doce de Pinheiro",
      rarity:
        "Comum",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder:
        1
    },
    {
      id:
        "natal:chocolate-raro",
      name:
        "Chocolate da Rena",
      rarity:
        "Raro",
      introducedInSeasonalChestId:
        chest2.id,
      introducedInSeasonalChestOrder:
        2
    },
    {
      id:
        "natal:unico",
      name:
        "Estrela Comestível",
      rarity:
        "Único",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder:
        1
    }
  ]
};


const pending1 = {
  seasonId: "2026-12",
  seasonalChestId:
    chest1.id,
  chestOrder: 1,
  poolRevision: 6,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_consumable",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const eligible1 =
  getEligibleSeasonalChestConsumables(
    pending1,
    seasonContent
  );

assert.equal(
  eligible1.ok,
  true
);

assert.deepEqual(
  eligible1.candidates
    .map(item => item.id)
    .sort(),
  [
    "natal:doce-comum",
    "natal:unico"
  ].sort(),
  "Baú #1 não pode receber consumível introduzido no Baú #2"
);


const pending2 = {
  seasonId: "2026-12",
  seasonalChestId:
    chest2.id,
  chestOrder: 2,
  poolRevision: 6,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_consumable",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const eligible2 =
  getEligibleSeasonalChestConsumables(
    pending2,
    seasonContent
  );

assert.equal(
  eligible2.ok,
  true
);

assert.deepEqual(
  eligible2.candidates
    .map(item => item.id)
    .sort(),
  [
    "natal:doce-comum",
    "natal:chocolate-raro",
    "natal:unico"
  ].sort()
);


const uniqueContent = {
  ...seasonContent,
  seasonalConsumables: [
    {
      id: "natal:comum",
      name: "Comum",
      rarity: "Comum",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:raro",
      name: "Raro",
      rarity: "Raro",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:super",
      name: "Super",
      rarity: "Super Raro",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:mitico",
      name: "Mítico",
      rarity: "Mítico",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:lendario",
      name: "Lendário",
      rarity: "Lendário",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:unico",
      name: "Único",
      rarity: "Único",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    }
  ]
};

const uniquePending = {
  ...pending1,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_consumable",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const uniqueResolved =
  resolveSeasonalChestConsumableRewards(
    uniquePending,
    uniqueContent,
    sequenceRandom([
      0.9995,
      0
    ])
  );

assert.equal(
  uniqueResolved.ok,
  true
);

assert.equal(
  uniquePending.rewardPlan
    .rewards[0].rarity,
  "Único"
);

assert.equal(
  uniquePending.rewardPlan
    .rewards[0].consumable.id,
  "natal:unico"
);

assert.equal(
  uniquePending.rewardPlan
    .hasUnresolvedRewards,
  false
);


const wrongSeason =
  resolveSeasonalChestConsumableRewards(
    {
      ...pending1,
      seasonId:
        "2027-01",
      rewardPlan: {
        rewards: [
          {
            type:
              "seasonal_consumable",
            resolved: false
          }
        ],
        hasUnresolvedRewards: true
      }
    },
    seasonContent,
    () => 0
  );

assert.equal(
  wrongSeason.ok,
  false
);

assert.equal(
  wrongSeason.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);


console.log(
  "✅ Resolver dos Consumíveis Sazonais validado."
);
