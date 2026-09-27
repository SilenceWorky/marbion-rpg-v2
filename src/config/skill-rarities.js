export const SKILL_RARITIES =
  Object.freeze({
    COMMON: "Comum",
    RARE: "Raro",
    SUPER_RARE: "Super Raro",
    MYTHIC: "Mítico",
    LEGENDARY: "Lendário",
    UNIQUE: "Único"
  });


export const LEGACY_SKILL_RARITY_TO_CANONICAL =
  Object.freeze({
    Comum:
      SKILL_RARITIES.COMMON,
    Incomum:
      SKILL_RARITIES.RARE,
    Raro:
      SKILL_RARITIES.SUPER_RARE,
    "Muito Raro":
      SKILL_RARITIES.MYTHIC,
    Lendário:
      SKILL_RARITIES.LEGENDARY,
    Especial:
      SKILL_RARITIES.UNIQUE
  });


export const SCROLL_RARITY_TO_SKILL_RARITY =
  Object.freeze({
    R1:
      SKILL_RARITIES.COMMON,
    R2:
      SKILL_RARITIES.RARE,
    R3:
      SKILL_RARITIES.SUPER_RARE,
    R4:
      SKILL_RARITIES.MYTHIC,
    R5:
      SKILL_RARITIES.LEGENDARY
  });


export function getSkillRarityForScrollTier(
  tier
) {
  const normalized =
    String(
      tier ?? ""
    )
      .trim()
      .toUpperCase();

  return (
    SCROLL_RARITY_TO_SKILL_RARITY[
      normalized
    ] ||
    null
  );
}


function normalizeRarityKey(
  rarity
) {
  return String(
    rarity ?? ""
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


export function normalizeLegacySkillRarity(
  rarity
) {
  const normalized =
    normalizeRarityKey(
      rarity
    );

  if (!normalized) {
    return null;
  }

  for (
    const [
      legacy,
      canonical
    ] of Object.entries(
      LEGACY_SKILL_RARITY_TO_CANONICAL
    )
  ) {
    if (
      normalizeRarityKey(
        legacy
      ) === normalized
    ) {
      return canonical;
    }
  }

  return null;
}


export function normalizeSkillRarity(
  rarity
) {
  const normalized =
    normalizeRarityKey(
      rarity
    );

  if (!normalized) {
    return null;
  }

  for (
    const canonical of
      Object.values(
        SKILL_RARITIES
      )
  ) {
    if (
      normalizeRarityKey(
        canonical
      ) === normalized
    ) {
      return canonical;
    }
  }

  return null;
}


export function detectLegacySkillRarityScale(
  rarities
) {
  if (!Array.isArray(rarities)) {
    return false;
  }

  const distinctiveLegacy =
    new Set([
      "incomum",
      "muito raro",
      "especial"
    ]);

  return rarities.some(
    rarity =>
      distinctiveLegacy.has(
        normalizeRarityKey(
          rarity
        )
      )
  );
}


export function normalizeCatalogSkillRarity(
  rarity,
  {
    legacyScale = false
  } = {}
) {
  return legacyScale
    ? normalizeLegacySkillRarity(
        rarity
      )
    : normalizeSkillRarity(
        rarity
      );
}


export function isScrollEligibleSkillRarity(
  rarity
) {
  const canonical =
    normalizeSkillRarity(
      rarity
    );

  return Object.values(
    SCROLL_RARITY_TO_SKILL_RARITY
  ).includes(
    canonical
  );
}
