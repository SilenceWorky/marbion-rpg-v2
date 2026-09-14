import {
  normalizePvpSeason
} from "./pvp-season.js";


export const PVP_SEASON_STORAGE_KEY =
  "pvp_current_season";


function hasMethod(
  value,
  method
) {
  return Boolean(
    value &&
    typeof value[method] === "function"
  );
}


export async function readCurrentPvpSeason(
  storage
) {
  if (!hasMethod(storage, "get")) {
    return {
      ok: false,
      error: "SEASON_STORAGE_UNAVAILABLE"
    };
  }

  let stored;

  try {
    stored =
      await storage.get(
        PVP_SEASON_STORAGE_KEY
      );
  }
  catch {
    return {
      ok: false,
      error: "SEASON_STORAGE_READ_FAILED"
    };
  }

  if (
    stored === null ||
    stored === undefined
  ) {
    return {
      ok: true,
      season: null
    };
  }

  const season =
    normalizePvpSeason(
      stored
    );

  if (!season) {
    return {
      ok: false,
      error: "INVALID_STORED_SEASON"
    };
  }

  return {
    ok: true,
    season
  };
}


export async function saveCurrentPvpSeason(
  storage,
  season
) {
  if (!hasMethod(storage, "put")) {
    return {
      ok: false,
      error: "SEASON_STORAGE_UNAVAILABLE"
    };
  }

  const normalized =
    normalizePvpSeason(
      season
    );

  if (!normalized) {
    return {
      ok: false,
      error: "INVALID_SEASON"
    };
  }

  try {
    await storage.put(
      PVP_SEASON_STORAGE_KEY,
      normalized
    );
  }
  catch {
    return {
      ok: false,
      error: "SEASON_STORAGE_WRITE_FAILED"
    };
  }

  return {
    ok: true,
    season: normalized
  };
}


export async function clearCurrentPvpSeason(
  storage
) {
  if (!hasMethod(storage, "delete")) {
    return {
      ok: false,
      error: "SEASON_STORAGE_UNAVAILABLE"
    };
  }

  try {
    await storage.delete(
      PVP_SEASON_STORAGE_KEY
    );
  }
  catch {
    return {
      ok: false,
      error: "SEASON_STORAGE_DELETE_FAILED"
    };
  }

  return {
    ok: true
  };
}
