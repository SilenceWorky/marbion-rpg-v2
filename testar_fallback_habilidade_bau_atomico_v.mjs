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


function createEnv(profile) {
  const store =
    new Map([
      [
        "fallbacktest",
        JSON.stringify(profile)
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


const profile =
  createBaseProfile(
    "fallbacktest"
  );

profile.race =
  "Terrariano";

profile.elements = [
  "Fogo"
];

profile.skills.push(
  "Fogo:Unica_Disponivel"
);

profile.skillMeta[
  "Fogo:Unica_Disponivel"
] = {
  source: "test",
  temporary: false
};

createAtomicChest(
  profile,
  {
    currentAtoms: 5,
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
  () => 0.99;

globalThis.fetch =
  async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        Fogo: {
          Unica_Disponivel: {
            nome:
              "Única Disponível",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Comum"
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
        "https://worker.test/bau?user=fallbacktest&args=abrir%201"
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
  "📦 @fallbacktest, o Baú Atômico ⚛⚛⚛⚛⚛ abriu! Todas as recompensas foram aplicadas e o baú foi consumido."
);

const stored =
  JSON.parse(
    env.store.get(
      "fallbacktest"
    )
  );

assert.equal(
  stored.chests.length,
  0
);

assert.equal(
  stored.money.platinum,
  2,
  "pool esgotado com roll >= 75% deve entregar 2 Platinas"
);

assert.equal(
  stored.skills.length,
  1,
  "fallback não deve criar habilidade duplicada"
);


console.log(
  "✅ Fallback de Platina da habilidade do Baú Atômico V validado."
);
