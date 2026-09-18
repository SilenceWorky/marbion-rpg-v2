import {
  MONEY_VALUES_IN_BRONZE,
  addMoney,
  subtractMoneyWithChange
} from "./money.js";

import {
  isBankPixExpired
} from "./bank-pix-state.js";


const SIDE_PREFIX =
  "bank_pix_side:";


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeId(
  value
) {
  const id =
    String(value ?? "")
      .trim();

  return id || null;
}


function normalizeAmount(
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


function normalizeCoin(
  value
) {
  const coin =
    String(value ?? "")
      .trim()
      .toLowerCase();

  if (
    coin === "bronze" ||
    coin === "silver" ||
    coin === "gold" ||
    coin === "platinum"
  ) {
    return coin;
  }

  return null;
}


function buildMoney(
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


function markerKey(
  transactionId,
  side
) {
  return (
    SIDE_PREFIX +
    transactionId +
    ":" +
    side
  );
}


function validateCommon(
  input
) {
  const transactionId =
    normalizeId(
      input?.transactionId
    );

  const sender =
    normalizeUser(
      input?.sender
    );

  const recipient =
    normalizeUser(
      input?.recipient
    );

  const amount =
    normalizeAmount(
      input?.amount
    );

  const coin =
    normalizeCoin(
      input?.coin
    );

  const totalBronze =
    Math.floor(
      Number(
        input?.totalBronze
      )
    );

  if (!transactionId) {
    return {
      ok: false,
      error:
        "INVALID_PIX_TRANSACTION_ID"
    };
  }

  if (!sender) {
    return {
      ok: false,
      error:
        "INVALID_PIX_SENDER"
    };
  }

  if (!recipient) {
    return {
      ok: false,
      error:
        "INVALID_PIX_RECIPIENT"
    };
  }

  if (sender === recipient) {
    return {
      ok: false,
      error:
        "PIX_SELF_TRANSFER"
    };
  }

  if (!amount) {
    return {
      ok: false,
      error:
        "INVALID_PIX_AMOUNT"
    };
  }

  if (!coin) {
    return {
      ok: false,
      error:
        "INVALID_PIX_COIN"
    };
  }

  if (
    !Number.isFinite(totalBronze) ||
    totalBronze <= 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_PIX_TOTAL"
    };
  }

  const expectedTotalBronze =
    amount *
    MONEY_VALUES_IN_BRONZE[
      coin
    ];

  if (
    totalBronze !==
    expectedTotalBronze
  ) {
    return {
      ok: false,
      error:
        "PIX_TOTAL_MISMATCH",
      expectedTotalBronze,
      totalBronze
    };
  }

  return {
    ok: true,
    transactionId,
    sender,
    recipient,
    amount,
    coin,
    totalBronze
  };
}


function validateStorage(
  storage
) {
  return Boolean(
    storage &&
    typeof storage.transaction ===
      "function"
  );
}


function transactionMarkerMatches(
  marker,
  data,
  side
) {
  return Boolean(
    marker &&
    normalizeId(
      marker.transactionId
    ) ===
      data.transactionId &&
    marker.side ===
      side &&
    normalizeUser(
      marker.sender
    ) ===
      data.sender &&
    normalizeUser(
      marker.recipient
    ) ===
      data.recipient &&
    normalizeAmount(
      marker.amount
    ) ===
      data.amount &&
    normalizeCoin(
      marker.coin
    ) ===
      data.coin &&
    Math.floor(
      Number(
        marker.totalBronze
      )
    ) ===
      data.totalBronze
  );
}


function pendingMatches(
  pending,
  data
) {
  return Boolean(
    pending &&
    normalizeId(pending.id) ===
      data.transactionId &&
    normalizeUser(pending.sender) ===
      data.sender &&
    normalizeUser(pending.recipient) ===
      data.recipient &&
    normalizeAmount(pending.amount) ===
      data.amount &&
    normalizeCoin(pending.coin) ===
      data.coin &&
    Math.floor(
      Number(
        pending.totalBronze
      )
    ) ===
      data.totalBronze
  );
}


async function readCurrentProfile(
  transaction
) {
  const profile =
    await transaction.get(
      "profile"
    );

  return (
    profile &&
    typeof profile === "object"
      ? profile
      : null
  );
}


export async function applyBankPixDebitSide(
  storage,
  input,
  {
    now = Date.now()
  } = {}
) {
  if (!validateStorage(storage)) {
    return {
      ok: false,
      error:
        "PIX_STORAGE_UNAVAILABLE"
    };
  }

  const data =
    validateCommon(
      input
    );

  if (!data.ok) {
    return data;
  }

  const key =
    markerKey(
      data.transactionId,
      "debit"
    );

  return storage.transaction(
    async transaction => {
      const alreadyApplied =
        await transaction.get(
          key
        );

      const profile =
        await readCurrentProfile(
          transaction
        );

      if (!profile) {
        return {
          ok: false,
          error:
            "PIX_PROFILE_NOT_FOUND"
        };
      }

      if (
        normalizeUser(
          profile.user
        ) !==
        data.sender
      ) {
        return {
          ok: false,
          error:
            "PIX_SENDER_PROFILE_MISMATCH"
        };
      }

      if (alreadyApplied) {
        if (
          !transactionMarkerMatches(
            alreadyApplied,
            data,
            "debit"
          )
        ) {
          return {
            ok: false,
            error:
              "PIX_TRANSACTION_CONFLICT"
          };
        }

        return {
          ok: true,
          applied: false,
          idempotent: true,
          profile,
          marker:
            alreadyApplied
        };
      }

      if (
        !pendingMatches(
          profile?.bank?.pendingPix,
          data
        )
      ) {
        return {
          ok: false,
          error:
            "PIX_PENDING_MISMATCH"
        };
      }

      /*
       * A expiração só bloqueia o INÍCIO da transferência.
       * Se o débito já foi aplicado, o marcador acima torna o
       * retry idempotente e permite terminar crédito/finalização
       * mesmo após os 2 minutos, evitando dinheiro "preso".
       */
      if (
        isBankPixExpired(
          profile?.bank?.pendingPix,
          now
        )
      ) {
        return {
          ok: false,
          error:
            "PIX_EXPIRED"
        };
      }

      const debit =
        subtractMoneyWithChange(
          profile.money,
          buildMoney(
            data.coin,
            data.amount
          )
        );

      if (!debit.ok) {
        return {
          ok: false,
          error:
            debit.error ===
            "INSUFFICIENT_FUNDS"
              ? "PIX_INSUFFICIENT_FUNDS"
              : debit.error
        };
      }

      profile.money =
        debit.money;

      /*
       * O pendingPix permanece enquanto a transação
       * distribuída não terminar. Isso permite retry
       * seguro caso o crédito do destinatário falhe.
       */
      const marker = {
        transactionId:
          data.transactionId,
        side: "debit",
        sender:
          data.sender,
        recipient:
          data.recipient,
        amount:
          data.amount,
        coin:
          data.coin,
        totalBronze:
          data.totalBronze,
        appliedAt:
          Date.now()
      };

      await transaction.put(
        "profile",
        profile
      );

      await transaction.put(
        key,
        marker
      );

      return {
        ok: true,
        applied: true,
        idempotent: false,
        profile,
        marker
      };
    }
  );
}


export async function applyBankPixCreditSide(
  storage,
  input
) {
  if (!validateStorage(storage)) {
    return {
      ok: false,
      error:
        "PIX_STORAGE_UNAVAILABLE"
    };
  }

  const data =
    validateCommon(
      input
    );

  if (!data.ok) {
    return data;
  }

  const key =
    markerKey(
      data.transactionId,
      "credit"
    );

  return storage.transaction(
    async transaction => {
      const alreadyApplied =
        await transaction.get(
          key
        );

      const profile =
        await readCurrentProfile(
          transaction
        );

      if (!profile) {
        return {
          ok: false,
          error:
            "PIX_PROFILE_NOT_FOUND"
        };
      }

      if (
        normalizeUser(
          profile.user
        ) !==
        data.recipient
      ) {
        return {
          ok: false,
          error:
            "PIX_RECIPIENT_PROFILE_MISMATCH"
        };
      }

      if (alreadyApplied) {
        if (
          !transactionMarkerMatches(
            alreadyApplied,
            data,
            "credit"
          )
        ) {
          return {
            ok: false,
            error:
              "PIX_TRANSACTION_CONFLICT"
          };
        }

        return {
          ok: true,
          applied: false,
          idempotent: true,
          profile,
          marker:
            alreadyApplied
        };
      }

      profile.money =
        addMoney(
          profile.money,
          buildMoney(
            data.coin,
            data.amount
          )
        );

      const marker = {
        transactionId:
          data.transactionId,
        side: "credit",
        sender:
          data.sender,
        recipient:
          data.recipient,
        amount:
          data.amount,
        coin:
          data.coin,
        totalBronze:
          data.totalBronze,
        appliedAt:
          Date.now()
      };

      await transaction.put(
        "profile",
        profile
      );

      await transaction.put(
        key,
        marker
      );

      return {
        ok: true,
        applied: true,
        idempotent: false,
        profile,
        marker
      };
    }
  );
}


export async function finalizeBankPixSenderSide(
  storage,
  input
) {
  if (!validateStorage(storage)) {
    return {
      ok: false,
      error:
        "PIX_STORAGE_UNAVAILABLE"
    };
  }

  const data =
    validateCommon(
      input
    );

  if (!data.ok) {
    return data;
  }

  const debitKey =
    markerKey(
      data.transactionId,
      "debit"
    );

  const finalizeKey =
    markerKey(
      data.transactionId,
      "finalize"
    );

  return storage.transaction(
    async transaction => {
      const alreadyFinalized =
        await transaction.get(
          finalizeKey
        );

      const profile =
        await readCurrentProfile(
          transaction
        );

      if (!profile) {
        return {
          ok: false,
          error:
            "PIX_PROFILE_NOT_FOUND"
        };
      }

      if (
        normalizeUser(
          profile.user
        ) !==
        data.sender
      ) {
        return {
          ok: false,
          error:
            "PIX_SENDER_PROFILE_MISMATCH"
        };
      }

      if (alreadyFinalized) {
        if (
          !transactionMarkerMatches(
            alreadyFinalized,
            data,
            "finalize"
          )
        ) {
          return {
            ok: false,
            error:
              "PIX_TRANSACTION_CONFLICT"
          };
        }

        return {
          ok: true,
          applied: false,
          idempotent: true,
          profile,
          marker:
            alreadyFinalized
        };
      }

      const debitApplied =
        await transaction.get(
          debitKey
        );

      if (!debitApplied) {
        return {
          ok: false,
          error:
            "PIX_DEBIT_NOT_APPLIED"
        };
      }

      if (
        !transactionMarkerMatches(
          debitApplied,
          data,
          "debit"
        )
      ) {
        return {
          ok: false,
          error:
            "PIX_TRANSACTION_CONFLICT"
        };
      }

      if (
        !pendingMatches(
          profile?.bank?.pendingPix,
          data
        )
      ) {
        return {
          ok: false,
          error:
            "PIX_PENDING_MISMATCH"
        };
      }

      profile.bank.pendingPix =
        null;

      const marker = {
        transactionId:
          data.transactionId,
        side: "finalize",
        sender:
          data.sender,
        recipient:
          data.recipient,
        amount:
          data.amount,
        coin:
          data.coin,
        totalBronze:
          data.totalBronze,
        appliedAt:
          Date.now()
      };

      await transaction.put(
        "profile",
        profile
      );

      await transaction.put(
        finalizeKey,
        marker
      );

      return {
        ok: true,
        applied: true,
        idempotent: false,
        profile,
        marker
      };
    }
  );
}
