import {
  applyBankPixCreditSide,
  applyBankPixDebitSide,
  finalizeBankPixSenderSide
} from "./bank-pix-durable-side.js";


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


async function syncProfileToKv(
  env,
  user,
  profile
) {
  const kv =
    env?.MARBION_USERS_V2;

  if (
    !kv ||
    typeof kv.put !==
      "function"
  ) {
    return {
      ok: true,
      synced: false
    };
  }

  try {
    await kv.put(
      user,
      JSON.stringify(
        profile
      )
    );
  }
  catch {
    return {
      ok: false,
      error:
        "PIX_KV_SYNC_FAILED"
    };
  }

  return {
    ok: true,
    synced: true
  };
}


export async function executeBankPixProfileStoreSide(
  storage,
  env,
  {
    side,
    user,
    transaction
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

  let result;

  if (side === "debit") {
    if (
      normalizeUser(
        transaction?.sender
      ) !==
      normalizedUser
    ) {
      return {
        ok: false,
        error:
          "PIX_SENDER_PROFILE_MISMATCH"
      };
    }

    result =
      await applyBankPixDebitSide(
        storage,
        transaction
      );
  }
  else if (
    side === "credit"
  ) {
    if (
      normalizeUser(
        transaction?.recipient
      ) !==
      normalizedUser
    ) {
      return {
        ok: false,
        error:
          "PIX_RECIPIENT_PROFILE_MISMATCH"
      };
    }

    result =
      await applyBankPixCreditSide(
        storage,
        transaction
      );
  }
  else if (
    side === "finalize"
  ) {
    if (
      normalizeUser(
        transaction?.sender
      ) !==
      normalizedUser
    ) {
      return {
        ok: false,
        error:
          "PIX_SENDER_PROFILE_MISMATCH"
      };
    }

    result =
      await finalizeBankPixSenderSide(
        storage,
        transaction
      );
  }
  else {
    return {
      ok: false,
      error:
        "INVALID_PIX_PROFILE_SIDE"
    };
  }

  if (!result.ok) {
    return result;
  }

  /*
   * O Durable Object é a fonte forte. O KV continua
   * como backup/compatibilidade, igual ao profile-store
   * normal. Se o sync do KV falhar, o marcador idempotente
   * permite repetir esta mesma etapa sem duplicar dinheiro.
   */
  const kvSync =
    await syncProfileToKv(
      env,
      normalizedUser,
      result.profile
    );

  if (!kvSync.ok) {
    return {
      ok: false,
      error:
        kvSync.error,
      durableApplied: true,
      idempotent:
        result.idempotent === true,
      profile:
        result.profile
    };
  }

  return {
    ...result,
    kvSynced:
      kvSync.synced
  };
}
