import assert from "node:assert/strict";

import {
  applySleepEffect,
  consumeSleepBlock,
  wakeSleepOnDirectDamage
} from "./src/systems/sleep.js";


function player(
  overrides = {}
) {
  return {
    user: "alvo",
    hp: 100,
    maxHp: 100,
    effects: [],
    ...overrides
  };
}


const sleepSkill = {
  nome: "Quebra de Consciência",
  controlType: "sono",
  controlDuration: 2,
  sleepWakeOnDirectDamage: true
};


{
  const target =
    player();

  const result =
    applySleepEffect(
      target,
      sleepSkill,
      1
    );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.remainingBlocks,
    2
  );

  assert.equal(
    target.effects.length,
    1
  );

  console.log(
    "✅ Sono aplicado por 2 ações."
  );
}


{
  const target =
    player();

  applySleepEffect(
    target,
    sleepSkill,
    1
  );

  const first =
    consumeSleepBlock(
      target
    );

  assert.equal(
    first.blocked,
    true
  );

  assert.equal(
    first.remainingBlocks,
    1
  );

  assert.equal(
    target.effects.length,
    1
  );

  const second =
    consumeSleepBlock(
      target
    );

  assert.equal(
    second.blocked,
    true
  );

  assert.equal(
    second.remainingBlocks,
    0
  );

  assert.equal(
    second.removed,
    true
  );

  assert.equal(
    target.effects.length,
    0
  );

  console.log(
    "✅ Sono bloqueia 2 ações e depois expira."
  );
}


{
  const target =
    player();

  applySleepEffect(
    target,
    sleepSkill,
    1
  );

  const wake =
    wakeSleepOnDirectDamage(
      target,
      12
    );

  assert.equal(
    wake.woke,
    true
  );

  assert.equal(
    target.effects.length,
    0
  );

  const action =
    consumeSleepBlock(
      target
    );

  assert.equal(
    action.blocked,
    false
  );

  console.log(
    "✅ Dano direto acorda o alvo imediatamente."
  );
}


{
  const target =
    player();

  applySleepEffect(
    target,
    sleepSkill,
    1
  );

  const wake =
    wakeSleepOnDirectDamage(
      target,
      0
    );

  assert.equal(
    wake.woke,
    false
  );

  assert.equal(
    target.effects.length,
    1
  );

  console.log(
    "✅ Dano zero não acorda o alvo."
  );
}


{
  const target =
    player();

  applySleepEffect(
    target,
    sleepSkill,
    1
  );

  consumeSleepBlock(
    target
  );

  const refreshed =
    applySleepEffect(
      target,
      sleepSkill,
      2
    );

  assert.equal(
    refreshed.refreshed,
    true
  );

  assert.equal(
    refreshed.remainingBlocks,
    2
  );

  assert.equal(
    target.effects.length,
    1
  );

  console.log(
    "✅ Reaplicação renova o Sono sem acumular efeitos duplicados."
  );
}


console.log(
  "\n💤 TODOS OS TESTES DO MOTOR DE SONO PASSARAM."
);
