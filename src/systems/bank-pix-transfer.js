import {
  addMoney,
  subtractMoneyWithChange
} from "./money.js";

import {
  getPendingBankPix
} from "./bank-pix-state.js";


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function buildPrice(
  coin,
  amount
) {
  return {
    bronze:
      coin === "bronze"
        ? amount
        : 0,

    silver:
      coin === "silver"
        ? amount
        : 0,

    gold:
      coin === "gold"
        ? amount
        : 0,

    platinum:
      coin === "platinum"
        ? amount
        : 0
  };
}


export function confirmPendingBankPix(
  senderProfile,
  recipientProfile,
  {
    now = Date.now()
  } = {}
) {
  if (
    !senderProfile ||
    typeof senderProfile !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_PIX_SENDER_PROFILE"
    };
  }

  if (
    !recipientProfile ||
    typeof recipientProfile !== "object"
  ) {
    return {
      ok: false,
      error: "PIX_RECIPIENT_NOT_FOUND"
    };
  }

  const sender =
    normalizeUser(
      senderProfile.user
    );

  const recipient =
    normalizeUser(
      recipientProfile.user
    );

  if (!sender) {
    return {
      ok: false,
      error: "INVALID_PIX_SENDER"
    };
  }

  if (!recipient) {
    return {
      ok: false,
      error: "INVALID_PIX_RECIPIENT"
    };
  }

  const pendingResult =
    getPendingBankPix(
      senderProfile,
      now
    );

  if (!pendingResult.ok) {
    return pendingResult;
  }

  if (!pendingResult.pendingPix) {
    return {
      ok: false,
      error:
        pendingResult.expired
          ? "PIX_EXPIRED"
          : "PIX_NOT_FOUND"
    };
  }

  const pending =
    pendingResult.pendingPix;

  if (
    normalizeUser(
      pending.sender
    ) !==
    sender
  ) {
    return {
      ok: false,
      error: "PIX_SENDER_MISMATCH"
    };
  }

  if (
    normalizeUser(
      pending.recipient
    ) !==
    recipient
  ) {
    return {
      ok: false,
      error: "PIX_RECIPIENT_MISMATCH"
    };
  }

  if (sender === recipient) {
    return {
      ok: false,
      error: "PIX_SELF_TRANSFER"
    };
  }

  const price =
    buildPrice(
      pending.coin,
      pending.amount
    );

  const debit =
    subtractMoneyWithChange(
      senderProfile.money,
      price
    );

  if (!debit.ok) {
    return {
      ok: false,
      error:
        debit.error ===
        "INSUFFICIENT_FUNDS"
          ? "PIX_INSUFFICIENT_FUNDS"
          : debit.error,

      balance:
        debit.balance,

      cost:
        debit.cost
    };
  }

  const recipientMoney =
    addMoney(
      recipientProfile.money,
      price
    );

  /*
   * Só alteramos os perfis depois de TODAS as validações
   * e cálculos terem passado. Assim uma falha não debita
   * o remetente parcialmente.
   */
  senderProfile.money =
    debit.money;

  recipientProfile.money =
    recipientMoney;

  senderProfile.bank.pendingPix =
    null;

  const audit = {
    id:
      pending.id,

    sender,
    recipient,

    amount:
      pending.amount,

    coin:
      pending.coin,

    totalBronze:
      pending.totalBronze,

    confirmedAt:
      Math.floor(
        Number(now)
      )
  };

  return {
    ok: true,

    sender,
    recipient,

    amount:
      pending.amount,

    coin:
      pending.coin,

    totalBronze:
      pending.totalBronze,

    senderMoney:
      senderProfile.money,

    recipientMoney:
      recipientProfile.money,

    audit
  };
}
