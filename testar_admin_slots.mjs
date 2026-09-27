import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  adminCharactersApiRoute
} from "./src/routes/api-admin-characters.js";

const store = new Map();

const env = {
  MARBION_ADMIN_KEY:
    "teste-seguro",
  MARBION_USERS_V2: {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async list() {
      return {
        keys: [],
        list_complete: true
      };
    }
  }
};

const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.race = "Terrariano";
profile.elements = ["Fogo"];
profile.skills = [
  "Fogo:Chama_Teste",
  "Fogo:Explosao_Teste"
];
profile.equippedSkills = [
  null,
  null,
  null,
  null
];

store.set(
  "silenceworky",
  JSON.stringify(profile)
);

const skillsData = {
  Fogo: {
    Chama_Teste: {
      nome: "Chama Teste",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Fogo",
      custoMentalidade: 5,
      cooldown: 0,
      escala: "magicStrength",
      dano: 10,
      precisao: 100,
      prioridade: 0
    },
    Explosao_Teste: {
      nome: "Explosão Teste",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Fogo",
      custoMentalidade: 8,
      cooldown: 1,
      escala: "magicStrength",
      dano: 20,
      precisao: 95,
      prioridade: 0
    }
  },
  Agua: {
    Onda_Nao_Possuida: {
      nome: "Onda Não Possuída",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Água",
      custoMentalidade: 5,
      cooldown: 0,
      escala: "magicStrength",
      dano: 10,
      precisao: 100,
      prioridade: 0
    }
  }
};

const originalFetch =
  globalThis.fetch;

globalThis.fetch =
  async () =>
    Response.json(
      skillsData
    );

function adminUrl() {
  return (
    "https://worker.test/api/v1/admin/characters" +
    "?actor=silenceworky" +
    "&key=teste-seguro"
  );
}

async function patch(
  equippedSkills
) {
  const response =
    await adminCharactersApiRoute(
      new Request(
        adminUrl(),
        {
          method: "PATCH",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify({
              user:
                "silenceworky",
              patch: {
                equippedSkills
              }
            })
        }
      ),
      env
    );

  return {
    response,
    payload:
      await response.json()
  };
}

try {
  const first =
    await patch([
      "Fogo:Chama_Teste",
      null,
      "Fogo:Explosao_Teste",
      null
    ]);

  assert.equal(
    first.response.status,
    200
  );
  assert.deepEqual(
    first.payload.character
      .skills.equipped,
    [
      "Fogo:Chama_Teste",
      null,
      "Fogo:Explosao_Teste",
      null
    ]
  );

  const moved =
    await patch([
      null,
      "Fogo:Chama_Teste",
      "Fogo:Explosao_Teste",
      null
    ]);

  assert.equal(
    moved.response.status,
    200
  );
  assert.deepEqual(
    moved.payload.character
      .skills.equipped,
    [
      null,
      "Fogo:Chama_Teste",
      "Fogo:Explosao_Teste",
      null
    ]
  );

  const duplicate =
    await patch([
      "Fogo:Chama_Teste",
      "Fogo:Chama_Teste",
      null,
      null
    ]);

  assert.equal(
    duplicate.response.status,
    400
  );
  assert.equal(
    duplicate.payload.error,
    "DUPLICATE_EQUIPPED_SKILL"
  );

  const notOwned =
    await patch([
      "Agua:Onda_Nao_Possuida",
      null,
      null,
      null
    ]);

  assert.equal(
    notOwned.response.status,
    400
  );
  assert.equal(
    notOwned.payload.error,
    "SKILL_NOT_OWNED"
  );

  const invalidLength =
    await patch([
      null,
      null
    ]);

  assert.equal(
    invalidLength.response.status,
    400
  );
  assert.equal(
    invalidLength.payload.error,
    "INVALID_EQUIPPED_SKILLS"
  );

  console.log(
    "✅ Slots administrativos validados."
  );
}
finally {
  globalThis.fetch =
    originalFetch;
}
