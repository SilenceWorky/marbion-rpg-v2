function normalizeUser(
  value
) {
  return String(value ?? "")
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


export async function callBankPixProfileSide(
  env,
  {
    side,
    user,
    transaction,
    now = Date.now()
  } = {}
) {
  const normalizedUser =
    normalizeUser(
      user
    );

  if (!normalizedUser) {
    return {
      ok: false,
      error:
        "INVALID_PIX_PROFILE_USER"
    };
  }

  if (
    side !== "debit" &&
    side !== "credit" &&
    side !== "finalize"
  ) {
    return {
      ok: false,
      error:
        "INVALID_PIX_PROFILE_SIDE"
    };
  }

  const stub =
    getProfileStoreStub(
      env,
      normalizedUser
    );

  if (!stub) {
    return {
      ok: false,
      error:
        "PIX_PROFILE_STORE_UNAVAILABLE"
    };
  }

  const url =
    new URL(
      "https://profile.internal/profile-store/pix-side"
    );

  url.searchParams.set(
    "side",
    side
  );

  url.searchParams.set(
    "user",
    normalizedUser
  );

  let response;

  try {
    response =
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
              JSON.stringify({
                ...transaction,
                requestedAt:
                  Number(now)
              })
          }
        )
      );
  }
  catch {
    return {
      ok: false,
      error:
        "PIX_PROFILE_STORE_TRANSPORT_FAILED"
    };
  }

  let result;

  try {
    result =
      await response.json();
  }
  catch {
    return {
      ok: false,
      error:
        "PIX_PROFILE_STORE_INVALID_RESPONSE"
    };
  }

  if (
    result?.profileStore !==
      true ||
    result?.pixSide !==
      true
  ) {
    return {
      ok: false,
      error:
        "PIX_PROFILE_STORE_UNSUPPORTED"
    };
  }

  if (!result.ok) {
    return {
      ...result,
      ok: false
    };
  }

  return result;
}
