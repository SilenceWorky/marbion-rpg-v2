import assert from "node:assert/strict";

import {
  attackRoute
} from "./src/routes/attack.js";

import {
  estadoRoute
} from "./src/routes/estado.js";


async function testApplicationAndBlockedMessage() {
  const result = {
    ok: true,
    waiting: false,
    turn: 1,
    player1: {
      user: "p1",
      skill: "Acorde Ascendente"
    },
    player2: {
      user: "p2",
      skill: "Labareda Ascendente"
    },
    firstExecution: {
      kind: "silence",
      attacker: "p1",
      defender: "p2",
      skill: "Acorde Ascendente",
      hit: true,
      damage: 10,
      defenderHp: 90,
      silenceApplied: true,
      silence: {
        type: "silencio",
        duration: 2,
        expiresAtTurn: 3
      }
    },
    secondExecution: {
      kind: "silence_blocked",
      attacker: "p2",
      skill: "Labareda Ascendente",
      blocked: true,
      silence: {
        type: "silencio",
        source: "Acorde Ascendente"
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
        "https://marbion.test/attack?user=p2&slot=1"
      ),
      env
    );

  const text =
    await response.text();

  assert.ok(
    text.includes(
      "🤐 @p2 ficou Silenciado"
    )
  );

  assert.ok(
    text.includes(
      "apenas habilidades Físicas e Meditação"
    )
  );

  assert.ok(
    text.includes(
      "Labareda Ascendente"
    )
  );

  assert.ok(
    text.includes(
      "não conseguiu usar a habilidade por causa do Silêncio"
    )
  );

  console.log(text);
  console.log(
    "✅ Mensagens de aplicação e bloqueio do Silêncio corretas."
  );
}


async function testSelectionErrorMessage() {
  const coordinator = {
    async fetch() {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "SILENCED_SKILL",
          source: "Acorde Ascendente",
          skill: "Labareda Ascendente"
        }),
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
        "https://marbion.test/attack?user=p2&slot=1"
      ),
      env
    );

  const text =
    await response.text();

  assert.ok(
    text.includes(
      "está Silenciado"
    )
  );

  assert.ok(
    text.includes(
      "Soco"
    )
  );

  assert.ok(
    text.includes(
      "Física"
    )
  );

  console.log(text);
  console.log(
    "✅ Mensagem de seleção bloqueada por Silêncio correta."
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
        type: "silencio",
        effectCategory: "restriction",
        restriction: "physical_only",
        source: "Acorde Ascendente",
        appliedAtTurn: 1,
        expiresAtTurn: 4
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

  const text =
    await response.text();

  assert.ok(
    text.includes(
      "🤐 Acorde Ascendente"
    )
  );

  assert.ok(
    text.includes(
      "Silêncio"
    )
  );

  assert.ok(
    text.includes(
      "(2T)"
    )
  );

  console.log(text);
  console.log(
    "✅ Silêncio aparece corretamente no !estado."
  );
}


await testApplicationAndBlockedMessage();
await testSelectionErrorMessage();
await testEstadoMessage();

console.log(
  "\n🤐 TODOS OS TESTES DE MENSAGEM DO SILÊNCIO PASSARAM."
);
