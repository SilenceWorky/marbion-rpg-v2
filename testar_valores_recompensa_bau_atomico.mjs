import assert from "node:assert/strict";

import {
  rollAtomicChestMoneyValue,
  rollAtomicChestXpValue
} from "./src/systems/atomic-chest-reward-values.js";


function fixedRandom(
  value
) {
  return () => value;
}


assert.deepEqual(
  rollAtomicChestXpValue(
    1,
    fixedRandom(0)
  ),
  {
    ok: true,
    type: "normal_xp",
    atoms: 1,
    amount: 1,
    range: {
      min: 1,
      max: 23
    }
  }
);

assert.deepEqual(
  rollAtomicChestXpValue(
    3,
    fixedRandom(
      0.999999999
    )
  ),
  {
    ok: true,
    type: "normal_xp",
    atoms: 3,
    amount: 92,
    range: {
      min: 23,
      max: 92
    }
  }
);

assert.deepEqual(
  rollAtomicChestXpValue(
    5,
    fixedRandom(0)
  ),
  {
    ok: true,
    type: "normal_xp",
    atoms: 5,
    amount: 92,
    range: {
      min: 92,
      max: 368
    }
  }
);


const moneyOne =
  rollAtomicChestMoneyValue(
    1,
    fixedRandom(
      0.999999999
    )
  );

assert.equal(
  moneyOne.bronzeEquivalent,
  9
);

assert.deepEqual(
  moneyOne.money,
  {
    bronze: 9,
    silver: 0,
    gold: 0,
    platinum: 0
  }
);


const moneyThree =
  rollAtomicChestMoneyValue(
    3,
    fixedRandom(
      0.999999999
    )
  );

assert.equal(
  moneyThree.bronzeEquivalent,
  36
);

assert.deepEqual(
  moneyThree.money,
  {
    bronze: 6,
    silver: 3,
    gold: 0,
    platinum: 0
  }
);


const moneyFive =
  rollAtomicChestMoneyValue(
    5,
    fixedRandom(
      0.999999999
    )
  );

assert.equal(
  moneyFive.bronzeEquivalent,
  144
);

assert.deepEqual(
  moneyFive.money,
  {
    bronze: 4,
    silver: 4,
    gold: 1,
    platinum: 0
  }
);


assert.equal(
  rollAtomicChestXpValue(
    0
  ).error,
  "INVALID_ATOMIC_CHEST_ATOMS"
);

assert.equal(
  rollAtomicChestMoneyValue(
    6
  ).error,
  "INVALID_ATOMIC_CHEST_ATOMS"
);

assert.equal(
  rollAtomicChestXpValue(
    1,
    fixedRandom(1)
  ).error,
  "INVALID_RANDOM_VALUE"
);


console.log(
  "✅ Sorteio de XP e dinheiro do Baú Atômico validado."
);
