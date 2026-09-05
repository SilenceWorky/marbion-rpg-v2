import assert from "node:assert/strict";

import {
  ELECTROCUTION_BONUS_MULTIPLIER,
  WET_DURATION,
  applyWetEffect,
  calculateElectrocutionBonus,
  hasWetEffect,
  resolveElementalCombo
} from "./src/systems/elemental-combos.js";

import {
  expireBattleEffects
} from "./src/systems/skill-effects.js";


console.log("=== COMBOS ELEMENTAIS V1 ===");

assert.equal(
  WET_DURATION,
  2
);

assert.equal(
  ELECTROCUTION_BONUS_MULTIPLIER,
  0.25
);


const waterSkill = {
  nome: "Jato de Água",
  elemento: "Água"
};

const electricSkill = {
  nome: "Raio",
  elemento: "Eletricidade"
};

const fireSkill = {
  nome: "Chama",
  elemento: "Fogo"
};


const target = {
  user: "alvo",
  effects: []
};


const wet =
  applyWetEffect(
    target,
    waterSkill,
    3
  );

assert.equal(
  wet.ok,
  true
);

assert.equal(
  wet.refreshed,
  false
);

assert.equal(
  wet.expiresAtTurn,
  5
);

assert.equal(
  hasWetEffect(target),
  true
);

assert.equal(
  target.effects.length,
  1
);

console.log("✅ Água aplica Molhado por 2 turnos.");


const refreshed =
  applyWetEffect(
    target,
    {
      nome: "Maré",
      elemento: "Água"
    },
    4
  );

assert.equal(
  refreshed.refreshed,
  true
);

assert.equal(
  refreshed.expiresAtTurn,
  6
);

assert.equal(
  target.effects.length,
  1
);

console.log("✅ Reaplicar Água renova Molhado sem duplicar o efeito.");


expireBattleEffects(
  target,
  5
);

assert.equal(
  hasWetEffect(target),
  true
);

expireBattleEffects(
  target,
  6
);

assert.equal(
  hasWetEffect(target),
  false
);

console.log("✅ Molhado expira pelo motor normal de efeitos.");


assert.equal(
  calculateElectrocutionBonus(40),
  10
);

assert.equal(
  calculateElectrocutionBonus(1),
  1
);

assert.equal(
  calculateElectrocutionBonus(0),
  0
);


applyWetEffect(
  target,
  waterSkill,
  7
);

const electrocution =
  resolveElementalCombo(
    target,
    electricSkill,
    7,
    40
  );

assert.equal(
  electrocution.type,
  "eletrocussao"
);

assert.equal(
  electrocution.bonusDamage,
  10
);

assert.equal(
  electrocution.directDamageBeforeCombo,
  40
);

assert.equal(
  electrocution.directDamageAfterCombo,
  50
);

assert.equal(
  electrocution.consumedWet,
  true
);

assert.equal(
  hasWetEffect(target),
  false
);

console.log("✅ Eletricidade em Molhado ativa Eletrocussão: +25% e consome Molhado.");


applyWetEffect(
  target,
  waterSkill,
  8
);

const evaporation =
  resolveElementalCombo(
    target,
    fireSkill,
    8,
    40
  );

assert.equal(
  evaporation.type,
  "evaporacao"
);

assert.equal(
  evaporation.bonusDamage,
  0
);

assert.equal(
  evaporation.directDamageAfterCombo,
  40
);

assert.equal(
  evaporation.consumedWet,
  true
);

assert.equal(
  hasWetEffect(target),
  false
);

console.log("✅ Fogo em Molhado causa Evaporação e consome Molhado sem bônus na V1.");


const noWetElectricity =
  resolveElementalCombo(
    target,
    electricSkill,
    9,
    40
  );

assert.equal(
  noWetElectricity,
  null
);


const waterCombo =
  resolveElementalCombo(
    target,
    waterSkill,
    9,
    35
  );

assert.equal(
  waterCombo.type,
  "molhado"
);

assert.equal(
  waterCombo.bonusDamage,
  0
);

assert.equal(
  waterCombo.directDamageAfterCombo,
  35
);

assert.equal(
  hasWetEffect(target),
  true
);

console.log("✅ Água registra Molhado sem alterar o dano direto.");


const neutral =
  resolveElementalCombo(
    target,
    {
      nome: "Soco",
      elemento: "Universal"
    },
    9,
    12
  );

assert.equal(
  neutral,
  null
);

console.log("✅ Universal/Neutro não acionam combos elementais.");

console.log("\n💧⚡ TODOS OS TESTES DE COMBOS ELEMENTAIS PASSARAM.");
