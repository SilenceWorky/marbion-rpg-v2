import {
  ensureProfileDefaults
} from "./profile.js";

export async function getProfile(
  env,
  user
) {
  const raw =
    await env.MARBION_USERS_V2.get(user);

  if (!raw) {
    return null;
  }

  const profile =
    JSON.parse(raw);

  return ensureProfileDefaults(
    profile,
    user
  );
}

export async function saveProfile(
  env,
  user,
  profile
) {
  const updatedProfile =
    ensureProfileDefaults(
      profile,
      user
    );

  updatedProfile.updatedAt =
    Date.now();

  await env.MARBION_USERS_V2.put(
    user,
    JSON.stringify(updatedProfile)
  );

  return updatedProfile;
}

export async function deleteProfile(
  env,
  user
) {
  await env.MARBION_USERS_V2.delete(
    user
  );
}