import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  addConsumableToInventory,
  getConsumableInventory,
  getConsumableById,
  removeConsumableById
} from "./src/systems/consumable-inventory.js";


const profile =
  createBaseProfile(
    "silenceworky"
  );

assert.deepEqual(
  profile.inventory.consumables,
  []
);

assert.equal(
  profile.inventory.consumableSequence,
  0
);

const first =
  addConsumableToInventory(
    profile,
    {
      key:
        "teste_consumivel",
      name:
        "Consumível de Teste",
      source:
        "atomic_chest",
      grantId:
        "atomic:test:reward:0",
      createdAt:
        1234
    }
  );

assert.equal(
  first.ok,
  true
);

assert.equal(
  first.duplicate,
  false
);

assert.equal(
  first.consumable.id,
  "consumable:1"
);

assert.equal(
  first.consumable.key,
  "teste_consumivel"
);

assert.equal(
  first.consumable.name,
  "Consumível de Teste"
);

assert.equal(
  first.consumable.source,
  "atomic_chest"
);

assert.equal(
  first.consumable.grantId,
  "atomic:test:reward:0"
);

assert.equal(
  first.consumable.createdAt,
  1234
);

assert.equal(
  profile.inventory.consumables.length,
  1
);

const duplicate =
  addConsumableToInventory(
    profile,
    {
      key:
        "outro_nome_nao_importa",
      grantId:
        "atomic:test:reward:0"
    }
  );

assert.equal(
  duplicate.ok,
  true
);

assert.equal(
  duplicate.duplicate,
  true
);

assert.equal(
  duplicate.consumable.id,
  "consumable:1"
);

assert.equal(
  profile.inventory.consumables.length,
  1
);

assert.equal(
  profile.inventory.consumableSequence,
  1
);

const second =
  addConsumableToInventory(
    profile,
    {
      key:
        "segundo_consumivel"
    }
  );

assert.equal(
  second.ok,
  true
);

assert.equal(
  second.consumable.id,
  "consumable:2"
);

assert.equal(
  getConsumableInventory(
    profile
  ).consumables.length,
  2
);

assert.equal(
  getConsumableById(
    profile,
    "consumable:2"
  ).consumable.key,
  "segundo_consumivel"
);

const removed =
  removeConsumableById(
    profile,
    "consumable:1"
  );

assert.equal(
  removed.ok,
  true
);

assert.equal(
  profile.inventory.consumables.length,
  1
);

assert.equal(
  profile.inventory.consumables[0].id,
  "consumable:2"
);


const legacy =
  ensureProfileDefaults({
    user:
      "legacy",
    inventory: {
      potionCount: 3
    }
  });

assert.equal(
  legacy.inventory.potionCount,
  3
);

assert.deepEqual(
  legacy.inventory.consumables,
  []
);

assert.equal(
  legacy.inventory.consumableSequence,
  0
);

assert.deepEqual(
  legacy.inventory.scrolls,
  []
);

assert.equal(
  legacy.inventory.scrollSequence,
  0
);


console.log(
  "✅ Inventário base de Consumíveis validado."
);
