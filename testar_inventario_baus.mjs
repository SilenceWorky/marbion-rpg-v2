import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  CHEST_TYPES,
  addChests,
  getChestById,
  getChestGroups,
  getFirstChestOfType,
  removeChestById
} from "./src/systems/chest-inventory.js";


const legacy =
  ensureProfileDefaults(
    {
      user:
        "legado"
    },
    "legado"
  );

assert.deepEqual(
  legacy.chests,
  []
);

assert.equal(
  legacy.chestSequence,
  0
);


const profile =
  createBaseProfile(
    "silenceworky"
  );


const atomic =
  addChests(
    profile,
    {
      type:
        CHEST_TYPES.ATOMIC,
      quantity: 3,
      metadata: {
        source:
          "season-pass"
      },
      createdAt:
        1000
    }
  );

assert.equal(
  atomic.ok,
  true
);

assert.equal(
  atomic.quantity,
  3
);

assert.equal(
  atomic.created[0].id,
  "chest:atomic:1"
);

assert.equal(
  atomic.created[1].id,
  "chest:atomic:2"
);

assert.equal(
  atomic.created[2].id,
  "chest:atomic:3"
);

assert.notEqual(
  atomic.created[0],
  atomic.created[1],
  "cada baú precisa ser uma instância distinta"
);


const seasonal =
  addChests(
    profile,
    {
      type:
        CHEST_TYPES.SEASONAL,
      quantity: 2,
      metadata: {
        seasonId:
          "2099-09"
      }
    }
  );

assert.equal(
  seasonal.ok,
  true
);


const admin =
  addChests(
    profile,
    {
      type:
        CHEST_TYPES.ADMIN,
      quantity: 1
    }
  );

assert.equal(
  admin.ok,
  true
);

assert.equal(
  profile.chestSequence,
  6
);

assert.equal(
  profile.chests.length,
  6
);


const groups =
  getChestGroups(
    profile
  );

assert.equal(
  groups.ok,
  true
);

assert.deepEqual(
  groups.groups.map(
    group => [
      group.type,
      group.quantity
    ]
  ),
  [
    [
      "atomic",
      3
    ],
    [
      "seasonal",
      2
    ],
    [
      "admin",
      1
    ]
  ]
);


const firstAtomic =
  getFirstChestOfType(
    profile,
    CHEST_TYPES.ATOMIC
  );

assert.equal(
  firstAtomic.ok,
  true
);

assert.equal(
  firstAtomic.chest.id,
  "chest:atomic:1",
  "a seleção padrão deve respeitar FIFO"
);


const exact =
  getChestById(
    profile,
    "chest:atomic:2"
  );

assert.equal(
  exact.ok,
  true
);

assert.equal(
  exact.chest.metadata.source,
  "season-pass"
);


const removed =
  removeChestById(
    profile,
    "chest:atomic:1"
  );

assert.equal(
  removed.ok,
  true
);

assert.equal(
  profile.chests.length,
  5
);

const nextAtomic =
  getFirstChestOfType(
    profile,
    CHEST_TYPES.ATOMIC
  );

assert.equal(
  nextAtomic.chest.id,
  "chest:atomic:2",
  "após consumir um baú, o próximo deve manter FIFO"
);


console.log(
  "✅ Inventário base de Baús validado."
);
