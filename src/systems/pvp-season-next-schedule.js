import {
  normalizePvpSeasonYearSchedule
} from "./pvp-season-schedule.js";

import {
  PVP_SEASON_SCHEDULE_STORAGE_PREFIX
} from "./pvp-season-schedule-store.js";


function hasMethod(
  value,
  method
) {
  return Boolean(
    value &&
    typeof value[method] === "function"
  );
}


function normalizeNow(value) {
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


/*
 * Procura apenas ativações FUTURAS.
 *
 * Uma entrada cujo startsAt já chegou é tratada
 * pelo motor de ativação no alarm atual. Se essa
 * ativação falhar, não reagendamos para now + 1,
 * evitando um loop apertado de alarms.
 */
export async function findNextScheduledPvpSeason(
  storage,
  now = Date.now()
) {
  if (!hasMethod(storage, "list")) {
    return {
      ok: false,
      error:
        "SEASON_SCHEDULE_LIST_UNAVAILABLE"
    };
  }

  const timestamp =
    normalizeNow(now);

  if (timestamp === null) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_SCHEDULE_LOOKUP_TIME"
    };
  }

  let listed;

  try {
    listed =
      await storage.list({
        prefix:
          PVP_SEASON_SCHEDULE_STORAGE_PREFIX
      });
  }
  catch {
    return {
      ok: false,
      error:
        "SEASON_SCHEDULE_LIST_FAILED"
    };
  }

  const values =
    listed instanceof Map
      ? [
          ...listed.values()
        ]
      : [];

  let nextEntry = null;

  for (
    const rawSchedule
    of values
  ) {
    const schedule =
      normalizePvpSeasonYearSchedule(
        rawSchedule
      );

    if (!schedule) {
      return {
        ok: false,
        error:
          "INVALID_STORED_SEASON_SCHEDULE"
      };
    }

    for (
      const entry
      of Object.values(
        schedule.months
      )
    ) {
      if (
        !entry ||
        entry.startsAt <= timestamp
      ) {
        continue;
      }

      if (
        !nextEntry ||
        entry.startsAt <
          nextEntry.startsAt
      ) {
        nextEntry = entry;
      }
    }
  }

  if (!nextEntry) {
    return {
      ok: true,
      entry: null,
      alarmAt: null
    };
  }

  return {
    ok: true,
    entry:
      nextEntry,
    alarmAt:
      nextEntry.startsAt
  };
}
