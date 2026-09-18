import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  addChests,
  CHEST_TYPES
} from "./src/systems/chest-inventory.js";

import {
  chestRoute
} from "./src/routes/chest.js";


function createEnv(
  profiles = {}
) {
  const store =
    new Map(
      Object.entries(
        profiles
      ).map(
        ([user, profile]) => [
          user,
          JSON.stringify(
            profile
          )
        ]
      )
    );

  return {
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


addChests(
  profile,
  {
    type:
      CHEST_TYPES.ADMIN,
    quantity: 1
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.SEASONAL,
    quantity: 2
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.ATOMIC,
    quantity: 3
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.BOSS,
    quantity: 4
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.MONSTER,
    quantity: 5
  }
);


const env =
  createEnv({
    silenceworky:
      profile
  });


const response =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=silenceworky"
    ),
    env
  );

assert.equal(
  await response.text(),
  "📦 Baús de @silenceworky ┃ 1. Baú Atômico ⚛ ×3 ┃ 2. Baú Sazonal ×2 ┃ 3. Baú de Monstro ×5 ┃ 4. Baú de Boss ×4 ┃ 5. Baú ADM ×1 ┃ Página 1/1"
);


const nonexistentPage =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=silenceworky&args=pagina%202"
    ),
    env
  );

assert.equal(
  await nonexistentPage.text(),
  "@silenceworky, página inexistente. Seus baús possuem 1 página(s)."
);


const empty =
  createBaseProfile(
    "vazio"
  );

empty.race =
  "Elfo";

const emptyEnv =
  createEnv({
    vazio:
      empty
  });

const emptyResponse =
  await chestRoute(
    new Request(
      "https://worker.test/ba%C3%BA?user=vazio"
    ),
    emptyEnv
  );

assert.equal(
  await emptyResponse.text(),
  "📦 @vazio, você não possui baús."
);


console.log(
  "✅ Rota de listagem dos Baús validada."
);
