import assert from "node:assert/strict";

import {
  rollAtomicChestBaseRewards
} from "./src/systems/atomic-chest-reward-values.js";


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


const oneXp =
  rollAtomicChestBaseRewards(
    1,
    sequenceRandom([
      0.49,
      0
    ])
  );

assert.equal(
  oneXp.ok,
  true
);

assert.equal(
  oneXp.rewards.length,
  1
);

assert.equal(
  oneXp.rewards[0].type,
  "normal_xp"
);

assert.equal(
  oneXp.rewards[0].amount,
  1
);


const oneMoney =
  rollAtomicChestBaseRewards(
    1,
    sequenceRandom([
      0.50,
      0.999999999
    ])
  );

assert.equal(
  oneMoney.ok,
  true
);

assert.equal(
  oneMoney.rewards.length,
  1
);

assert.equal(
  oneMoney.rewards[0].type,
  "money"
);

assert.equal(
  oneMoney.rewards[0]
    .bronzeEquivalent,
  9
);

assert.deepEqual(
  oneMoney.rewards[0].money,
  {
    bronze: 9,
    silver: 0,
    gold: 0,
    platinum: 0
  }
);


const two =
  rollAtomicChestBaseRewards(
    2,
    sequenceRandom([
      0,
      0.999999999
    ])
  );

assert.equal(
  two.ok,
  true
);

assert.deepEqual(
  two.rewards.map(
    reward =>
      reward.type
  ),
  [
    "normal_xp",
    "money"
  ]
);

assert.equal(
  two.rewards[0].amount,
  11
);

assert.equal(
  two.rewards[1]
    .bronzeEquivalent,
  18
);

assert.deepEqual(
  two.rewards[1].money,
  {
    bronze: 8,
    silver: 1,
    gold: 0,
    platinum: 0
  }
);


const five =
  rollAtomicChestBaseRewards(
    5,
    sequenceRandom([
      0.999999999,
      0.999999999
    ])
  );

assert.equal(
  five.rewards[0].amount,
  368
);

assert.equal(
  five.rewards[1]
    .bronzeEquivalent,
  144
);

assert.deepEqual(
  five.rewards[1].money,
  {
    bronze: 4,
    silver: 4,
    gold: 1,
    platinum: 0
  }
);


assert.equal(
  rollAtomicChestBaseRewards(
    0
  ).error,
  "INVALID_ATOMIC_CHEST_ATOMS"
);


console.log(
  "✅ Recompensas base do Baú Atômico validadas."
);
