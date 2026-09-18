import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  addScrollToInventory,
  getScrollInventory,
  getScrollById,
  removeScrollById
} from "./src/systems/scroll-inventory.js";


const profile =
  createBaseProfile(
    "silenceworky"
  );

assert.deepEqual(
  profile.inventory,
  {
    scrolls: [],
    scrollSequence: 0
  }
);


const added =
  addScrollToInventory(
    profile,
    {
      tier: "r2",
      skill: {
        id:
          "Fogo:Chama_Rara",
        group:
          "Fogo",
        key:
          "Chama_Rara",
        nome:
          "Chama Rara",
        elemento:
          "Fogo",
        raridade:
          "Raro"
      },
      source:
        "atomic_chest",
      createdAt:
        1234
    }
  );

assert.equal(
  added.ok,
  true
);

assert.deepEqual(
  added.scroll,
  {
    id:
      "scroll:1",
    tier:
      "R2",
    skill: {
      id:
        "Fogo:Chama_Rara",
      group:
        "Fogo",
      key:
        "Chama_Rara",
      nome:
        "Chama Rara",
      elemento:
        "Fogo",
      raridade:
        "Raro"
    },
    source:
      "atomic_chest",
    createdAt:
      1234
  }
);


const second =
  addScrollToInventory(
    profile,
    {
      tier: "R1",
      skill: {
        id:
          "Luz:Clarão_Comum"
      }
    }
  );

assert.equal(
  second.ok,
  true
);

assert.equal(
  second.scroll.id,
  "scroll:2"
);


const listed =
  getScrollInventory(
    profile
  );

assert.equal(
  listed.ok,
  true
);

assert.equal(
  listed.scrolls.length,
  2
);


assert.equal(
  getScrollById(
    profile,
    "scroll:1"
  ).scroll.skill.id,
  "Fogo:Chama_Rara"
);


const removed =
  removeScrollById(
    profile,
    "scroll:1"
  );

assert.equal(
  removed.ok,
  true
);

assert.equal(
  profile.inventory.scrolls.length,
  1
);

assert.equal(
  profile.inventory.scrolls[0].id,
  "scroll:2"
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
  3,
  "campos antigos/genéricos do inventário precisam ser preservados"
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
  "✅ Inventário base de Pergaminhos validado."
);
