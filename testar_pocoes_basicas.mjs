import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  listConsumableDefinitions
} from "./src/systems/consumable-catalog.js";

import {
  addConsumableToInventory
} from "./src/systems/consumable-inventory.js";

import {
  useConsumable
} from "./src/systems/consumable-use.js";


const definitions =
  listConsumableDefinitions();

assert.equal(
  definitions.length,
  8
);

const byKey =
  Object.fromEntries(
    definitions.map(
      entry => [
        entry.key,
        entry
      ]
    )
  );

assert.equal(
  byKey.vida_simples
    .restorePercent,
  0.30
);

assert.equal(
  byKey.vida_comum
    .restorePercent,
  0.50
);

assert.equal(
  byKey.vida_melhorada
    .restorePercent,
  0.80
);

assert.equal(
  byKey.vida_especial
    .restorePercent,
  1.00
);

assert.equal(
  byKey.mentalidade_simples
    .restorePercent,
  0.30
);

assert.equal(
  byKey.mentalidade_comum
    .restorePercent,
  0.50
);

assert.equal(
  byKey.mentalidade_melhorada
    .restorePercent,
  0.80
);

assert.equal(
  byKey.mentalidade_especial
    .restorePercent,
  1.00
);

assert.equal(
  byKey.vida_especial
    .price.platinum,
  5
);

assert.equal(
  byKey.mentalidade_especial
    .price.platinum,
  5
);

const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.maxHp = 300;
profile.hp = 42;

const life =
  addConsumableToInventory(
    profile,
    {
      key:
        "vida_simples",
      name:
        "Poção de Vida Simples"
    }
  );

assert.equal(
  life.ok,
  true
);

const usedLife =
  useConsumable(
    profile,
    life.consumable.id,
    {
      inCombat: true
    }
  );

assert.equal(
  usedLife.ok,
  true
);

assert.equal(
  usedLife.before,
  42
);

assert.equal(
  usedLife.restored,
  90
);

assert.equal(
  usedLife.after,
  132
);

assert.equal(
  usedLife.consumesTurn,
  true
);

assert.equal(
  profile.inventory
    .consumables.length,
  0,
  "usar a Poção deve remover uma unidade"
);

profile.maxMentalidade = 50;
profile.mentalidade = 10;

const mind =
  addConsumableToInventory(
    profile,
    {
      key:
        "mentalidade_melhorada",
      name:
        "Poção de Mentalidade Melhorada"
    }
  );

const usedMind =
  useConsumable(
    profile,
    mind.consumable.id
  );

assert.equal(
  usedMind.ok,
  true
);

assert.equal(
  usedMind.restored,
  40
);

assert.equal(
  usedMind.after,
  50
);

assert.equal(
  usedMind.consumesTurn,
  false
);

profile.hp = 85;
profile.maxHp = 100;

const special =
  addConsumableToInventory(
    profile,
    {
      key:
        "vida_especial",
      name:
        "Poção de Vida Especial"
    }
  );

const usedSpecial =
  useConsumable(
    profile,
    special.consumable.id,
    {
      inCombat: true
    }
  );

assert.equal(
  usedSpecial.ok,
  true
);

assert.equal(
  usedSpecial.after,
  100
);

assert.equal(
  usedSpecial.restored,
  15
);

const atFull =
  addConsumableToInventory(
    profile,
    {
      key:
        "vida_comum",
      name:
        "Poção de Vida Comum"
    }
  );

const blockedAtFull =
  useConsumable(
    profile,
    atFull.consumable.id
  );

assert.equal(
  blockedAtFull.ok,
  false
);

assert.equal(
  blockedAtFull.error,
  "RESOURCE_ALREADY_FULL"
);

assert.equal(
  profile.inventory
    .consumables.length,
  1,
  "recurso cheio não deve gastar a Poção"
);

console.log(
  "✅ Poções básicas de Vida e Mentalidade validadas."
);
