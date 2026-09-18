import {
  SEASON_PASS_MAX_TIER,
  SEASON_PASS_TOTAL_XP,
  getSeasonPassProgress,
  resolvePostPassRewards,
  splitSeasonPassXp
} from "./season-pass-progression.js";


function normalizeSeasonId(
  value
) {
  const id =
    String(value ?? "")
      .trim();

  return id || null;
}


function normalizePositiveInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return Math.floor(number);
}


function normalizeMultiplier(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}


export function createSeasonPassState(
  seasonId = null
) {
  return {
    seasonId:
      normalizeSeasonId(
        seasonId
      ),
    xp: 0,
    tier: 0,
    completed: false,
    postPassXp: 0,
    claimedRewards: []
  };
}


export function syncSeasonPassState(
  profile,
  seasonId
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }

  const normalizedSeasonId =
    normalizeSeasonId(
      seasonId
    );

  if (!normalizedSeasonId) {
    return {
      ok: false,
      error: "INVALID_SEASON_ID"
    };
  }

  const current =
    profile.seasonPass &&
    typeof profile.seasonPass ===
      "object"
      ? profile.seasonPass
      : createSeasonPassState();

  const currentSeasonId =
    normalizeSeasonId(
      current.seasonId
    );

  const changedSeason =
    currentSeasonId !==
    normalizedSeasonId;

  if (changedSeason) {
    profile.seasonPass =
      createSeasonPassState(
        normalizedSeasonId
      );

    return {
      ok: true,
      changedSeason: true,
      seasonPass:
        profile.seasonPass
    };
  }

  const progress =
    getSeasonPassProgress(
      current.xp
    );

  profile.seasonPass = {
    ...createSeasonPassState(
      normalizedSeasonId
    ),
    ...current,
    seasonId:
      normalizedSeasonId,
    xp:
      progress.xp,
    tier:
      progress.tier,
    completed:
      progress.completed,
    postPassXp:
      Math.max(
        0,
        Math.floor(
          Number(
            current.postPassXp
          ) || 0
        )
      ),
    claimedRewards:
      Array.isArray(
        current.claimedRewards
      )
        ? [
            ...current.claimedRewards
          ]
        : []
  };

  return {
    ok: true,
    changedSeason: false,
    seasonPass:
      profile.seasonPass
  };
}


export function applySeasonPassXp(
  profile,
  {
    seasonId,
    amount,
    multiplier = 1
  } = {}
) {
  const normalizedSeasonId =
    normalizeSeasonId(
      seasonId
    );

  const normalizedAmount =
    normalizePositiveInteger(
      amount
    );

  const normalizedMultiplier =
    normalizeMultiplier(
      multiplier
    );

  if (!normalizedSeasonId) {
    return {
      ok: false,
      error: "INVALID_SEASON_ID"
    };
  }

  if (!normalizedAmount) {
    return {
      ok: false,
      error: "INVALID_PASS_XP_AMOUNT"
    };
  }

  if (!normalizedMultiplier) {
    return {
      ok: false,
      error: "INVALID_PASS_XP_MULTIPLIER"
    };
  }

  const sync =
    syncSeasonPassState(
      profile,
      normalizedSeasonId
    );

  if (!sync.ok) {
    return sync;
  }

  const previousTier =
    profile.seasonPass.tier;

  const previousPassXp =
    profile.seasonPass.xp;

  const previousPostPassXp =
    profile.seasonPass
      .postPassXp;

  const effectiveXp =
    Math.floor(
      normalizedAmount *
      normalizedMultiplier
    );

  if (effectiveXp <= 0) {
    return {
      ok: false,
      error:
        "INVALID_EFFECTIVE_PASS_XP"
    };
  }

  const split =
    splitSeasonPassXp(
      previousPassXp,
      effectiveXp
    );

  const post =
    resolvePostPassRewards(
      previousPostPassXp,
      split.postPassGain
    );

  const progress =
    getSeasonPassProgress(
      split.passXp
    );

  profile.seasonPass.xp =
    progress.xp;

  profile.seasonPass.tier =
    progress.tier;

  profile.seasonPass.completed =
    progress.completed;

  profile.seasonPass.postPassXp =
    post.postPassXp;

  const unlockedTiers = [];

  for (
    let tier =
      previousTier + 1;
    tier <= progress.tier;
    tier += 1
  ) {
    unlockedTiers.push(
      tier
    );
  }

  return {
    ok: true,

    seasonId:
      normalizedSeasonId,

    seasonReset:
      sync.changedSeason,

    baseXp:
      normalizedAmount,

    multiplier:
      normalizedMultiplier,

    xpGained:
      effectiveXp,

    passXpGained:
      split.passXp -
      previousPassXp,

    postPassXpGained:
      split.postPassGain,

    tier:
      progress.tier,

    maxTier:
      SEASON_PASS_MAX_TIER,

    completed:
      progress.completed,

    xp:
      progress.xp,

    totalXp:
      SEASON_PASS_TOTAL_XP,

    unlockedTiers,

    postPassXp:
      post.postPassXp,

    postPassRewardsUnlocked:
      post.rewards,

    seasonPass:
      profile.seasonPass
  };
}
