import {
  bronzeToCanonicalMoney
} from "./money.js";


export const ATOMIC_CHEST_BONUS_POOLS =
  Object.freeze({
    4: Object.freeze([
      Object.freeze({
        type: "consumable",
        weight: 0.40
      }),
      Object.freeze({
        type: "extra_xp",
        weight: 0.30
      }),
      Object.freeze({
        type: "extra_money",
        weight: 0.20
      }),
      Object.freeze({
        type: "second_scroll",
        weight: 0.10
      })
    ]),

    5: Object.freeze([
      Object.freeze({
        type: "consumable",
        weight: 0.39
      }),
      Object.freeze({
        type: "extra_xp",
        weight: 0.30
      }),
      Object.freeze({
        type: "extra_money",
        weight: 0.20
      }),
      Object.freeze({
        type: "second_scroll",
        weight: 0.10
      }),
      Object.freeze({
        type: "special_title",
        weight: 0.01
      })
    ])
  });

export const ATOMIC_CHEST_BONUS_SCROLL_POOLS =
  Object.freeze({
    4: Object.freeze([
      Object.freeze({
        rarity: "R2",
        weight: 0.60
      }),
      Object.freeze({
        rarity: "R3",
        weight: 0.30
      }),
      Object.freeze({
        rarity: "R4",
        weight: 0.09
      }),
      Object.freeze({
        rarity: "R5",
        weight: 0.01
      })
    ]),

    5: Object.freeze([
      Object.freeze({
        rarity: "R3",
        weight: 0.60
      }),
      Object.freeze({
        rarity: "R4",
        weight: 0.30
      }),
      Object.freeze({
        rarity: "R5",
        weight: 0.10
      })
    ])
  });


export const ATOMIC_CHEST_SPECIAL_TITLE =
  Object.freeze({
    id: "mago_dos_baus",
    name: "Mago dos Baús",
    description:
      "Nem todo baú deveria ser aberto."
  });

function nextRandom(
  random
) {
  const value =
    Number(
      random()
    );

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error:
        "INVALID_RANDOM_VALUE"
    };
  }

  return {
    ok: true,
    value
  };
}


function rollWeightedEntry(
  entries,
  random
) {
  if (
    !Array.isArray(entries) ||
    entries.length === 0
  ) {
    return {
      ok: false,
      error:
        "EMPTY_ATOMIC_BONUS_POOL"
    };
  }

  const total =
    entries.reduce(
      (sum, entry) =>
        sum +
        Math.max(
          0,
          Number(entry?.weight) || 0
        ),
      0
    );

  if (!(total > 0)) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_BONUS_POOL"
    };
  }

  const rolled =
    nextRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  let cursor =
    rolled.value *
    total;

  for (const entry of entries) {
    const weight =
      Math.max(
        0,
        Number(entry?.weight) || 0
      );

    if (cursor < weight) {
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


function findBaseReward(
  rewards,
  type
) {
  return rewards.find(
    reward =>
      reward?.type === type &&
      reward?.resolved === true &&
      reward?.bonus !== true
  ) || null;
}

function buildExtraXpReward(
  rewards,
  atoms
) {
  const base =
    findBaseReward(
      rewards,
      "normal_xp"
    );

  if (!base) {
    return {
      ok: false,
      error:
        "ATOMIC_BONUS_BASE_XP_NOT_FOUND"
    };
  }

  const multiplier =
    atoms === 4
      ? 0.50
      : 1.00;

  const amount =
    Math.floor(
      Number(base.amount) *
      multiplier
    );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_BONUS_XP"
    };
  }

  return {
    ok: true,
    reward: {
      type: "normal_xp",
      resolved: true,
      bonus: true,
      bonusSource: "atomic_bonus",
      multiplier,
      amount
    }
  };
}

