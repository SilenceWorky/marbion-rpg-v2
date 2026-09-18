import {
  MONEY_VALUES_IN_BRONZE
} from "./money.js";


export const BANK_PIX_TTL_MS =
  2 * 60 * 1000;


const VALID_COINS =
  new Set(
    Object.keys(
      MONEY_VALUES_IN_BRONZE
    )
  );


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeCoin(
  value
) {
  const coin =
    String(value ?? "")
      .trim()
      .toLowerCase();

  return VALID_COINS.has(coin)
    ? coin
    : null;
}


function normalizePositiveInteger(
  value
) {
  const amount =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return amount;
}


function normalizeNow(
  value
) {
  const now =
    Number(value);

  if (
    !Number.isFinite(now) ||
    now < 0
  ) {
    return Date.now();
  }

  return Math.floor(now);
}


function ensureBank(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return null;
  }

  if (
    !profile.bank ||
    typeof profile.bank !==
      "object"
  ) {
    profile.bank = {
      pendingPix: null
    };
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      profile.bank,
      "pendingPix"
    )
  ) {
    profile.bank.pendingPix =
      null;
  }

  return profile.bank;
}


export function isBankPixExpired(
  pendingPix,
  now = Date.now()
) {
  if (!pendingPix) {
    return false;
  }

  return (
    normalizeNow(now) >=
    Number(
      pendingPix.expiresAt
    )
  );
}


export function getPendingBankPix(
  profile,
  now = Date.now()
) {
  const bank =
    ensureBank(
      profile
    );

  if (!bank) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }

  if (!bank.pendingPix) {
    return {
      ok: true,
      pendingPix: null,
      expired: false
    };
  }

  if (
    isBankPixExpired(
      bank.pendingPix,
      now
    )
  ) {
    bank.pendingPix =
      null;

    return {
      ok: true,
      pendingPix: null,
      expired: true
    };
  }

  return {
    ok: true,
    pendingPix:
      bank.pendingPix,
    expired: false
  };
}


export function createPendingBankPix(
  profile,
  {
    sender,
    recipient,
    amount,
    coin,
    now = Date.now()
  } = {}
) {
  const bank =
    ensureBank(
      profile
    );

  if (!bank) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }

  const normalizedSender =
    normalizeUser(
      sender ||
      profile.user
    );

  const normalizedRecipient =
    normalizeUser(
      recipient
    );

  const normalizedAmount =
    normalizePositiveInteger(
      amount
    );

  const normalizedCoin =
    normalizeCoin(
      coin
    );

  const normalizedNow =
    normalizeNow(
      now
    );

  if (!normalizedSender) {
    return {
      ok: false,
      error: "INVALID_PIX_SENDER"
    };
  }

  if (!normalizedRecipient) {
    return {
      ok: false,
      error: "INVALID_PIX_RECIPIENT"
    };
  }

  if (
    normalizedSender ===
    normalizedRecipient
  ) {
    return {
      ok: false,
      error: "PIX_SELF_TRANSFER"
    };
  }

  if (!normalizedAmount) {
    return {
      ok: false,
      error: "INVALID_PIX_AMOUNT"
    };
  }

  if (!normalizedCoin) {
    return {
      ok: false,
      error: "INVALID_PIX_COIN"
    };
  }

  const existing =
    getPendingBankPix(
      profile,
      normalizedNow
    );

  if (!existing.ok) {
    return existing;
  }

  if (existing.pendingPix) {
    return {
      ok: false,
      error:
        "PIX_ALREADY_PENDING",
      pendingPix:
        existing.pendingPix
    };
  }

  const totalBronze =
    normalizedAmount *
    MONEY_VALUES_IN_BRONZE[
      normalizedCoin
    ];

  const pendingPix = {
    id:
      `pix:${normalizedSender}:${normalizedNow}`,

    sender:
      normalizedSender,

    recipient:
      normalizedRecipient,

    amount:
      normalizedAmount,

    coin:
      normalizedCoin,

    totalBronze,

    createdAt:
      normalizedNow,

    expiresAt:
      normalizedNow +
      BANK_PIX_TTL_MS
  };

  bank.pendingPix =
    pendingPix;

  return {
    ok: true,
    pendingPix
  };
}


export function cancelPendingBankPix(
  profile,
  now = Date.now()
) {
  const current =
    getPendingBankPix(
      profile,
      now
    );

  if (!current.ok) {
    return current;
  }

  if (!current.pendingPix) {
    return {
      ok: false,
      error: current.expired
        ? "PIX_EXPIRED"
        : "PIX_NOT_FOUND"
    };
  }

  const cancelled =
    current.pendingPix;

  profile.bank.pendingPix =
    null;

  return {
    ok: true,
    cancelled
  };
}


export function consumePendingBankPix(
  profile,
  now = Date.now()
) {
  const current =
    getPendingBankPix(
      profile,
      now
    );

  if (!current.ok) {
    return current;
  }

  if (!current.pendingPix) {
    return {
      ok: false,
      error: current.expired
        ? "PIX_EXPIRED"
        : "PIX_NOT_FOUND"
    };
  }

  const pendingPix =
    current.pendingPix;

  profile.bank.pendingPix =
    null;

  return {
    ok: true,
    pendingPix
  };
}
