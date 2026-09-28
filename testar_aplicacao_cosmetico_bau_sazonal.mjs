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
    "aplica-cosmetico"
  );

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:cosmetic01",
      seasonId: "2026-12",
      order: 2,
      poolRevision: 11,
      name: "Baú Rena"
    },
    {
      createdAt: 100
    }
  );

assert.equal(created.ok, true);

created.chest.metadata
  .seasonal.pendingOpen = {
    seasonId: "2026-12",
    seasonalChestId:
      "seasonal:2026-12:chest:cosmetic01",
    chestOrder: 2,
    poolRevision: 11,
    createdAt: 200,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_cosmetic",
          resolved: true,
          seasonId: "2026-12",
          seasonalChestId:
            "seasonal:2026-12:chest:cosmetic01",
          chestOrder: 2,
          poolRevision: 11,
          cosmetic: {
            id: "natal:bota",
            name: "Bota Invernal",
            slot: "shoes",
            introducedInSeasonalChestId:
              "seasonal:2026-12:chest:cosmetic01",
            introducedInSeasonalChestOrder:
              2
          }
        },
        {
          type:
            "seasonal_relic",
          resolved: false
        }
      ],
      hasUnresolvedRewards: true
    }
  };


const applied =
  applyResolvedSeasonalChestRewards(
    profile,
    created.chest.id
  );

assert.equal(applied.ok, true);
assert.deepEqual(
  applied.appliedNow,
  [0]
);
assert.deepEqual(
  applied.appliedRewardIndexes,
  [0]
);
assert.deepEqual(
  applied.unresolvedIndexes,
  [1]
);
assert.equal(
  applied.fullyResolved,
  false
);
assert.equal(
  applied.cosmeticRewards.length,
  1
);
assert.equal(
  applied.cosmeticRewards[0]
    .duplicate,
  false
);

assert.equal(
  profile.cosmetics.owned.length,
  1
);
assert.equal(
  profile.cosmetics.owned[0]
    .seasonId,
  "2026-12"
);
assert.equal(
  profile.cosmetics.owned[0]
    .cosmeticId,
  "natal:bota"
);
assert.equal(
  profile.cosmetics.owned[0].name,
  "Bota Invernal"
);
assert.equal(
  profile.cosmetics.owned[0].slot,
  "shoes"
);
assert.equal(
  profile.cosmetics.owned[0]
    .source,
  "seasonal_chest"
);
assert.equal(
  profile.cosmetics.owned[0]
    .seasonalChestId,
  "seasonal:2026-12:chest:cosmetic01"
);
assert.equal(
  profile.cosmetics.owned[0]
    .chestOrder,
  2
);
assert.equal(
  profile.cosmetics.owned[0]
    .poolRevision,
  11
);
assert.equal(
  profile.cosmetics.owned[0]
    .acquiredAt,
  200
);


const retry =
  applyResolvedSeasonalChestRewards(
    profile,
    created.chest.id
  );

assert.equal(retry.ok, true);
assert.deepEqual(
  retry.appliedNow,
  []
);
assert.equal(
  profile.cosmetics.owned.length,
  1
);


created.chest.metadata
  .seasonal.pendingOpen
  .rewardPlan.appliedRewardIndexes = [];

const defensiveRetry =
  applyResolvedSeasonalChestRewards(
    profile,
    created.chest.id
  );

assert.equal(
  defensiveRetry.ok,
  true
);
assert.equal(
  defensiveRetry
    .cosmeticRewards[0]
    .duplicate,
  true
);
assert.equal(
  profile.cosmetics.owned.length,
  1
);


const badProfile =
  createBaseProfile(
    "cosmetico-identidade-errada"
  );

const badChest =
  createSeasonalChestFromDefinition(
    badProfile,
    {
      id:
        "seasonal:2026-12:chest:badcosmetic01",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 4,
      name: "Baú"
    }
  );

assert.equal(badChest.ok, true);

badChest.chest.metadata
  .seasonal.pendingOpen = {
    seasonId: "2026-12",
    seasonalChestId:
      "seasonal:2026-12:chest:badcosmetic01",
    chestOrder: 1,
    poolRevision: 4,
    createdAt: 10,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_cosmetic",
          resolved: true,
          seasonId: "2027-12",
          seasonalChestId:
            "seasonal:2026-12:chest:badcosmetic01",
          chestOrder: 1,
          poolRevision: 4,
          cosmetic: {
            id: "erro",
            name: "Erro"
          }
        }
      ],
      hasUnresolvedRewards: false
    }
  };

const mismatch =
  applyResolvedSeasonalChestRewards(
    badProfile,
    badChest.chest.id
  );

assert.equal(mismatch.ok, false);
assert.equal(
  mismatch.error,
  "SEASONAL_COSMETIC_REWARD_IDENTITY_MISMATCH"
);
assert.equal(
  badProfile.cosmetics.owned.length,
  0
);


const invalidProfile =
  createBaseProfile(
    "cosmetico-invalido"
  );

const invalidChest =
  createSeasonalChestFromDefinition(
    invalidProfile,
    {
      id:
        "seasonal:2026-12:chest:invalidcos01",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 2,
      name: "Baú"
    }
  );

invalidChest.chest.metadata
  .seasonal.pendingOpen = {
    seasonId: "2026-12",
    seasonalChestId:
      "seasonal:2026-12:chest:invalidcos01",
    chestOrder: 1,
    poolRevision: 2,
    createdAt: 10,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_cosmetic",
          resolved: true,
          seasonId: "2026-12",
          seasonalChestId:
            "seasonal:2026-12:chest:invalidcos01",
          chestOrder: 1,
          poolRevision: 2,
          cosmetic: {
            id: "sem-nome",
            name: ""
          }
        }
      ],
      hasUnresolvedRewards: false
    }
  };

const invalid =
  applyResolvedSeasonalChestRewards(
    invalidProfile,
    invalidChest.chest.id
  );

assert.equal(invalid.ok, false);
assert.equal(
  invalid.error,
  "INVALID_SEASONAL_COSMETIC_REWARD"
);
assert.equal(
  invalidProfile.cosmetics.owned.length,
  0
);


console.log(
  "OK: aplicação idempotente de Cosmético Sazonal"
);
