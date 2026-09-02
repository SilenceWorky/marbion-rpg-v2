import {
  ensureProfileDefaults
} from "./profile.js";


function normalizeUser(
  user
) {
  return String(
    user ?? ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function getProfileStoreStub(
  env,
  user
) {
  const namespace =
    env?.PVP_COORDINATOR;


  if (
    !namespace ||
    typeof namespace.idFromName !==
      "function" ||
    typeof namespace.get !==
      "function"
  ) {
    return null;
  }


  const id =
    namespace.idFromName(
      `marbion-profile:${user}`
    );


  return namespace.get(
    id
  );
}


async function readFromProfileStore(
  env,
  user
) {
  const stub =
    getProfileStoreStub(
      env,
      user
    );


  if (!stub) {
    return {
      supported: false,
      profile: null
    };
  }


  const url =
    new URL(
      "https://profile.internal/profile-store/get"
    );

  url.searchParams.set(
    "user",
    user
  );


  const response =
    await stub.fetch(
      new Request(
        url.toString()
      )
    );


  let result =
    null;


  try {
    result =
      await response.json();
  }
  catch {
    return {
      supported: false,
      profile: null
    };
  }


  /*
   * Compatibilidade com testes antigos
   * que simulam PVP_COORDINATOR apenas
   * para /player-state.
   */
  if (
    result?.profileStore !==
      true
  ) {
    return {
      supported: false,
      profile: null
    };
  }


  if (!result.ok) {
    throw new Error(
      `PROFILE_STORE_READ_FAILED:${result.error || "UNKNOWN"}`
    );
  }


  return {
    supported: true,
    profile:
      result.profile ||
      null
  };
}


async function writeToProfileStore(
  env,
  user,
  profile
) {
  const stub =
    getProfileStoreStub(
      env,
      user
    );


  if (!stub) {
    return {
      supported: false
    };
  }


  const url =
    new URL(
      "https://profile.internal/profile-store/put"
    );

  url.searchParams.set(
    "user",
    user
  );


  const response =
    await stub.fetch(
      new Request(
        url.toString(),
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify(
              profile
            )
        }
      )
    );


  let result =
    null;


  try {
    result =
      await response.json();
  }
  catch {
    return {
      supported: false
    };
  }


  if (
    result?.profileStore !==
      true
  ) {
    return {
      supported: false
    };
  }


  if (!result.ok) {
    throw new Error(
      `PROFILE_STORE_WRITE_FAILED:${result.error || "UNKNOWN"}`
    );
  }


  return {
    supported: true
  };
}


async function deleteFromProfileStore(
  env,
  user
) {
  const stub =
    getProfileStoreStub(
      env,
      user
    );


  if (!stub) {
    return {
      supported: false
    };
  }


  const url =
    new URL(
      "https://profile.internal/profile-store/delete"
    );

  url.searchParams.set(
    "user",
    user
  );


  const response =
    await stub.fetch(
      new Request(
        url.toString(),
        {
          method: "POST"
        }
      )
    );


  let result =
    null;


  try {
    result =
      await response.json();
  }
  catch {
    return {
      supported: false
    };
  }


  if (
    result?.profileStore !==
      true
  ) {
    return {
      supported: false
    };
  }


  if (!result.ok) {
    throw new Error(
      `PROFILE_STORE_DELETE_FAILED:${result.error || "UNKNOWN"}`
    );
  }


  return {
    supported: true
  };
}


export async function getProfile(
  env,
  user
) {
  const normalizedUser =
    normalizeUser(
      user
    );


  if (!normalizedUser) {
    return null;
  }


  const strongResult =
    await readFromProfileStore(
      env,
      normalizedUser
    );


  if (
    strongResult.supported
  ) {
    if (!strongResult.profile) {
      return null;
    }


    return ensureProfileDefaults(
      strongResult.profile,
      normalizedUser
    );
  }


  /*
   * Fallback usado pelos testes locais
   * antigos e por ambientes sem Durable
   * Object disponível.
   */
  const raw =
    await env.MARBION_USERS_V2.get(
      normalizedUser
    );


  if (!raw) {
    return null;
  }


  const profile =
    JSON.parse(raw);


  return ensureProfileDefaults(
    profile,
    normalizedUser
  );
}


export async function saveProfile(
  env,
  user,
  profile
) {
  const normalizedUser =
    normalizeUser(
      user
    );


  if (!normalizedUser) {
    throw new Error(
      "INVALID_PROFILE_USER"
    );
  }


  const updatedProfile =
    ensureProfileDefaults(
      profile,
      normalizedUser
    );


  updatedProfile.updatedAt =
    Date.now();


  const strongResult =
    await writeToProfileStore(
      env,
      normalizedUser,
      updatedProfile
    );


  if (
    strongResult.supported
  ) {
    return updatedProfile;
  }


  await env.MARBION_USERS_V2.put(
    normalizedUser,
    JSON.stringify(
      updatedProfile
    )
  );


  return updatedProfile;
}


export async function deleteProfile(
  env,
  user
) {
  const normalizedUser =
    normalizeUser(
      user
    );


  if (!normalizedUser) {
    return;
  }


  const strongResult =
    await deleteFromProfileStore(
      env,
      normalizedUser
    );


  if (
    strongResult.supported
  ) {
    return;
  }


  await env.MARBION_USERS_V2.delete(
    normalizedUser
  );
}
