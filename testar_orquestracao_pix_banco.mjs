import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createPendingBankPix
} from "./src/systems/bank-pix-state.js";

import {
  confirmBankPixDistributed
} from "./src/systems/bank-pix-confirm-service.js";


const now =
  1_700_000_000_000;

const sender =
  createBaseProfile(
    "origem"
  );

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


const calls = [];

const success =
  await confirmBankPixDistributed(
    {},
    sender,
    {
      now:
        now + 1000,

      async callSide(
        env,
        input
      ) {
        calls.push(
          structuredClone(
            input
          )
        );

        return {
          ok: true,
          side:
            input.side,
          idempotent: false
        };
      }
    }
  );

assert.equal(
  success.ok,
  true
);

assert.deepEqual(
  calls.map(
    call =>
      call.side
  ),
  [
    "debit",
    "credit",
    "finalize"
  ],
  "a confirmação deve executar débito, crédito e finalização nessa ordem"
);

assert.equal(
  calls[0].user,
  "origem"
);

assert.equal(
  calls[1].user,
  "destino"
);

assert.equal(
  calls[2].user,
  "origem"
);

assert.equal(
  success.totalBronze,
  100
);


const creditFailureCalls = [];

const creditFailure =
  await confirmBankPixDistributed(
    {},
    sender,
    {
      now:
        now + 1000,

      async callSide(
        env,
        input
      ) {
        creditFailureCalls.push(
          input.side
        );

        if (
          input.side ===
          "credit"
        ) {
          return {
            ok: false,
            error:
              "SIMULATED_CREDIT_FAILURE"
          };
        }

        return {
          ok: true,
          side:
            input.side
        };
      }
    }
  );

assert.equal(
  creditFailure.ok,
  false
);

assert.equal(
  creditFailure.stage,
  "credit"
);

assert.equal(
  creditFailure.retrySafe,
  true
);

assert.deepEqual(
  creditFailureCalls,
  [
    "debit",
    "credit"
  ],
  "falha no crédito não pode executar a finalização"
);


const finalizeFailureCalls = [];

const finalizeFailure =
  await confirmBankPixDistributed(
    {},
    sender,
    {
      now:
        now + 1000,

      async callSide(
        env,
        input
      ) {
        finalizeFailureCalls.push(
          input.side
        );

        if (
          input.side ===
          "finalize"
        ) {
          return {
            ok: false,
            error:
              "SIMULATED_FINALIZE_FAILURE"
          };
        }

        return {
          ok: true,
          side:
            input.side
        };
      }
    }
  );

assert.equal(
  finalizeFailure.ok,
  false
);

assert.equal(
  finalizeFailure.stage,
  "finalize"
);

assert.equal(
  finalizeFailure.retrySafe,
  true
);

assert.deepEqual(
  finalizeFailureCalls,
  [
    "debit",
    "credit",
    "finalize"
  ]
);


const retryCalls = [];

const retry =
  await confirmBankPixDistributed(
    {},
    sender,
    {
      now:
        now + 1000,

      async callSide(
        env,
        input
      ) {
        retryCalls.push(
          input.side
        );

        return {
          ok: true,
          side:
            input.side,
          idempotent: true
        };
      }
    }
  );

assert.equal(
  retry.ok,
  true
);

assert.deepEqual(
  retryCalls,
  [
    "debit",
    "credit",
    "finalize"
  ],
  "retry pode percorrer todas as etapas porque cada lado é idempotente"
);


const expiredSender =
  createBaseProfile(
    "expirado"
  );

createPendingBankPix(
  expiredSender,
  {
    recipient:
      "destino",
    amount: 1,
    coin: "silver",
    now
  }
);

let expiredCalled =
  false;

const expired =
  await confirmBankPixDistributed(
    {},
    expiredSender,
    {
      now:
        now +
        (3 * 60 * 1000),

      async callSide(
        env,
        input
      ) {
        expiredCalled =
          true;

        if (
          input.side ===
          "debit"
        ) {
          return {
            ok: false,
            error:
              "PIX_EXPIRED"
          };
        }

        return {
          ok: true
        };
      }
    }
  );

assert.equal(
  expired.ok,
  false
);

assert.equal(
  expired.error,
  "PIX_EXPIRED"
);

assert.equal(
  expiredCalled,
  true,
  "a camada forte do débito deve decidir se um Pix expirado pode iniciar ou se já é um retry"
);


const resumedAfterExpiryCalls = [];

const resumedAfterExpiry =
  await confirmBankPixDistributed(
    {},
    expiredSender,
    {
      now:
        now +
        (3 * 60 * 1000),

      async callSide(
        env,
        input
      ) {
        resumedAfterExpiryCalls.push(
          input.side
        );

        if (
          input.side ===
          "debit"
        ) {
          return {
            ok: true,
            idempotent: true
          };
        }

        return {
          ok: true
        };
      }
    }
  );

assert.equal(
  resumedAfterExpiry.ok,
  true
);

assert.deepEqual(
  resumedAfterExpiryCalls,
  [
    "debit",
    "credit",
    "finalize"
  ],
  "uma transferência já debitada deve poder terminar mesmo depois do TTL"
);


console.log(
  "✅ Orquestração distribuída e retomável do Pix validada."
);
