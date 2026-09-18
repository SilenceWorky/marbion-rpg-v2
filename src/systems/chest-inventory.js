export const CHEST_TYPES =
  Object.freeze({
    ATOMIC: "atomic",
    SEASONAL: "seasonal",
    MONSTER: "monster",
    BOSS: "boss",
    ADMIN: "admin"
  });


export const CHEST_TYPE_LABELS =
  Object.freeze({
    [CHEST_TYPES.ATOMIC]:
      "Baú Atômico",
    [CHEST_TYPES.SEASONAL]:
      "Baú Sazonal",
    [CHEST_TYPES.MONSTER]:
      "Baú de Monstro",
    [CHEST_TYPES.BOSS]:
      "Baú de Boss",
    [CHEST_TYPES.ADMIN]:
      "Baú ADM"
  });


const VALID_TYPES =
  new Set(
    Object.values(
      CHEST_TYPES
    )
  );


function ensureChestState(
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
    !Array.isArray(
      profile.chests
    )
  ) {
    profile.chests = [];
  }

  if (
    !Number.isSafeInteger(
      profile.chestSequence
    ) ||
    profile.chestSequence < 0
  ) {
    profile.chestSequence = 0;
  }

  return {
    ok: true,
    chests:
      profile.chests
  };
}


function normalizeType(
  value
) {
  const type =
    String(value ?? "")
      .trim()
      .toLowerCase();

  return VALID_TYPES.has(type)
    ? type
    : null;
}


function normalizeQuantity(
  value
) {
  const quantity =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  return quantity;
}


function cloneMetadata(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return structuredClone(
    value
  );
}


export function createChestInstance(
  profile,
  {
    type,
    metadata = {},
    createdAt = Date.now()
  } = {}
) {
  const state =
    ensureChestState(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const normalizedType =
    normalizeType(
      type
    );

  if (!normalizedType) {
    return {
      ok: false,
      error:
        "INVALID_CHEST_TYPE"
    };
  }

  if (
    profile.chestSequence >=
    Number.MAX_SAFE_INTEGER
  ) {
    return {
      ok: false,
      error:
        "CHEST_SEQUENCE_OVERFLOW"
    };
  }

  profile.chestSequence += 1;

  const chest = {
    id:
      `chest:${normalizedType}:${profile.chestSequence}`,

    type:
      normalizedType,

    createdAt:
      Math.max(
        0,
        Math.floor(
          Number(createdAt) ||
          Date.now()
        )
      ),

    metadata:
      cloneMetadata(
        metadata
      )
  };

  profile.chests.push(
    chest
  );

  return {
    ok: true,
    chest
  };
}


export function addChests(
  profile,
  {
    type,
    quantity = 1,
    metadata = {},
    createdAt = Date.now()
  } = {}
) {
  const normalizedQuantity =
    normalizeQuantity(
      quantity
    );

  if (!normalizedQuantity) {
    return {
      ok: false,
      error:
        "INVALID_CHEST_QUANTITY"
    };
  }

  /*
   * Cada baú é uma instância real, inclusive quando vários
   * aparecem agrupados como "×N" no !baú. Isso é necessário
   * porque Baús Atômicos terão estado interno próprio e,
   * futuramente, Baús Sazonais/Monstro/Boss também podem
   * carregar metadados de origem diferentes.
   */
  const created = [];

  for (
    let index = 0;
    index < normalizedQuantity;
    index += 1
  ) {
    const result =
      createChestInstance(
        profile,
        {
          type,
          metadata,
          createdAt
        }
      );

    if (!result.ok) {
      return result;
    }

    created.push(
      result.chest
    );
  }

  return {
    ok: true,
    created,
    quantity:
      created.length
  };
}


export function getChestGroups(
  profile
) {
  const state =
    ensureChestState(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const groups =
    new Map();

  for (
    const chest of
      profile.chests
  ) {
    const type =
      normalizeType(
        chest?.type
      );

    if (!type) {
      continue;
    }

    if (!groups.has(type)) {
      groups.set(
        type,
        {
          type,
          label:
            CHEST_TYPE_LABELS[
              type
            ],
          quantity: 0,
          chestIds: []
        }
      );
    }

    const group =
      groups.get(
        type
      );

    group.quantity += 1;

    group.chestIds.push(
      chest.id
    );
  }

  return {
    ok: true,
    groups:
      Array.from(
        groups.values()
      )
  };
}


export function getChestById(
  profile,
  chestId
) {
  const state =
    ensureChestState(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const id =
    String(chestId ?? "")
      .trim();

  if (!id) {
    return {
      ok: false,
      error:
        "INVALID_CHEST_ID"
    };
  }

  const chest =
    profile.chests.find(
      candidate =>
        candidate?.id === id
    ) || null;

  return chest
    ? {
        ok: true,
        chest
      }
    : {
        ok: false,
        error:
          "CHEST_NOT_FOUND"
      };
}


export function removeChestById(
  profile,
  chestId
) {
  const state =
    ensureChestState(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const id =
    String(chestId ?? "")
      .trim();

  const index =
    profile.chests.findIndex(
      chest =>
        chest?.id === id
    );

  if (index < 0) {
    return {
      ok: false,
      error:
        "CHEST_NOT_FOUND"
    };
  }

  const [
    removed
  ] =
    profile.chests.splice(
      index,
      1
    );

  return {
    ok: true,
    chest:
      removed
  };
}


export function getFirstChestOfType(
  profile,
  type
) {
  const state =
    ensureChestState(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const normalizedType =
    normalizeType(
      type
    );

  if (!normalizedType) {
    return {
      ok: false,
      error:
        "INVALID_CHEST_TYPE"
    };
  }

  const chest =
    profile.chests.find(
      candidate =>
        candidate?.type ===
          normalizedType
    ) || null;

  return chest
    ? {
        ok: true,
        chest
      }
    : {
        ok: false,
        error:
          "CHEST_NOT_FOUND"
      };
}
