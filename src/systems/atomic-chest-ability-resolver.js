import {
  SKILL_RARITIES,
  detectLegacySkillRarityScale,
  normalizeCatalogSkillRarity
} from "../config/skill-rarities.js";

import {
  flattenSkills
} from "./skills.js";

import {
  canLearnSkillFromScroll
} from "./element-compatibility.js";


export const ATOMIC_CHEST_ABILITY_RARITY_POOL =
  Object.freeze([
    Object.freeze({
      rarity: SKILL_RARITIES.COMMON,
      weight: 0.35
    }),
    Object.freeze({
      rarity: SKILL_RARITIES.RARE,
      weight: 0.30
    }),
    Object.freeze({
      rarity: SKILL_RARITIES.SUPER_RARE,
      weight: 0.20
    }),
    Object.freeze({
      rarity: SKILL_RARITIES.MYTHIC,
      weight: 0.10
    }),
    Object.freeze({
      rarity: SKILL_RARITIES.LEGENDARY,
      weight: 0.05
    })
  ]);


function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function readRandom(random) {
  if (typeof random !== "function") {
    return {
      ok: false,
      error: "INVALID_ATOMIC_ABILITY_RANDOM_SOURCE"
    };
  }

  let value;

  try {
    value = Number(random());
  }
  catch {
    return {
      ok: false,
      error: "ATOMIC_ABILITY_RANDOM_FAILED"
    };
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error: "INVALID_ATOMIC_ABILITY_RANDOM_VALUE"
    };
  }

  return {
    ok: true,
    value
  };
}


function rollWeightedEntry(entries, random) {
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
      error: "EMPTY_ATOMIC_ABILITY_RARITY_POOL"
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


export function getEligibleAtomicChestAbilitySkills(
  profile,
  skillsData
) {
  const catalog =
    flattenSkills(
      skillsData
    );

  const legacyScale =
    detectLegacySkillRarityScale(
      catalog.map(
        skill =>
          skill.raridade
      )
    );

  const owned =
    new Set(
      Array.isArray(profile?.skills)
        ? profile.skills.map(
            value =>
              String(value)
          )
        : []
    );

  const allowedRarities =
    new Set(
      ATOMIC_CHEST_ABILITY_RARITY_POOL
        .map(
          entry =>
            entry.rarity
        )
    );

  const candidates =
    catalog
      .map(
        skill => ({
          ...skill,
          canonicalRarity:
            normalizeCatalogSkillRarity(
              skill.raridade,
              {
                legacyScale
              }
            )
        })
      )
      .filter(
        skill =>
          !owned.has(
            skill.id
          ) &&
          allowedRarities.has(
            skill.canonicalRarity
          ) &&
          normalizeText(
            skill.elemento
          ) !== "universal" &&
          canLearnSkillFromScroll(
            profile,
            skill.elemento
          )
      );

  return {
    ok: true,
    legacyScale,
    candidates
  };
}


function buildFallbackMoney(
  random
) {
  const rolled =
    readRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  const platinum =
    rolled.value < 0.75
      ? 1
      : 2;

  return {
    ok: true,
    reward: {
      type: "money",
      resolved: true,
      fallbackFrom:
        "new_elemental_ability",
      bronzeEquivalent:
        platinum * 1000,
      money: {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum
      }
    }
  };
}


function selectAbility(
  candidates,
  random
) {
  const availableRarities =
    ATOMIC_CHEST_ABILITY_RARITY_POOL
      .filter(
        entry =>
          candidates.some(
            skill =>
              skill.canonicalRarity ===
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
        skill.canonicalRarity ===
        rarity
    );

  const skillRoll =
    readRandom(
      random
    );

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


export function resolveAtomicChestAbilityRewards(
  profile,
  pendingOpen,
  skillsData,
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
      error: "INVALID_ATOMIC_PENDING_OPEN"
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
        "new_elemental_ability" ||
      reward?.resolved === true
    ) {
      continue;
    }

    const eligible =
      getEligibleAtomicChestAbilitySkills(
        profile,
        skillsData
      );

    if (!eligible.ok) {
      return {
        ...eligible,
        rewardIndex: index
      };
    }

    if (
      eligible.candidates.length ===
      0
    ) {
      const fallback =
        buildFallbackMoney(
          random
        );

      if (!fallback.ok) {
        return {
          ...fallback,
          rewardIndex: index
        };
      }

      replacements.push({
        index,
        reward:
          fallback.reward
      });

      continue;
    }

    const selected =
      selectAbility(
        eligible.candidates,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex: index
      };
    }

    const {
      canonicalRarity,
      ...skill
    } = selected.skill;

    replacements.push({
      index,
      reward: {
        type:
          "new_elemental_ability",
        resolved: true,
        compatibleElement: true,
        rarity:
          selected.rarity,
        skill: {
          ...structuredClone(
            skill
          ),
          raridade:
            selected.rarity
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
