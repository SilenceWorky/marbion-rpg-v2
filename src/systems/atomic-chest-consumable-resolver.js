import {
  getAtomicConsumableTierPool,
  getConsumableDefinition
} from "./consumable-catalog.js";


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
        "EMPTY_CONSUMABLE_POOL"
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
        "INVALID_CONSUMABLE_POOL"
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

function resolveKey(
  tier,
  random
) {
  const rolled =
    nextRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  const prefix =
    rolled.value < 0.5
      ? "vida"
      : "mentalidade";

  const key =
    `${prefix}_${tier}`;

  const definition =
    getConsumableDefinition(
      key
    );

  if (!definition.ok) {
    return definition;
  }

  return {
    ok: true,
    key,
    definition:
      definition.consumable
  };
}


export function resolveAtomicChestConsumableRewards(
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

  const tierPool =
    getAtomicConsumableTierPool(
      atoms
    );

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
      reward?.type !== "consumable" ||
      reward?.resolved === true
    ) {
      continue;
    }

    if (!tierPool) {
      return {
        ok: false,
        error:
          "ATOMIC_CONSUMABLE_POOL_UNDEFINED",
        atoms,
        rewardIndex:
          index
      };
    }

    const tier =
      rollWeightedEntry(
        tierPool,
        random
      );

    if (!tier.ok) {
      return {
        ...tier,
        rewardIndex:
          index
      };
    }

    const selected =
      resolveKey(
        tier.entry.tier,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex:
          index
      };
    }

    replacements.push({
      index,
      reward: {
        ...structuredClone(
          reward
        ),
        resolved: true,
        consumable: {
          key:
            selected.definition.key,
          name:
            selected.definition.name,
          resource:
            selected.definition.resource,
          restorePercent:
            selected.definition.restorePercent
        }
      }
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
