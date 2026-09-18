import assert from "node:assert/strict";

import {
  bankRoute
} from "./src/routes/bank.js";

import {
  createBaseProfile
} from "./src/core/profile.js";


function createEnv(
  profiles
) {
  const store =
    new Map();

  for (
    const [
      user,
      profile
    ] of Object.entries(
      profiles
    )
  ) {
    store.set(
      user,
      JSON.stringify(
        profile
      )
    );
  }

  return {
    store,

    MARBION_USERS_V2: {
      async get(key) {
        return (
          store.get(key) ??
          null
        );
      },

      async put(
        key,
        value
      ) {
        store.set(
          key,
          value
        );
      },

      async delete(key) {
        store.delete(key);
      }
    }
  };
}


const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.race =
  "Terrariano";

profile.money = {
  bronze: 125,
  silver: 8,
  gold: 9,
  platinum: 0
};

const env =
  createEnv({
    silenceworky:
      profile
  });


const balanceResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=silenceworky"
    ),
    env
  );

const balanceText =
  await balanceResponse.text();

assert.equal(
  balanceText,
  "🏦 Banco de @silenceworky ┃ Bronze: 125 ┃ Prata: 8 ┃ Ouro: 9 ┃ Platina: 0"
);


const joinAllResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=silenceworky&args=unir%20tudo"
    ),
    env
  );

const joinAllText =
  await joinAllResponse.text();

assert.ok(
  joinAllText.includes(
    "Bronze: 5 ┃ Prata: 0 ┃ Ouro: 1 ┃ Platina: 1"
  ),
  "a rota deve aplicar a cascata de unir tudo"
);


const storedAfterJoin =
  JSON.parse(
    env.store.get(
      "silenceworky"
    )
  );

assert.deepEqual(
  storedAfterJoin.money,
  {
    bronze: 5,
    silver: 0,
    gold: 1,
    platinum: 1
  },
  "a alteração do Banco deve ser persistida no perfil"
);


const splitResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=silenceworky&args=separar%20platina%201"
    ),
    env
  );

const splitText =
  await splitResponse.text();

assert.ok(
  splitText.includes(
    "Bronze: 5 ┃ Prata: 0 ┃ Ouro: 11 ┃ Platina: 0"
  ),
  "separar 1 Platina deve criar 10 Ouro"
);


const joinGoldProfile =
  createBaseProfile(
    "ouroteste"
  );

joinGoldProfile.race =
  "Terrariano";

joinGoldProfile.money = {
  bronze: 0,
  silver: 0,
  gold: 20,
  platinum: 0
};

const envJoinGold =
  createEnv({
    ouroteste:
      joinGoldProfile
  });

const joinGoldResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=ouroteste&args=unir%20ouro%201"
    ),
    envJoinGold
  );

assert.ok(
  (
    await joinGoldResponse.text()
  ).includes(
    "Ouro: 10 ┃ Platina: 1"
  ),
  "nomes portugueses de moeda devem ser aceitos pela rota"
);


const invalidResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=silenceworky&args=unir%20platina"
    ),
    env
  );

assert.equal(
  await invalidResponse.text(),
  "@silenceworky, Platina é a maior moeda e não pode ser unida."
);


const pixSender =
  createBaseProfile(
    "pixsender"
  );

pixSender.race =
  "Terrariano";

pixSender.money = {
  bronze: 0,
  silver: 0,
  gold: 0,
  platinum: 1
};

const pixRecipient =
  createBaseProfile(
    "pixdestino"
  );

pixRecipient.race =
  "Tritão";

const pixEnv =
  createEnv({
    pixsender:
      pixSender,
    pixdestino:
      pixRecipient
  });

const pixResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=pixsender&args=pix%201%20ouro%20%40pixdestino"
    ),
    pixEnv
  );

const pixText =
  await pixResponse.text();

assert.ok(
  pixText.includes(
    "Pix pendente: 1 ouro para @pixdestino"
  ),
  "a rota deve criar um Pix pendente usando nomes portugueses de moeda"
);

const storedPixSender =
  JSON.parse(
    pixEnv.store.get(
      "pixsender"
    )
  );

assert.equal(
  storedPixSender.bank
    .pendingPix.recipient,
  "pixdestino"
);

assert.equal(
  storedPixSender.bank
    .pendingPix.coin,
  "gold"
);

assert.equal(
  storedPixSender.bank
    .pendingPix.totalBronze,
  100
);

assert.deepEqual(
  storedPixSender.money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 1
  },
  "criar o Pix não pode mover dinheiro antes da confirmação"
);

const storedPixRecipient =
  JSON.parse(
    pixEnv.store.get(
      "pixdestino"
    )
  );

assert.deepEqual(
  storedPixRecipient.money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  },
  "criar o Pix não pode creditar o destinatário antes da confirmação"
);


const poorPixSender =
  createBaseProfile(
    "pixpobre"
  );

poorPixSender.race =
  "Terrariano";

poorPixSender.money = {
  bronze: 5,
  silver: 0,
  gold: 0,
  platinum: 0
};

const poorPixRecipient =
  createBaseProfile(
    "pixrico"
  );

poorPixRecipient.race =
  "Elfo";

const poorPixEnv =
  createEnv({
    pixpobre:
      poorPixSender,
    pixrico:
      poorPixRecipient
  });

const poorPixResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=pixpobre&args=pix%201%20ouro%20%40pixrico"
    ),
    poorPixEnv
  );

assert.equal(
  await poorPixResponse.text(),
  "@pixpobre, saldo insuficiente para criar esse Pix."
);

const poorStored =
  JSON.parse(
    poorPixEnv.store.get(
      "pixpobre"
    )
  );

assert.equal(
  poorStored.bank.pendingPix,
  null,
  "Pix sem saldo não deve ser criado"
);


const noCharacter =
  createBaseProfile(
    "semchar"
  );

const envNoCharacter =
  createEnv({
    semchar:
      noCharacter
  });

const noCharacterResponse =
  await bankRoute(
    new Request(
      "https://worker.test/banco?user=semchar"
    ),
    envNoCharacter
  );

assert.equal(
  await noCharacterResponse.text(),
  "@semchar, você ainda não possui um personagem. Use !raça primeiro."
);


console.log(
  "✅ Rota base do Banco validada."
);
