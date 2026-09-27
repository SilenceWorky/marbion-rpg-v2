import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  resolveAtomicChestConsumableRewards
} from "./src/systems/atomic-chest-consumable-resolver.js";

import {
  applyResolvedAtomicChestRewards
} from "./src/systems/atomic-chest-reward-apply.js";


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

const profile =
  createBaseProfile(
    "silenceworky"
  );

const created =
  createAtomicChest(
    profile,
    {
      currentAtoms: 3,
      pendingOpen: {
        atoms: 3,
        attemptNumber: 1,
        scripted: false,
        createdAt: 1234,
        rewardPlan: {
          atoms: 3,
          rewards: [
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

const pendingOpen =
  created.chest.metadata.atomic
    .pendingOpen;

const resolved =
  resolveAtomicChestConsumableRewards(
    pendingOpen,
    sequenceRandom([
      0.90,
      0.20
    ])
  );

assert.equal(
  resolved.ok,
  true
);

assert.equal(
  pendingOpen.rewardPlan
    .rewards[0]
    .consumable.key,
  "vida_melhorada"
);

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
  [0]
);

assert.equal(
  first.consumableRewards.length,
  1
);

assert.equal(
  first.consumableRewards[0]
    .duplicate,
  false
);

assert.equal(
  profile.inventory
    .consumables.length,
  1
);

assert.equal(
  profile.inventory
    .consumables[0].key,
  "vida_melhorada"
);

assert.equal(
  profile.inventory
    .consumables[0].source,
  "atomic_chest"
);

assert.equal(
  profile.inventory
    .consumables[0].grantId,
  `atomic_chest:${chestId}:reward:0:unit:0`
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

assert.equal(
  profile.inventory
    .consumables.length,
  1
);

created.chest.metadata.atomic
  .pendingOpen.rewardPlan
  .appliedRewardIndexes = [];

const retryWithoutMarker =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  retryWithoutMarker.ok,
  true
);

assert.deepEqual(
  retryWithoutMarker.appliedNow,
  [0]
);

assert.equal(
  retryWithoutMarker
    .consumableRewards[0]
    .duplicate,
  true
);

assert.equal(
  profile.inventory
    .consumables.length,
  1,
  "grantId precisa impedir consumível duplicado"
);

assert.equal(
  profile.inventory
    .consumableSequence,
  1
);


console.log(
  "✅ Entrega idempotente de Consumíveis do Baú Atômico validada."
);
