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
    !profile.victoryMessages ||
    typeof profile.victoryMessages !== "object" ||
    Array.isArray(profile.victoryMessages)
  ) {
    profile.victoryMessages = {};
  }
  if (!Array.isArray(profile.victoryMessages.owned)) {
    profile.victoryMessages.owned = [];
  }

  const equipped =
    profile.victoryMessages.equipped;

  if (
    equipped !== null &&
    (
      !equipped ||
      typeof equipped !== "object" ||
      Array.isArray(equipped) ||
      !normalizeText(equipped.messageId)
    )
  ) {
    profile.victoryMessages.equipped = null;
  }

  return {
    ok: true,
    owned: profile.victoryMessages.owned,
    equipped: profile.victoryMessages.equipped
  };
}

function sameIdentity(entry, seasonId, messageId) {
  return (
    normalizeSeasonId(entry?.seasonId) ===
      normalizeSeasonId(seasonId) &&
    normalizeText(entry?.messageId) ===
      normalizeText(messageId)
  );
}

export function getVictoryMessageCollection(profile) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  return {
    ok: true,
    owned: state.owned,
    equipped: state.equipped
  };
}

export function findOwnedVictoryMessage(
  profile,
  seasonId,
  messageId
) {
  const state = ensureCollection(profile);
  if (!state.ok) {
    return state;
  }

  const normalizedMessageId =
    normalizeText(messageId);

  if (!normalizedMessageId) {
    return {
      ok: false,
      error: "INVALID_VICTORY_MESSAGE_IDENTITY"
    };
  }

  const normalizedSeasonId =
    normalizeSeasonId(seasonId);

  const message =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedMessageId
        )
    ) || null;

  return message
    ? {
        ok: true,
        found: true,
        message
      }
    : {
        ok: true,
        found: false,
        message: null
      };
}

export function grantVictoryMessage(
  profile,
  {
    seasonId = null,
    messageId,
    text,
    name = null,
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
  const normalizedMessageId =
    normalizeText(messageId);
  const normalizedText =
    normalizeText(text);

  if (
    !normalizedMessageId ||
    !normalizedText
  ) {
    return {
      ok: false,
      error: "INVALID_VICTORY_MESSAGE"
    };
  }

  const existing =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          normalizedSeasonId,
          normalizedMessageId
        )
    ) || null;

  if (existing) {
    return {
      ok: true,
      duplicate: true,
      message: existing
    };
  }

  const message = {
    seasonId: normalizedSeasonId,
    messageId: normalizedMessageId,
    text: normalizedText,
    source: normalizeText(source) || "unknown",
    acquiredAt:
      Math.max(
        0,
        Math.floor(
          Number(acquiredAt) ||
          Date.now()
        )
      )
  };

  const normalizedName = normalizeText(name);
  if (normalizedName) {
    message.name = normalizedName;
  }

  const normalizedChestId =
    normalizeText(seasonalChestId);
  if (normalizedChestId) {
    message.seasonalChestId =
      normalizedChestId;
  }

  if (
    Number.isSafeInteger(chestOrder) &&
    chestOrder > 0
  ) {
    message.chestOrder = chestOrder;
  }

  if (
    Number.isSafeInteger(poolRevision) &&
    poolRevision >= 0
  ) {
    message.poolRevision = poolRevision;
  }

  state.owned.push(message);

  return {
    ok: true,
    duplicate: false,
    message
  };
}

export function equipVictoryMessage(
  profile,
  seasonId,
  messageId
) {
  const found =
    findOwnedVictoryMessage(
      profile,
      seasonId,
      messageId
    );

  if (!found.ok) {
    return found;
  }

  if (!found.found) {
    return {
      ok: false,
      error: "VICTORY_MESSAGE_NOT_OWNED"
    };
  }

  const identity = {
    seasonId: found.message.seasonId,
    messageId: found.message.messageId
  };

  const current =
    profile.victoryMessages.equipped;
  const changed =
    !current ||
    !sameIdentity(
      current,
      identity.seasonId,
      identity.messageId
    );

  profile.victoryMessages.equipped =
    identity;

  return {
    ok: true,
    changed,
    equipped: identity,
    message: found.message
  };
}

export function unequipVictoryMessage(profile) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  const changed =
    state.equipped !== null;

  profile.victoryMessages.equipped = null;
  return {
    ok: true,
    changed,
    equipped: null
  };
}

export function getEquippedVictoryMessage(profile) {
  const state = ensureCollection(profile);

  if (!state.ok) {
    return state;
  }

  if (!state.equipped) {
    return {
      ok: true,
      message: null
    };
  }

  const found =
    state.owned.find(
      entry =>
        sameIdentity(
          entry,
          state.equipped.seasonId,
          state.equipped.messageId
        )
    ) || null;
  if (!found) {
    profile.victoryMessages.equipped = null;

    return {
      ok: true,
      message: null
    };
  }

  return {
    ok: true,
    message: found
  };
}
