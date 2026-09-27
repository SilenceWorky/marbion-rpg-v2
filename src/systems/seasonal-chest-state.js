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

  const seasonId =
    normalizeSeasonId(
      chest?.metadata
        ?.seasonal
        ?.seasonId
    );

  if (!seasonId) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_SEASON_NOT_BOUND"
    };
  }

  return {
    ok: true,
    state: {
      seasonId
    }
  };
}


export function createSeasonalChest(
  profile,
  {
    seasonId,
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
      normalizedSeasonId
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