function buildExtraMoneyReward(
  rewards,
  atoms
) {
  const base =
    findBaseReward(
      rewards,
      "money"
    );

  if (!base) {
    return {
      ok: false,
      error:
        "ATOMIC_BONUS_BASE_MONEY_NOT_FOUND"
    };
  }

  const multiplier =
    atoms === 4
      ? 0.50
      : 1.00;

  const bronzeEquivalent =
    Math.floor(
      Number(
        base.bronzeEquivalent
      ) *
      multiplier
    );

  if (
    !Number.isFinite(
      bronzeEquivalent
    ) ||
    bronzeEquivalent <= 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_BONUS_MONEY"
    };
  }

  return {
    ok: true,
    reward: {
      type: "money",
      resolved: true,
      bonus: true,
      bonusSource: "atomic_bonus",
      multiplier,
      bronzeEquivalent,
      money:
        bronzeToCanonicalMoney(
          bronzeEquivalent
        )
    }
  };
}

function buildSecondScrollReward(
  atoms,
  random
) {
  const pool =
    ATOMIC_CHEST_BONUS_SCROLL_POOLS[
      atoms
    ] || null;

  const selected =
    rollWeightedEntry(
      pool,
      random
    );

  if (!selected.ok) {
    return selected;
  }

  return {
    ok: true,
    reward: {
      type: "scroll",
      resolved: false,
      bonus: true,
      bonusSource: "atomic_bonus",
      secondScroll: true,
      rarity:
        selected.entry.rarity,
      compatibleElement: true
    }
  };
}


function buildBonusReward(
  selectedType,
  rewards,
  atoms,
  random
) {
  if (
    selectedType ===
      "consumable"
  ) {
    return {
      ok: true,
      reward: {
        type: "consumable",
        resolved: false,
        bonus: true,
        bonusSource: "atomic_bonus",
        quantity: 1
      }
    };
  }

  if (
    selectedType ===
      "extra_xp"
  ) {
    return buildExtraXpReward(
      rewards,
      atoms
    );
  }

  if (
    selectedType ===
      "extra_money"
  ) {
    return buildExtraMoneyReward(
      rewards,
      atoms
    );
  }

  if (
    selectedType ===
      "second_scroll"
  ) {
    return buildSecondScrollReward(
      atoms,
      random
    );
  }

  if (
    selectedType ===
      "special_title"
  ) {
    return {
      ok: true,
      reward: {
        type: "title",
        resolved: true,
        bonus: true,
        bonusSource:
          "atomic_bonus",
        title:
          structuredClone(
            ATOMIC_CHEST_SPECIAL_TITLE
          )
      }
    };
  }

  return {
    ok: false,
    error:
      "UNKNOWN_ATOMIC_BONUS_TYPE"
  };
}


export function resolveAtomicChestBonusRewards(
  pendingOpen,
  random = Math.random
) {
  if (
    !pendingOpen ||
    typeof pendingOpen !== "object" ||
    Array.isArray(pendingOpen) ||
    !pendingOpen.rewardPlan ||
    !Array.isArray(
      pendingOpen.rewardPlan.rewards
    )
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_PENDING_OPEN"
    };
  }

  const atoms =
    Math.floor(
      Number(
        pendingOpen.atoms
      )
    );

  const pool =
    ATOMIC_CHEST_BONUS_POOLS[
      atoms
    ] || null;

  const rewards =
    pendingOpen.rewardPlan.rewards;

  const replacements = [];

  for (
    let index = 0;
    index < rewards.length;
    index += 1
  ) {
    const reward =
      rewards[index];

    if (
      reward?.type !== "bonus" ||
      reward?.resolved === true
    ) {
      continue;
    }

    if (!pool) {
      return {
        ok: false,
        error:
          "ATOMIC_BONUS_POOL_UNDEFINED",
        atoms,
        rewardIndex:
          index
      };
    }

    const selected =
      rollWeightedEntry(
        pool,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex:
          index
      };
    }

    const built =
      buildBonusReward(
        selected.entry.type,
        rewards,
        atoms,
        random
      );

    if (!built.ok) {
      return {
        ...built,
        rewardIndex:
          index
      };
    }

    replacements.push({
      index,
      reward:
        built.reward
    });
  }

  for (
    const replacement of
      replacements
  ) {
    rewards[
      replacement.index
    ] =
      replacement.reward;
  }

  pendingOpen.rewardPlan
    .hasUnresolvedRewards =
      rewards.some(
        reward =>
          reward?.resolved !== true
      );

  return {
    ok: true,
    resolvedIndexes:
      replacements.map(
        replacement =>
          replacement.index
      ),
    pendingOpen
  };
}
