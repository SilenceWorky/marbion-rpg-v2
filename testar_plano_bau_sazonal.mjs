import assert from "node:assert/strict";

import {
  SEASONAL_CHEST_BASE_REWARD_WEIGHTS,
  SEASONAL_CHEST_XP_RANGE,
  SEASONAL_CHEST_MONEY_RANGE,
  SEASONAL_CHEST_SPECIAL_POOL,
  rollSeasonalChestRewardPlan
} from "./src/config/seasonal-chest-rewards.js";


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

    return values[
      index++
    ];
  };
}


assert.deepEqual(
  SEASONAL_CHEST_BASE_REWARD_WEIGHTS,
  {
    normal_xp: 0.50,
    money: 0.50
  }
);

assert.deepEqual(
  SEASONAL_CHEST_XP_RANGE,
  {
    min: 50,
    max: 180
  }
);

assert.deepEqual(
  SEASONAL_CHEST_MONEY_RANGE,
  {
    min: 20,
    max: 80
  }
);

assert.equal(
  SEASONAL_CHEST_SPECIAL_POOL
    .reduce(
      (sum, entry) =>
        sum +
        entry.weight,
      0
    ),
  1
);

assert.deepEqual(
  SEASONAL_CHEST_SPECIAL_POOL
    .map(
      entry => [
        entry.type,
        entry.weight
      ]
    ),
  [
    ["seasonal_skill", 0.12],
    ["seasonal_consumable", 0.38],
    ["seasonal_pvp_finisher", 0.15],
    ["seasonal_victory_message", 0.15],
    ["seasonal_cosmetic", 0.10],
    ["seasonal_relic", 0.10]
  ]
);


const xpPlan =
  rollSeasonalChestRewardPlan(
    sequenceRandom([
      0,
      0,
      0
    ])
  );

assert.equal(
  xpPlan.ok,
  true
);

assert.deepEqual(
  xpPlan.rewards,
  [
    {
      type: "normal_xp",
      resolved: true,
      amount: 50
    },
    {
      type: "seasonal_skill",
      resolved: false
    }
  ]
);


const moneyPlan =
  rollSeasonalChestRewardPlan(
    sequenceRandom([
      0.99,
      0.99,
      0.99
    ])
  );

assert.equal(
  moneyPlan.ok,
  true
);

assert.deepEqual(
  moneyPlan.rewards[0],
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
  }
);

assert.equal(
  moneyPlan.rewards[1].type,
  "seasonal_relic"
);

assert.equal(
  moneyPlan.hasUnresolvedRewards,
  true
);


console.log(
  "✅ Plano estrutural do Baú Sazonal validado."
);
