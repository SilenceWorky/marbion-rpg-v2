import {
  SEASONAL_CHEST_SKILL_RARITY_POOL
} from "../config/seasonal-chest-rewards.js";

import {
  normalizeSkillRarity
} from "../config/skill-rarities.js";

import {
  canLearnSkillFromScroll
} from "./element-compatibility.js";


function readRandom(random) {
  if (typeof random !== "function") {
    return {
      ok: false,
      error: "INVALID_SEASONAL_SKILL_RANDOM_SOURCE"
    };
  }

  let value;

  try {
    value = Number(random());
  }
  catch {
    return {
      ok: false,
      error: "SEASONAL_SKILL_RANDOM_FAILED"
    };
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error: "INVALID_SEASONAL_SKILL_RANDOM_VALUE"
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
      error: "EMPTY_SEASONAL_SKILL_RARITY_POOL"
    };
  }

  const rolled = readRandom(random);

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


function normalizeSeasonalSkill(
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
    String(value.id ?? "").trim();

  const element =
    String(value.element ?? "").trim();

  const name =
    String(value.name ?? "").trim();

  const rarity =
    normalizeSkillRarity(
      value.rarity
    );

  const introducedInSeasonalChestId =
    value.introducedInSeasonalChestId ===
      null ||
    value.introducedInSeasonalChestId ===
      undefined ||
    String(
      value.introducedInSeasonalChestId
    ).trim() === ""
      ? null
      : String(
          value.introducedInSeasonalChestId
        ).trim();

  const rawIntroducedOrder =
    value.introducedInSeasonalChestOrder ??
    value.introducedInChestOrder;

  const introducedInSeasonalChestOrder =
    rawIntroducedOrder ===
      null ||
    rawIntroducedOrder ===
      undefined ||
    rawIntroducedOrder ===
      ""
      ? null
      : Number(
          rawIntroducedOrder
        );

  if (
    !id ||
    !element ||
    !name ||
    !rarity ||
    (
      introducedInSeasonalChestOrder !==
        null &&
      (
        !Number.isSafeInteger(
          introducedInSeasonalChestOrder
        ) ||
        introducedInSeasonalChestOrder < 1
      )
    ) ||
    (
      introducedInSeasonalChestId &&
      introducedInSeasonalChestOrder ===
        null
    )
  ) {
    return null;
  }

  return {
    id,
    element,
    name,
    rarity,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder,
    introducedInChestOrder:
      introducedInSeasonalChestOrder,
    baseDamage:
      value.baseDamage === null ||
      value.baseDamage === undefined
        ? null
        : Number(value.baseDamage),
    effect:
      value.effect ?? null,
    description:
      value.description ?? null
  };
}


