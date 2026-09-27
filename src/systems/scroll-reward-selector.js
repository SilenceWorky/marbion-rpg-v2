import {
  flattenSkills
} from "./skills.js";

import {
  canLearnSkillFromScroll
} from "./element-compatibility.js";

import {
  getSkillRarityForScrollTier,
  detectLegacySkillRarityScale,
  normalizeCatalogSkillRarity
} from "../config/skill-rarities.js";


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
        "INVALID_SCROLL_RANDOM_SOURCE"
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
        "SCROLL_RANDOM_FAILED"
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
        "INVALID_SCROLL_RANDOM_VALUE"
    };
  }

  return {
    ok: true,
    value
  };
}


export function getEligibleScrollRewardSkills(
  profile,
  skillsData,
  tier
) {
  const skillRarity =
    getSkillRarityForScrollTier(
      tier
    );

  if (!skillRarity) {
    return {
      ok: false,
      error:
        "INVALID_SCROLL_TIER"
    };
  }

  const owned =
    new Set(
      Array.isArray(
        profile?.skills
      )
        ? profile.skills.map(
            value =>
              String(value)
          )
        : []
    );

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

  const candidates =
    catalog.filter(
      skill =>
        !owned.has(
          skill.id
        ) &&
        normalizeCatalogSkillRarity(
          skill.raridade,
          {
            legacyScale
          }
        ) ===
          skillRarity &&
        canLearnSkillFromScroll(
          profile,
          skill.elemento
        )
    );

  return {
    ok: true,
    tier:
      String(tier)
        .trim()
        .toUpperCase(),
    skillRarity,
    candidates
  };
}


export function rollScrollRewardSkill(
  profile,
  skillsData,
  tier,
  random = Math.random
) {
  const eligible =
    getEligibleScrollRewardSkills(
      profile,
      skillsData,
      tier
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
        "SCROLL_REWARD_POOL_EXHAUSTED",
      tier:
        eligible.tier,
      skillRarity:
        eligible.skillRarity
    };
  }

  const rolled =
    readRandom(
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  const index =
    Math.min(
      eligible.candidates.length - 1,
      Math.floor(
        rolled.value *
        eligible.candidates.length
      )
    );

  const skill =
    eligible.candidates[
      index
    ];

  return {
    ok: true,
    tier:
      eligible.tier,
    skillRarity:
      eligible.skillRarity,
    skill: {
      id:
        skill.id,
      group:
        skill.group,
      key:
        skill.key,
      nome:
        skill.nome,
      elemento:
        skill.elemento,
      raridade:
        skill.raridade
    }
  };
}
