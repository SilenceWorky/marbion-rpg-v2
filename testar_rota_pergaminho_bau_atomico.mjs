import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  chestRoute
} from "./src/routes/chest.js";


function createEnv(
  profile
) {
  const store =
    new Map([
      [
        "scrolltest",
        JSON.stringify(
          profile
        )
      ]
    ]);

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
      }
    }
  };
}

function sequenceRandom(
  values
) {
  let index = 0;

  return () => {
    if (
      index >=
      values.length
    ) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    return values[
      index++
    ];
  };
}


const profile =
  createBaseProfile(
    "scrolltest"
  );

profile.race =
  "Terrariano";

profile.elements = [
  "Fogo"
];

createAtomicChest(
  profile,
  {
    currentAtoms: 4,
    scriptedSteps: [
      "open"
    ]
  }
);

const env =
  createEnv(
    profile
  );

const originalRandom =
  Math.random;

const originalFetch =
  globalThis.fetch;

Math.random =
  sequenceRandom([
    0,
    0,
    0,
    0.99,
    0
  ]);

globalThis.fetch =
  async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        Fogo: {
          Chama_Rara: {
            nome:
              "Chama Rara",
            elemento:
              "Fogo",
            raridade:
              "Raro"
          }
        }
      };
    }
  });

let response;

try {
  response =
    await chestRoute(
      new Request(
        "https://worker.test/bau?user=scrolltest&args=abrir%201"
      ),
      env
    );
}
finally {
  Math.random =
    originalRandom;

  globalThis.fetch =
    originalFetch;
}

assert.equal(
  await response.text(),
  "📦 @scrolltest, o Baú Atômico ⚛⚛⚛⚛ abriu! Todas as recompensas foram aplicadas e o baú foi consumido."
);

const stored =
  JSON.parse(
    env.store.get(
      "scrolltest"
    )
  );

assert.equal(
  stored.chests.length,
  0,
  "baú deve ser removido após resolver e entregar o Pergaminho"
);

assert.equal(
  stored.inventory
    .scrolls.length,
  1
);

assert.equal(
  stored.inventory
    .scrolls[0].tier,
  "R2"
);

assert.equal(
  stored.inventory
    .scrolls[0].skill.id,
  "Fogo:Chama_Rara"
);

assert.equal(
  stored.inventory
    .scrolls[0].source,
  "atomic_chest"
);

assert.match(
  stored.inventory
    .scrolls[0].grantId,
  /^atomic_chest:chest:atomic:\d+:reward:\d+$/
);

assert.equal(
  stored.skills.includes(
    "Fogo:Chama_Rara"
  ),
  false,
  "Pergaminho deve ir ao inventário, não aprender a habilidade automaticamente"
);


console.log(
  "✅ Rota do Baú Atômico resolve, entrega Pergaminho e finaliza com segurança."
);
