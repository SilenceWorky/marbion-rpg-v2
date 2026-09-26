function ensureInventory(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    return {
      ok: false,
      error:
        "INVALID_PROFILE"
    };
  }

  if (
    !profile.inventory ||
    typeof profile.inventory !== "object" ||
    Array.isArray(profile.inventory)
  ) {
    profile.inventory = {};
  }

  if (!Array.isArray(
    profile.inventory.consumables
  )) {
    profile.inventory.consumables = [];
  }
  if (
    !Number.isSafeInteger(
      profile.inventory.consumableSequence
    ) ||
    profile.inventory.consumableSequence < 0
  ) {
    profile.inventory.consumableSequence = 0;
  }

  return {
    ok: true,
    consumables:
      profile.inventory.consumables
  };
}


export function addConsumableToInventory(
  profile,
  {
    key,
    name = null,
    source = "unknown",
    grantId = null,
    createdAt = Date.now()
  } = {}
) {
  const state =
    ensureInventory(profile);

  if (!state.ok) {
    return state;
  }

  const normalizedKey =
    String(key ?? "")
      .trim();

  if (!normalizedKey) {
    return {
      ok: false,
      error:
        "INVALID_CONSUMABLE_KEY"
    };
  }

  const normalizedGrantId =
    String(grantId ?? "")
      .trim() || null;

  if (normalizedGrantId) {
    const existing =
      state.consumables.find(
        entry =>
          entry?.grantId ===
          normalizedGrantId
      ) || null;
    if (existing) {
      return {
        ok: true,
        duplicate: true,
        consumable:
          existing
      };
    }
  }

  if (
    profile.inventory
      .consumableSequence >=
      Number.MAX_SAFE_INTEGER
  ) {
    return {
      ok: false,
      error:
        "CONSUMABLE_SEQUENCE_OVERFLOW"
    };
  }

  profile.inventory
    .consumableSequence += 1;

  const consumable = {
    id:
      `consumable:${profile.inventory.consumableSequence}`,
    key:
      normalizedKey,
    name:
      String(name ?? normalizedKey),
    source:
      String(source ?? "unknown"),
    ...(
      normalizedGrantId
        ? {
            grantId:
              normalizedGrantId
          }
        : {}
    ),
    createdAt:
      Math.max(
        0,
        Math.floor(
          Number(createdAt) ||
          Date.now()
        )
      )
  };

  profile.inventory
    .consumables.push(
      consumable
    );
  return {
    ok: true,
    duplicate: false,
    consumable
  };
}


export function getConsumableInventory(
  profile
) {
  const state =
    ensureInventory(profile);

  if (!state.ok) {
    return state;
  }

  return {
    ok: true,
    consumables:
      state.consumables
  };
}


export function getConsumableById(
  profile,
  consumableId
) {
  const state =
    ensureInventory(profile);

  if (!state.ok) {
    return state;
  }

  const id =
    String(consumableId ?? "")
      .trim();

  const consumable =
    state.consumables.find(
      entry =>
        entry?.id === id
    ) || null;

  return consumable
    ? {
        ok: true,
        consumable
      }
    : {
        ok: false,
        error:
          "CONSUMABLE_NOT_FOUND"
      };
}


export function removeConsumableById(
  profile,
  consumableId
) {
  const state =
    ensureInventory(profile);

  if (!state.ok) {
    return state;
  }

  const id =
    String(consumableId ?? "")
      .trim();

  const index =
    state.consumables.findIndex(
      entry =>
        entry?.id === id
    );

  if (index < 0) {
    return {
      ok: false,
      error:
        "CONSUMABLE_NOT_FOUND"
    };
  }

  const [removed] =
    state.consumables.splice(
      index,
      1
    );

  return {
    ok: true,
    consumable:
      removed
  };
}
