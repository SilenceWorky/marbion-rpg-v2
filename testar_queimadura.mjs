import assert from "node:assert/strict";

import {
  applyBurnEffect,
  processBurnEffects,
  applyPoisonEffect,
  processPoisonEffects
} from "./src/systems/skill-effects.js";


function makeTarget(
  hp = 100
) {
  return {
    user: "p2",
    hp,
    maxHp: 100,
    effects: []
  };
}


const burnSkill = {
  nome: "Chama Devastadora",
  custoMentalidade: 20
};


/*
 * ==================================
 * TESTE 1
 *
 * APLICAÇÃO + 2 TICKS EXATOS
 * ==================================
 */
{
  const target =
    makeTarget();


  const applied =
    applyBurnEffect(
      target,
      burnSkill,
      1
    );


  assert.equal(
    applied.ok,
    true
  );

  assert.equal(
    applied.damagePerTurn,
    9
  );

  assert.equal(
    applied.duration,
    2
  );

  assert.equal(
    applied.nextTickTurn,
    2
  );


  /*
   * Mesmo turno:
   * não pode causar dano.
   */
  const turn1 =
    processBurnEffects(
      target,
      1
    );


  assert.equal(
    turn1.ticks.length,
    0
  );

  assert.equal(
    target.hp,
    100
  );


  /*
   * Primeiro tick.
   */
  const turn2 =
    processBurnEffects(
      target,
      2
    );


  assert.equal(
    turn2.ticks.length,
    1
  );

  assert.equal(
    turn2.ticks[0].damage,
    9
  );

  assert.equal(
    turn2.ticks[0].remainingTicks,
    1
  );

  assert.equal(
    target.hp,
    91
  );


  /*
   * Segundo e último tick.
   */
  const turn3 =
    processBurnEffects(
      target,
      3
    );


  assert.equal(
    turn3.ticks.length,
    1
  );

  assert.equal(
    turn3.ticks[0].damage,
    9
  );

  assert.equal(
    turn3.ticks[0].remainingTicks,
    0
  );

  assert.equal(
    target.hp,
    82
  );


  /*
   * Queimadura deve ter sumido.
   */
  assert.equal(
    target.effects.some(
      effect =>
        effect.type ===
        "queimadura"
    ),
    false
  );


  const turn4 =
    processBurnEffects(
      target,
      4
    );


  assert.equal(
    turn4.ticks.length,
    0
  );


  console.log(
    "✅ TESTE 1 — Queimadura causa exatamente 2 ticks."
  );
}


/*
 * ==================================
 * TESTE 2
 *
 * REAPLICAÇÃO
 *
 * - renova duração
 * - mantém a mais forte
 * ==================================
 */
{
  const target =
    makeTarget();


  const strongSkill = {
    nome:
      "Chama Forte",

    custoMentalidade:
      20
  };


  const weakSkill = {
    nome:
      "Chama Fraca",

    custoMentalidade:
      10
  };


  const strongerSkill = {
    nome:
      "Inferno",

    custoMentalidade:
      30
  };


  applyBurnEffect(
    target,
    strongSkill,
    1
  );


  /*
   * 20 × 0.45 = 9
   */
  let burn =
    target.effects.find(
      effect =>
        effect.type ===
        "queimadura"
    );


  assert.equal(
    burn.damagePerTurn,
    9
  );


  /*
   * Reaplica uma queimadura mais fraca.
   * Deve continuar com 9.
   */
  const refreshedWeak =
    applyBurnEffect(
      target,
      weakSkill,
      2
    );


  assert.equal(
    refreshedWeak.refreshed,
    true
  );

  assert.equal(
    refreshedWeak.damagePerTurn,
    9
  );

  assert.equal(
    refreshedWeak.duration,
    2
  );

  assert.equal(
    refreshedWeak.nextTickTurn,
    3
  );


  /*
   * Agora aplica uma mais forte.
   *
   * 30 × 0.45 = 13.5
   * Math.round = 14
   */
  const refreshedStrong =
    applyBurnEffect(
      target,
      strongerSkill,
      2
    );


  assert.equal(
    refreshedStrong.damagePerTurn,
    14
  );

  assert.equal(
    refreshedStrong.duration,
    2
  );

  assert.equal(
    refreshedStrong.nextTickTurn,
    3
  );


  burn =
    target.effects.find(
      effect =>
        effect.type ===
        "queimadura"
    );


  assert.equal(
    burn.remainingTicks,
    2
  );

  assert.equal(
    burn.damagePerTurn,
    14
  );


  console.log(
    "✅ TESTE 2 — Reaplicação renova e mantém a Queimadura mais forte."
  );
}


/*
 * ==================================
 * TESTE 3
 *
 * VENENO + QUEIMADURA
 *
 * Devem coexistir.
 * ==================================
 */
{
  const target =
    makeTarget();


  const poisonSkill = {
    nome:
      "Nuvem Tóxica",

    custoMentalidade:
      20
  };


  applyPoisonEffect(
    target,
    poisonSkill,
    1
  );


  applyBurnEffect(
    target,
    burnSkill,
    1
  );


  assert.equal(
    target.effects.some(
      effect =>
        effect.type ===
        "veneno"
    ),
    true
  );

  assert.equal(
    target.effects.some(
      effect =>
        effect.type ===
        "queimadura"
    ),
    true
  );


  /*
   * Queimadura:
   * 20 × 0.45 = 9
   */
  const burnTick =
    processBurnEffects(
      target,
      2
    );


  assert.equal(
    burnTick.ticks[0].damage,
    9
  );

  assert.equal(
    target.hp,
    91
  );


  /*
   * Veneno:
   * 20 × 0.35 = 7
   */
  const poisonTick =
    processPoisonEffects(
      target,
      2
    );


  assert.equal(
    poisonTick.ticks[0].damage,
    7
  );

  assert.equal(
    target.hp,
    84
  );


  assert.equal(
    target.effects.some(
      effect =>
        effect.type ===
        "veneno"
    ),
    true
  );

  assert.equal(
    target.effects.some(
      effect =>
        effect.type ===
        "queimadura"
    ),
    true
  );


  console.log(
    "✅ TESTE 3 — Veneno e Queimadura coexistem."
  );
}


/*
 * ==================================
 * TESTE 4
 *
 * MORTE POR QUEIMADURA
 * ==================================
 */
{
  const target =
    makeTarget(
      8
    );


  applyBurnEffect(
    target,
    burnSkill,
    1
  );


  const result =
    processBurnEffects(
      target,
      2
    );


  /*
   * O dano teórico é 9,
   * mas só existem 8 HP.
   *
   * O dano REAL registrado
   * precisa ser 8.
   */
  assert.equal(
    result.ticks[0].damage,
    8
  );

  assert.equal(
    result.ticks[0].hpAfter,
    0
  );

  assert.equal(
    target.hp,
    0
  );

  assert.equal(
    result.killed,
    true
  );

  assert.equal(
    result.ticks[0].lethal,
    true
  );


  assert.deepEqual(
    result.killedBy,
    {
      type:
        "queimadura",

      source:
        "Chama Devastadora"
    }
  );


  console.log(
    "✅ TESTE 4 — Queimadura pode matar corretamente."
  );
}


console.log(
  "\n🔥 TODOS OS TESTES DE QUEIMADURA PASSARAM."
);