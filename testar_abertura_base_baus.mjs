import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  addChests,
  CHEST_TYPES
} from "./src/systems/chest-inventory.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  attemptChestOpen
} from "./src/systems/chest-open-service.js";


function sequenceRandom(
  values
) {
  let index = 0;

  return () => {
    if (
      index >=
        values.length
    ) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    const value =
      values[index];

    index += 1;

    return value;
  };
}


const profile =
  createBaseProfile(
    "silenceworky"
  );

const atomic =
  createAtomicChest(
    profile,
    {
      currentAtoms: 2
    }
  ).chest;

addChests(
  profile,
  {
    type:
      CHEST_TYPES.SEASONAL,
    quantity: 1
  }
);


const nothing =
  attemptChestOpen(
    profile,
    1,
    {
      random:
        sequenceRandom([
          0.10
        ]),
      now: 1000
    }
  );

assert.equal(
  nothing.ok,
  true
);

assert.equal(
  nothing.action,
  "nothing"
);

assert.equal(
  nothing.pending,
  false
);

assert.equal(
  atomic.metadata.atomic
    .attemptsAtLevel,
  1
);


const opens =
  attemptChestOpen(
    profile,
    1,
    {
      random:
        sequenceRandom([
          0.90,
          0.90
        ]),
      now: 2000
    }
  );

assert.equal(
  opens.ok,
  true
);

assert.equal(
  opens.action,
  "open"
);

assert.equal(
  opens.pending,
  true
);

assert.deepEqual(
  atomic.metadata.atomic
    .pendingOpen,
  {
    atoms: 2,
    attemptNumber: 2,
    scripted: false,
    createdAt: 2000
  }
);


const retryPending =
  attemptChestOpen(
    profile,
    1,
    {
      random() {
        throw new Error(
          "não deve rerrolar"
        );
      },
      now: 3000
    }
  );

assert.equal(
  retryPending.ok,
  true
);

assert.equal(
  retryPending.action,
  "open"
);

assert.equal(
  retryPending.pending,
  true
);

assert.deepEqual(
  retryPending.pendingOpen,
  {
    atoms: 2,
    attemptNumber: 2,
    scripted: false,
    createdAt: 2000
  },
  "uma abertura pendente precisa ser idempotente e não pode rerrolar"
);


const seasonal =
  attemptChestOpen(
    profile,
    2
  );

assert.equal(
  seasonal.ok,
  false
);

assert.equal(
  seasonal.error,
  "CHEST_OPEN_NOT_IMPLEMENTED"
);

assert.equal(
  seasonal.chestType,
  CHEST_TYPES.SEASONAL
);


console.log(
  "✅ Serviço base de abertura dos Baús validado."
);
