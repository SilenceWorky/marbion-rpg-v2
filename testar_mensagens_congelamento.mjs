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
      skill: "Lança Glaciar"
    },

    player2: {
      user: "p2",
      skill: "Soco"
    },

    firstExecution: {
      kind: "freeze",

      attacker: "p1",
      defender: "p2",

      skill: "Lança Glaciar",

      hit: true,
      damage: 40,

      defenderHp: 60,

      controlApplied: true,

      control: {
        type: "congelamento",
        remainingBlocks: 1
      }
    },

    secondExecution: {
      kind: "control_blocked",

      attacker: "p2",
      skill: "Soco",

      blocked: true,

      control: {
        type: "congelamento",
        source: "Lança Glaciar",
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
        current: 60,
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
      "❄️ @p2 ficou Congelado"
    )
  );


  assert.ok(
    text.includes(
      "perderá 1 ação(ões)"
    )
  );


  assert.ok(
    text.includes(
      "❄️ @p2 tentou usar Soco"
    )
  );


  assert.ok(
    text.includes(
      "Congelado por Lança Glaciar"
    )
  );


  assert.ok(
    text.includes(
      "perdeu a ação"
    )
  );


  console.log(
    "\n✅ Mensagem de aplicação do Congelamento correta."
  );

  console.log(
    "✅ Mensagem da ação congelada correta."
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

    hp: 60,
    maxHp: 100,

    mentalidade: 100,
    maxMentalidade: 100,

    effects: [
      {
        type: "congelamento",

        effectCategory:
          "control",

        source:
          "Lança Glaciar",

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
      "❄️ Lança Glaciar"
    )
  );


  assert.ok(
    text.includes(
      "1 ação(ões) bloqueada(s)"
    )
  );


  console.log(
    "\n✅ Congelamento aparece corretamente no !estado."
  );
}


await testAttackMessage();

await testEstadoMessage();


console.log(
  "\n❄️ TODOS OS TESTES DE MENSAGEM DE CONGELAMENTO PASSARAM."
);
