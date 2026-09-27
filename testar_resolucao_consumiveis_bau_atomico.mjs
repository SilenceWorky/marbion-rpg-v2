import assert from "node:assert/strict";

import {
  SPECIAL_CONSUMABLE_BASE_CHANCE,
  getAtomicConsumableTierPool
} from "./src/systems/consumable-catalog.js";

import {
  resolveAtomicChestConsumableRewards
} from "./src/systems/atomic-chest-consumable-resolver.js";


function sequenceRandom(
  values
) {
  let index = 0;

  return () => {
    if (index >= values.length) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    return values[
      index++
    ];
  };
}

assert.equal(
  SPECIAL_CONSUMABLE_BASE_CHANCE,
  0.001
);

const poolThree =
  getAtomicConsumableTierPool(
    3
  );

assert.equal(
  poolThree.reduce(
    (sum, entry) =>
      sum + entry.weight,
    0
  ),
  1
);

assert.deepEqual(
  poolThree.map(
    entry => [
      entry.tier,
      entry.weight
    ]
  ),
  [
    ["simples", 0.55],
    ["comum", 0.30],
    ["melhorada", 0.149],
    ["especial", 0.001]
  ]
);

const pendingTwo = {
  atoms: 2,
  rewardPlan: {
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 20
      },
      {
        type: "consumable",
        resolved: false,
        optional: true,
        quantity: 1
      }
    ],
    hasUnresolvedRewards: true
  }
};

const resolvedTwo =
  resolveAtomicChestConsumableRewards(
    pendingTwo,
    sequenceRandom([
      0.80,
      0.80
    ])
  );

assert.equal(
  resolvedTwo.ok,
  true
);

assert.equal(
  pendingTwo.rewardPlan
    .rewards[1]
    .consumable.key,
  "mentalidade_comum"
);

assert.equal(
  pendingTwo.rewardPlan
    .rewards[1]
    .resolved,
  true
);

assert.equal(
  pendingTwo.rewardPlan
    .hasUnresolvedRewards,
  false
);


const pendingThree = {
  atoms: 3,
  rewardPlan: {
    rewards: [
      {
        type: "consumable",
        resolved: false,
        quantity: 1
      }
    ],
    hasUnresolvedRewards: true
  }
};

const resolvedSpecial =
  resolveAtomicChestConsumableRewards(
    pendingThree,
    sequenceRandom([
      0.9995,
      0.20
    ])
  );

assert.equal(
  resolvedSpecial.ok,
  true
);

assert.equal(
  pendingThree.rewardPlan
    .rewards[0]
    .consumable.key,
  "vida_especial"
);

assert.equal(
  pendingThree.rewardPlan
    .rewards[0]
    .consumable.restorePercent,
  1
);

assert.equal(
  pendingThree.rewardPlan
    .rewards[0]
    .resolved,
  true
);


const snapshot =
  structuredClone(
    pendingThree
  );

const retry =
  resolveAtomicChestConsumableRewards(
    pendingThree,
    sequenceRandom([])
  );

assert.equal(
  retry.ok,
  true
);

assert.deepEqual(
  retry.resolvedIndexes,
  []
);

assert.deepEqual(
  pendingThree,
  snapshot,
  "retry não pode rerrolar consumível já congelado"
);


console.log(
  "✅ Resolução congelada de Consumíveis do Baú Atômico validada."
);