export function getEligibleSeasonalChestSkills(
  profile,
  seasonContent,
  chestContext
) {
  const seasonId =
    String(
      chestContext?.seasonId ?? ""
    ).trim();

  const seasonalChestId =
    String(
      chestContext?.seasonalChestId ?? ""
    ).trim();

  const chestOrder =
    Number(
      chestContext?.chestOrder
    );

  const poolRevision =
    Number(
      chestContext?.poolRevision
    );

  const contentId =
    String(
      seasonContent?.id ?? ""
    ).trim();

  const contentRevision =
    Number(
      seasonContent?.revision
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
    contentId !== seasonId ||
    contentRevision !==
      poolRevision
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
        chest?.id ===
          seasonalChestId
    );

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

  const seasonalSkills =
    Array.isArray(
      seasonContent?.seasonalSkills
    )
      ? seasonContent.seasonalSkills
      : [];

  const owned =
    new Set(
      Array.isArray(profile?.skills)
        ? profile.skills.map(
            value => String(value)
          )
        : []
    );

  const allowedRarities =
    new Set(
      SEASONAL_CHEST_SKILL_RARITY_POOL
        .map(entry => entry.rarity)
    );

  const chestById =
    new Map(
      chestDefinitions.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const unboundSkillIds = [];

  const candidates =
    seasonalSkills
      .map(
        normalizeSeasonalSkill
      )
      .filter(Boolean)
      .filter(skill => {
        if (
          !owned.has(skill.id) &&
          allowedRarities.has(
            skill.rarity
          ) &&
          canLearnSkillFromScroll(
            profile,
            skill.element
          )
        ) {
          if (
            !skill
              .introducedInSeasonalChestOrder
          ) {
            unboundSkillIds.push(
              skill.id
            );
            return false;
          }

          if (
            skill
              .introducedInSeasonalChestId
          ) {
            const introducedChest =
              chestById.get(
                skill
                  .introducedInSeasonalChestId
              );

            if (
              !introducedChest ||
              introducedChest.seasonId !==
                seasonId ||
              Number(
                introducedChest.order
              ) !==
                skill
                  .introducedInSeasonalChestOrder
            ) {
              return false;
            }
          }

          return (
            skill
              .introducedInSeasonalChestOrder <=
            chestOrder
          );
        }

        return false;
      });

  return {
    ok: true,
    seasonId,
    seasonalChestId,
    chestOrder,
    poolRevision,
    unboundSkillIds,
    candidates
  };
}


function buildFallbackMoney() {
  return {
    type: "money",
    resolved: true,
    fallbackFrom:
      "seasonal_skill",
    bronzeEquivalent: 1000,
    money: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 1
    }
  };
}


function selectSeasonalSkill(
  candidates,
  random
) {
  const availableRarities =
    SEASONAL_CHEST_SKILL_RARITY_POOL
      .filter(
        entry =>
          candidates.some(
            skill =>
              skill.rarity ===
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
      skill =>
        skill.rarity === rarity
    );

  const skillRoll =
    readRandom(random);

  if (!skillRoll.ok) {
    return skillRoll;
  }

  const index =
    Math.min(
      sameRarity.length - 1,
      Math.floor(
        skillRoll.value *
        sameRarity.length
      )
    );

  return {
    ok: true,
    rarity,
    skill:
      sameRarity[index]
  };
}


export function resolveSeasonalChestSkillRewards(
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
      error: "INVALID_SEASONAL_PENDING_OPEN"
    };
  }

  const seasonId =
    String(
      pendingOpen.seasonId ?? ""
    ).trim();

  const seasonalChestId =
    String(
      pendingOpen
        .seasonalChestId ?? ""
    ).trim();

  const chestOrder =
    Number(
      pendingOpen.chestOrder
    );

  const poolRevision =
    Number(
      pendingOpen.poolRevision
    );

  if (
    !seasonalChestId ||
    !Number.isSafeInteger(
      chestOrder
    ) ||
    chestOrder <= 0 ||
    !Number.isSafeInteger(
      poolRevision
    ) ||
    poolRevision <= 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_PENDING_OPEN_IDENTITY"
    };
  }

  const contentId =
    String(
      seasonContent?.id ?? ""
    ).trim();

  const contentRevision =
    Number(
      seasonContent?.revision
    );

  if (
    !seasonId ||
    !contentId ||
    seasonId !== contentId ||
    contentRevision !==
      poolRevision
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CONTENT_MISMATCH"
    };
  }

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
      reward?.type !==
        "seasonal_skill" ||
      reward?.resolved === true
    ) {
      continue;
    }

    const eligible =
      getEligibleSeasonalChestSkills(
        profile,
        seasonContent,
        {
          seasonId,
          seasonalChestId,
          chestOrder,
          poolRevision
        }
      );

    if (!eligible.ok) {
      return {
        ...eligible,
        rewardIndex: index
      };
    }

    if (
      eligible.candidates.length === 0
    ) {
      replacements.push({
        index,
        reward:
          buildFallbackMoney()
      });

      continue;
    }

    const selected =
      selectSeasonalSkill(
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
          "seasonal_skill",
        resolved: true,
        seasonId,
        seasonalChestId,
        chestOrder,
        poolRevision,
        rarity:
          selected.rarity,
        skill:
          structuredClone(
            selected.skill
          )
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
