import {
  SEASONAL_CHEST_CONSUMABLE_RARITY_POOL
} from "../config/seasonal-chest-rewards.js";

import {
  normalizeSkillRarity
} from "../config/skill-rarities.js";


function readRandom(random) {
  if (typeof random !== "function") {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CONSUMABLE_RANDOM_SOURCE"
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
        "SEASONAL_CONSUMABLE_RANDOM_FAILED"
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
        "INVALID_SEASONAL_CONSUMABLE_RANDOM_VALUE"
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
  const total =
    entries.reduce(
      (sum, entry) =>
        sum +
        Math.max(
          0,
          Number(entry.weight) || 0
        ),
      0
    );

  if (!(total > 0)) {
    return {
      ok: false,
      error:
        "EMPTY_SEASONAL_CONSUMABLE_RARITY_POOL"
    };
  }

  const rolled =
    readRandom(random);

  if (!rolled.ok) {
    return rolled;
  }

  let cursor =
    rolled.value * total;

  for (const entry of entries) {
    const weight =
      Math.max(
        0,
        Number(entry.weight) || 0
      );

    if (cursor < weight) {
      return {
        ok: true,
        entry
      };
    }

    cursor -= weight;
  }

  return {
    ok: true,
    entry:
      entries[
        entries.length - 1
      ]
  };
}


function normalizeConsumable(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const id =
    String(
      value.id ?? ""
    ).trim();

  const name =
    String(
      value.name ?? ""
    ).trim();

  const rarity =
    normalizeSkillRarity(
      value.rarity
    );

  const introducedInSeasonalChestId =
    String(
      value
        .introducedInSeasonalChestId ??
      ""
    ).trim() || null;

  const introducedInSeasonalChestOrder =
    Number(
      value
        .introducedInSeasonalChestOrder
    );

  if (
    !id ||
    !name ||
    !rarity ||
    !introducedInSeasonalChestId ||
    !Number.isSafeInteger(
      introducedInSeasonalChestOrder
    ) ||
    introducedInSeasonalChestOrder < 1
  ) {
    return null;
  }

  return {
    id,
    key:
      String(
        value.key ?? id
      ).trim() || id,
    name,
    rarity,
    description:
      String(
        value.description ?? ""
      ).trim() || null,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function getChestContext(
  pendingOpen,
  seasonContent
) {
  const seasonId =
    String(
      pendingOpen?.seasonId ?? ""
    ).trim();

  const seasonalChestId =
    String(
      pendingOpen?.seasonalChestId ??
      ""
    ).trim();

  const chestOrder =
    Number(
      pendingOpen?.chestOrder
    );

  const poolRevision =
    Number(
      pendingOpen?.poolRevision
    );

  if (
    !seasonId ||
    !seasonalChestId ||
    !Number.isSafeInteger(
      chestOrder
    ) ||
    chestOrder < 1 ||
    !Number.isSafeInteger(
      poolRevision
    ) ||
    poolRevision < 1
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_IDENTITY_REQUIRED"
    };
  }

  if (
    String(
      seasonContent?.id ?? ""
    ).trim() !== seasonId ||
    Number(
      seasonContent?.revision
    ) !== poolRevision
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CONTENT_MISMATCH"
    };
  }

  const chestDefinition =
    Array.isArray(
      seasonContent?.seasonalChests
    )
      ? seasonContent.seasonalChests
          .find(
            entry =>
              entry?.id ===
              seasonalChestId
          ) ?? null
      : null;

  if (
    !chestDefinition ||
    chestDefinition.seasonId !==
      seasonId ||
    Number(
      chestDefinition.order
    ) !== chestOrder ||
    Number(
      chestDefinition.poolRevision
    ) !== poolRevision
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_DEFINITION_MISMATCH"
    };
  }

  return {
    ok: true,
    seasonId,
    seasonalChestId,
    chestOrder,
    poolRevision
  };
}


