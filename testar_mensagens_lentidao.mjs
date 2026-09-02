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
      skill: "Nevasca Ascendente"
    },
    player2: {
      user: "p2",
      skill: "Soco"
    },
    firstExecution: {
      kind: "damage",
      attacker: "p2",
      defender: "p1",
      skill: "Soco",
      hit: true,
      damage: 5,
      defenderHp: 95
    },
    secondExecution: {
      kind: "slow",
      attacker: "p1",
      defender: "p2",
      skill: "Nevasca Ascendente",
      hit: true,
      damage: 10,
      defenderHp: 90,
      slowApplied: true,
      slow: {
        type: "lentidao",
        subtype: "lentidao",
        stat: "speed",
        amount: 20,
        duration: 2
      }
    },
    hp: {
      player1: {
        user: "p1",
        current: 95,
        max: 100
      },
      player2: {
        user: "p2",
        current: 90,
        max: 100
      }
    },
    dotTicks: [],
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
            "content-type": "application/json"
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

  const text = await response.text();

  assert.ok(
    text.includes(
      "🐌 @p2 ficou Lento"
    )
  );

  assert.ok(
    text.includes(
      "Velocidade -20"
    )
  );

  assert.ok(
    text.includes(
      "por 2 turnos"
    )
  );

  console.log(text);
  console.log(
    "✅ Mensagem de aplicação da Lentidao correta."
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
    hp: 90,
    maxHp: 100,
    mentalidade: 100,
    maxMentalidade: 100,
    effects: [
      {
        type: "debuff",
        subtype: "lentidao",
        effectCategory: "debuff",
        source: "Nevasca Ascendente",
        stat: "speed",
        amount: 20,
        appliedAtTurn: 1,
        expiresAtTurn: 4
      }
    ]
  };

  const env = {
    MARBION_USERS_V2: {
      async get() {
        return JSON.stringify(profile);
      },
      async put() {}
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
                  "content-type": "application/json"
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

  const text = await response.text();

  assert.ok(
    text.includes(
      "🐌 Nevasca Ascendente"
    )
  );

  assert.ok(
    text.includes(
      "Velocidade -20"
    )
  );

  assert.ok(
    text.includes(
      "(2T)"
    )
  );

  console.log(text);
  console.log(
    "✅ Lentidao aparece corretamente no !estado."
  );
}

await testAttackMessage();
await testEstadoMessage();

console.log(
  "\n🐌 TODOS OS TESTES DE MENSAGEM DE LENTIDAO PASSARAM."
);
