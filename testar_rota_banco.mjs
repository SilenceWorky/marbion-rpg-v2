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
