import assert from "node:assert/strict";
import fs from "node:fs";

import {
  applyWetEffect,
  hasWetEffect
} from "./src/systems/elemental-combos.js";

import {
  expireBattleEffects
} from "./src/systems/skill-effects.js";


const pvp =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const normalCall =
`  return executeOffensiveAction(
    attacker,
    defender,
    action,
    currentTurn
  );`;

const brokenCall =
`  return executeOffensiveAction(
    attacker,
    defender,
    action
  );`;

assert.ok(
  pvp.includes(
    normalCall
  ),
  "Ataque normal precisa propagar currentTurn ao motor de combos."
);

assert.ok(
  !pvp.includes(
    brokenCall
  ),
  "Não pode restar o caminho padrão sem currentTurn."
);


const target = {
  user: "p2",
  effects: []
};

const skill = {
  nome: "Onda Absoluto",
  elemento: "Água"
};

const wet =
  applyWetEffect(
    target,
    skill,
    1
  );

assert.equal(
  wet.expiresAtTurn,
  3,
  "Molhado aplicado no T1 por 2 turnos deve expirar no T3."
);

assert.equal(
  hasWetEffect(target),
  true
);

expireBattleEffects(
  target,
  2
);

assert.equal(
  hasWetEffect(target),
  true,
  "Molhado aplicado no T1 precisa continuar ativo no T2."
);

expireBattleEffects(
  target,
  3
);

assert.equal(
  hasWetEffect(target),
  false,
  "Molhado deve expirar ao abrir o T3 se não for consumido/renovado."
);

console.log("✅ Ataque normal propaga currentTurn.");
console.log("✅ Molhado aplicado no T1 continua ativo durante o T2.");
console.log("✅ Molhado expira corretamente ao abrir o T3.");
console.log("\n💧 TESTE DE PERSISTÊNCIA DO MOLHADO PASSOU.");