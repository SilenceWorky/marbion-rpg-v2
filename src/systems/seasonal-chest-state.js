import {
  CHEST_TYPES,
  createChestInstance
} from "./chest-inventory.js";


function normalizeSeasonId(
  value
) {
  const seasonId =
    String(value ?? "")
      .trim();

  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/
      .test(
        seasonId
      )
  ) {
    return null;
  }

  return seasonId;
}


function normalizeSeasonalChestId(
  value,
  seasonId
) {
  const id =
    String(value ?? "")
      .trim();

  const modern =
    id.match(
      /^seasonal:(\d{4}-(?:0[1-9]|1[0-2])):chest:[a-zA-Z0-9_-]{6,96}$/
    );

  const legacy =
    id.match(
      /^(\d{4}-(?:0[1-9]|1[0-2])):[a-zA-Z0-9_-]{3,120}$/
    );

  const embeddedSeasonId =
    modern?.[1] ??
    legacy?.[1] ??
    null;

  if (
    !embeddedSeasonId ||
    (
      seasonId &&
      embeddedSeasonId !==
        seasonId
    )
  ) {
    return null;
  }

  return id;
}


function normalizePositiveInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return number;
}


function normalizeSnapshotText(
  value,
  max
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  return text.slice(
    0,
    max
  );
}


export function getSeasonalChestState(
  chest
) {
  if (
    !chest ||
    typeof chest !== "object" ||
    Array.isArray(chest) ||
    chest.type !==
      CHEST_TYPES.SEASONAL
  ) {
    return {
      ok: false,
      error:
        "NOT_SEASONAL_CHEST"
    };
  }

  const seasonal =
    chest?.metadata
      ?.seasonal;

  const seasonId =
    normalizeSeasonId(
      seasonal?.seasonId
    );

  if (!seasonId) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_SEASON_NOT_BOUND"
    };
  }

  const seasonalChestId =
    normalizeSeasonalChestId(
      seasonal?.seasonalChestId,
      seasonId
    );

  const chestOrder =
    normalizePositiveInteger(
      seasonal?.chestOrder
    );

  const poolRevision =
    normalizePositiveInteger(
      seasonal?.poolRevision
    );

  const nameSnapshot =
    normalizeSnapshotText(
      seasonal?.nameSnapshot ??
      seasonal?.name,
      160
    );

  const descriptionSnapshot =
    normalizeSnapshotText(
      seasonal?.descriptionSnapshot ??
      seasonal?.description,
      1200
    );

  const coreIdentityValues = [
    seasonalChestId,
    chestOrder,
    nameSnapshot
  ];

  const coreIdentityComplete =
    coreIdentityValues.every(
      value =>
        value !== null
    );

  const coreIdentityPartiallyPresent =
    coreIdentityValues.some(
      value =>
        value !== null
    );

  if (
    coreIdentityPartiallyPresent &&
    !coreIdentityComplete
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_IDENTITY"
    };
  }

  /*
   * Compatibilidade explícita:
   * instâncias antigas tinham apenas seasonId.
   * Mantemos exatamente o shape legado para não
   * inventar ID, ordem, nome ou revisão.
   */
  if (!coreIdentityComplete) {
    return {
      ok: true,
      state: {
        seasonId
      }
    };
  }

  const identityComplete =
    poolRevision !== null;

  return {
    ok: true,
    state: {
      seasonId,
      seasonalChestId,
      chestOrder,
      poolRevision:
        poolRevision ??
        null,
      name:
        nameSnapshot,
      nameSnapshot,
      description:
        descriptionSnapshot ??
        null,
      descriptionSnapshot:
        descriptionSnapshot ??
        null,
      identityComplete,
      legacy:
        !identityComplete,
      legacyMode:
        poolRevision === null
          ? "pre-versioned"
          : null
    }
  };
}


export function createSeasonalChest(
  profile,
  {
    seasonId,
    seasonalChestId = null,
    chestOrder = null,
    poolRevision = null,
    name = null,
    nameSnapshot = null,
    description = null,
    descriptionSnapshot = null,
    createdAt = Date.now(),
    metadata = {}
  } = {}
) {
  const normalizedSeasonId =
    normalizeSeasonId(
      seasonId
    );

  if (!normalizedSeasonId) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_ID"
    };
  }

  const resolvedName =
    nameSnapshot ??
    name;

  const resolvedDescription =
    descriptionSnapshot ??
    description;

  const coreIdentityRequested =
    seasonalChestId !== null ||
    chestOrder !== null ||
    resolvedName !== null;

  const poolRevisionRequested =
    poolRevision !== null &&
    poolRevision !== undefined;

  let normalizedIdentity =
    null;

  if (
    coreIdentityRequested ||
    poolRevisionRequested
  ) {
    const id =
      normalizeSeasonalChestId(
        seasonalChestId,
        normalizedSeasonId
      );

    if (!id) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_ID"
      };
    }

    const order =
      normalizePositiveInteger(
        chestOrder
      );

    if (!order) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_ORDER"
      };
    }

    const normalizedName =
      normalizeSnapshotText(
        resolvedName,
        160
      );

    if (!normalizedName) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_NAME"
      };
    }

    const revision =
      poolRevisionRequested
        ? normalizePositiveInteger(
            poolRevision
          )
        : null;

    if (
      poolRevisionRequested &&
      !revision
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_POOL_REVISION"
      };
    }

    const normalizedDescription =
      normalizeSnapshotText(
        resolvedDescription,
        1200
      );

    normalizedIdentity = {
      seasonalChestId:
        id,
      chestOrder:
        order,
      ...(revision
        ? {
            poolRevision:
              revision
          }
        : {}),
      name:
        normalizedName,
      nameSnapshot:
        normalizedName,
      description:
        normalizedDescription,
      descriptionSnapshot:
        normalizedDescription
    };
  }

  const extraMetadata =
    (
      metadata &&
      typeof metadata === "object" &&
      !Array.isArray(metadata)
    )
      ? structuredClone(
          metadata
        )
      : {};

  const existingSeasonal =
    (
      extraMetadata.seasonal &&
      typeof extraMetadata.seasonal ===
        "object" &&
      !Array.isArray(
        extraMetadata.seasonal
      )
    )
      ? extraMetadata.seasonal
      : {};

  extraMetadata.seasonal = {
    ...existingSeasonal,
    seasonId:
      normalizedSeasonId,
    ...(normalizedIdentity ??
      {})
  };

  return createChestInstance(
    profile,
    {
      type:
        CHEST_TYPES.SEASONAL,
      metadata:
        extraMetadata,
      createdAt
    }
  );
}


export function createSeasonalChestFromDefinition(
  profile,
  definition,
  {
    createdAt = Date.now(),
    metadata = {}
  } = {}
) {
  if (
    !definition ||
    typeof definition !== "object" ||
    Array.isArray(definition)
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_DEFINITION"
    };
  }

  return createSeasonalChest(
    profile,
    {
      seasonId:
        definition.seasonId,
      seasonalChestId:
        definition.id,
      chestOrder:
        definition.order,
      poolRevision:
        definition.poolRevision,
      nameSnapshot:
        definition.name,
      descriptionSnapshot:
        definition.description,
      createdAt,
      metadata
    }
  );
}
