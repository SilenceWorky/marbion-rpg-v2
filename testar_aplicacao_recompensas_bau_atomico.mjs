import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  applyResolvedAtomicChestRewards
} from "./src/systems/atomic-chest-reward-apply.js";


const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.race =
  "Terrariano";

profile.xp = 190;

const created =
  createAtomicChest(
    profile,
    {
      currentAtoms: 2,
      pendingOpen: {
        atoms: 2,
        attemptNumber: 1,
        scripted: false,
        createdAt: 1000,
        rewardPlan: {
          atoms: 2,
          rewards: [
            {
              type: "normal_xp",
              resolved: true,
              amount: 23
            },
            {
              type: "money",
              resolved: true,
              money: {
                bronze: 8,
                silver: 1,
                gold: 0,
                platinum: 0
              }
            },
            {
              type: "consumable",
              resolved: false,
              quantity: 1
            }
          ],
          hasUnresolvedRewards: true,
          appliedRewardIndexes: []
        }
      }
    }
  );

assert.equal(
  created.ok,
  true
);

const chestId =
  created.chest.id;


const first =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  first.ok,
  true
);

assert.deepEqual(
  first.appliedNow,
  [
    0,
    1
  ]
);

assert.deepEqual(
  first.unresolvedIndexes,
  [
    2
  ]
);

assert.equal(
  first.fullyResolved,
  false
);

assert.equal(
  profile.level,
  2,
  "23 XP sobre 190/200 deve subir um nível"
);

assert.equal(
  profile.xp,
  13
);

assert.equal(
  profile.statusPoints,
  1
);

assert.deepEqual(
  profile.money,
  {
    bronze: 8,
    silver: 1,
    gold: 0,
    platinum: 0
  }
);

assert.deepEqual(
  created.chest.metadata.atomic
    .pendingOpen.rewardPlan
    .appliedRewardIndexes,
  [
    0,
    1
  ]
);


const snapshot =
  structuredClone(
    {
      level:
        profile.level,
      xp:
        profile.xp,
      statusPoints:
        profile.statusPoints,
      money:
        profile.money,
      applied:
        created.chest.metadata.atomic
          .pendingOpen.rewardPlan
          .appliedRewardIndexes
    }
  );


const retry =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  retry.ok,
  true
);

assert.deepEqual(
  retry.appliedNow,
  []
);

assert.deepEqual(
  {
    level:
      profile.level,
    xp:
      profile.xp,
    statusPoints:
      profile.statusPoints,
    money:
      profile.money,
    applied:
      created.chest.metadata.atomic
        .pendingOpen.rewardPlan
        .appliedRewardIndexes
  },
  snapshot,
  "retry não pode duplicar XP, dinheiro nem marcadores"
);


const unsupportedProfile =
  createBaseProfile(
    "unsupported"
  );

unsupportedProfile.race =
  "Elfo";

const unsupportedChest =
  createAtomicChest(
    unsupportedProfile,
    {
      pendingOpen: {
        atoms: 1,
        attemptNumber: 1,
        scripted: false,
        createdAt: 2000,
        rewardPlan: {
          atoms: 1,
          rewards: [
            {
              type: "normal_xp",
              resolved: true,
              amount: 10
            },
            {
              type: "mystery_reward",
              resolved: true
            }
          ],
          hasUnresolvedRewards: false,
          appliedRewardIndexes: []
        }
      }
    }
  ).chest;

const unsupported =
  applyResolvedAtomicChestRewards(
    unsupportedProfile,
    unsupportedChest.id
  );

assert.equal(
  unsupported.ok,
  false
);

assert.equal(
  unsupported.error,
  "UNSUPPORTED_RESOLVED_ATOMIC_REWARD"
);

assert.equal(
  unsupportedProfile.xp,
  0,
  "pré-validação deve impedir aplicação parcial antes do erro"
);


console.log(
  "✅ Aplicação idempotente das recompensas resolvidas do Baú Atômico validada."
);
