function normalizeText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


function ensureCollection(
  profile
) {
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
    !profile.pvpFinishers ||
    typeof profile.pvpFinishers !== "object" ||
    Array.isArray(profile.pvpFinishers)
  ) {
    profile.pvpFinishers = {};
  }
  if (!Array.isArray(
    profile.pvpFinishers.owned
  )) {
    profile.pvpFinishers.owned = [];
  }

  const equipped =
    profile.pvpFinishers.equipped;

  if (
    equipped !== null &&
    (
      !equipped ||
      typeof equipped !== "object" ||
      Array.isArray(equipped) ||
      !normalizeText(equipped.seasonId) ||
      !normalizeText(equipped.finisherId)
    )
  ) {
    profile.pvpFinishers.equipped = null;
  }

  return {
    ok: true,
    owned: profile.pvpFinishers.owned,
    equipped: profile.pvpFinishers.equipped
  };
}
function sameIdentity(
  entry,
  seasonId,
  finisherId
) {
  return (
    normalizeText(entry?.seasonId) ===
      seasonId &&
    normalizeText(entry?.finisherId) ===
      finisherId
  );
}


export function getPvpFinisherCollection(
  profile
) {
  const state =
    ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  return {
    ok: true,
    owned: state.owned,
    equipped: state.equipped
  };
}
export function findOwnedPvpFinisher(
  profile,
  seasonId,
  finisherId
) {
  const state =
    ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedSeasonId =
    normalizeText(seasonId);
  const normalizedFinisherId =
    normalizeText(finisherId);

  if (
    !normalizedSeasonId ||
    !normalizedFinisherId
  ) {
    return {
      ok: false,
      error: "INVALID_PVP_FINISHER_IDENTITY"
    };
  }

  const finisher =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedFinisherId
        )
    ) || null;

  return finisher
    ? {
        ok: true,
        found: true,
        finisher
      }
    : {
        ok: true,
        found: false,
        finisher: null
      };
}


export function grantPvpFinisher(
  profile,
  {
    seasonId,
    finisherId,
    name = null,
    description = null,
    source = "unknown",
    seasonalChestId = null,
    chestOrder = null,
    poolRevision = null,
    acquiredAt = Date.now()
  } = {}
) {
  const state =
    ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedSeasonId =
    normalizeText(seasonId);
  const normalizedFinisherId =
    normalizeText(finisherId);

  if (
    !normalizedSeasonId ||
    !normalizedFinisherId
  ) {
    return {
      ok: false,
      error: "INVALID_PVP_FINISHER_IDENTITY"
    };
  }

  const existing =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedFinisherId
        )
    ) || null;

  if (existing) {
    return {
      ok: true,
      duplicate: true,
      finisher: existing
    };
  }

  const finisher = {
    seasonId: normalizedSeasonId,
    finisherId: normalizedFinisherId,
    name:
      normalizeText(name) ||
      normalizedFinisherId,
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
    finisher.description =
      normalizedDescription;
  }

  const normalizedChestId =
    normalizeText(seasonalChestId);

  if (normalizedChestId) {
    finisher.seasonalChestId =
      normalizedChestId;
  }

  if (
    Number.isSafeInteger(chestOrder) &&
    chestOrder > 0
  ) {
    finisher.chestOrder =
      chestOrder;
  }

  if (
    Number.isSafeInteger(poolRevision) &&
    poolRevision >= 0
  ) {
    finisher.poolRevision =
      poolRevision;
  }

  state.owned.push(finisher);

  return {
    ok: true,
    duplicate: false,
    finisher
  };
}


export function equipPvpFinisher(
  profile,
  seasonId,
  finisherId
) {
  const found =
    findOwnedPvpFinisher(
      profile,
      seasonId,
      finisherId
    );

  if (!found.ok) {
    return found;
  }

  if (!found.found) {
    return {
      ok: false,
      error: "PVP_FINISHER_NOT_OWNED"
    };
  }

  const identity = {
    seasonId:
      found.finisher.seasonId,
    finisherId:
      found.finisher.finisherId
  };

  const current =
    profile.pvpFinishers.equipped;

  const changed =
    !current ||
    !sameIdentity(
      current,
      identity.seasonId,
      identity.finisherId
    );
  profile.pvpFinishers.equipped =
    identity;

  return {
    ok: true,
    changed,
    equipped: identity,
    finisher: found.finisher
  };
}


export function unequipPvpFinisher(
  profile
) {
  const state =
    ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const changed =
    state.equipped !== null;

  profile.pvpFinishers.equipped =
    null;

  return {
    ok: true,
    changed,
    equipped: null
  };
}


export function getEquippedPvpFinisher(
  profile
) {
  const state =
    ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  if (!state.equipped) {
    return {
      ok: true,
      finisher: null
    };
  }

  const found =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizeText(
            state.equipped.seasonId
          ),
          normalizeText(
            state.equipped.finisherId
          )
        )
    ) || null;

  if (!found) {
    profile.pvpFinishers.equipped =
      null;

    return {
      ok: true,
      finisher: null
    };
  }

  return {
    ok: true,
    finisher: found
  };
}
