import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createPendingBankPix
} from "./src/systems/bank-pix-state.js";

import {
  applyBankPixCreditSide,
  applyBankPixDebitSide,
  finalizeBankPixSenderSide
} from "./src/systems/bank-pix-durable-side.js";


function createStorage(
  initial = {}
) {
  const data =
    new Map(
      Object.entries(
        structuredClone(
          initial
        )
      )
    );

  const api = {
    data,

    async get(key) {
      return structuredClone(
        data.get(key)
      );
    },

    async put(
      key,
      value
    ) {
      data.set(
        key,
        structuredClone(
          value
        )
      );
    },

    async transaction(
      callback
    ) {
      /*
       * Mock serial para validar a semântica do helper.
       * O Durable Object real fornece isolamento transacional.
       */
      return callback(api);
    }
  };

  return api;
}


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

createPendingBankPix(
  sender,
  {
    recipient:
      "destino",
    amount: 1,
    coin: "gold",
    now
  }
);

const pending =
  sender.bank.pendingPix;

const recipient =
  createBaseProfile(
    "destino"
  );

const senderStorage =
  createStorage({
    profile: sender
  });

const recipientStorage =
  createStorage({
    profile: recipient
  });

const transaction = {
  transactionId:
    pending.id,
  sender:
    "remetente",
  recipient:
    "destino",
  amount: 1,
  coin: "gold",
  totalBronze: 100
};


const debit =
  await applyBankPixDebitSide(
    senderStorage,
    transaction
  );

assert.equal(
  debit.ok,
  true
);

assert.equal(
  debit.applied,
  true
);

assert.deepEqual(
  debit.profile.money,
  {
    bronze: 0,
    silver: 0,
    gold: 9,
    platinum: 0
  }
);

assert.ok(
  debit.profile.bank.pendingPix,
  "o Pix pendente deve permanecer até o crédito e a finalização terminarem"
);


const debitRetry =
  await applyBankPixDebitSide(
    senderStorage,
    transaction
  );

assert.equal(
  debitRetry.ok,
  true
);

assert.equal(
  debitRetry.idempotent,
  true
);

assert.deepEqual(
  debitRetry.profile.money,
  {
    bronze: 0,
    silver: 0,
    gold: 9,
    platinum: 0
  },
  "retry do débito não pode descontar duas vezes"
);


const credit =
  await applyBankPixCreditSide(
    recipientStorage,
    transaction
  );

assert.equal(
  credit.ok,
  true
);

assert.equal(
  credit.applied,
  true
);

assert.deepEqual(
  credit.profile.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  }
);


const creditRetry =
  await applyBankPixCreditSide(
    recipientStorage,
    transaction
  );

assert.equal(
  creditRetry.ok,
  true
);

assert.equal(
  creditRetry.idempotent,
  true
);

assert.deepEqual(
  creditRetry.profile.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  },
  "retry do crédito não pode creditar duas vezes"
);


const finalized =
  await finalizeBankPixSenderSide(
    senderStorage,
    transaction
  );

assert.equal(
  finalized.ok,
  true
);

assert.equal(
  finalized.applied,
  true
);

assert.equal(
  finalized.profile.bank
    .pendingPix,
  null,
  "pendingPix só deve ser removido na finalização"
);


const finalizeRetry =
  await finalizeBankPixSenderSide(
    senderStorage,
    transaction
  );

assert.equal(
  finalizeRetry.ok,
  true
);

assert.equal(
  finalizeRetry.idempotent,
  true
);


const conflictingCredit =
  await applyBankPixCreditSide(
    recipientStorage,
    {
      ...transaction,
      amount: 2,
      totalBronze: 200
    }
  );

assert.equal(
  conflictingCredit.ok,
  false
);

assert.equal(
  conflictingCredit.error,
  "PIX_TRANSACTION_CONFLICT",
  "o mesmo transactionId não pode ser reutilizado com valor diferente"
);

assert.deepEqual(
  (
    await recipientStorage.get(
      "profile"
    )
  ).money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  },
  "conflito de idempotência não pode creditar novamente"
);


const invalidTotalRecipient =
  createBaseProfile(
    "totaltarget"
  );

const invalidTotalStorage =
  createStorage({
    profile:
      invalidTotalRecipient
  });

const invalidTotal =
  await applyBankPixCreditSide(
    invalidTotalStorage,
    {
      transactionId:
        "pix:origem:total",
      sender: "origem",
      recipient:
        "totaltarget",
      amount: 1,
      coin: "gold",
      totalBronze: 10
    }
  );

assert.equal(
  invalidTotal.ok,
  false
);

assert.equal(
  invalidTotal.error,
  "PIX_TOTAL_MISMATCH"
);

assert.deepEqual(
  (
    await invalidTotalStorage.get(
      "profile"
    )
  ).money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  },
  "total em Bronze inconsistente não pode gerar crédito"
);


const wrongSender =
  createBaseProfile(
    "origem"
  );

wrongSender.money = {
  bronze: 0,
  silver: 0,
  gold: 5,
  platinum: 0
};

createPendingBankPix(
  wrongSender,
  {
    recipient:
      "alvo-correto",
    amount: 1,
    coin: "gold",
    now
  }
);

const wrongPending =
  wrongSender.bank.pendingPix;

const wrongStorage =
  createStorage({
    profile:
      wrongSender
  });

const before =
  JSON.stringify(
    wrongSender
  );

const mismatch =
  await applyBankPixDebitSide(
    wrongStorage,
    {
      transactionId:
        wrongPending.id,
      sender: "origem",
      recipient:
        "alvo-errado",
      amount: 1,
      coin: "gold",
      totalBronze: 100
    }
  );

assert.equal(
  mismatch.ok,
  false
);

assert.equal(
  mismatch.error,
  "PIX_PENDING_MISMATCH"
);

assert.equal(
  JSON.stringify(
    await wrongStorage.get(
      "profile"
    )
  ),
  before,
  "mismatch não pode alterar saldo nem estado do perfil"
);


console.log(
  "✅ Lados duráveis e idempotentes do Pix validados."
);
