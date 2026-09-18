import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createPendingBankPix
} from "./src/systems/bank-pix-state.js";

import {
  confirmPendingBankPix
} from "./src/systems/bank-pix-transfer.js";


const now =
  1_700_000_000_000;


const sender =
  createBaseProfile(
    "remetente"
  );

sender.money = {
  bronze: 0,
  silver: 0,
  gold: 0,
  platinum: 1
};


const recipient =
  createBaseProfile(
    "destino"
  );


const pending =
  createPendingBankPix(
    sender,
    {
      recipient:
        "@Destino",
      amount: 1,
      coin: "gold",
      now
    }
  );

assert.equal(
  pending.ok,
  true
);


const confirmed =
  confirmPendingBankPix(
    sender,
    recipient,
    {
      now:
        now + 1000
    }
  );

assert.equal(
  confirmed.ok,
  true
);

assert.deepEqual(
  sender.money,
  {
    bronze: 0,
    silver: 0,
    gold: 9,
    platinum: 0
  },
  "1 Platina enviando 1 Ouro deve deixar 9 Ouro no remetente"
);

assert.deepEqual(
  recipient.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  },
  "o destinatário deve receber exatamente a denominação enviada"
);

assert.equal(
  sender.bank.pendingPix,
  null,
  "Pix confirmado deve limpar o estado pendente"
);

assert.equal(
  confirmed.audit.sender,
  "remetente"
);

assert.equal(
  confirmed.audit.recipient,
  "destino"
);

assert.equal(
  confirmed.audit.totalBronze,
  100
);


const poorSender =
  createBaseProfile(
    "pobre"
  );

poorSender.money = {
  bronze: 5,
  silver: 0,
  gold: 0,
  platinum: 0
};

const untouchedRecipient =
  createBaseProfile(
    "rico"
  );

createPendingBankPix(
  poorSender,
  {
    recipient: "rico",
    amount: 1,
    coin: "gold",
    now
  }
);

const senderBefore =
  JSON.stringify(
    poorSender.money
  );

const recipientBefore =
  JSON.stringify(
    untouchedRecipient.money
  );

const pendingBefore =
  JSON.stringify(
    poorSender.bank.pendingPix
  );

const failed =
  confirmPendingBankPix(
    poorSender,
    untouchedRecipient,
    {
      now:
        now + 1000
    }
  );

assert.equal(
  failed.ok,
  false
);

assert.equal(
  failed.error,
  "PIX_INSUFFICIENT_FUNDS"
);

assert.equal(
  JSON.stringify(
    poorSender.money
  ),
  senderBefore,
  "saldo insuficiente não pode alterar o remetente"
);

assert.equal(
  JSON.stringify(
    untouchedRecipient.money
  ),
  recipientBefore,
  "saldo insuficiente não pode alterar o destinatário"
);

assert.equal(
  JSON.stringify(
    poorSender.bank.pendingPix
  ),
  pendingBefore,
  "falha na confirmação deve manter o Pix pendente"
);


const mismatchSender =
  createBaseProfile(
    "origem"
  );

mismatchSender.money = {
  bronze: 0,
  silver: 0,
  gold: 5,
  platinum: 0
};

createPendingBankPix(
  mismatchSender,
  {
    recipient:
      "destino-correto",
    amount: 1,
    coin: "gold",
    now
  }
);

const wrongRecipient =
  createBaseProfile(
    "destino-errado"
  );

const mismatch =
  confirmPendingBankPix(
    mismatchSender,
    wrongRecipient,
    {
      now:
        now + 1000
    }
  );

assert.equal(
  mismatch.ok,
  false
);

assert.equal(
  mismatch.error,
  "PIX_RECIPIENT_MISMATCH"
);

assert.equal(
  mismatchSender.money.gold,
  5
);

assert.ok(
  mismatchSender.bank
    .pendingPix,
  "destinatário incorreto não pode consumir o Pix pendente"
);


const missing =
  confirmPendingBankPix(
    mismatchSender,
    null,
    {
      now:
        now + 1000
    }
  );

assert.equal(
  missing.ok,
  false
);

assert.equal(
  missing.error,
  "PIX_RECIPIENT_NOT_FOUND"
);


console.log(
  "✅ Confirmação lógica do Pix do Banco validada."
);
