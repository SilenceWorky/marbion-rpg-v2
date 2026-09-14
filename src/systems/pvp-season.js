import {
  PVP_SEASON_TIMEZONE,
  getSeasonMonthName,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";


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


function normalizeOptionalText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .trim();

  return text || null;
}


function normalizeMonthlyMetadata(value = {}) {
  const supplied =
    [
      value.year,
      value.month,
      value.monthName,
      value.baseTheme,
      value.timezone
    ].some(
      field =>
        field !== null &&
        field !== undefined
    );

  if (!supplied) {
    return {
      ok: true,
      metadata: null
    };
  }

  const year =
    normalizeSeasonYear(
      value.year
    );

  const month =
    normalizeSeasonMonth(
      value.month
    );

  const baseTheme =
    normalizeOptionalText(
      value.baseTheme
    );

  const timezone =
    normalizeOptionalText(
      value.timezone
    );

  const expectedMonthName =
    getSeasonMonthName(
      month
    );

  const suppliedMonthName =
    normalizeOptionalText(
      value.monthName
    );

  if (
    !year ||
    !month ||
    !expectedMonthName ||
    !baseTheme ||
    timezone !== PVP_SEASON_TIMEZONE ||
    (
      suppliedMonthName &&
      suppliedMonthName !==
        expectedMonthName
    )
  ) {
    return {
      ok: false,
      metadata: null
    };
  }

  return {
    ok: true,
    metadata: {
      year,
      month,
      monthName:
        expectedMonthName,
      baseTheme,
      timezone:
        PVP_SEASON_TIMEZONE
    }
  };
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
  durationMs = PVP_SEASON_DEFAULT_DURATION_MS,
  year = null,
  month = null,
  monthName = null,
  baseTheme = null,
  timezone = null
} = {}) {
  const normalizedId =
    normalizeSeasonId(id);

  const normalizedName =
    normalizeSeasonName(name);

  const normalizedStartsAt =
    normalizeTimestamp(startsAt);

  const normalizedDuration =
    Number(durationMs);

  const monthly =
    normalizeMonthlyMetadata({
      year,
      month,
      monthName,
      baseTheme,
      timezone
    });

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

  if (!monthly.ok) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_MONTHLY_METADATA"
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
        null,

      ...(monthly.metadata || {})
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

  const monthly =
    normalizeMonthlyMetadata(value);

  if (
    !id ||
    !name ||
    startsAt === null ||
    endsAt === null ||
    endsAt <= startsAt ||
    !monthly.ok
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
    endedAt,
    ...(monthly.metadata || {})
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
