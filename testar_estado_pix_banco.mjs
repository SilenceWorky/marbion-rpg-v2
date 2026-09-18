import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  BANK_PIX_TTL_MS,
  cancelPendingBankPix,
  consumePendingBankPix,
  createPendingBankPix,
  getPendingBankPix
} from "./src/systems/bank-pix-state.js";


const base =
  createBaseProfile(
    "silenceworky"
  );

assert.deepEqual(
  base.bank,
  {
    pendingPix: null
  },
  "perfil novo deve nascer sem Pix pendente"
);


const legacy =
  ensureProfileDefaults(
    {
      version: 2,
      user: "legacy"
    },
    "legacy"
  );

assert.deepEqual(
  legacy.bank,
  {
    pendingPix: null
  },
  "perfil antigo deve receber estado do Banco sem migração destrutiva"
);


const now =
  1_700_000_000_000;

const created =
  createPendingBankPix(
    base,
    {
      recipient: "@Destino",
      amount: 1,
      coin: "gold",
      now
    }
  );

assert.equal(
  created.ok,
  true
);

assert.deepEqual(
  created.pendingPix,
  {
    id:
      `pix:silenceworky:${now}`,
    sender:
      "silenceworky",
    recipient:
      "destino",
    amount: 1,
    coin: "gold",
    totalBronze: 100,
    createdAt: now,
    expiresAt:
      now +
      BANK_PIX_TTL_MS
  }
);

assert.equal(
  created.pendingPix.expiresAt -
    created.pendingPix.createdAt,
  120000,
  "Pix pendente deve expirar em 2 minutos"
);


const duplicate =
  createPendingBankPix(
    base,
    {
      recipient: "outro",
      amount: 1,
      coin: "silver",
      now:
        now + 1000
    }
  );

assert.equal(
  duplicate.ok,
  false
);

assert.equal(
  duplicate.error,
  "PIX_ALREADY_PENDING",
  "deve existir no máximo um Pix pendente por usuário"
);


const self =
  createPendingBankPix(
    createBaseProfile(
      "silenceworky"
    ),
    {
      recipient:
        "@SilenceWorky",
      amount: 1,
      coin: "bronze",
      now
    }
  );

assert.equal(
  self.error,
  "PIX_SELF_TRANSFER"
);


const expiredProfile =
  createBaseProfile(
    "expirado"
  );

createPendingBankPix(
  expiredProfile,
  {
    recipient: "destino",
    amount: 5,
    coin: "silver",
    now
  }
);

const expired =
  getPendingBankPix(
    expiredProfile,
    now +
      BANK_PIX_TTL_MS
  );

assert.equal(
  expired.ok,
  true
);

assert.equal(
  expired.expired,
  true
);

assert.equal(
  expired.pendingPix,
  null
);

assert.equal(
  expiredProfile.bank
    .pendingPix,
  null
);


const cancelProfile =
  createBaseProfile(
    "cancelador"
  );

createPendingBankPix(
  cancelProfile,
  {
    recipient: "destino",
    amount: 25,
    coin: "bronze",
    now
  }
);

const cancelled =
  cancelPendingBankPix(
    cancelProfile,
    now + 1000
  );

assert.equal(
  cancelled.ok,
  true
);

assert.equal(
  cancelProfile.bank
    .pendingPix,
  null
);


const consumeProfile =
  createBaseProfile(
    "confirmador"
  );

createPendingBankPix(
  consumeProfile,
  {
    recipient: "destino",
    amount: 2,
    coin: "platinum",
    now
  }
);

const consumed =
  consumePendingBankPix(
    consumeProfile,
    now + 1000
  );

assert.equal(
  consumed.ok,
  true
);

assert.equal(
  consumed.pendingPix
    .totalBronze,
  2000
);

assert.equal(
  consumeProfile.bank
    .pendingPix,
  null
);


console.log(
  "✅ Estado pendente do Pix do Banco validado."
);
