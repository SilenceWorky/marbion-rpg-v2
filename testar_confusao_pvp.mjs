import assert from "node:assert/strict";

import {
  applyConfusionEffect,
  consumeConfusionAction
} from "./src/systems/confusion.js";


function makePlayer(
  user = "p2"
) {
  return {
    user,
    hp: 100,
    maxHp: 100,
    mentalidade: 50,
    maxMentalidade: 50,
    effects: []
  };
}


const skill = {
  nome: "Véu Ilusório Ascendente",
  debuffType: "confusao",
  debuffDuration: 2,
  confusionChance: 0.5,
  confusionSelfDamage: 10
};


/*
 * TESTE 1
 * Aplica por duas ações.
 */
{
  const player =
    makePlayer();

  const result =
    applyConfusionEffect(
      player,
      skill,
      1
    );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.remainingActions,
    2
  );

  assert.equal(
    player.effects.length,
    1
  );

  console.log(
    "✅ Confusao aplicada por 2 acoes."
  );
}


/*
 * TESTE 2
 * Roll abaixo de 50%: auto-dano e perde ação.
 */
{
  const player =
    makePlayer();

  applyConfusionEffect(
    player,
    skill,
    1
  );

  const result =
    consumeConfusionAction(
      player,
      () => 0.10
    );

  assert.equal(
    result.active,
    true
  );

  assert.equal(
    result.selfHit,
    true
  );

  assert.equal(
    result.damage,
    10
  );

  assert.equal(
    player.hp,
    90
  );

  assert.equal(
    result.remainingActions,
    1
  );

  assert.equal(
    player.effects[0].remainingActions,
    1
  );

  console.log(
    "✅ Confusao pode causar 10 de auto-dano e perder a acao."
  );
}


/*
 * TESTE 3
 * Roll acima de 50%: ação segue normalmente,
 * mas ainda consome uma das ações de Confusão.
 */
{
  const player =
    makePlayer();

  applyConfusionEffect(
    player,
    skill,
    1
  );

  const result =
    consumeConfusionAction(
      player,
      () => 0.90
    );

  assert.equal(
    result.active,
    true
  );

  assert.equal(
    result.selfHit,
    false
  );

  assert.equal(
    player.hp,
    100
  );

  assert.equal(
    result.remainingActions,
    1
  );

  console.log(
    "✅ Confusao permite a acao normalmente quando o teste e superado."
  );
}


/*
 * TESTE 4
 * Duas checagens encerram o efeito.
 */
{
  const player =
    makePlayer();

  applyConfusionEffect(
    player,
    skill,
    1
  );

  consumeConfusionAction(
    player,
    () => 0.90
  );

  const second =
    consumeConfusionAction(
      player,
      () => 0.90
    );

  assert.equal(
    second.removed,
    true
  );

  assert.equal(
    player.effects.length,
    0
  );

  console.log(
    "✅ Confusao expira depois de 2 acoes verificadas."
  );
}


/*
 * TESTE 5
 * Reaplicação renova, não acumula.
 */
{
  const player =
    makePlayer();

  applyConfusionEffect(
    player,
    skill,
    1
  );

  consumeConfusionAction(
    player,
    () => 0.90
  );

  const reapplied =
    applyConfusionEffect(
      player,
      skill,
      2
    );

  assert.equal(
    reapplied.refreshed,
    true
  );

  assert.equal(
    player.effects.length,
    1
  );

  assert.equal(
    player.effects[0].remainingActions,
    2
  );

  console.log(
    "✅ Reaplicacao renova a Confusao sem acumular efeitos duplicados."
  );
}


console.log(
  "\n😵 TODOS OS TESTES DO MOTOR DE CONFUSAO PASSARAM."
);
