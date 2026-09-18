import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  addChests,
  CHEST_TYPES,
  removeChestById
} from "./src/systems/chest-inventory.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  selectChestByGroupNumber
} from "./src/systems/chest-selection.js";


const profile =
  createBaseProfile(
    "silenceworky"
  );


addChests(
  profile,
  {
    type:
      CHEST_TYPES.ADMIN,
    quantity: 1
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.SEASONAL,
    quantity: 2
  }
);

const firstAtomic =
  createAtomicChest(
    profile,
    {
      currentAtoms: 2,
      maxAtoms: 5,
      metadata: {
        source:
          "primeiro"
      }
    }
  );

const secondAtomic =
  createAtomicChest(
    profile,
    {
      currentAtoms: 4,
      maxAtoms: 5,
      metadata: {
        source:
          "segundo"
      }
    }
  );

addChests(
  profile,
  {
    type:
      CHEST_TYPES.BOSS,
    quantity: 1
  }
);

addChests(
  profile,
  {
    type:
      CHEST_TYPES.MONSTER,
    quantity: 1
  }
);


const atomicSelection =
  selectChestByGroupNumber(
    profile,
    1
  );

assert.equal(
  atomicSelection.ok,
  true
);

assert.equal(
  atomicSelection.group.type,
  CHEST_TYPES.ATOMIC
);

assert.equal(
  atomicSelection.group.quantity,
  2
);

assert.equal(
  atomicSelection.chest.id,
  firstAtomic.chest.id,
  "o número 1 deve selecionar a primeira instância Atômica em FIFO"
);

assert.equal(
  atomicSelection.chest
    .metadata.source,
  "primeiro"
);


const seasonalSelection =
  selectChestByGroupNumber(
    profile,
    2
  );

assert.equal(
  seasonalSelection.ok,
  true
);

assert.equal(
  seasonalSelection.group.type,
  CHEST_TYPES.SEASONAL
);


const monsterSelection =
  selectChestByGroupNumber(
    profile,
    3
  );

assert.equal(
  monsterSelection.group.type,
  CHEST_TYPES.MONSTER
);


const bossSelection =
  selectChestByGroupNumber(
    profile,
    4
  );

assert.equal(
  bossSelection.group.type,
  CHEST_TYPES.BOSS
);


const adminSelection =
  selectChestByGroupNumber(
    profile,
    5
  );

assert.equal(
  adminSelection.group.type,
  CHEST_TYPES.ADMIN
);


removeChestById(
  profile,
  firstAtomic.chest.id
);

const nextAtomicSelection =
  selectChestByGroupNumber(
    profile,
    1
  );

assert.equal(
  nextAtomicSelection.ok,
  true
);

assert.equal(
  nextAtomicSelection.chest.id,
  secondAtomic.chest.id,
  "depois de consumir o primeiro, o próximo Atômico deve assumir o FIFO"
);

assert.equal(
  nextAtomicSelection.chest
    .metadata.source,
  "segundo"
);


assert.deepEqual(
  selectChestByGroupNumber(
    profile,
    0
  ),
  {
    ok: false,
    error:
      "INVALID_CHEST_SELECTION"
  }
);

assert.deepEqual(
  selectChestByGroupNumber(
    profile,
    6
  ),
  {
    ok: false,
    error:
      "CHEST_GROUP_NOT_FOUND"
  }
);


console.log(
  "✅ Seleção numérica e FIFO dos Baús validada."
);
