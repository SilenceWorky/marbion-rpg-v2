import {
  callBankPixProfileSide
} from "./bank-pix-profile-client.js";

function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function buildTransaction(
  pending
) {
  return {
    transactionId:
      pending.id,

    sender:
      normalizeUser(
        pending.sender
      ),

    recipient:
      normalizeUser(
        pending.recipient
      ),

    amount:
      pending.amount,

    coin:
      pending.coin,

    totalBronze:
      pending.totalBronze
  };
}


export async function confirmBankPixDistributed(
  env,
  senderProfile,
  {
    now = Date.now(),
    callSide =
      callBankPixProfileSide
  } = {}
) {
  if (
    !senderProfile ||
    typeof senderProfile !==
      "object"
  ) {
    return {
      ok: false,
      error:
        "INVALID_PIX_SENDER_PROFILE"
    };
  }

  const sender =
    normalizeUser(
      senderProfile.user
    );

  if (!sender) {
    return {
      ok: false,
      error:
        "INVALID_PIX_SENDER"
    };
  }

  const pending =
    senderProfile?.bank
      ?.pendingPix;

  if (!pending) {
    return {
      ok: false,
      error:
        "PIX_NOT_FOUND"
    };
  }

  if (
    normalizeUser(
      pending.sender
    ) !== sender
  ) {
    return {
      ok: false,
      error:
        "PIX_SENDER_MISMATCH"
    };
  }

  const recipient =
    normalizeUser(
      pending.recipient
    );

  if (!recipient) {
    return {
      ok: false,
      error:
        "INVALID_PIX_RECIPIENT"
    };
  }

  if (
    recipient ===
    sender
  ) {
    return {
      ok: false,
      error:
        "PIX_SELF_TRANSFER"
    };
  }

  const transaction =
    buildTransaction(
      pending
    );

  /*
   * Saga idempotente:
   *
   * 1. débito no DO forte do remetente;
   * 2. crédito no DO forte do destinatário;
   * 3. finalização no remetente, removendo pendingPix.
   *
   * Cada etapa é idempotente. Se houver falha entre elas,
   * o retry da mesma confirmação continua do ponto seguro
   * sem debitar ou creditar duas vezes.
   */
  const debit =
    await callSide(
      env,
      {
        side:
          "debit",
        user:
          sender,
        transaction,
        now
      }
    );

  if (!debit.ok) {
    return {
      ok: false,
      error:
        debit.error ||
        "PIX_DEBIT_FAILED",
      stage:
        "debit",
      transaction,
      debit
    };
  }

  const credit =
    await callSide(
      env,
      {
        side:
          "credit",
        user:
          recipient,
        transaction
      }
    );

  if (!credit.ok) {
    return {
      ok: false,
      error:
        credit.error ||
        "PIX_CREDIT_FAILED",
      stage:
        "credit",
      retrySafe: true,
      transaction,
      debit,
      credit
    };
  }

  const finalize =
    await callSide(
      env,
      {
        side:
          "finalize",
        user:
          sender,
        transaction
      }
    );

  if (!finalize.ok) {
    return {
      ok: false,
      error:
        finalize.error ||
        "PIX_FINALIZE_FAILED",
      stage:
        "finalize",
      retrySafe: true,
      transaction,
      debit,
      credit,
      finalize
    };
  }

  return {
    ok: true,
    transaction,
    sender,
    recipient,
    amount:
      transaction.amount,
    coin:
      transaction.coin,
    totalBronze:
      transaction.totalBronze,
    debit,
    credit,
    finalize
  };
}
