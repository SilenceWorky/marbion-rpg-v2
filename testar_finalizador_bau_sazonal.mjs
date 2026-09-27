import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  grantPvpFinisher
} from "./src/systems/pvp-finisher-collection.js";

import {
  getEligibleSeasonalChestPvpFinishers,
  resolveSeasonalChestPvpFinisherRewards
} from "./src/systems/seasonal-chest-pvp-finisher-resolver.js";


const chest1 = {
  id: "seasonal:2026-12:chest:1",
  seasonId: "2026-12",
  order: 1,
  name: "Baú de Pinheiro",
  poolRevision: 9,
  createdAt: 1,
  updatedAt: 1
};
const chest2 = {
  id: "seasonal:2026-12:chest:2",
  seasonId: "2026-12",
  order: 2,
  name: "Baú Rena",
  poolRevision: 9,
  createdAt: 1,
  updatedAt: 1
};

const content = {
  version: 2,
  id: "2026-12",
  year: 2026,
  month: 12,
  revision: 9,
  featuredElements: [],
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalSkills: [],
  seasonalConsumables: [],
  seasonalPvpFinishers: [
    {
      id: "natal:nevasca",
      name: "Nevasca Final",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:rena",
      name: "Investida da Rena",
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
              "seasonal_pvp_finisher",
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
  getEligibleSeasonalChestPvpFinishers(
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
  ["natal:nevasca"]
);
assert.deepEqual(
  eligibleChest1.candidates
    .map(item => item.id),
  ["natal:nevasca"]
);
const resolvedChest1 =
  resolveSeasonalChestPvpFinisherRewards(
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
    .finisher.id,
  "natal:nevasca"
);
assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .seasonalChestId,
  chest1.id
);
assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .poolRevision,
  9
);
const ownsFirst =
  createBaseProfile("owns-first");

grantPvpFinisher(
  ownsFirst,
  {
    seasonId: "2026-12",
    finisherId: "natal:nevasca",
    name: "Nevasca Final"
  }
);

const chest1Fallback =
  resolveSeasonalChestPvpFinisherRewards(
    ownsFirst,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(chest1Fallback.ok, true);
assert.equal(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0].type,
  "money"
);
assert.equal(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0]
    .fallbackFrom,
  "seasonal_pvp_finisher"
);
assert.deepEqual(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0].money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 1
  }
);

const chest2Pending =
  pendingFor(chest2);

const eligibleChest2 =
  getEligibleSeasonalChestPvpFinishers(
    ownsFirst,
    chest2Pending,
    content
  );

assert.equal(
  eligibleChest2.ok,
  true
);
assert.deepEqual(
  eligibleChest2.catalogCandidates
    .map(item => item.id),
  [
    "natal:nevasca",
    "natal:rena"
  ]
);
assert.deepEqual(
  eligibleChest2.candidates
    .map(item => item.id),
  ["natal:rena"]
);

const resolvedChest2 =
  resolveSeasonalChestPvpFinisherRewards(
    ownsFirst,
    chest2Pending,
    content,
    () => 0
  );

assert.equal(resolvedChest2.ok, true);
assert.equal(
  resolvedChest2.pendingOpen
    .rewardPlan.rewards[0]
    .finisher.id,
  "natal:rena"
);

const otherSeason =
  createBaseProfile("other-season");

grantPvpFinisher(
  otherSeason,
  {
    seasonId: "2027-12",
    finisherId: "natal:nevasca",
    name: "Mesmo ID, outra temporada"
  }
);

const otherSeasonResult =
  resolveSeasonalChestPvpFinisherRewards(
    otherSeason,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(otherSeasonResult.ok, true);
assert.equal(
  otherSeasonResult.pendingOpen
    .rewardPlan.rewards[0]
    .finisher.id,
  "natal:nevasca"
);

const twoNew =
  createBaseProfile("two-new");

const twoRewards =
  resolveSeasonalChestPvpFinisherRewards(
    twoNew,
    pendingFor(chest2, 3),
    content,
    () => 0
  );

assert.equal(twoRewards.ok, true);
const twoRewardPlan =
  twoRewards.pendingOpen
    .rewardPlan.rewards;

assert.equal(
  twoRewardPlan[0]
    .finisher.id,
  "natal:nevasca"
);
assert.equal(
  twoRewardPlan[1]
    .finisher.id,
  "natal:rena"
);
assert.equal(
  twoRewardPlan[2].type,
  "money"
);
assert.equal(
  twoRewardPlan[2].money.platinum,
  1
);

const badRevision =
  pendingFor(chest1);

badRevision.poolRevision = 8;

const mismatch =
  resolveSeasonalChestPvpFinisherRewards(
    clean,
    badRevision,
    content,
    () => 0
  );

assert.equal(mismatch.ok, false);
assert.equal(
  mismatch.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);

let randomCalls = 0;

const alreadyResolved =
  pendingFor(chest1);

alreadyResolved.rewardPlan.rewards[0] = {
  type: "seasonal_pvp_finisher",
  resolved: true,
  finisher: {
    id: "natal:nevasca",
    name: "Nevasca Final"
  }
};

const retry =
  resolveSeasonalChestPvpFinisherRewards(
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
assert.equal(randomCalls, 0);

const emptyContent = {
  ...content,
  seasonalPvpFinishers: []
};

const empty =
  resolveSeasonalChestPvpFinisherRewards(
    clean,
    pendingFor(chest1),
    emptyContent,
    () => 0
  );

assert.equal(empty.ok, false);
assert.equal(
  empty.error,
  "SEASONAL_PVP_FINISHER_CATALOG_EMPTY"
);

console.log(
  "OK: resolver de Finalizadores PvP Sazonais"
);
