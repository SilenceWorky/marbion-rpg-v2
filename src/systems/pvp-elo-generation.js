import {
  PVP_STARTING_RATING,
  getRankFromRating
} from "./pvp-ranking.js";


export const PVP_ELO_GENERATION_INITIAL = 0;


export function normalizeEloGeneration(
  value,
  fallback = PVP_ELO_GENERATION_INITIAL
) {
  const generation =
    Number(value);


  if (
    !Number.isSafeInteger(
      generation
    ) ||
    generation < 0
  ) {
    return fallback;
  }


  return generation;
}


export function nextEloGeneration(
  currentGeneration
) {
  const current =
    normalizeEloGeneration(
      currentGeneration
    );


  if (
    current >=
    Number.MAX_SAFE_INTEGER
  ) {
    return {
      ok: false,
      error:
        "ELO_GENERATION_OVERFLOW"
    };
  }


  return {
    ok: true,
    before:
      current,
    after:
      current + 1
  };
}


export function syncProfileEloGeneration(
  profile,
  currentGeneration
) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    return {
      ok: false,
      error:
        "INVALID_PROFILE"
    };
  }


  if (
    !profile.pvp ||
    typeof profile.pvp !== "object" ||
    Array.isArray(profile.pvp)
  ) {
    profile.pvp = {};
  }


  const targetGeneration =
    normalizeEloGeneration(
      currentGeneration
    );

  const profileGeneration =
    normalizeEloGeneration(
      profile.pvp.eloGeneration
    );


  if (
    profileGeneration >
    targetGeneration
  ) {
    return {
      ok: false,
      error:
        "PROFILE_ELO_GENERATION_AHEAD",
      profileGeneration,
      currentGeneration:
        targetGeneration
    };
  }


  if (
    profileGeneration ===
    targetGeneration
  ) {
    return {
      ok: true,
      changed: false,
      reset: false,
      profileGeneration,
      currentGeneration:
        targetGeneration
    };
  }


  const baseRank =
    getRankFromRating(
      PVP_STARTING_RATING
    );

  const before = {
    generation:
      profileGeneration,
    rating:
      Number.isFinite(
        Number(
          profile.pvp.rating
        )
      )
        ? Number(
            profile.pvp.rating
          )
        : PVP_STARTING_RATING,
    rank:
      profile.pvp.rank ??
      null,
    prodigyPosition:
      profile.pvp.prodigyPosition ??
      null
  };


  profile.pvp.rating =
    PVP_STARTING_RATING;

  profile.pvp.rank =
    baseRank.label;

  profile.pvp.prodigyPosition =
    null;

  profile.pvp.eloGeneration =
    targetGeneration;


  return {
    ok: true,
    changed: true,
    reset: true,
    before,
    after: {
      generation:
        targetGeneration,
      rating:
        PVP_STARTING_RATING,
      rank:
        baseRank.label,
      prodigyPosition:
        null
    }
  };
}
