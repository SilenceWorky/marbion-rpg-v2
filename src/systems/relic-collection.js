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
    !profile.relics ||
    typeof profile.relics !== "object" ||
    Array.isArray(profile.relics)
  ) {
    profile.relics = {};
  }

  if (!Array.isArray(profile.relics.owned)) {
    profile.relics.owned = [];
  }

  return {
    ok: true,
    owned: profile.relics.owned
  };
}

function sameIdentity(
  entry,
  seasonId,
  relicId
) {
  return (
    normalizeSeasonId(entry?.seasonId) ===
      normalizeSeasonId(seasonId) &&
    normalizeText(entry?.relicId) ===
      normalizeText(relicId)
  );
}

export function getRelicCollection(profile) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  return {
    ok: true,
    owned: state.owned
  };
}

export function findOwnedRelic(
  profile,
  seasonId,
  relicId
) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedRelicId =
    normalizeText(relicId);

  if (!normalizedRelicId) {
    return {
      ok: false,
      error: "INVALID_RELIC_IDENTITY"
    };
  }

  const normalizedSeasonId =
    normalizeSeasonId(seasonId);

  const relic =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedRelicId
        )
    ) || null;

  return relic
    ? {
        ok: true,
        found: true,
        relic
      }
    : {
        ok: true,
        found: false,
        relic: null
      };
}

export function grantRelic(
  profile,
  {
    seasonId = null,
    relicId,
    name,
    description = null,
    lore = null,
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
  const normalizedRelicId =
    normalizeText(relicId);
  const normalizedName =
    normalizeText(name);

  if (
    !normalizedRelicId ||
    !normalizedName
  ) {
    return {
      ok: false,
      error: "INVALID_RELIC"
    };
  }

  const existing =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedRelicId
        )
    ) || null;

  if (existing) {
    return {
      ok: true,
      duplicate: true,
      relic: existing
    };
  }

  const relic = {
    seasonId: normalizedSeasonId,
    relicId: normalizedRelicId,
    name: normalizedName,
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

  const normalizedDescription =
    normalizeText(description);

  if (normalizedDescription) {
    relic.description =
      normalizedDescription;
  }

  const normalizedLore =
    normalizeText(lore);

  if (normalizedLore) {
    relic.lore =
      normalizedLore;
  }

  const normalizedChestId =
    normalizeText(seasonalChestId);

  if (normalizedChestId) {
    relic.seasonalChestId =
      normalizedChestId;
  }

  if (
    Number.isSafeInteger(chestOrder) &&
    chestOrder > 0
  ) {
    relic.chestOrder =
      chestOrder;
  }

  if (
    Number.isSafeInteger(poolRevision) &&
    poolRevision >= 0
  ) {
    relic.poolRevision =
      poolRevision;
  }

  state.owned.push(relic);

  return {
    ok: true,
    duplicate: false,
    relic
  };
}
