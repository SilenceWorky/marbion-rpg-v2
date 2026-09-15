import {
  PVP_SEASON_TIMEZONE
} from "./pvp-season-calendar.js";

import {
  readCurrentPvpSeason
} from "./pvp-season-store.js";

import {
  endCurrentPvpSeason
} from "./pvp-season-service.js";


function isCanonicalMonthlySeason(
  season
) {
  return Boolean(
    season &&
    Number.isInteger(
      Number(season.year)
    ) &&
    Number.isInteger(
      Number(season.month)
    ) &&
    season.timezone ===
      PVP_SEASON_TIMEZONE
  );
}


export async function getCurrentMonthlyPvpSeasonEndCandidate(
  storage,
  now = Date.now()
) {
  const timestamp =
    Number(now);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_EXPIRATION_TIME"
    };
  }

  const current =
    await readCurrentPvpSeason(
      storage
    );

  if (!current.ok) {
    return current;
  }

  const season =
    current.season;

  if (
    !season ||
    season.status === "ENDED" ||
    !isCanonicalMonthlySeason(season)
  ) {
    return {
      ok: true,
      candidate: null
    };
  }

  const endsAt =
    Number(season.endsAt);

  if (
    !Number.isFinite(endsAt) ||
    endsAt < 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_CURRENT_SEASON_END"
    };
  }

  return {
    ok: true,
    candidate: {
      season,
      alarmAt:
        endsAt,
      due:
        timestamp >= endsAt
    }
  };
}


export async function closeExpiredMonthlyPvpSeason(
  storage,
  now = Date.now()
) {
  const candidateResult =
    await getCurrentMonthlyPvpSeasonEndCandidate(
      storage,
      now
    );

  if (!candidateResult.ok) {
    return candidateResult;
  }

  const candidate =
    candidateResult.candidate;

  if (!candidate) {
    return {
      ok: true,
      changed: false,
      ended: false,
      reason:
        "NO_ACTIVE_MONTHLY_SEASON"
    };
  }

  if (!candidate.due) {
    return {
      ok: true,
      changed: false,
      ended: false,
      reason:
        "MONTHLY_SEASON_NOT_DUE",
      season:
        candidate.season,
      alarmAt:
        candidate.alarmAt
    };
  }

  const ended =
    await endCurrentPvpSeason(
      storage,
      candidate.alarmAt
    );

  if (!ended.ok) {
    return ended;
  }

  return {
    ok: true,
    changed:
      ended.changed === true,
    ended: true,
    season:
      ended.season,
    endedAt:
      candidate.alarmAt
  };
}
