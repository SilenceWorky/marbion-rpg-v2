import {
  createPvpSeason,
  endPvpSeason,
  getPvpSeasonLifecycleStatus,
  getPvpSeasonRemainingMs,
  isPvpSeasonActive
} from "./pvp-season.js";

import {
  readCurrentPvpSeason,
  saveCurrentPvpSeason
} from "./pvp-season-store.js";


export async function getPvpSeasonState(
  storage,
  now = Date.now()
) {
  const current =
    await readCurrentPvpSeason(
      storage
    );

  if (!current.ok) {
    return current;
  }

  if (!current.season) {
    return {
      ok: true,
      season: null,
      lifecycle: "NONE",
      active: false,
      remainingMs: 0
    };
  }

  return {
    ok: true,
    season:
      current.season,
    lifecycle:
      getPvpSeasonLifecycleStatus(
        current.season,
        now
      ),
    active:
      isPvpSeasonActive(
        current.season,
        now
      ),
    remainingMs:
      getPvpSeasonRemainingMs(
        current.season,
        now
      )
  };
}


export async function startPvpSeason(
  storage,
  options = {},
  now = Date.now()
) {
  const current =
    await readCurrentPvpSeason(
      storage
    );

  if (!current.ok) {
    return current;
  }

  if (
    current.season &&
    current.season.status !== "ENDED"
  ) {
    return {
      ok: false,
      error:
        "SEASON_ALREADY_EXISTS",
      season:
        current.season,
      lifecycle:
        getPvpSeasonLifecycleStatus(
          current.season,
          now
        )
    };
  }

  const created =
    createPvpSeason({
      ...options,
      startsAt:
        options.startsAt ??
        now
    });

  if (!created.ok) {
    return created;
  }

  const saved =
    await saveCurrentPvpSeason(
      storage,
      created.season
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed: true,
    season:
      saved.season,
    lifecycle:
      getPvpSeasonLifecycleStatus(
        saved.season,
        now
      )
  };
}


export async function endCurrentPvpSeason(
  storage,
  endedAt = Date.now()
) {
  const current =
    await readCurrentPvpSeason(
      storage
    );

  if (!current.ok) {
    return current;
  }

  if (!current.season) {
    return {
      ok: false,
      error:
        "NO_CURRENT_SEASON"
    };
  }

  const ended =
    endPvpSeason(
      current.season,
      endedAt
    );

  if (!ended.ok) {
    return ended;
  }

  if (!ended.changed) {
    return {
      ok: true,
      changed: false,
      season:
        ended.season,
      lifecycle: "ENDED"
    };
  }

  const saved =
    await saveCurrentPvpSeason(
      storage,
      ended.season
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed: true,
    season:
      saved.season,
    lifecycle: "ENDED"
  };
}
