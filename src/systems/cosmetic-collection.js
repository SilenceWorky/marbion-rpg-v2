import {
  normalizeSeasonCosmeticSlot
} from "../config/cosmetic-slots.js";


function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeSeasonId(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function ensureCollection(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }

  if (
    !profile.cosmetics ||
    typeof profile.cosmetics !== "object" ||
    Array.isArray(profile.cosmetics)
  ) {
    profile.cosmetics = {};
  }
  if (!Array.isArray(profile.cosmetics.owned)) {
    profile.cosmetics.owned = [];
  }

  return {
    ok: true,
    owned: profile.cosmetics.owned
  };
}

function sameIdentity(
  entry,
  seasonId,
  cosmeticId
) {
  return (
    normalizeSeasonId(entry?.seasonId) ===
      normalizeSeasonId(seasonId) &&
    normalizeText(entry?.cosmeticId) ===
      normalizeText(cosmeticId)
  );
}

export function getCosmeticCollection(profile) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }
  return {
    ok: true,
    owned: state.owned
  };
}

export function findOwnedCosmetic(
  profile,
  seasonId,
  cosmeticId
) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedCosmeticId =
    normalizeText(cosmeticId);

  if (!normalizedCosmeticId) {
    return {
      ok: false,
      error: "INVALID_COSMETIC_IDENTITY"
    };
  }

  const normalizedSeasonId =
    normalizeSeasonId(seasonId);
  const cosmetic =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedCosmeticId
        )
    ) || null;

  return cosmetic
    ? {
        ok: true,
        found: true,
        cosmetic
      }
    : {
        ok: true,
        found: false,
        cosmetic: null
      };
}

export function grantCosmetic(
  profile,
  {
    seasonId = null,
    cosmeticId,
    name,
    slot = null,
    source = "unknown",
    seasonalChestId = null,
    chestOrder = null,
    poolRevision = null,
    acquiredAt = Date.now()
  } = {}
) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedSeasonId =
    normalizeSeasonId(seasonId);
  const normalizedCosmeticId =
    normalizeText(cosmeticId);
  const normalizedName =
    normalizeText(name);
  const normalizedSlot =
    normalizeSeasonCosmeticSlot(
      slot
    );

  if (
    !normalizedCosmeticId ||
    !normalizedName ||
    (
      normalizeText(slot) &&
      !normalizedSlot
    )
  ) {
    return {
      ok: false,
      error: "INVALID_COSMETIC"
    };
  }
  const existing =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedCosmeticId
        )
    ) || null;

  if (existing) {
    return {
      ok: true,
      duplicate: true,
      cosmetic: existing
    };
  }

  const cosmetic = {
    seasonId: normalizedSeasonId,
    cosmeticId: normalizedCosmeticId,
    name: normalizedName,
    slot: normalizedSlot,
    source:
      normalizeText(source) ||
      "unknown",
    acquiredAt:
      Math.max(
        0,
        Math.floor(
          Number(acquiredAt) ||
          Date.now()
        )
      )
  };

  const normalizedChestId =
    normalizeText(seasonalChestId);

  if (normalizedChestId) {
    cosmetic.seasonalChestId =
      normalizedChestId;
  }

  if (
    Number.isSafeInteger(chestOrder) &&
    chestOrder > 0
  ) {
    cosmetic.chestOrder =
      chestOrder;
  }

  if (
    Number.isSafeInteger(poolRevision) &&
    poolRevision >= 0
  ) {
    cosmetic.poolRevision =
      poolRevision;
  }

  state.owned.push(cosmetic);

  return {
    ok: true,
    duplicate: false,
    cosmetic
  };
}
