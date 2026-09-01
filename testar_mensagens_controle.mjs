import assert from "node:assert/strict";

import {
  attackRoute
} from "./src/routes/attack.js";

import {
  estadoRoute
} from "./src/routes/estado.js";


/*
 * ==============================
 * TESTE DO !ATAQUE
 * ==============================
 */
async function testAttackMessage() {
  const result = {
    ok: true,
    waiting: false,

    turn: 1,

    player1: {
      user: "p1",
      skill: "Raio Instantâneo"
    },

    player2: {
      user: "p2",
      skill: "Soco"
    },

    firstExecution: {
      kind: "paralysis",

      attacker: "p1",
      defender: "p2",

      skill: "Raio Instantâneo",

      hit: true,
      damage: 32,

      defenderHp: 68,

      controlApplied: true,

      control: {
        type: "paralisia",
        remainingBlocks: 1
      }
    },

    secondExecution: {
      kind: "control_blocked",

      attacker: "p2",
      skill: "Soco",

      blocked: true,

      control: {
        type: "paralisia",
        source: "Raio Instantâneo",
        remainingBlocks: 0
      }
    },

    hp: {
      player1: {
        user: "p1",
        current: 100,
        max: 100
      },

      player2: {
        user: "p2",
        current: 68,
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
        JSON.stringify(
          result
        ),
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


  const request =
    new Request(
      "https://marbion.test/attack?user=p2&slot=4"
    );


  const response =
    await attackRoute(
      request,
      env
    );


  const text =
    await response.text();


  console.log(
    "\n=============================="
  );

  console.log(
    "MENSAGEM DO !ATAQUE"
  );

  console.log(
    "=============================="
  );

  console.log(
    text
  );


  assert.ok(
    text.includes(
      "⚡ @p2 ficou Paralisado"
    )
  );


  assert.ok(
    text.includes(
      "perderá 1 ação(ões)"
    )
  );


  assert.ok(
    text.includes(
      "⚡ @p2 tentou usar Soco"
    )
  );


  assert.ok(
    text.includes(
      "Paralisado por Raio Instantâneo"
    )
  );


  assert.ok(
    text.includes(
      "perdeu a ação"
    )
  );


  console.log(
    "\n✅ Mensagem de aplicação da Paralisia correta."
  );

  console.log(
    "✅ Mensagem da ação bloqueada correta."
  );
}


/*
 * ==============================
 * TESTE DO !ESTADO
 * ==============================
 */
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

    hp: 68,
    maxHp: 100,

    mentalidade: 100,
    maxMentalidade: 100,

    effects: [
      {
        type: "paralisia",

        effectCategory:
          "control",

        source:
          "Raio Instantâneo",

        remainingBlocks:
          1,

        appliedAtTurn:
          1
      }
    ]
  };


  const env = {
    MARBION_USERS_V2: {
      async get() {
        return JSON.stringify(
          profile
        );
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
              JSON.stringify(
                battleState
              ),
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


  const request =
    new Request(
      "https://marbion.test/estado?user=p2"
    );


  const response =
    await estadoRoute(
      request,
      env
    );


  const text =
    await response.text();


  console.log(
    "\n=============================="
  );

  console.log(
    "MENSAGEM DO !ESTADO"
  );

  console.log(
    "=============================="
  );

  console.log(
    text
  );


  assert.ok(
    text.includes(
      "⚡ Raio Instantâneo"
    )
  );


  assert.ok(
    text.includes(
      "1 ação(ões) bloqueada(s)"
    )
  );


  console.log(
    "\n✅ Paralisia aparece corretamente no !estado."
  );
}


await testAttackMessage();

await testEstadoMessage();


console.log(
  "\n⚡ TODOS OS TESTES DE MENSAGEM DE CONTROLE PASSARAM."
);
