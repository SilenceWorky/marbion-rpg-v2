import {
  getCosmeticCollection
} from "./cosmetic-collection.js";


function normalizeText(value) {
  return String(value ?? "").trim();
}


function normalizeCosmetic(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const id =
    normalizeText(value.id);
  const name =
    normalizeText(value.name);
  const introducedInSeasonalChestId =
    normalizeText(
      value.introducedInSeasonalChestId
    );
  const introducedInSeasonalChestOrder =
    Number(
      value.introducedInSeasonalChestOrder
    );

  if (
    !id ||
    !name ||
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
    name,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function readRandom(random) {
  if (typeof random !== "function") {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_RANDOM_SOURCE"
    };
  }

  let value;

  try {
    value =
      Number(random());
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


function getChestContext(
  pendingOpen,
  seasonContent
) {
  const seasonId =
    normalizeText(
      pendingOpen?.seasonId
    );
  const seasonalChestId =
    normalizeText(
      pendingOpen?.seasonalChestId
    );
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
    !Number.isSafeInteger(chestOrder) ||
    chestOrder < 1 ||
    !Number.isSafeInteger(poolRevision) ||
    poolRevision < 1
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_IDENTITY_REQUIRED"
    };
  }

  const contentId =
    normalizeText(
      seasonContent?.id
    );
  const contentRevision =
    Number(
      seasonContent?.revision
    );

  if (
    contentId !== seasonId ||
    contentRevision !== poolRevision
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CONTENT_MISMATCH"
    };
  }

  const chestDefinitions =
    Array.isArray(
      seasonContent?.seasonalChests
    )
      ? seasonContent.seasonalChests
      : [];

  const chestDefinition =
    chestDefinitions.find(
      chest =>
        chest?.id === seasonalChestId
    ) || null;

  if (
    !chestDefinition ||
    chestDefinition.seasonId !==
      seasonId ||
    Number(chestDefinition.order) !==
      chestOrder ||
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
    poolRevision,
    chestDefinitions
  };
}


export function getEligibleSeasonalChestCosmetics(
  profile,
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

  const collection =
    getCosmeticCollection(
      profile
    );

  if (!collection.ok) {
    return collection;
  }

  const chestById =
    new Map(
      context.chestDefinitions.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const rawCatalog =
    Array.isArray(
      seasonContent?.seasonalCosmetics
    )
      ? seasonContent.seasonalCosmetics
      : [];

  const catalogCandidates = [];
  const seenIds = new Set();

  for (const raw of rawCatalog) {
    const cosmetic =
      normalizeCosmetic(raw);

    if (!cosmetic) {
      continue;
    }

    const introducedChest =
      chestById.get(
        cosmetic
          .introducedInSeasonalChestId
      );

    if (
      !introducedChest ||
      introducedChest.seasonId !==
        context.seasonId ||
      Number(
        introducedChest.order
      ) !==
        cosmetic
          .introducedInSeasonalChestOrder ||
      cosmetic
        .introducedInSeasonalChestOrder >
        context.chestOrder
    ) {
      continue;
    }

    if (seenIds.has(cosmetic.id)) {
      continue;
    }

    seenIds.add(cosmetic.id);
    catalogCandidates.push(cosmetic);
  }

  const ownedCosmeticIds =
    new Set(
      collection.owned
        .filter(
          entry =>
            normalizeText(
              entry?.seasonId
            ) ===
            context.seasonId
        )
        .map(
          entry =>
            normalizeText(
              entry?.cosmeticId
            )
        )
        .filter(Boolean)
    );

  const candidates =
    catalogCandidates.filter(
      cosmetic =>
        !ownedCosmeticIds.has(
          cosmetic.id
        )
    );

  return {
    ok: true,
    seasonId:
      context.seasonId,
    seasonalChestId:
      context.seasonalChestId,
    chestOrder:
      context.chestOrder,
    poolRevision:
      context.poolRevision,
    catalogCandidates,
    ownedCosmeticIds,
    candidates
  };
}


function buildFallbackMoney() {
  return {
    type: "money",
    resolved: true,
    fallbackFrom:
      "seasonal_cosmetic",
    bronzeEquivalent: 1000,
    money: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 1
    }
  };
}


function selectCosmetic(
  candidates,
  random
) {
  const rolled =
    readRandom(random);

  if (!rolled.ok) {
    return rolled;
  }

  const index =
    Math.min(
      candidates.length - 1,
      Math.floor(
        rolled.value *
        candidates.length
      )
    );

  return {
    ok: true,
    cosmetic:
      candidates[index]
  };
}


export function resolveSeasonalChestCosmeticRewards(
  profile,
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
            "seasonal_cosmetic" &&
          entry.reward?.resolved !== true
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
    getEligibleSeasonalChestCosmetics(
      profile,
      pendingOpen,
      seasonContent
    );

  if (!eligible.ok) {
    return eligible;
  }

  if (
    eligible.catalogCandidates.length ===
    0
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_COSMETIC_CATALOG_EMPTY"
    };
  }

  const plannedOwned =
    new Set(
      eligible.ownedCosmeticIds
    );

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
        "seasonal_cosmetic" ||
      reward?.resolved === true
    ) {
      continue;
    }

    const candidates =
      eligible.catalogCandidates
        .filter(
          cosmetic =>
            !plannedOwned.has(
              cosmetic.id
            )
        );

    if (candidates.length === 0) {
      replacements.push({
        index,
        reward:
          buildFallbackMoney()
      });

      continue;
    }

    const selected =
      selectCosmetic(
        candidates,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex: index
      };
    }

    plannedOwned.add(
      selected.cosmetic.id
    );

    replacements.push({
      index,
      reward: {
        type:
          "seasonal_cosmetic",
        resolved: true,
        seasonId:
          eligible.seasonId,
        seasonalChestId:
          eligible.seasonalChestId,
        chestOrder:
          eligible.chestOrder,
        poolRevision:
          eligible.poolRevision,
        cosmetic:
          structuredClone(
            selected.cosmetic
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
