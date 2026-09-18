import assert from "node:assert/strict";

import {
  ATOMIC_CHEST_REWARD_RULES,
  getAtomicChestMoneyRange,
  getAtomicChestNaturalFiveAtomChance,
  getAtomicChestRewardRule,
  getAtomicChestXpRange
} from "./src/config/atomic-chest-rewards.js";


assert.equal(
  Object.keys(
    ATOMIC_CHEST_REWARD_RULES
  ).length,
  5
);


const one =
  getAtomicChestRewardRule(
    1
  );

assert.deepEqual(
  one.primaryChoice.choices,
  [
    "normal_xp",
    "money"
  ]
);

assert.equal(
  one.primaryChoice.weights,
  null,
  "os pesos de XP vs dinheiro continuam não definidos"
);

assert.deepEqual(
  one.primaryChoice.amountRanges
    .normal_xp,
  {
    min: 1,
    max: 23
  }
);

assert.deepEqual(
  one.primaryChoice.amountRanges
    .money,
  {
    min: 1,
    max: 9,
    unit: "bronze_equivalent",
    autoConvert: true
  }
);

assert.equal(
  one.optional[0].chance,
  0.20
);


const two =
  getAtomicChestRewardRule(
    2
  );

assert.deepEqual(
  two.guaranteed[0]
    .amountRange,
  {
    min: 11,
    max: 46
  }
);

assert.deepEqual(
  two.guaranteed[1]
    .amountRange,
  {
    min: 4,
    max: 18,
    unit: "bronze_equivalent",
    autoConvert: true
  }
);

assert.equal(
  two.optional[0].chance,
  0.30
);

assert.equal(
  two.optional[1].chance,
  0.08
);

assert.equal(
  two.optional[1]
    .rarities[0]
    .rarity,
  "R1"
);


const three =
  getAtomicChestRewardRule(
    3
  );

assert.deepEqual(
  three.guaranteed[0]
    .amountRange,
  {
    min: 23,
    max: 92
  }
);

assert.deepEqual(
  three.guaranteed[1]
    .amountRange,
  {
    min: 9,
    max: 36,
    unit: "bronze_equivalent",
    autoConvert: true
  }
);

assert.deepEqual(
  three.optional[0]
    .rarities.map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    [
      "R1",
      0.70
    ],
    [
      "R2",
      0.30
    ]
  ]
);

assert.equal(
  three.optional[1].chance,
  0.20
);


const four =
  getAtomicChestRewardRule(
    4
  );

assert.deepEqual(
  four.guaranteed[0]
    .amountRange,
  {
    min: 46,
    max: 184
  }
);

assert.deepEqual(
  four.guaranteed[1]
    .amountRange,
  {
    min: 18,
    max: 72,
    unit: "bronze_equivalent",
    autoConvert: true
  }
);

assert.deepEqual(
  four.guaranteed[2]
    .rarities.map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    [
      "R2",
      0.75
    ],
    [
      "R3",
      0.20
    ],
    [
      "R4",
      0.05
    ]
  ]
);

assert.equal(
  four.optional[0].chance,
  0.30
);

assert.equal(
  four.optional[0].pool,
  null,
  "o conteúdo do bônus de 30% ainda não foi definido"
);


const five =
  getAtomicChestRewardRule(
    5
  );

assert.deepEqual(
  five.guaranteed[0]
    .amountRange,
  {
    min: 92,
    max: 368
  }
);

assert.deepEqual(
  five.guaranteed[1]
    .amountRange,
  {
    min: 36,
    max: 144,
    unit: "bronze_equivalent",
    autoConvert: true
  }
);

assert.equal(
  five.guaranteed[2].type,
  "new_elemental_ability"
);

assert.equal(
  five.guaranteed[2]
    .fallbackWhenExhausted
    .choices[0]
    .platinum,
  1
);

assert.equal(
  five.guaranteed[2]
    .fallbackWhenExhausted
    .choices[0]
    .weight,
  0.75
);

assert.equal(
  five.guaranteed[2]
    .fallbackWhenExhausted
    .choices[1]
    .platinum,
  2
);

assert.equal(
  five.guaranteed[2]
    .fallbackWhenExhausted
    .choices[1]
    .weight,
  0.25
);

assert.equal(
  five.optional[0].chance,
  0.40
);

assert.deepEqual(
  five.optional[0]
    .rarities.map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    [
      "R3",
      0.75
    ],
    [
      "R4",
      0.20
    ],
    [
      "R5",
      0.05
    ]
  ]
);

assert.equal(
  five.optional[1].chance,
  0.20
);


assert.deepEqual(
  [
    1,
    2,
    3,
    4,
    5
  ].map(
    atoms => [
      atoms,
      getAtomicChestXpRange(
        atoms
      ),
      getAtomicChestMoneyRange(
        atoms
      )
    ]
  ),
  [
    [
      1,
      { min: 1, max: 23 },
      {
        min: 1,
        max: 9,
        unit: "bronze_equivalent",
        autoConvert: true
      }
    ],
    [
      2,
      { min: 11, max: 46 },
      {
        min: 4,
        max: 18,
        unit: "bronze_equivalent",
        autoConvert: true
      }
    ],
    [
      3,
      { min: 23, max: 92 },
      {
        min: 9,
        max: 36,
        unit: "bronze_equivalent",
        autoConvert: true
      }
    ],
    [
      4,
      { min: 46, max: 184 },
      {
        min: 18, max: 72,
        unit: "bronze_equivalent",
        autoConvert: true
      }
    ],
    [
      5,
      { min: 92, max: 368 },
      {
        min: 36, max: 144,
        unit: "bronze_equivalent",
        autoConvert: true
      }
    ]
  ]
);

assert.equal(
  getAtomicChestNaturalFiveAtomChance(),
  0.000125
);

assert.equal(
  1 /
    getAtomicChestNaturalFiveAtomChance(),
  8000
);


assert.equal(
  getAtomicChestRewardRule(
    0
  ),
  null
);

assert.equal(
  getAtomicChestRewardRule(
    6
  ),
  null
);


console.log(
  "✅ Catálogo de recompensas do Baú Atômico validado."
);
