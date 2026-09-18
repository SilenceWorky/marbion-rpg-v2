import {
  getAtomicChestRewardRule
} from "../config/atomic-chest-rewards.js";

import {
  rollAtomicChestBaseRewards
} from "./atomic-chest-reward-values.js";


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
        "EMPTY_WEIGHTED_POOL"
    };
  }

  const total =
    entries.reduce(
      (sum, entry) =>
        sum +
        Math.max(
          0,
          Number(
            entry?.weight
          ) || 0
        ),
      0
    );

  if (!(total > 0)) {
    return {
      ok: false,
      error:
        "INVALID_WEIGHTED_POOL"
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

  for (
    const entry of
      entries
  ) {
    const weight =
      Math.max(
        0,
        Number(
          entry?.weight
        ) || 0
      );

    if (
      cursor <
      weight
    ) {
      return {
        ok: true,
        entry:
          structuredClone(
            entry
          )
      };
    }

    cursor -=
      weight;
  }

  return {
    ok: true,
    entry:
      structuredClone(
        entries[
          entries.length - 1
        ]
      )
  };
}


function rollChance(
  chance,
  random
) {
  const rolled =
    nextRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  return {
    ok: true,
    hit:
      rolled.value <
      Number(chance)
  };
}


function buildUnresolvedReward(
  descriptor,
  extra = {}
) {
  return {
    type:
      descriptor.type,
    resolved: false,
    ...extra
  };
}


export function rollAtomicChestRewardPlan(
  atoms,
  random = Math.random
) {
  const rule =
    getAtomicChestRewardRule(
      atoms
    );

  if (!rule) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_CHEST_ATOMS"
    };
  }

  const base =
    rollAtomicChestBaseRewards(
      atoms,
      random
    );

  if (!base.ok) {
    return base;
  }

  const rewards =
    base.rewards.map(
      reward => ({
        ...structuredClone(
          reward
        ),
        resolved: true
      })
    );

  const guaranteed =
    Array.isArray(
      rule.guaranteed
    )
      ? rule.guaranteed.slice(2)
      : [];

  for (
    const descriptor of
      guaranteed
  ) {
    if (
      descriptor.type ===
        "scroll"
    ) {
      const rarity =
        rollWeightedEntry(
          descriptor.rarities,
          random
        );

      if (!rarity.ok) {
        return rarity;
      }

      rewards.push(
        buildUnresolvedReward(
          descriptor,
          {
            rarity:
              rarity.entry.rarity,
            compatibleElement:
              descriptor.compatibleElement ===
              true
          }
        )
      );

      continue;
    }

    rewards.push(
      buildUnresolvedReward(
        descriptor,
        descriptor.type ===
          "consumable"
          ? {
              quantity:
                descriptor.quantity ??
                1
            }
          : {
              compatibleElement:
                descriptor.compatibleElement ===
                true
            }
      )
    );
  }

  for (
    const descriptor of
      rule.optional || []
  ) {
    const chance =
      rollChance(
        descriptor.chance,
        random
      );

    if (!chance.ok) {
      return chance;
    }

    if (!chance.hit) {
      continue;
    }

    if (
      descriptor.type ===
        "scroll"
    ) {
      const rarity =
        rollWeightedEntry(
          descriptor.rarities,
          random
        );

      if (!rarity.ok) {
        return rarity;
      }

      rewards.push(
        buildUnresolvedReward(
          descriptor,
          {
            optional: true,
            rarity:
              rarity.entry.rarity,
            compatibleElement:
              descriptor.compatibleElement ===
              true
          }
        )
      );

      continue;
    }

    rewards.push(
      buildUnresolvedReward(
        descriptor,
        {
          optional: true,
          quantity:
            descriptor.quantity ??
            (
              descriptor.type ===
                "consumable"
                ? 1
                : undefined
            ),
          label:
            descriptor.label ??
            undefined,
          poolDefined:
            descriptor.pool !==
            null
        }
      )
    );
  }

  return {
    ok: true,
    atoms:
      Math.floor(
        Number(atoms)
      ),
    rewards,
    hasUnresolvedRewards:
      rewards.some(
        reward =>
          reward.resolved ===
          false
      )
  };
}
