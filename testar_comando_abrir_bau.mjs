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

const originalRandom =
  Math.random;

Math.random =
  () => 0.99;

const openResponse =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=abre&args=abrir%201"
    ),
    openEnv
  );

Math.random =
  originalRandom;

assert.equal(
  await openResponse.text(),
  "📦 @abre, o Baú Atômico ⚛⚛ abriu! Todas as recompensas foram aplicadas e o baú foi consumido."
);

const openStored =
  JSON.parse(
    openEnv.store.get(
      "abre"
    )
  );

assert.equal(
  openStored.chests.length,
  0,
  "o baú deve ser consumido quando todas as recompensas forem resolvidas e aplicadas"
);

assert.equal(
  openStored.xp > 0,
  true,
  "a rota precisa aplicar o XP resolvido do plano"
);

const openMoneyBronzeEquivalent =
  openStored.money.bronze +
  openStored.money.silver * 10 +
  openStored.money.gold * 100 +
  openStored.money.platinum * 1000;

assert.equal(
  openMoneyBronzeEquivalent > 0,
  true,
  "a rota precisa aplicar o dinheiro resolvido do plano"
);

const rewardSnapshot =
  structuredClone({
    xp:
      openStored.xp,
    level:
      openStored.level,
    statusPoints:
      openStored.statusPoints,
    money:
      openStored.money
  });

const retryOpenResponse =
  await chestRoute(
    new Request(
      "https://worker.test/bau?user=abre&args=abrir%201"
    ),
    openEnv
  );

assert.equal(
  await retryOpenResponse.text(),
  "@abre, esse número de baú não existe na sua lista."
);

const retryOpenStored =
  JSON.parse(
    openEnv.store.get(
      "abre"
    )
  );

assert.deepEqual(
  {
    xp:
      retryOpenStored.xp,
    level:
      retryOpenStored.level,
    statusPoints:
      retryOpenStored.statusPoints,
    money:
      retryOpenStored.money
  },
  rewardSnapshot,
  "tentar novamente após consumir o baú não pode duplicar XP nem dinheiro"
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
  "@sazonal, esse Baú Sazonal é antigo e não possui identidade histórica completa para uma abertura segura."
);


console.log(
  "✅ Comando !baú abrir com persistência base validado."
);
