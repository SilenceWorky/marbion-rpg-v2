export const SEASON_COSMETIC_SLOT_DEFINITIONS =
  Object.freeze([
    Object.freeze({
      id: "hair",
      label: "Cabelo"
    }),
    Object.freeze({
      id: "accessory",
      label:
        "Acessório (chapéu, óculos, cachecol etc.)"
    }),
    Object.freeze({
      id: "top",
      label:
        "Parte de cima (camisa, casaco etc.)"
    }),
    Object.freeze({
      id: "bottom",
      label:
        "Parte de baixo (calça, short, saia etc.)"
    }),
    Object.freeze({
      id: "shoes",
      label:
        "Calçado (bota, tênis etc.)"
    })
  ]);


export const SEASON_COSMETIC_SLOTS =
  Object.freeze(
    SEASON_COSMETIC_SLOT_DEFINITIONS
      .map(
        entry =>
          entry.id
      )
  );


const SLOT_SET =
  new Set(
    SEASON_COSMETIC_SLOTS
  );


export function normalizeSeasonCosmeticSlot(
  value
) {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase();

  return SLOT_SET.has(
    normalized
  )
    ? normalized
    : null;
}


export function getSeasonCosmeticSlotDefinition(
  value
) {
  const slot =
    normalizeSeasonCosmeticSlot(
      value
    );

  return (
    SEASON_COSMETIC_SLOT_DEFINITIONS
      .find(
        entry =>
          entry.id === slot
      ) ??
    null
  );
}


export function isSeasonCosmeticSlot(
  value
) {
  return (
    normalizeSeasonCosmeticSlot(
      value
    ) !== null
  );
}
