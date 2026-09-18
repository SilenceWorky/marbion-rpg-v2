export const SKILL_RARITIES =
  Object.freeze({
    COMMON: "Comum",
    RARE: "Raro",
    SUPER_RARE: "Super Raro",
    MYTHIC: "Mítico",
    LEGENDARY: "Lendário",
    UNIQUE: "Único"
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


export function isScrollEligibleSkillRarity(
  rarity
) {
  const normalized =
    String(
      rarity ?? ""
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  return Object.values(
    SCROLL_RARITY_TO_SKILL_RARITY
  ).some(
    value =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase() ===
      normalized
  );
}
