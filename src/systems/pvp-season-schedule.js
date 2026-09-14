import {
  getMonthlySeasonBounds,
  getMonthlySeasonId,
  getSeasonMonthName,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";

import {
  normalizePvpSeasonPlanMonth
} from "./pvp-season-plan.js";


export const PVP_SEASON_SCHEDULE_VERSION = 1;

export const PVP_SEASON_SCHEDULE_STATUS_SCHEDULED =
  "SCHEDULED";


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


function getMonthKey(month) {
  const normalized =
    normalizeSeasonMonth(month);

  if (!normalized) {
    return null;
  }

  return String(normalized)
    .padStart(2, "0");
}


export function createPvpSeasonYearSchedule(
  year
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  if (!normalizedYear) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  return {
    ok: true,
    schedule: {
      version:
        PVP_SEASON_SCHEDULE_VERSION,
      year:
        normalizedYear,
      months: {}
    }
  };
}


export function createScheduledPvpSeasonMonth(
  definition,
  scheduledAt = Date.now()
) {
  const normalizedDefinition =
    normalizePvpSeasonPlanMonth(
      definition
    );

  if (!normalizedDefinition) {
    return {
      ok: false,
      error: "INVALID_SEASON_DEFINITION"
    };
  }

  const timestamp =
    normalizeTimestamp(
      scheduledAt
    );

  if (timestamp === null) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE_TIME"
    };
  }

  const bounds =
    getMonthlySeasonBounds(
      normalizedDefinition.year,
      normalizedDefinition.month
    );

  if (!bounds.ok) {
    return bounds;
  }

  if (
    timestamp >=
    bounds.startsAt
  ) {
    return {
      ok: false,
      error: "SEASON_SCHEDULE_WINDOW_CLOSED"
    };
  }

  return {
    ok: true,
    entry: {
      id:
        getMonthlySeasonId(
          normalizedDefinition.year,
          normalizedDefinition.month
        ),
      year:
        normalizedDefinition.year,
      month:
        normalizedDefinition.month,
      monthName:
        getSeasonMonthName(
          normalizedDefinition.month
        ),
      name:
        normalizedDefinition.name,
      status:
        PVP_SEASON_SCHEDULE_STATUS_SCHEDULED,
      startsAt:
        bounds.startsAt,
      endsAt:
        bounds.endsAt,
      scheduledAt:
        timestamp
    }
  };
}


export function normalizePvpSeasonScheduleMonth(
  value,
  fallbackYear = null
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const year =
    normalizeSeasonYear(
      value.year ??
      fallbackYear
    );

  const month =
    normalizeSeasonMonth(
      value.month
    );

  const name =
    String(value.name ?? "")
      .trim();

  const startsAt =
    normalizeTimestamp(
      value.startsAt
    );

  const endsAt =
    normalizeTimestamp(
      value.endsAt
    );

  const scheduledAt =
    normalizeTimestamp(
      value.scheduledAt
    );

  if (
    !year ||
    !month ||
    !name ||
    startsAt === null ||
    endsAt === null ||
    scheduledAt === null ||
    endsAt <= startsAt
  ) {
    return null;
  }

  return {
    id:
      getMonthlySeasonId(
        year,
        month
      ),
    year,
    month,
    monthName:
      getSeasonMonthName(month),
    name,
    status:
      PVP_SEASON_SCHEDULE_STATUS_SCHEDULED,
    startsAt,
    endsAt,
    scheduledAt
  };
}


export function normalizePvpSeasonYearSchedule(
  value
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const year =
    normalizeSeasonYear(
      value.year
    );

  if (!year) {
    return null;
  }

  const rawMonths =
    value.months &&
    typeof value.months === "object"
      ? value.months
      : {};

  const months = {};

  for (
    let month = 1;
    month <= 12;
    month += 1
  ) {
    const key =
      getMonthKey(month);

    const raw =
      rawMonths[key] ??
      rawMonths[month];

    if (
      raw === null ||
      raw === undefined
    ) {
      continue;
    }

    const normalized =
      normalizePvpSeasonScheduleMonth(
        {
          ...raw,
          month
        },
        year
      );

    if (!normalized) {
      return null;
    }

    months[key] =
      normalized;
  }

  return {
    version:
      PVP_SEASON_SCHEDULE_VERSION,
    year,
    months
  };
}


export function setPvpSeasonScheduledMonth(
  schedule,
  entry
) {
  const normalizedSchedule =
    normalizePvpSeasonYearSchedule(
      schedule
    );

  const normalizedEntry =
    normalizePvpSeasonScheduleMonth(
      entry,
      normalizedSchedule?.year
    );

  if (!normalizedSchedule) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE"
    };
  }

  if (
    !normalizedEntry ||
    normalizedEntry.year !==
      normalizedSchedule.year
  ) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE_ENTRY"
    };
  }

  const key =
    getMonthKey(
      normalizedEntry.month
    );

  const previous =
    normalizedSchedule.months[key] ??
    null;

  return {
    ok: true,
    changed:
      !previous ||
      previous.name !== normalizedEntry.name ||
      previous.startsAt !== normalizedEntry.startsAt ||
      previous.endsAt !== normalizedEntry.endsAt,
    entry:
      normalizedEntry,
    schedule: {
      ...normalizedSchedule,
      months: {
        ...normalizedSchedule.months,
        [key]: normalizedEntry
      }
    }
  };
}


export function getPvpSeasonScheduledMonth(
  schedule,
  month
) {
  const normalizedSchedule =
    normalizePvpSeasonYearSchedule(
      schedule
    );

  const key =
    getMonthKey(month);

  if (
    !normalizedSchedule ||
    !key
  ) {
    return null;
  }

  return (
    normalizedSchedule.months[key] ??
    null
  );
}


export function clearPvpSeasonScheduledMonth(
  schedule,
  month
) {
  const normalizedSchedule =
    normalizePvpSeasonYearSchedule(
      schedule
    );

  if (!normalizedSchedule) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE"
    };
  }

  const key =
    getMonthKey(month);

  if (!key) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  if (!normalizedSchedule.months[key]) {
    return {
      ok: true,
      changed: false,
      schedule:
        normalizedSchedule
    };
  }

  const months = {
    ...normalizedSchedule.months
  };

  delete months[key];

  return {
    ok: true,
    changed: true,
    schedule: {
      ...normalizedSchedule,
      months
    }
  };
}
