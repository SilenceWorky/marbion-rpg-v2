import {
  clearPvpSeasonScheduledMonth,
  normalizePvpSeasonYearSchedule
} from "./pvp-season-schedule.js";

import {
  PVP_SEASON_SCHEDULE_STORAGE_PREFIX,
  savePvpSeasonYearSchedule
} from "./pvp-season-schedule-store.js";


function normalizeTimestamp(value) {
  const timestamp = Number(value);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return null;
  }

  return Math.round(timestamp);
}


/*
 * Remove snapshots SCHEDULED cuja janela civil já terminou.
 *
 * A varredura usa apenas o namespace de temporadas agendadas,
 * preserva meses correntes/futuros e funciona também através
 * da virada de ano. Nenhuma temporada ACTIVE é alterada aqui.
 */
export async function cleanupExpiredScheduledPvpSeasons(
  storage,
  now = Date.now()
) {
  if (
    !storage ||
    typeof storage.list !== "function"
  ) {
    return {
      ok: false,
      error: "SEASON_SCHEDULE_LIST_UNAVAILABLE"
    };
  }

  const timestamp = normalizeTimestamp(now);

  if (timestamp === null) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE_CLEANUP_TIME"
    };
  }

  let listed;

  try {
    listed = await storage.list({
      prefix: PVP_SEASON_SCHEDULE_STORAGE_PREFIX
    });
  }
  catch {
    return {
      ok: false,
      error: "SEASON_SCHEDULE_LIST_FAILED"
    };
  }

  if (!(listed instanceof Map)) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE_LIST"
    };
  }

  const removed = [];
  let changed = false;

  for (const rawSchedule of listed.values()) {
    let schedule = normalizePvpSeasonYearSchedule(
      rawSchedule
    );

    if (!schedule) {
      return {
        ok: false,
        error: "INVALID_STORED_SEASON_SCHEDULE"
      };
    }

    let yearChanged = false;

    for (const entry of Object.values(schedule.months)) {
      if (
        !entry ||
        Number(entry.endsAt) > timestamp
      ) {
        continue;
      }

      const cleared = clearPvpSeasonScheduledMonth(
        schedule,
        entry.month
      );

      if (!cleared.ok) {
        return cleared;
      }

      schedule = cleared.schedule;

      if (!cleared.changed) {
        continue;
      }

      changed = true;
      yearChanged = true;
      removed.push({
        id: entry.id,
        year: entry.year,
        month: entry.month,
        endsAt: entry.endsAt
      });
    }

    if (!yearChanged) {
      continue;
    }

    const saved = await savePvpSeasonYearSchedule(
      storage,
      schedule
    );

    if (!saved.ok) {
      return saved;
    }
  }

  return {
    ok: true,
    changed,
    removed
  };
}
