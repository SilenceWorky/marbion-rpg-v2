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
    "aplica-mensagem-vitoria"
  );

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:message01",
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
      "seasonal:2026-12:chest:message01",
    chestOrder: 2,
    poolRevision: 9,
    createdAt: 200,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_victory_message",
          resolved: true,
          seasonId: "2026-12",
          seasonalChestId:
            "seasonal:2026-12:chest:message01",
          chestOrder: 2,
          poolRevision: 9,
          message: {
            id: "natal:rena",
            text:
              "A rena chegou primeiro à vitória!",
            introducedInSeasonalChestId:
              "seasonal:2026-12:chest:message01",
            introducedInSeasonalChestOrder:
              2
          }
        },
        {
          type:
            "seasonal_cosmetic",
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
  applied.victoryMessageRewards.length,
  1
);
assert.equal(
  applied.victoryMessageRewards[0]
    .duplicate,
  false
);

assert.equal(
  profile.victoryMessages.owned.length,
  1
);
assert.equal(
  profile.victoryMessages.owned[0]
    .seasonId,
  "2026-12"
);
assert.equal(
  profile.victoryMessages.owned[0]
    .messageId,
  "natal:rena"
);
assert.equal(
  profile.victoryMessages.owned[0].text,
  "A rena chegou primeiro à vitória!"
);
assert.equal(
  profile.victoryMessages.owned[0]
    .seasonalChestId,
  "seasonal:2026-12:chest:message01"
);
assert.equal(
  profile.victoryMessages.owned[0]
    .chestOrder,
  2
);
assert.equal(
  profile.victoryMessages.owned[0]
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
  profile.victoryMessages.owned.length,
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
    .victoryMessageRewards[0]
    .duplicate,
  true
);
assert.equal(
  profile.victoryMessages.owned.length,
  1
);


const badProfile =
  createBaseProfile(
    "mensagem-identidade-errada"
  );

const badChest =
  createSeasonalChestFromDefinition(
    badProfile,
    {
      id:
        "seasonal:2026-12:chest:badmsg01",
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
      "seasonal:2026-12:chest:badmsg01",
    chestOrder: 1,
    poolRevision: 4,
    createdAt: 10,
    rewardPlan: {
      rewards: [
        {
          type:
            "seasonal_victory_message",
          resolved: true,
          seasonId: "2027-12",
          seasonalChestId:
            "seasonal:2026-12:chest:badmsg01",
          chestOrder: 1,
          poolRevision: 4,
          message: {
            id: "erro",
            text: "Erro"
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
  "SEASONAL_VICTORY_MESSAGE_REWARD_IDENTITY_MISMATCH"
);
assert.equal(
  badProfile.victoryMessages.owned.length,
  0
);


console.log(
  "OK: aplicação idempotente de Mensagem de Vitória Sazonal"
);
