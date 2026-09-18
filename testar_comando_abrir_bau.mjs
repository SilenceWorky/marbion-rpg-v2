import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  addChests,
  CHEST_TYPES
} from "./src/systems/chest-inventory.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

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


const nothingProfile =
  createBaseProfile(
    "nada"
  );

nothingProfile.race =
  "Terrariano";

createAtomicChest(
  nothingProfile,
  {
    currentAtoms: 1,
    scriptedSteps: [
      "nothing"
    ]
  }
);

const nothingEnv =
  createEnv({
    nada:
      nothingProfile
  });

const nothingResponse =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=nada&args=abrir%201"
    ),
    nothingEnv
  );

assert.equal(
  await nothingResponse.text(),
  "📦 @nada, o Baú Atômico ⚛ não abriu nem evoluiu nesta tentativa. Tentativa 1/3."
);

const nothingStored =
  JSON.parse(
    nothingEnv.store.get(
      "nada"
    )
  );

assert.equal(
  nothingStored.chests[0]
    .metadata.atomic
    .attemptsAtLevel,
  1,
  "a tentativa sem resultado precisa ser persistida"
);


const evolveProfile =
  createBaseProfile(
    "evolui"
  );

evolveProfile.race =
  "Elfo";

createAtomicChest(
  evolveProfile,
  {
    currentAtoms: 1,
    scriptedSteps: [
      "evolve"
    ]
  }
);

const evolveEnv =
  createEnv({
    evolui:
      evolveProfile
  });

const evolveResponse =
  await chestRoute(
    new Request(
      "https://worker.test/ba%C3%BA?user=evolui&args=abrir%201"
    ),
    evolveEnv
  );

assert.equal(
  await evolveResponse.text(),
  "⚛️ @evolui, seu Baú Atômico evoluiu de ⚛ para ⚛⚛."
);

const evolveStored =
  JSON.parse(
    evolveEnv.store.get(
      "evolui"
    )
  );

assert.equal(
  evolveStored.chests[0]
    .metadata.atomic
    .currentAtoms,
  2,
  "a evolução precisa ser persistida"
);


const openProfile =
  createBaseProfile(
    "abre"
  );

openProfile.race =
  "Tritão";

createAtomicChest(
  openProfile,
  {
    currentAtoms: 2,
    scriptedSteps: [
      "open"
    ]
  }
);

const openEnv =
  createEnv({
    abre:
      openProfile
  });

const openResponse =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=abre&args=abrir%201"
    ),
    openEnv
  );

assert.equal(
  await openResponse.text(),
  "📦 @abre, a abertura do Baú Atômico ⚛⚛ foi registrada com segurança e aguarda a entrega da recompensa."
);

const openStored =
  JSON.parse(
    openEnv.store.get(
      "abre"
    )
  );

assert.equal(
  openStored.chests.length,
  1,
  "o baú ainda não deve ser consumido neste bloco"
);

assert.equal(
  openStored.chests[0]
    .metadata.atomic
    .pendingOpen
    .atoms,
  2,
  "pendingOpen precisa ser persistido pela rota"
);


const seasonalProfile =
  createBaseProfile(
    "sazonal"
  );

seasonalProfile.race =
  "Metamorfo";

addChests(
  seasonalProfile,
  {
    type:
      CHEST_TYPES.SEASONAL,
    quantity: 1
  }
);

const seasonalEnv =
  createEnv({
    sazonal:
      seasonalProfile
  });

const seasonalResponse =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=sazonal&args=abrir%201"
    ),
    seasonalEnv
  );

assert.equal(
  await seasonalResponse.text(),
  "@sazonal, a abertura desse tipo de baú ainda não está implementada."
);


console.log(
  "✅ Comando !baú abrir com persistência base validado."
);
