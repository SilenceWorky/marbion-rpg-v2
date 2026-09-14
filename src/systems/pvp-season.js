export const PVP_SEASON_VERSION = 1;

export const PVP_SEASON_DEFAULT_DURATION_MS =
  30 * 24 * 60 * 60 * 1000;

export const PVP_SEASON_STATUS_ACTIVE =
  "ACTIVE";

export const PVP_SEASON_STATUS_ENDED =
  "ENDED";


function normalizeTimestamp(value) {
  const timestamp =
    Number(value);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return null;
  }

  return Math.round(timestamp);
}


export function normalizeSeasonId(value) {
  const id =
    String(value ?? "")
      .trim();

  return id || null;
}


export function normalizeSeasonName(value) {
  const name =
    String(value ?? "")
      .trim();

  return name || null;
}


export function createPvpSeason({
  id,
  name,
  startsAt = Date.now(),
  endsAt = null,
  durationMs = PVP_SEASON_DEFAULT_DURATION_MS
} = {}) {
  const normalizedId =
    normalizeSeasonId(id);

  const normalizedName =
    normalizeSeasonName(name);

  const normalizedStartsAt =
    normalizeTimestamp(startsAt);

  const normalizedDuration =
    Number(durationMs);

  if (!normalizedId) {
    return {
      ok: false,
      error: "INVALID_SEASON_ID"
    };
  }

  if (!normalizedName) {
    return {
      ok: false,
      error: "INVALID_SEASON_NAME"
    };
  }

  if (normalizedStartsAt === null) {
    return {
      ok: false,
      error: "INVALID_SEASON_START"
    };
  }

  let normalizedEndsAt =
    endsAt === null ||
    endsAt === undefined
      ? null
      : normalizeTimestamp(endsAt);

  if (normalizedEndsAt === null) {
    if (
      !Number.isFinite(normalizedDuration) ||
      normalizedDuration <= 0
    ) {
      return {
        ok: false,
        error: "INVALID_SEASON_DURATION"
      };
    }

    normalizedEndsAt =
      normalizedStartsAt +
      Math.round(normalizedDuration);
  }

  if (
    normalizedEndsAt <=
    normalizedStartsAt
  ) {
    return {
      ok: false,
      error: "INVALID_SEASON_END"
    };
  }

  return {
    ok: true,
    season: {
      version:
        PVP_SEASON_VERSION,

      id:
        normalizedId,

      name:
        normalizedName,

      status:
        PVP_SEASON_STATUS_ACTIVE,

      startsAt:
        normalizedStartsAt,

      endsAt:
        normalizedEndsAt,

      endedAt:
        null
    }
  };
}


export function normalizePvpSeason(value) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const id =
    normalizeSeasonId(value.id);

  const name =
    normalizeSeasonName(value.name);

  const startsAt =
    normalizeTimestamp(value.startsAt);

  const endsAt =
    normalizeTimestamp(value.endsAt);

  if (
    !id ||
    !name ||
    startsAt === null ||
    endsAt === null ||
    endsAt <= startsAt
  ) {
    return null;
  }

  const status =
    value.status === PVP_SEASON_STATUS_ENDED
      ? PVP_SEASON_STATUS_ENDED
      : PVP_SEASON_STATUS_ACTIVE;

  const endedAt =
    status === PVP_SEASON_STATUS_ENDED
      ? normalizeTimestamp(value.endedAt) ?? endsAt
      : null;

  return {
    version:
      PVP_SEASON_VERSION,
    id,
    name,
    status,
    startsAt,
    endsAt,
    endedAt
  };
}


export function isPvpSeasonActive(
  season,
  now = Date.now()
) {
  const normalized =
    normalizePvpSeason(season);

  const timestamp =
    normalizeTimestamp(now);

  if (
    !normalized ||
    timestamp === null
  ) {
    return false;
  }

  return (
    normalized.status ===
      PVP_SEASON_STATUS_ACTIVE &&
    timestamp >=
      normalized.startsAt &&
    timestamp <
      normalized.endsAt
  );
}


export function getPvpSeasonRemainingMs(
  season,
  now = Date.now()
) {
  const normalized =
    normalizePvpSeason(season);

  const timestamp =
    normalizeTimestamp(now);

  if (
    !normalized ||
    timestamp === null ||
    normalized.status ===
      PVP_SEASON_STATUS_ENDED
  ) {
    return 0;
  }

  return Math.max(
    0,
    normalized.endsAt -
      timestamp
  );
}


export function getPvpSeasonLifecycleStatus(
  season,
  now = Date.now()
) {
  const normalized =
    normalizePvpSeason(season);

  const timestamp =
    normalizeTimestamp(now);

  if (
    !normalized ||
    timestamp === null
  ) {
    return "NONE";
  }

  if (
    normalized.status ===
      PVP_SEASON_STATUS_ENDED
  ) {
    return "ENDED";
  }

  if (
    timestamp <
    normalized.startsAt
  ) {
    return "SCHEDULED";
  }

  if (
    timestamp >=
    normalized.endsAt
  ) {
    return "EXPIRED";
  }

  return "ACTIVE";
}


export function endPvpSeason(
  season,
  endedAt = Date.now()
) {
  const normalized =
    normalizePvpSeason(season);

  const timestamp =
    normalizeTimestamp(endedAt);

  if (!normalized) {
    return {
      ok: false,
      error: "INVALID_SEASON"
    };
  }

  if (timestamp === null) {
    return {
      ok: false,
      error: "INVALID_SEASON_END_TIME"
    };
  }

  if (
    normalized.status ===
    PVP_SEASON_STATUS_ENDED
  ) {
    return {
      ok: true,
      changed: false,
      season: normalized
    };
  }

  return {
    ok: true,
    changed: true,
    season: {
      ...normalized,
      status:
        PVP_SEASON_STATUS_ENDED,
      endedAt:
        timestamp
    }
  };
}
