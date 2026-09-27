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
  username,
  profile
) {
  const store =
    new Map([
      [
        username,
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
      },

      async delete(key) {
        store.delete(key);
      }
    }
  };
}


function readStored(
  env,
  username
) {
  return JSON.parse(
    env.store.get(
      username
    )
  );
}


function rewardSnapshot(
  profile
) {
  return structuredClone({
    level:
      profile.level,
    xp:
      profile.xp,
    statusPoints:
      profile.statusPoints,
    money:
      profile.money,
    skills:
      profile.skills,
    skillMeta:
      profile.skillMeta,
    inventory:
      profile.inventory,
    unlockedTags:
      profile.unlockedTags
  });
}


function buildSkillsCatalog() {
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


async function openAtomicChest(
  env,
  username
) {
  return chestRoute(
    new Request(
      `https://worker.test/bau?user=${username}&args=abrir%201`
    ),
    env
  );
}


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
      return buildSkillsCatalog();
    }
  });


try {
  for (
    let atoms = 1;
    atoms <= 5;
    atoms += 1
  ) {
    const username =
      `integrado${atoms}`;

    const profile =
      createBaseProfile(
        username
      );

    profile.race =
      "Terrariano";

    profile.elements = [
      "Fogo"
    ];

    createAtomicChest(
      profile,
      {
        currentAtoms:
          atoms,
        scriptedSteps: [
          "open"
        ]
      }
    );

    const env =
      createEnv(
        username,
        profile
      );

    const response =
      await openAtomicChest(
        env,
        username
      );

    assert.equal(
      await response.text(),
      `📦 @${username}, o Baú Atômico ${"⚛".repeat(atoms)} abriu! Todas as recompensas foram aplicadas e o baú foi consumido.`
    );

    const stored =
      readStored(
        env,
        username
      );

    assert.equal(
      stored.chests.length,
      0,
      `Baú ${atoms} deve ser removido após finalização completa`
    );

    if (atoms === 1) {
      const totalMoney =
        stored.money.bronze +
        stored.money.silver * 10 +
        stored.money.gold * 100 +
        stored.money.platinum * 1000;

      assert.equal(
        totalMoney > 0,
        true,
        "Baú I com RNG 0.99 deve entregar dinheiro"
      );
    }

    if (atoms >= 2) {
      assert.equal(
        stored.xp > 0,
        true,
        `Baú ${atoms} deve entregar XP`
      );

      const totalMoney =
        stored.money.bronze +
        stored.money.silver * 10 +
        stored.money.gold * 100 +
        stored.money.platinum * 1000;

      assert.equal(
        totalMoney > 0,
        true,
        `Baú ${atoms} deve entregar dinheiro`
      );
    }

    if (atoms === 3) {
      assert.equal(
        stored.inventory
          .consumables.length,
        1,
        "Baú III deve entregar o consumível garantido"
      );
    }

    if (atoms === 4) {
      assert.equal(
        stored.inventory
          .scrolls.length,
        1,
        "Baú IV deve entregar o Pergaminho garantido"
      );

      assert.equal(
        stored.inventory
          .scrolls[0].tier,
        "R4",
        "RNG 0.99 deve selecionar R4 no Pergaminho garantido do Baú IV"
      );
    }

    if (atoms === 5) {
      assert.equal(
        stored.skills.includes(
          "Fogo:Chama_Lendaria"
        ),
        true,
        "Baú V deve aprender a habilidade Lendária selecionada"
      );

      assert.equal(
        stored.skills.includes(
          "Fogo:Chama_Especial"
        ),
        false,
        "habilidade Especial antiga/Único não pode sair no Baú V"
      );
    }

    const beforeRetry =
      rewardSnapshot(
        stored
      );

    const retry =
      await openAtomicChest(
        env,
        username
      );

    assert.equal(
      await retry.text(),
      `@${username}, esse número de baú não existe na sua lista.`
    );

    const afterRetry =
      readStored(
        env,
        username
      );

    assert.deepEqual(
      rewardSnapshot(
        afterRetry
      ),
      beforeRetry,
      `retry após consumir Baú ${atoms} não pode duplicar recompensas`
    );
  }


  const evolutionUser =
    "integradoevolucao";

  const evolutionProfile =
    createBaseProfile(
      evolutionUser
    );

  evolutionProfile.race =
    "Terrariano";

  evolutionProfile.elements = [
    "Fogo"
  ];

  createAtomicChest(
    evolutionProfile,
    {
      currentAtoms: 1,
      scriptedSteps: [
        "evolve",
        "evolve",
        "evolve",
        "evolve",
        "open"
      ]
    }
  );

  const evolutionEnv =
    createEnv(
      evolutionUser,
      evolutionProfile
    );

  for (
    let expectedAtoms = 2;
    expectedAtoms <= 5;
    expectedAtoms += 1
  ) {
    const response =
      await openAtomicChest(
        evolutionEnv,
        evolutionUser
      );

    assert.equal(
      await response.text(),
      `⚛️ @${evolutionUser}, seu Baú Atômico evoluiu de ${"⚛".repeat(expectedAtoms - 1)} para ${"⚛".repeat(expectedAtoms)}.`
    );

    const stored =
      readStored(
        evolutionEnv,
        evolutionUser
      );

    assert.equal(
      stored.chests[0]
        .metadata.atomic
        .currentAtoms,
      expectedAtoms
    );

    assert.equal(
      stored.chests[0]
        .metadata.atomic
        .attemptsAtLevel,
      0,
      "evolução deve zerar as tentativas do novo nível"
    );
  }

  const finalOpen =
    await openAtomicChest(
      evolutionEnv,
      evolutionUser
    );

  assert.equal(
    await finalOpen.text(),
    `📦 @${evolutionUser}, o Baú Atômico ⚛⚛⚛⚛⚛ abriu! Todas as recompensas foram aplicadas e o baú foi consumido.`
  );

  const evolvedStored =
    readStored(
      evolutionEnv,
      evolutionUser
    );

  assert.equal(
    evolvedStored.chests.length,
    0,
    "baú evoluído de I até V deve ser removido após a abertura final"
  );

  assert.equal(
    evolvedStored.skills.includes(
      "Fogo:Chama_Lendaria"
    ),
    true,
    "baú evoluído até V deve entregar a habilidade garantida"
  );
}
finally {
  Math.random =
    originalRandom;

  globalThis.fetch =
    originalFetch;
}


console.log(
  "✅ Integração completa dos Baús Atômicos I–V validada."
);
