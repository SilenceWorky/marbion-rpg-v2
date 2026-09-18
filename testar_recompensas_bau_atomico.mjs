import assert from "node:assert/strict";

import {
  ATOMIC_CHEST_REWARD_RULES,
  getAtomicChestNaturalFiveAtomChance,
  getAtomicChestRewardRule
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
  "não devemos inventar pesos de XP vs dinheiro antes da definição canônica"
);

assert.equal(
  one.optional[0].chance,
  0.20
);


const two =
  getAtomicChestRewardRule(
    2
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
