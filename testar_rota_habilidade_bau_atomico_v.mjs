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
        "abilitytest",
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
    "abilitytest"
  );

profile.race =
  "Terrariano";

profile.elements = [
  "Fogo"
];

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
          Chama_Comum: {
            nome:
              "Chama Comum",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Comum"
          },
          Chama_Incomum: {
            nome:
              "Chama Incomum",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Incomum"
          },
          Chama_Rara: {
            nome:
              "Chama Rara",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Raro"
          },
          Chama_Muito_Rara: {
            nome:
              "Chama Muito Rara",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Muito Raro"
          },
          Chama_Lendaria: {
            nome:
              "Chama Lendária",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Lendário"
          },
          Chama_Especial: {
            nome:
              "Chama Especial",
            tipo:
              "Elemental",
            elemento:
              "Fogo",
            raridade:
              "Especial"
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
        "https://worker.test/bau?user=abilitytest&args=abrir%201"
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
  "📦 @abilitytest, o Baú Atômico ⚛⚛⚛⚛⚛ abriu! Todas as recompensas foram aplicadas e o baú foi consumido."
);

const stored =
  JSON.parse(
    env.store.get(
      "abilitytest"
    )
  );

assert.equal(
  stored.chests.length,
  0,
  "Baú V deve ser removido depois da entrega completa"
);

assert.equal(
  stored.skills.includes(
    "Fogo:Chama_Lendaria"
  ),
  true,
  "habilidade garantida deve ser aprendida diretamente"
);

assert.equal(
  stored.skills.includes(
    "Fogo:Chama_Especial"
  ),
  false,
  "Especial antigo vira Único e não pode sair no Baú V"
);

assert.equal(
  stored.skillMeta[
    "Fogo:Chama_Lendaria"
  ].source,
  "atomic_chest"
);

assert.equal(
  stored.skillMeta[
    "Fogo:Chama_Lendaria"
  ].temporary,
  false
);


console.log(
  "✅ Rota do Baú Atômico V entrega a habilidade elemental garantida."
);
