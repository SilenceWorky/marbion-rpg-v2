import {
  getSeasonCalendarPartsAt
} from "./pvp-season-calendar.js";

import {
  getPvpSeasonScheduledMonth
} from "./pvp-season-schedule.js";

import {
  readPvpSeasonYearSchedule,
  cancelScheduledPvpSeasonYearMonth
} from "./pvp-season-schedule-store.js";

import {
  cleanupExpiredScheduledPvpSeasons
} from "./pvp-season-schedule-cleanup.js";

import {
  readCurrentPvpSeason
} from "./pvp-season-store.js";

import {
  startMonthlyPvpSeason
} from "./pvp-season-service.js";


export async function activateDueScheduledPvpSeason(
  storage,
  now = Date.now()
) {
  const calendar =
    getSeasonCalendarPartsAt(now);

  if (!calendar) {
    return {
      ok: false,
      error: "INVALID_SEASON_ACTIVATION_TIME"
    };
  }

  /*
   * Antes de procurar o mês atual, removemos snapshots cuja
   * janela civil já terminou. Isso impede que uma temporada que
   * nunca conseguiu ativar permaneça órfã como SCHEDULED após
   * sua virada mensal (inclusive entre anos).
   */
  const expiredCleanup =
    await cleanupExpiredScheduledPvpSeasons(
      storage,
      now
    );

  if (!expiredCleanup.ok) {
    return expiredCleanup;
  }

  const scheduleResult =
    await readPvpSeasonYearSchedule(
      storage,
      calendar.year
    );

  if (!scheduleResult.ok) {
    return scheduleResult;
  }

  if (!scheduleResult.schedule) {
    return {
      ok: true,
      changed: false,
      activated: false,
      reason: "NO_SEASON_SCHEDULE"
    };
  }

  const entry =
    getPvpSeasonScheduledMonth(
      scheduleResult.schedule,
      calendar.month
    );

  if (!entry) {
    return {
      ok: true,
      changed: false,
      activated: false,
      reason: "NO_SCHEDULED_SEASON_FOR_CURRENT_MONTH"
    };
  }

  if (now < entry.startsAt) {
    return {
      ok: true,
      changed: false,
      activated: false,
      reason: "SCHEDULED_SEASON_NOT_DUE",
      entry
    };
  }

  if (now >= entry.endsAt) {
    return {
      ok: false,
      error: "SCHEDULED_SEASON_EXPIRED",
      entry
    };
  }

  const current =
    await readCurrentPvpSeason(
      storage
    );

  if (!current.ok) {
    return current;
  }

  if (current.season) {
    if (
      current.season.id ===
      entry.id
    ) {
      const cleanup =
        await cancelScheduledPvpSeasonYearMonth(
          storage,
          {
            year: entry.year,
            month: entry.month
          }
        );

      if (!cleanup.ok) {
        return {
          ok: false,
          error:
            "SEASON_ACTIVATED_SCHEDULE_CLEANUP_FAILED",
          season:
            current.season
        };
      }

      return {
        ok: true,
        changed: false,
        activated: true,
        season:
          current.season,
        scheduleCleared:
          cleanup.changed
      };
    }

    if (
      current.season.status !==
      "ENDED"
    ) {
      return {
        ok: false,
        error: "SEASON_ALREADY_EXISTS",
        season:
          current.season
      };
    }
  }

  const started =
    await startMonthlyPvpSeason(
      storage,
      {
        year:
          entry.year,
        month:
          entry.month,
        name:
          entry.name
      },
      now
    );

  if (!started.ok) {
    if (
      started.error ===
      "INVALID_SEASON_BASE_THEME"
    ) {
      return {
        ok: false,
        error:
          "SEASON_BASE_THEME_NOT_CONFIGURED",
        entry
      };
    }

    return started;
  }

  const cleanup =
    await cancelScheduledPvpSeasonYearMonth(
      storage,
      {
        year: entry.year,
        month: entry.month
      }
    );

  if (!cleanup.ok) {
    return {
      ok: false,
      error:
        "SEASON_ACTIVATED_SCHEDULE_CLEANUP_FAILED",
      season:
        started.season
    };
  }

  return {
    ok: true,
    changed: true,
    activated: true,
    season:
      started.season,
    scheduleCleared:
      cleanup.changed
  };
}
