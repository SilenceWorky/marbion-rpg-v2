import assert from "node:assert/strict";

import {
  handleRequest
} from "./src/router.js";

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


function createEnvironment() {
  const kv =
    new Map();

  const objects =
    new Map();

  const env = {
    MARBION_USERS_V2: {
      async get(key) {
        return (
          kv.get(key) ??
          null
        );
      },

      async put(
        key,
        value
      ) {
        kv.set(
          key,
          value
        );
      },

      async delete(key) {
        kv.delete(key);
      }
    },

    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },

      get(id) {
        return objects.get(
          id
        );
      }
    }
  };

  function addProfile(
    profile
  ) {
    const storage =
      createStorage(
        profile
      );

    const id =
      `marbion-profile:${profile.user}`;

    objects.set(
      id,
      new PvpCoordinator(
        {
          storage
        },
        env
      )
    );

    return storage;
  }

  return {
    env,
    addProfile
  };
}


function makeTransferProfiles(
  senderUser,
  recipientUser
) {
  const sender =
    createBaseProfile(
      senderUser
    );

  sender.race =
    "Terrariano";

  sender.money = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 1
  };

  const recipient =
    createBaseProfile(
      recipientUser
    );

  recipient.race =
    "Tritão";

  createPendingBankPix(
    sender,
    {
      recipient:
        recipientUser,
      amount: 1,
      coin: "gold",
      now:
        Date.now()
    }
  );

  return {
    sender,
    recipient
  };
}


const first =
  createEnvironment();

const firstProfiles =
  makeTransferProfiles(
    "origem",
    "destino"
  );

const firstSenderStorage =
  first.addProfile(
    firstProfiles.sender
  );

const firstRecipientStorage =
  first.addProfile(
    firstProfiles.recipient
  );


const bankResponse =
  await handleRequest(
    new Request(
      "https://worker.test/banco?user=origem&args=confirmar"
    ),
    first.env
  );

const bankText =
  await bankResponse.text();

assert.equal(
  bankText,
  "✅ @origem, Pix confirmado: 1 Ouro para @destino."
);

const firstSenderFinal =
  await firstSenderStorage.get(
    "profile"
  );

const firstRecipientFinal =
  await firstRecipientStorage.get(
    "profile"
  );

assert.deepEqual(
  firstSenderFinal.money,
  {
    bronze: 0,
    silver: 0,
    gold: 9,
    platinum: 0
  }
);

assert.equal(
  firstSenderFinal.bank
    .pendingPix,
  null
);

assert.deepEqual(
  firstRecipientFinal.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 0
  }
);


const second =
  createEnvironment();

const secondProfiles =
  makeTransferProfiles(
    "origem2",
    "destino2"
  );

second.addProfile(
  secondProfiles.sender
);

second.addProfile(
  secondProfiles.recipient
);


const directResponse =
  await handleRequest(
    new Request(
      "https://worker.test/confirmar?user=origem2"
    ),
    second.env
  );

assert.equal(
  await directResponse.text(),
  "✅ @origem2, Pix confirmado: 1 Ouro para @destino2."
);


const repeatedResponse =
  await handleRequest(
    new Request(
      "https://worker.test/confirmar?user=origem2"
    ),
    second.env
  );

assert.equal(
  await repeatedResponse.text(),
  "@origem2, você não possui um Pix pendente."
);


console.log(
  "✅ Confirmação do Pix pelas rotas !confirmar e !banco confirmar validada."
);
