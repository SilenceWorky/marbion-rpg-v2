import assert from "node:assert/strict";

import {
  applyControlEffect,
  consumeControlBlock
} from "./src/systems/skill-effects.js";


function makePlayer() {
  return {
    user: "p2",
    effects: []
  };
}


/*
 * TESTE 1
 * Aplicação simples
 */
{
  const player =
    makePlayer();


  const result =
    applyControlEffect(
      player,
      {
        nome:
          "Choque Paralisante"
      },
      1,
      {
        effectType:
          "paralisia",

        resultKind:
          "paralysis",

        duration:
          1
      }
    );


  assert.equal(
    result.ok,
    true
  );


  assert.equal(
    player.effects.length,
    1
  );


  assert.equal(
    player.effects[0].type,
    "paralisia"
  );


  assert.equal(
    player.effects[0].remainingBlocks,
    1
  );


  console.log(
    "✅ TESTE 1 — Controle aplicado."
  );
}


/*
 * TESTE 2
 * Controle bloqueia exatamente
 * uma ação e desaparece.
 */
{
  const player =
    makePlayer();


  applyControlEffect(
    player,
    {
      nome:
        "Choque Paralisante"
    },
    1,
    {
      effectType:
        "paralisia",

      resultKind:
        "paralysis",

      duration:
        1
    }
  );


  const blocked =
    consumeControlBlock(
      player
    );


  assert.equal(
    blocked.blocked,
    true
  );


  assert.equal(
    blocked.control.type,
    "paralisia"
  );


  assert.equal(
    blocked.control.remainingBlocks,
    0
  );


  assert.equal(
    player.effects.length,
    0
  );


  /*
   * Próxima ação deve funcionar.
   */
  const next =
    consumeControlBlock(
      player
    );


  assert.equal(
    next.blocked,
    false
  );


  console.log(
    "✅ TESTE 2 — Uma ação bloqueada e efeito removido."
  );
}


/*
 * TESTE 3
 * Controle de duração 2.
 */
{
  const player =
    makePlayer();


  applyControlEffect(
    player,
    {
      nome:
        "Congelamento Profundo"
    },
    1,
    {
      effectType:
        "congelamento",

      resultKind:
        "freeze",

      duration:
        2
    }
  );


  const first =
    consumeControlBlock(
      player
    );


  assert.equal(
    first.blocked,
    true
  );


  assert.equal(
    first.control.remainingBlocks,
    1
  );


  assert.equal(
    player.effects.length,
    1
  );


  const second =
    consumeControlBlock(
      player
    );


  assert.equal(
    second.blocked,
    true
  );


  assert.equal(
    second.control.remainingBlocks,
    0
  );


  assert.equal(
    player.effects.length,
    0
  );


  console.log(
    "✅ TESTE 3 — Controle pode bloquear múltiplas ações."
  );
}


/*
 * TESTE 4
 * Reaplicação não duplica
 * o mesmo Controle.
 */
{
  const player =
    makePlayer();


  applyControlEffect(
    player,
    {
      nome:
        "Choque 1"
    },
    1,
    {
      effectType:
        "paralisia",

      duration:
        1
    }
  );


  const refreshed =
    applyControlEffect(
      player,
      {
        nome:
          "Choque 2"
      },
      2,
      {
        effectType:
          "paralisia",

        duration:
          2
      }
    );


  assert.equal(
    refreshed.refreshed,
    true
  );


  assert.equal(
    player.effects.length,
    1
  );


  assert.equal(
    player.effects[0].remainingBlocks,
    2
  );


  assert.equal(
    player.effects[0].source,
    "Choque 2"
  );


  console.log(
    "✅ TESTE 4 — Reaplicação renova o Controle."
  );
}


/*
 * TESTE 5
 * Controles diferentes podem
 * coexistir estruturalmente.
 */
{
  const player =
    makePlayer();


  applyControlEffect(
    player,
    {
      nome:
        "Choque"
    },
    1,
    {
      effectType:
        "paralisia",

      duration:
        1
    }
  );


  applyControlEffect(
    player,
    {
      nome:
        "Gelo"
    },
    1,
    {
      effectType:
        "congelamento",

      duration:
        1
    }
  );


  assert.equal(
    player.effects.length,
    2
  );


  console.log(
    "✅ TESTE 5 — Controles diferentes coexistem."
  );
}


console.log(
  "\n🧠 TODOS OS TESTES DO MOTOR DE CONTROLE PASSARAM."
);