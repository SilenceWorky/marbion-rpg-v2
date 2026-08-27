import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  addXp
} from "./progression.js";


function normalizeUser(user) {
  return String(user ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export async function awardXp(
  env,
  user,
  amount
) {
  const normalizedUser =
    normalizeUser(user);

  const normalizedAmount =
    Number(amount);


  if (!normalizedUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  if (
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0
  ) {
    return {
      ok: false,
      error: "INVALID_XP_AMOUNT"
    };
  }


  const profile =
    await getProfile(
      env,
      normalizedUser
    );


  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      error: "CHARACTER_NOT_FOUND",
      user: normalizedUser
    };
  }


  const result =
    addXp(
      profile,
      normalizedAmount
    );


  const savedProfile =
    await saveProfile(
      env,
      normalizedUser,
      profile
    );


  return {
    ok: true,

    user:
      normalizedUser,

    xpGained:
      result.xpGained,

    levelsGained:
      result.levelsGained,

    level:
      result.level,

    xp:
      result.xp,

    xpNeeded:
      result.xpNeeded,

    statusPoints:
      result.statusPoints,

    profile:
      savedProfile
  };
}