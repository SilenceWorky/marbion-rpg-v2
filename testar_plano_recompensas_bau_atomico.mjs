import assert from "node:assert/strict";

import {
  rollAtomicChestRewardPlan
} from "./src/systems/atomic-chest-reward-plan.js";


function sequenceRandom(
  values
) {
  let index = 0;

  return () => {
    if (
      index >=
        values.length
    ) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    const value =
      values[index];

    index += 1;

    return value;
  };
}


const one =
  rollAtomicChestRewardPlan(
    1,
    sequenceRandom([
      0.10,
      0,
      0.99
    ])
  );

assert.equal(
  one.ok,
  true
);

assert.equal(
  one.rewards.length,
  1
);

assert.equal(
  one.rewards[0].type,
  "normal_xp"
);

assert.equal(
  one.hasUnresolvedRewards,
  false
);


const two =
  rollAtomicChestRewardPlan(
    2,
    sequenceRandom([
      0,
      0,
      0.10,
      0.01,
      0
    ])
  );

assert.deepEqual(
  two.rewards.map(
    reward => [
      reward.type,
      reward.resolved,
      reward.rarity ?? null
    ]
  ),
  [
    [
      "normal_xp",
      true,
      null
    ],
    [
      "money",
      true,
      null
    ],
    [
      "consumable",
      false,
      null
    ],
    [
      "scroll",
      false,
      "R1"
    ]
  ]
);

assert.equal(
  two.hasUnresolvedRewards,
  true
);


const four =
  rollAtomicChestRewardPlan(
    4,
    sequenceRandom([
      0,
      0,
      0.99,
      0.10
    ])
  );

assert.equal(
  four.rewards[2].type,
  "scroll"
);

assert.equal(
  four.rewards[2].rarity,
  "R2"
);

assert.equal(
  four.rewards[2].resolved,
  false
);

assert.equal(
  four.rewards.some(
    reward =>
      reward.type ===
      "bonus"
  ),
  true
);


const five =
  rollAtomicChestRewardPlan(
    5,
    sequenceRandom([
      0,
      0,
      0.99,
      0.99
    ])
  );

assert.equal(
  five.rewards[2].type,
  "new_elemental_ability"
);

assert.equal(
  five.rewards[2].resolved,
  false
);

assert.equal(
  five.rewards.some(
    reward =>
      reward.type ===
      "scroll"
  ),
  false
);

assert.equal(
  five.rewards.some(
    reward =>
      reward.type ===
      "bonus"
  ),
  false
);


assert.equal(
  rollAtomicChestRewardPlan(
    0
  ).error,
  "INVALID_ATOMIC_CHEST_ATOMS"
);


console.log(
  "✅ Plano de recompensas do Baú Atômico validado."
);
