import assert from "node:assert/strict";

import {
  ATOMIC_CHEST_BONUS_POOLS,
  ATOMIC_CHEST_BONUS_SCROLL_POOLS,
  ATOMIC_CHEST_SPECIAL_TITLE,
  resolveAtomicChestBonusRewards
} from "./src/systems/atomic-chest-bonus-resolver.js";

import {
  getAtomicConsumableTierPool
} from "./src/systems/consumable-catalog.js";


function sequenceRandom(
  values
) {
  let index = 0;

  return () => {
    if (
      index >= values.length
    ) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    return values[index++];
  };
}

assert.deepEqual(
  ATOMIC_CHEST_BONUS_POOLS[4]
    .map(
      entry => [
        entry.type,
        entry.weight
      ]
    ),
  [
    ["consumable", 0.40],
    ["extra_xp", 0.30],
    ["extra_money", 0.20],
    ["second_scroll", 0.10]
  ]
);

assert.deepEqual(
  ATOMIC_CHEST_BONUS_POOLS[5]
    .map(
      entry => [
        entry.type,
        entry.weight
      ]
    ),
  [
    ["consumable", 0.39],
    ["extra_xp", 0.30],
    ["extra_money", 0.20],
    ["second_scroll", 0.10],
    ["special_title", 0.01]
  ]
);

assert.deepEqual(
  ATOMIC_CHEST_BONUS_SCROLL_POOLS[4]
    .map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    ["R2", 0.60],
    ["R3", 0.30],
    ["R4", 0.09],
    ["R5", 0.01]
  ]
);

assert.deepEqual(
  ATOMIC_CHEST_BONUS_SCROLL_POOLS[5]
    .map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    ["R3", 0.60],
    ["R4", 0.30],
    ["R5", 0.10]
  ]
);

assert.equal(
  ATOMIC_CHEST_SPECIAL_TITLE.name,
  "Mago dos Baús"
);

assert.deepEqual(
  getAtomicConsumableTierPool(4)
    .map(
      entry => [
        entry.tier,
        entry.weight
      ]
    ),
  [
    ["comum", 0.70],
    ["melhorada", 0.299],
    ["especial", 0.001]
  ]
);

assert.deepEqual(
  getAtomicConsumableTierPool(5)
    .map(
      entry => [
        entry.tier,
        entry.weight
      ]
    ),
  [
    ["comum", 0.499],
    ["melhorada", 0.50],
    ["especial", 0.001]
  ]
);

const pendingFourXp = {
  atoms: 4,
  rewardPlan: {
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 101
      },
      {
        type: "money",
        resolved: true,
        bronzeEquivalent: 31,
        money: {
          bronze: 1,
          silver: 3,
          gold: 0,
          platinum: 0
        }
      },
      {
        type: "bonus",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fourXp =
  resolveAtomicChestBonusRewards(
    pendingFourXp,
    sequenceRandom([
      0.50
    ])
  );

assert.equal(
  fourXp.ok,
  true
);

assert.deepEqual(
  pendingFourXp.rewardPlan
    .rewards[2],
  {
    type: "normal_xp",
    resolved: true,
    bonus: true,
    bonusSource:
      "atomic_bonus",
    multiplier: 0.50,
    amount: 50
  }
);

const pendingFourMoney = {
  atoms: 4,
  rewardPlan: {
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 100
      },
      {
        type: "money",
        resolved: true,
        bronzeEquivalent: 31,
        money: {
          bronze: 1,
          silver: 3,
          gold: 0,
          platinum: 0
        }
      },
      {
        type: "bonus",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fourMoney =
  resolveAtomicChestBonusRewards(
    pendingFourMoney,
    sequenceRandom([
      0.75
    ])
  );

assert.equal(
  fourMoney.ok,
  true
);

assert.equal(
  pendingFourMoney.rewardPlan
    .rewards[2]
    .bronzeEquivalent,
  15
);

assert.deepEqual(
  pendingFourMoney.rewardPlan
    .rewards[2].money,
  {
    bronze: 5,
    silver: 1,
    gold: 0,
    platinum: 0
  }
);

const pendingFourScroll = {
  atoms: 4,
  rewardPlan: {
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 100
      },
      {
        type: "money",
        resolved: true,
        bronzeEquivalent: 40,
        money: {
          bronze: 0,
          silver: 4,
          gold: 0,
          platinum: 0
        }
      },
      {
        type: "bonus",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fourScroll =
  resolveAtomicChestBonusRewards(
    pendingFourScroll,
    sequenceRandom([
      0.95,
      0.995
    ])
  );

assert.equal(
  fourScroll.ok,
  true
);

assert.equal(
  pendingFourScroll.rewardPlan
    .rewards[2].type,
  "scroll"
);

assert.equal(
  pendingFourScroll.rewardPlan
    .rewards[2].rarity,
  "R5"
);

assert.equal(
  pendingFourScroll.rewardPlan
    .rewards[2].resolved,
  false
);

const pendingFiveTitle = {
  atoms: 5,
  rewardPlan: {
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 200
      },
      {
        type: "money",
        resolved: true,
        bronzeEquivalent: 80,
        money: {
          bronze: 0,
          silver: 8,
          gold: 0,
          platinum: 0
        }
      },
      {
        type: "bonus",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fiveTitle =
  resolveAtomicChestBonusRewards(
    pendingFiveTitle,
    sequenceRandom([
      0.995
    ])
  );

assert.equal(
  fiveTitle.ok,
  true
);

assert.equal(
  pendingFiveTitle.rewardPlan
    .rewards[2].type,
  "title"
);

assert.equal(
  pendingFiveTitle.rewardPlan
    .rewards[2].title.name,
  "Mago dos Baús"
);

assert.equal(
  pendingFiveTitle.rewardPlan
    .hasUnresolvedRewards,
  false
);

console.log(
  "✅ Pools de bônus IV/V do Baú Atômico validados."
);
