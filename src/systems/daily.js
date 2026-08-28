import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  addXp
} from "./progression.js";


const DAILY_COOLDOWN =
  24 * 60 * 60 * 1000;

const DAILY_XP_MIN = 40;
const DAILY_XP_MAX = 70;


function normalizeUser(user) {
  return String(user ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function randomDailyXp() {
  return Math.floor(
    Math.random() *
    (
      DAILY_XP_MAX -
      DAILY_XP_MIN +
      1
    )
  ) + DAILY_XP_MIN;
}


export async function claimDaily(
  env,
  user
) {
  const normalizedUser =
    normalizeUser(user);


  if (!normalizedUser) {
    return {
      ok: false,
      error: "INVALID_USER"
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


  const now =
    Date.now();

  const lastDaily =
    Math.max(
      0,
      Number(profile.lastDaily) || 0
    );


  const elapsed =
    now - lastDaily;


  if (
    lastDaily > 0 &&
    elapsed < DAILY_COOLDOWN
  ) {
    return {
      ok: false,
      error: "DAILY_COOLDOWN",

      remainingMs:
        DAILY_COOLDOWN -
        elapsed,

      user:
        normalizedUser
    };
  }


  const xpReward =
    randomDailyXp();


  const xpResult =
    addXp(
      profile,
      xpReward
    );


  profile.lastDaily =
    now;


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
      xpResult.xpGained,

    levelsGained:
      xpResult.levelsGained,

    level:
      xpResult.level,

    xp:
      xpResult.xp,

    xpNeeded:
      xpResult.xpNeeded,

    statusPoints:
      xpResult.statusPoints
  };
}