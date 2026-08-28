import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  spendStatusPoints
} from "./stats.js";


function normalizeUser(user) {
  return String(user ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export async function spendPlayerStatusPoints(
  env,
  user,
  stat,
  amount = 1
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


  const result =
    spendStatusPoints(
      profile,
      stat,
      amount
    );


  if (!result.ok) {
    return {
      ...result,
      user: normalizedUser
    };
  }


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

    stat:
      result.stat,

    amountSpent:
      result.amountSpent,

    newValue:
      result.newValue,

    statusPoints:
      result.statusPoints,

    profile:
      savedProfile
  };
}