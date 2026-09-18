import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinatorFinalEntry.js";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createPendingBankPix
} from "./src/systems/bank-pix-state.js";


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
      ],
      [
        "profile_initialized",
        true
      ],
      [
        "profile_user",
        profile.user
      ]
    ]);

  const storage = {
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

    async delete(key) {
      data.delete(key);
    },

    async transaction(
      callback
    ) {
      return callback(
        storage
      );
    }
  };

  return storage;
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
        },

        async get(key) {
          return (
            kv.get(key) ??
            null
          );
        },

        async delete(key) {
          kv.delete(key);
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

const senderStorage =
  createStorage(
    sender
  );

const senderEnv =
  createEnv();

const senderDo =
  new PvpCoordinator(
    {
      storage:
        senderStorage
    },
    senderEnv.env
  );


const debitResponse =
  await senderDo.fetch(
    new Request(
      "https://profile.internal/profile-store/pix-side?side=debit&user=origem",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body:
          JSON.stringify(
            transaction
          )
      }
    )
  );

const debit =
  await debitResponse.json();

assert.equal(
  debit.ok,
  true
);

assert.equal(
  debit.profileStore,
  true
);

assert.equal(
  debit.pixSide,
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


const debitRetryResponse =
  await senderDo.fetch(
    new Request(
      "https://profile.internal/profile-store/pix-side?side=debit&user=origem",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body:
          JSON.stringify(
            transaction
          )
      }
    )
  );

const debitRetry =
  await debitRetryResponse.json();

assert.equal(
  debitRetry.ok,
  true
);

assert.equal(
  debitRetry.idempotent,
  true
);


const recipient =
  createBaseProfile(
    "destino"
  );

const recipientStorage =
  createStorage(
    recipient
  );

const recipientEnv =
  createEnv();

const recipientDo =
  new PvpCoordinator(
    {
      storage:
        recipientStorage
    },
    recipientEnv.env
  );

const creditResponse =
  await recipientDo.fetch(
    new Request(
      "https://profile.internal/profile-store/pix-side?side=credit&user=destino",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body:
          JSON.stringify(
            transaction
          )
      }
    )
  );

const credit =
  await creditResponse.json();

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


const finalizeResponse =
  await senderDo.fetch(
    new Request(
      "https://profile.internal/profile-store/pix-side?side=finalize&user=origem",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body:
          JSON.stringify(
            transaction
          )
      }
    )
  );

const finalized =
  await finalizeResponse.json();

assert.equal(
  finalized.ok,
  true
);

assert.equal(
  finalized.profile.bank
    .pendingPix,
  null
);


const invalidJsonResponse =
  await senderDo.fetch(
    new Request(
      "https://profile.internal/profile-store/pix-side?side=debit&user=origem",
      {
        method: "POST",
        body: "{"
      }
    )
  );

assert.equal(
  invalidJsonResponse.status,
  400
);

const invalidJson =
  await invalidJsonResponse.json();

assert.equal(
  invalidJson.error,
  "INVALID_JSON"
);


console.log(
  "✅ Endpoint interno do Pix no profile-store validado."
);
