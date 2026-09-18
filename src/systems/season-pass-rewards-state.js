import {
  SEASON_PASS_MAX_TIER
} from "./season-pass-progression.js";


function normalizeTier(
  value
) {
  const tier =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(tier) ||
    tier < 1 ||
    tier >
      SEASON_PASS_MAX_TIER
  ) {
    return null;
  }

  return tier;
}


function normalizeClaimedRewards(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(
          normalizeTier
        )
        .filter(
          tier =>
            tier !== null
        )
    )
  ]
    .sort(
      (a, b) =>
        a - b
    );
}


export function ensureSeasonPassClaimState(
  profile
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

  if (
    !profile.seasonPass ||
    typeof profile.seasonPass !==
      "object"
  ) {
    return {
      ok: false,
      error: "SEASON_PASS_NOT_FOUND"
    };
  }

  profile.seasonPass.claimedRewards =
    normalizeClaimedRewards(
      profile.seasonPass
        .claimedRewards
    );

  return {
    ok: true,
    claimedRewards:
      profile.seasonPass
        .claimedRewards
  };
}


export function getClaimableSeasonPassTiers(
  profile
) {
  const ensured =
    ensureSeasonPassClaimState(
      profile
    );

  if (!ensured.ok) {
    return ensured;
  }

  const currentTier =
    Math.max(
      0,
      Math.min(
        SEASON_PASS_MAX_TIER,
        Math.floor(
          Number(
            profile.seasonPass.tier
          ) || 0
        )
      )
    );

  const claimed =
    new Set(
      profile.seasonPass
        .claimedRewards
    );

  const claimable = [];

  for (
    let tier = 1;
    tier <= currentTier;
    tier += 1
  ) {
    if (!claimed.has(tier)) {
      claimable.push(
        tier
      );
    }
  }

  return {
    ok: true,
    currentTier,
    claimableTiers:
      claimable,
    claimedRewards:
      [
        ...profile.seasonPass
          .claimedRewards
      ]
  };
}


export function canClaimSeasonPassTier(
  profile,
  tier
) {
  const normalizedTier =
    normalizeTier(
      tier
    );

  if (!normalizedTier) {
    return {
      ok: false,
      error: "INVALID_PASS_TIER"
    };
  }

  const claimable =
    getClaimableSeasonPassTiers(
      profile
    );

  if (!claimable.ok) {
    return claimable;
  }

  if (
    normalizedTier >
    claimable.currentTier
  ) {
    return {
      ok: false,
      error: "PASS_TIER_LOCKED",
      tier:
        normalizedTier
    };
  }

  if (
    claimable.claimedRewards
      .includes(
        normalizedTier
      )
  ) {
    return {
      ok: false,
      error:
        "PASS_REWARD_ALREADY_CLAIMED",
      tier:
        normalizedTier
    };
  }

  return {
    ok: true,
    tier:
      normalizedTier
  };
}


export function markSeasonPassTierClaimed(
  profile,
  tier
) {
  const check =
    canClaimSeasonPassTier(
      profile,
      tier
    );

  if (!check.ok) {
    return check;
  }

  profile.seasonPass
    .claimedRewards
    .push(
      check.tier
    );

  profile.seasonPass
    .claimedRewards =
    normalizeClaimedRewards(
      profile.seasonPass
        .claimedRewards
    );

  return {
    ok: true,
    tier:
      check.tier,
    claimedRewards:
      [
        ...profile.seasonPass
          .claimedRewards
      ]
  };
}


export function markSeasonPassTiersClaimed(
  profile,
  tiers
) {
  if (!Array.isArray(tiers)) {
    return {
      ok: false,
      error: "INVALID_PASS_TIERS"
    };
  }

  const normalized =
    [
      ...new Set(
        tiers
          .map(
            normalizeTier
          )
          .filter(
            tier =>
              tier !== null
          )
      )
    ]
      .sort(
        (a, b) =>
          a - b
      );

  if (normalized.length === 0) {
    return {
      ok: false,
      error: "INVALID_PASS_TIERS"
    };
  }

  for (
    const tier of normalized
  ) {
    const check =
      canClaimSeasonPassTier(
        profile,
        tier
      );

    if (!check.ok) {
      return check;
    }
  }

  profile.seasonPass
    .claimedRewards =
    normalizeClaimedRewards([
      ...profile.seasonPass
        .claimedRewards,
      ...normalized
    ]);

  return {
    ok: true,
    tiers:
      normalized,
    claimedRewards:
      [
        ...profile.seasonPass
          .claimedRewards
      ]
  };
}
