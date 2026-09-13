import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  PVP_STARTING_RATING,
  getDisplayRank,
  getRankFromRating
} from "./pvp-ranking.js";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeStoredRating(
  value,
  fallback = PVP_STARTING_RATING
) {
  const rating =
    Number(value);

  if (
    !Number.isFinite(
      rating
    )
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.round(
      rating
    )
  );
}


export function resetProfileEloState(profile) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }


  if (
    !profile.pvp ||
    typeof profile.pvp !== "object" ||
    Array.isArray(profile.pvp)
  ) {
    profile.pvp = {};
  }


  const before = {
    rating:
      normalizeStoredRating(
        profile.pvp.rating
      ),
    displayRank:
      getDisplayRank(profile),
    prodigyPosition:
      profile.pvp.prodigyPosition ?? null,
    peakRating:
      normalizeStoredRating(
        profile.pvp.peakRating
      )
  };


  const baseRank =
    getRankFromRating(
      PVP_STARTING_RATING
    );


  profile.pvp.rating =
    PVP_STARTING_RATING;

  profile.pvp.rank =
    baseRank.label;

  profile.pvp.prodigyPosition =
    null;


  return {
    ok: true,
    before,
    after: {
      rating:
        PVP_STARTING_RATING,
      displayRank:
        baseRank.label,
      prodigyPosition:
        null,
      peakRating:
        normalizeStoredRating(
          profile.pvp.peakRating
        )
    }
  };
}


export async function adminResetIndividualElo(
  env,
  target
) {
  const user =
    normalizeUser(target);


  if (!user) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  const profile =
    await getProfile(
      env,
      user
    );


  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      error: "CHARACTER_NOT_FOUND",
      user
    };
  }


  const reset =
    resetProfileEloState(
      profile
    );


  if (!reset.ok) {
    return {
      ...reset,
      user
    };
  }


  await saveProfile(
    env,
    user,
    profile
  );


  return {
    ok: true,
    user,
    before:
      reset.before,
    after:
      reset.after
  };
}
