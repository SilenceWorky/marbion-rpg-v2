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
    "aplica-finalizador"
  );

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:finisher",
      seasonId: "2026-12",
      order: 2,
      poolRevision: 9,
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
      "seasonal:2026-12:chest:finisher",
    chestOrder: 2,
    poolRevision: 9,
    createdAt: 200,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_pvp_finisher",
          resolved: true,
          seasonId: "2026-12",
          seasonalChestId:
            "seasonal:2026-12:chest:finisher",
          chestOrder: 2,
          poolRevision: 9,
          finisher: {
            id: "natal:rena",
            name: "Investida da Rena",
            description:
              "Finalizador de teste.",
            introducedInSeasonalChestId:
              "seasonal:2026-12:chest:finisher",
            introducedInSeasonalChestOrder:
              2
          }
        },
        {
          type:
            "seasonal_victory_message",
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
  applied.pvpFinisherRewards.length,
  1
);
assert.equal(
  applied.pvpFinisherRewards[0]
    .duplicate,
  false
);

assert.equal(
  profile.pvpFinishers.owned.length,
  1
);
assert.equal(
  profile.pvpFinishers.owned[0]
    .seasonId,
  "2026-12"
);
assert.equal(
  profile.pvpFinishers.owned[0]
    .finisherId,
  "natal:rena"
);
assert.equal(
  profile.pvpFinishers.owned[0]
    .seasonalChestId,
  "seasonal:2026-12:chest:finisher"
);
assert.equal(
  profile.pvpFinishers.owned[0]
    .chestOrder,
  2
);
assert.equal(
  profile.pvpFinishers.owned[0]
    .poolRevision,
  9
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
  profile.pvpFinishers.owned.length,
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
    .pvpFinisherRewards[0]
    .duplicate,
  true
);
assert.equal(
  profile.pvpFinishers.owned.length,
  1
);

const badProfile =
  createBaseProfile(
    "identidade-errada"
  );

const badChest =
  createSeasonalChestFromDefinition(
    badProfile,
    {
      id:
        "seasonal:2026-12:chest:bad001",
      seasonId: "2026-12",
      order: 1,
      poolRevision: 4,
      name: "Baú"
    }
  );

badChest.chest.metadata
  .seasonal.pendingOpen = {
    seasonId: "2026-12",
    seasonalChestId:
      "seasonal:2026-12:chest:bad001",
    chestOrder: 1,
    poolRevision: 4,
    createdAt: 10,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_pvp_finisher",
          resolved: true,
          seasonId: "2027-12",
          seasonalChestId:
            "seasonal:2026-12:chest:bad001",
          chestOrder: 1,
          poolRevision: 4,
          finisher: {
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
  "SEASONAL_PVP_FINISHER_REWARD_IDENTITY_MISMATCH"
);
assert.equal(
  badProfile.pvpFinishers.owned.length,
  0
);

console.log(
  "OK: aplicação idempotente de Finalizador PvP Sazonal"
);
