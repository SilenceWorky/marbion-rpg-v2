import {
  bronzeToCanonicalMoney
} from "../systems/money.js";


export const SEASONAL_CHEST_BASE_REWARD_WEIGHTS =
  Object.freeze({
    normal_xp: 0.50,
    money: 0.50
  });


export const SEASONAL_CHEST_XP_RANGE =
  Object.freeze({
    min: 50,
    max: 180
  });


export const SEASONAL_CHEST_MONEY_RANGE =
  Object.freeze({
    min: 20,
    max: 80
  });


export const SEASONAL_CHEST_SPECIAL_POOL =
  Object.freeze([
    Object.freeze({
      type: "seasonal_skill",
      weight: 0.12
    }),
    Object.freeze({
      type: "seasonal_consumable",
      weight: 0.38
    }),
    Object.freeze({
      type: "seasonal_pvp_finisher",
      weight: 0.15
    }),
    Object.freeze({
      type: "seasonal_victory_message",
      weight: 0.15
    }),
    Object.freeze({
      type: "seasonal_cosmetic",
      weight: 0.10
    }),
    Object.freeze({
      type: "seasonal_relic",
      weight: 0.10
    })
  ]);


function readRandom(
  random
) {
  if (
    typeof random !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_RANDOM_SOURCE"
    };
  }

  let value;

  try {
    value =
      Number(
        random()
      );
  }
  catch {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_RANDOM_FAILED"
    };
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_RANDOM_VALUE"
    };
  }

  return {
    ok: true,
    value
  };
}


function rollInclusiveInteger(
  range,
  random
) {
  const rolled =
    readRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  return {
    ok: true,
    amount:
      range.min +
      Math.floor(
        rolled.value *
        (
          range.max -
          range.min +
          1
        )
      )
  };
}


function rollWeightedEntry(
  entries,
  random
) {
  const rolled =
    readRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  const total =
    entries.reduce(
      (sum, entry) =>
        sum +
        Number(entry.weight || 0),
      0
    );

  let cursor =
    rolled.value *
    total;

  for (
    const entry of
      entries
  ) {
    const weight =
      Number(
        entry.weight || 0
      );

    if (
      cursor <
      weight
    ) {
      return {
        ok: true,
        entry
      };
    }

    cursor -=
      weight;
  }

  return {
    ok: true,
    entry:
      entries[
        entries.length - 1
      ]
  };
}


export function rollSeasonalChestRewardPlan(
  random = Math.random
) {
  const baseChoice =
    readRandom(
      random
    );

  if (!baseChoice.ok) {
    return baseChoice;
  }

  let baseReward;

  if (
    baseChoice.value <
    SEASONAL_CHEST_BASE_REWARD_WEIGHTS.normal_xp
  ) {
    const xp =
      rollInclusiveInteger(
        SEASONAL_CHEST_XP_RANGE,
        random
      );

    if (!xp.ok) {
      return xp;
    }

    baseReward = {
      type: "normal_xp",
      resolved: true,
      amount:
        xp.amount
    };
  }
  else {
    const money =
      rollInclusiveInteger(
        SEASONAL_CHEST_MONEY_RANGE,
        random
      );

    if (!money.ok) {
      return money;
    }

    baseReward = {
      type: "money",
      resolved: true,
      bronzeEquivalent:
        money.amount,
      money:
        bronzeToCanonicalMoney(
          money.amount
        )
    };
  }

  const special =
    rollWeightedEntry(
      SEASONAL_CHEST_SPECIAL_POOL,
      random
    );

  if (!special.ok) {
    return special;
  }

  return {
    ok: true,
    rewards: [
      baseReward,
      {
        type:
          special.entry.type,
        resolved: false
      }
    ],
    hasUnresolvedRewards:
      true
  };
}