export function getEligibleSeasonalChestConsumables(
  pendingOpen,
  seasonContent
) {
  const context =
    getChestContext(
      pendingOpen,
      seasonContent
    );

  if (!context.ok) {
    return context;
  }

  const catalog =
    Array.isArray(
      seasonContent?.seasonalConsumables
    )
      ? seasonContent.seasonalConsumables
      : [];

  const allowedRarities =
    new Set(
      SEASONAL_CHEST_CONSUMABLE_RARITY_POOL
        .map(
          entry => entry.rarity
        )
    );

  const candidates =
    catalog
      .map(
        normalizeConsumable
      )
      .filter(Boolean)
      .filter(
        consumable =>
          allowedRarities.has(
            consumable.rarity
          ) &&
          consumable
            .introducedInSeasonalChestOrder <=
          context.chestOrder
      );

  return {
    ok: true,
    ...context,
    candidates
  };
}


function selectConsumable(
  candidates,
  random
) {
  const availableRarities =
    SEASONAL_CHEST_CONSUMABLE_RARITY_POOL
      .filter(
        entry =>
          candidates.some(
            consumable =>
              consumable.rarity ===
              entry.rarity
          )
      );

  const rarityRoll =
    rollWeightedEntry(
      availableRarities,
      random
    );

  if (!rarityRoll.ok) {
    return rarityRoll;
  }

  const rarity =
    rarityRoll.entry.rarity;

  const sameRarity =
    candidates.filter(
      consumable =>
        consumable.rarity ===
        rarity
    );

  const itemRoll =
    readRandom(random);

  if (!itemRoll.ok) {
    return itemRoll;
  }

  const index =
    Math.min(
      sameRarity.length - 1,
      Math.floor(
        itemRoll.value *
        sameRarity.length
      )
    );

  return {
    ok: true,
    rarity,
    consumable:
      sameRarity[index]
  };
}


export function resolveSeasonalChestConsumableRewards(
  pendingOpen,
  seasonContent,
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
        "INVALID_SEASONAL_PENDING_OPEN"
    };
  }

  const unresolvedIndexes =
    pendingOpen.rewardPlan.rewards
      .map(
        (reward, index) => ({
          reward,
          index
        })
      )
      .filter(
        entry =>
          entry.reward?.type ===
            "seasonal_consumable" &&
          entry.reward?.resolved !==
            true
      )
      .map(
        entry => entry.index
      );

  if (
    unresolvedIndexes.length === 0
  ) {
    return {
      ok: true,
      resolvedIndexes: [],
      pendingOpen
    };
  }

  const eligible =
    getEligibleSeasonalChestConsumables(
      pendingOpen,
      seasonContent
    );

  if (!eligible.ok) {
    return eligible;
  }

  if (
    eligible.candidates.length ===
    0
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CONSUMABLE_CATALOG_EMPTY"
    };
  }

  const replacements = [];

  for (
    let index = 0;
    index <
      pendingOpen.rewardPlan.rewards.length;
    index += 1
  ) {
    const reward =
      pendingOpen.rewardPlan.rewards[
        index
      ];

    if (
      reward?.type !==
        "seasonal_consumable" ||
      reward?.resolved === true
    ) {
      continue;
    }

    const selected =
      selectConsumable(
        eligible.candidates,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex: index
      };
    }

    replacements.push({
      index,
      reward: {
        type:
          "seasonal_consumable",
        resolved: true,
        seasonId:
          eligible.seasonId,
        seasonalChestId:
          eligible.seasonalChestId,
        chestOrder:
          eligible.chestOrder,
        poolRevision:
          eligible.poolRevision,
        rarity:
          selected.rarity,
        quantity: 1,
        consumable:
          structuredClone(
            selected.consumable
          )
      }
    });
  }

  for (
    const replacement of
      replacements
  ) {
    pendingOpen.rewardPlan.rewards[
      replacement.index
    ] =
      replacement.reward;
  }

  pendingOpen.rewardPlan
    .hasUnresolvedRewards =
      pendingOpen.rewardPlan.rewards
        .some(
          reward =>
            reward?.resolved !== true
        );

  return {
    ok: true,
    resolvedIndexes:
      replacements.map(
        entry => entry.index
      ),
    pendingOpen
  };
}
