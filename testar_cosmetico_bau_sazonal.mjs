import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  grantCosmetic
} from "./src/systems/cosmetic-collection.js";

import {
  getEligibleSeasonalChestCosmetics,
  resolveSeasonalChestCosmeticRewards
} from "./src/systems/seasonal-chest-cosmetic-resolver.js";


const chest1 = {
  id: "seasonal:2026-12:chest:cosmetic1",
  seasonId: "2026-12",
  order: 1,
  name: "Baú de Pinheiro",
  poolRevision: 11,
  createdAt: 1,
  updatedAt: 1
};

const chest2 = {
  id: "seasonal:2026-12:chest:cosmetic2",
  seasonId: "2026-12",
  order: 2,
  name: "Baú Rena",
  poolRevision: 11,
  createdAt: 1,
  updatedAt: 1
};

const content = {
  version: 6,
  id: "2026-12",
  year: 2026,
  month: 12,
  revision: 11,
  featuredElements: [],
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalCosmetics: [
    {
      id: "natal:cachecol",
      name: "Cachecol Congelado",
      slot: "accessory",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:bota",
      name: "Bota Invernal",
      slot: "shoes",
      introducedInSeasonalChestId:
        chest2.id,
      introducedInSeasonalChestOrder: 2
    }
  ],
  updatedAt: 1
};

function pendingFor(
  chest,
  count = 1
) {
  return {
    seasonId: chest.seasonId,
    seasonalChestId: chest.id,
    chestOrder: chest.order,
    poolRevision: chest.poolRevision,
    createdAt: 10,
    rewardPlan: {
      rewards:
        Array.from(
          { length: count },
          () => ({
            type:
              "seasonal_cosmetic",
            resolved: false
          })
        ),
      hasUnresolvedRewards: true
    }
  };
}


const clean =
  createBaseProfile("clean");

const eligibleChest1 =
  getEligibleSeasonalChestCosmetics(
    clean,
    pendingFor(chest1),
    content
  );

assert.equal(
  eligibleChest1.ok,
  true
);

assert.deepEqual(
  eligibleChest1.catalogCandidates
    .map(item => item.id),
  ["natal:cachecol"]
);

const resolvedChest1 =
  resolveSeasonalChestCosmeticRewards(
    clean,
    pendingFor(chest1),
    content,
    () => 0.99
  );

assert.equal(
  resolvedChest1.ok,
  true
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .cosmetic.id,
  "natal:cachecol"
);
assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .cosmetic.slot,
  "accessory"
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .poolRevision,
  11
);


const ownsFirst =
  createBaseProfile("owns-first");

grantCosmetic(
  ownsFirst,
  {
    seasonId: "2026-12",
    cosmeticId: "natal:cachecol",
    name: "Cachecol Congelado"
  }
);

const fallback =
  resolveSeasonalChestCosmeticRewards(
    ownsFirst,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(fallback.ok, true);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0].type,
  "money"
);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0]
    .fallbackFrom,
  "seasonal_cosmetic"
);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0]
    .money.platinum,
  1
);


const eligibleChest2 =
  getEligibleSeasonalChestCosmetics(
    ownsFirst,
    pendingFor(chest2),
    content
  );

assert.deepEqual(
  eligibleChest2.catalogCandidates
    .map(item => item.id),
  [
    "natal:cachecol",
    "natal:bota"
  ]
);

assert.deepEqual(
  eligibleChest2.candidates
    .map(item => item.id),
  ["natal:bota"]
);

const resolvedChest2 =
  resolveSeasonalChestCosmeticRewards(
    ownsFirst,
    pendingFor(chest2),
    content,
    () => 0
  );

assert.equal(
  resolvedChest2.pendingOpen
    .rewardPlan.rewards[0]
    .cosmetic.id,
  "natal:bota"
);


const otherSeason =
  createBaseProfile("other-season");

grantCosmetic(
  otherSeason,
  {
    seasonId: "2027-12",
    cosmeticId: "natal:cachecol",
    name: "Mesmo ID, outro ano"
  }
);

const otherSeasonResult =
  resolveSeasonalChestCosmeticRewards(
    otherSeason,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(
  otherSeasonResult.pendingOpen
    .rewardPlan.rewards[0]
    .cosmetic.id,
  "natal:cachecol"
);


const threeRewards =
  resolveSeasonalChestCosmeticRewards(
    createBaseProfile("three"),
    pendingFor(chest2, 3),
    content,
    () => 0
  );

const rewards =
  threeRewards.pendingOpen
    .rewardPlan.rewards;

assert.equal(
  rewards[0].cosmetic.id,
  "natal:cachecol"
);
assert.equal(
  rewards[1].cosmetic.id,
  "natal:bota"
);
assert.equal(
  rewards[2].type,
  "money"
);
assert.equal(
  rewards[2].money.platinum,
  1
);


const badRevision =
  pendingFor(chest1);

badRevision.poolRevision = 10;

const mismatch =
  resolveSeasonalChestCosmeticRewards(
    clean,
    badRevision,
    content,
    () => 0
  );

assert.equal(
  mismatch.ok,
  false
);
assert.equal(
  mismatch.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);


let randomCalls = 0;

const alreadyResolved =
  pendingFor(chest1);

alreadyResolved.rewardPlan.rewards[0] = {
  type: "seasonal_cosmetic",
  resolved: true,
  cosmetic: {
    id: "natal:cachecol",
    name: "Cachecol Congelado"
  }
};

const retry =
  resolveSeasonalChestCosmeticRewards(
    clean,
    alreadyResolved,
    content,
    () => {
      randomCalls += 1;
      return 0.5;
    }
  );

assert.equal(retry.ok, true);
assert.deepEqual(
  retry.resolvedIndexes,
  []
);
assert.equal(
  randomCalls,
  0
);


const empty =
  resolveSeasonalChestCosmeticRewards(
    clean,
    pendingFor(chest1),
    {
      ...content,
      seasonalCosmetics: []
    },
    () => 0
  );

assert.equal(empty.ok, false);
assert.equal(
  empty.error,
  "SEASONAL_COSMETIC_CATALOG_EMPTY"
);


console.log(
  "OK: resolver de Cosméticos Sazonais"
);
