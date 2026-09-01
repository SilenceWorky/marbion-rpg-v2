import assert from "node:assert/strict";

import {
  attackRoute
} from "./src/routes/attack.js";


async function runAttackRoute(
  result
) {
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
      "https://marbion.test/attack?user=p1&slot=1"
    );


  const response =
    await attackRoute(
      request,
      env
    );


  return response.text();
}


/*
 * ==============================
 * TESTE 1
 *
 * DERROTA POR QUEIMADURA
 * ==============================
 */
{
  const text =
    await runAttackRoute({
      ok: true,
      waiting: false,

      turn: 2,

      player1: {
        user: "p1",
        skill: "Soco"
      },

      player2: {
        user: "p2",
        skill: "Soco"
      },

      firstExecution:
        null,

      secondExecution:
        null,

      hp: {
        player1: {
          user: "p1",
          current: 50,
          max: 100
        },

        player2: {
          user: "p2",
          current: 0,
          max: 100
        }
      },

      dotTicks: [
        {
          type:
            "queimadura",

          source:
            "Chama Devastadora",

          user:
            "p2",

          damage:
            9,

          hpAfter:
            0,

          maxHp:
            100,

          lethal:
            true
        }
      ],

      dotDefeats: {
        player1:
          null,

        player2: {
          user:
            "p2",

          type:
            "queimadura",

          source:
            "Chama Devastadora"
        }
      },

      battleOver:
        true,

      draw:
        false,

      winner:
        "p1",

      loser:
        "p2",

      rankedResult: {
        ok:
          false
      },

      nextTurn:
        null
    });


  console.log(
    "\nTESTE 1:"
  );

  console.log(
    text
  );


  assert.ok(
    text.includes(
      "@p2 foi derrotado por 🔥 Queimadura no início do turno."
    )
  );


  console.log(
    "✅ Derrota por Queimadura identificada."
  );
}


/*
 * ==============================
 * TESTE 2
 *
 * EMPATE:
 *
 * P1 → Veneno
 * P2 → Queimadura
 * ==============================
 */
{
  const text =
    await runAttackRoute({
      ok: true,
      waiting: false,

      turn: 4,

      player1: {
        user: "p1",
        skill: "Soco"
      },

      player2: {
        user: "p2",
        skill: "Soco"
      },

      firstExecution:
        null,

      secondExecution:
        null,

      hp: {
        player1: {
          user: "p1",
          current: 0,
          max: 100
        },

        player2: {
          user: "p2",
          current: 0,
          max: 100
        }
      },

      dotTicks: [
        {
          type:
            "veneno",

          source:
            "Nuvem Tóxica",

          user:
            "p1",

          damage:
            8,

          hpAfter:
            0,

          maxHp:
            100,

          lethal:
            true
        },

        {
          type:
            "queimadura",

          source:
            "Chama Devastadora",

          user:
            "p2",

          damage:
            9,

          hpAfter:
            0,

          maxHp:
            100,

          lethal:
            true
        }
      ],

      dotDefeats: {
        player1: {
          user:
            "p1",

          type:
            "veneno",

          source:
            "Nuvem Tóxica"
        },

        player2: {
          user:
            "p2",

          type:
            "queimadura",

          source:
            "Chama Devastadora"
        }
      },

      battleOver:
        true,

      draw:
        true,

      winner:
        null,

      loser:
        null,

      rankedResult:
        null,

      nextTurn:
        null
    });


  console.log(
    "\nTESTE 2:"
  );

  console.log(
    text
  );


  assert.ok(
    text.includes(
      "@p1 foi derrotado por ☠️ Veneno"
    )
  );


  assert.ok(
    text.includes(
      "@p2 foi derrotado por 🔥 Queimadura"
    )
  );


  assert.ok(
    text.includes(
      "O PvP terminou em empate."
    )
  );


  console.log(
    "✅ Causas diferentes no empate identificadas."
  );
}


console.log(
  "\n💀 TODOS OS TESTES DE CAUSA DE DERROTA PASSARAM."
);