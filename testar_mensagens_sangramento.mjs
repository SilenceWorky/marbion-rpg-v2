import assert from "node:assert/strict";

import {
  attackRoute
} from "./src/routes/attack.js";

import {
  estadoRoute
} from "./src/routes/estado.js";

async function testAttackMessage() {
  const result = {
    ok: true,
    waiting: false,
    turn: 1,
    player1: {
      user: "p1",
      skill: "Lâmina de Ar Cortante"
    },
    player2: {
      user: "p2",
      skill: "Soco"
    },
    firstExecution: {
      kind: "bleed",
      attacker: "p1",
      defender: "p2",
      skill: "Lâmina de Ar Cortante",
      hit: true,
      damage: 40,
      defenderHp: 60,
      bleedApplied: true,
      bleed: {
        type: "sangramento",
        damagePerTurn: 10,
        duration: 3
      }
    },
    secondExecution: {
      kind: "damage",
      attacker: "p2",
      defender: "p1",
      skill: "Soco",
      hit: true,
      damage: 1,
      defenderHp: 99
    },
    hp: {
      player1: {
        user: "p1",
        current: 99,
        max: 100
      },
      player2: {
        user: "p2",
        current: 50,
        max: 100
      }
    },
    dotTicks: [
      {
        type: "sangramento",
        source: "Lâmina de Ar Cortante",
        user: "p2",
        damage: 10,
        hpAfter: 50,
        remainingTicks: 2
      }
    ],
    dotDefeats: {
      player1: null,
      player2: null
    },
    battleOver: false,
    draw: false,
    winner: null,
    loser: null,
    rankedResult: null,
    nextTurn: 2
  };

  const coordinator = {
    async fetch() {
      return new Response(
        JSON.stringify(result),
        {
          headers: {
            "content-type":
              "application/json"
          }
        }
      );
    }
  };

  const env = {
    PVP_COORDINATOR: {
      idFromName() {
        return "test";
      },
      get() {
        return coordinator;
      }
    }
  };

  const response =
    await attackRoute(
      new Request(
        "https://marbion.test/attack?user=p2&slot=4"
      ),
      env
    );

  const text =
    await response.text();

  assert.ok(
    text.includes(
      "🩸 @p2 ficou Sangrando"
    )
  );

  assert.ok(
    text.includes(
      "10 de dano por turno"
    )
  );

  assert.ok(
    text.includes(
      "por 3 turnos"
    )
  );

  assert.ok(
    text.includes(
      "🩸 Sangramento"
    )
  );

  console.log(text);
  console.log(
    "✅ Mensagem de aplicação/tick de Sangramento correta."
  );
}

async function testEstadoMessage() {
  const profile = {
    race: "Terrariano",
    hp: 100,
    maxHp: 100,
    mentalidade: 100,
    maxMentalidade: 100,
    statusEffects: {}
  };

  const battleState = {
    ok: true,
    inBattle: true,
    turn: 2,
    opponent: "p1",
    hp: 50,
    maxHp: 100,
    mentalidade: 100,
    maxMentalidade: 100,
    effects: [
      {
        type: "sangramento",
        source: "Lâmina de Ar Cortante",
        damagePerTurn: 10,
        remainingTicks: 2,
        nextTickTurn: 3
      }
    ]
  };

  const env = {
    MARBION_USERS_V2: {
      async get() {
        return JSON.stringify(profile);
      }
    },
    PVP_COORDINATOR: {
      idFromName() {
        return "test";
      },
      get() {
        return {
          async fetch() {
            return new Response(
              JSON.stringify(battleState),
              {
                headers: {
                  "content-type":
                    "application/json"
                }
              }
            );
          }
        };
      }
    }
  };

  const response =
    await estadoRoute(
      new Request(
        "https://marbion.test/estado?user=p2"
      ),
      env
    );

  const text =
    await response.text();

  assert.ok(
    text.includes(
      "🩸 Lâmina de Ar Cortante"
    )
  );

  assert.ok(
    text.includes(
      "10 dano/turno (2T)"
    )
  );

  console.log(text);
  console.log(
    "✅ Sangramento aparece corretamente no !estado."
  );
}

await testAttackMessage();
await testEstadoMessage();

console.log(
  "\n🩸 TODOS OS TESTES DE MENSAGEM DE SANGRAMENTO PASSARAM."
);
