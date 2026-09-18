import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createPendingBankPix
} from "./src/systems/bank-pix-state.js";

import {
  executeBankPixProfileStoreSide
} from "./src/systems/bank-pix-profile-store.js";


function createStorage(
  profile
) {
  const data =
    new Map([
      [
        "profile",
        structuredClone(
          profile
        )
      ]
    ]);

  const api = {
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
      return callback(api);
    }
  };

  return {
    api,
    data
  };
}


function createEnv() {
  const kv =
    new Map();

  return {
    kv,

    env: {
      MARBION_USERS_V2: {
        async put(
          key,
          value
        ) {
          kv.set(
            key,
            value
          );
        }
      }
    }
  };
}


const now =
  1_700_000_000_000;

const sender =
  createBaseProfile(
    "origem"
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

const transaction = {
  transactionId:
    sender.bank.pendingPix.id,
  sender: "origem",
  recipient: "destino",
  amount: 1,
  coin: "gold",
  totalBronze: 100
};

const senderStore =
  createStorage(
    sender
  );

const senderEnv =
  createEnv();

const debit =
  await executeBankPixProfileStoreSide(
    senderStore.api,
    senderEnv.env,
    {
      side: "debit",
      user: "origem",
      transaction
    }
  );

assert.equal(
  debit.ok,
  true
);

assert.equal(
  debit.kvSynced,
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

assert.deepEqual(
  JSON.parse(
    senderEnv.kv.get(
      "origem"
    )
  ).money,
  debit.profile.money,
  "o KV deve acompanhar o perfil forte após o débito"
);


const recipient =
  createBaseProfile(
    "destino"
  );

const recipientStore =
  createStorage(
    recipient
  );

const recipientEnv =
  createEnv();

const credit =
  await executeBankPixProfileStoreSide(
    recipientStore.api,
    recipientEnv.env,
    {
      side: "credit",
      user: "@Destino",
      transaction
    }
  );

assert.equal(
  credit.ok,
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


const finalized =
  await executeBankPixProfileStoreSide(
    senderStore.api,
    senderEnv.env,
    {
      side:
        "finalize",
      user: "origem",
      transaction
    }
  );

assert.equal(
  finalized.ok,
  true
);

assert.equal(
  finalized.profile.bank
    .pendingPix,
  null
);

assert.equal(
  JSON.parse(
    senderEnv.kv.get(
      "origem"
    )
  ).bank.pendingPix,
  null,
  "o KV deve acompanhar a finalização do Pix"
);


const mismatched =
  await executeBankPixProfileStoreSide(
    recipientStore.api,
    recipientEnv.env,
    {
      side:
        "credit",
      user:
        "outro-usuario",
      transaction
    }
  );

assert.equal(
  mismatched.ok,
  false
);

assert.equal(
  mismatched.error,
  "PIX_RECIPIENT_PROFILE_MISMATCH"
);


const retry =
  await executeBankPixProfileStoreSide(
    recipientStore.api,
    recipientEnv.env,
    {
      side:
        "credit",
      user:
        "destino",
      transaction
    }
  );

assert.equal(
  retry.ok,
  true
);

assert.equal(
  retry.idempotent,
  true
);

assert.deepEqual(
  retry.profile.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  }
);


console.log(
  "✅ Integração do Pix com o profile-store validada."
);
