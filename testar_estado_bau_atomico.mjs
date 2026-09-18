import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest,
  createAtomicChestState,
  getAtomicChestState
} from "./src/systems/atomic-chest-state.js";


const base =
  createAtomicChestState();

assert.equal(
  base.ok,
  true
);

assert.deepEqual(
  base.state,
  {
    currentAtoms: 1,
    maxAtoms: 5,
    minimumOpenAtoms: 1,
    attemptsAtLevel: 0,
    scriptedSteps: [],
    scriptIndex: 0
  }
);


const locked =
  createAtomicChestState({
    currentAtoms: 3,
    maxAtoms: 5,
    minimumOpenAtoms: 3
  });

assert.equal(
  locked.ok,
  true
);

assert.equal(
  locked.state.currentAtoms,
  3
);

assert.equal(
  locked.state.minimumOpenAtoms,
  3
);


const scripted =
  createAtomicChestState({
    currentAtoms: 1,
    maxAtoms: 5,
    minimumOpenAtoms: 1,
    scriptedSteps: [
      "evolve",
      "evolve",
      "open"
    ]
  });

assert.equal(
  scripted.ok,
  true
);

assert.deepEqual(
  scripted.state.scriptedSteps,
  [
    "evolve",
    "evolve",
    "open"
  ]
);


const impossible =
  createAtomicChestState({
    currentAtoms: 4,
    maxAtoms: 3
  });

assert.equal(
  impossible.ok,
  false
);

assert.equal(
  impossible.error,
  "ATOMIC_CURRENT_EXCEEDS_MAX"
);


const profile =
  createBaseProfile(
    "silenceworky"
  );

const first =
  createAtomicChest(
    profile,
    {
      currentAtoms: 2,
      maxAtoms: 5,
      minimumOpenAtoms: 2,
      metadata: {
        source:
          "season-pass"
      }
    }
  );

const second =
  createAtomicChest(
    profile,
    {
      currentAtoms: 2,
      maxAtoms: 3,
      minimumOpenAtoms: 2
    }
  );

assert.equal(
  first.ok,
  true
);

assert.equal(
  second.ok,
  true
);

assert.equal(
  profile.chests.length,
  2
);

assert.notEqual(
  first.chest.id,
  second.chest.id
);

assert.notEqual(
  first.atomic,
  second.atomic,
  "cada Baú Atômico precisa possuir estado interno independente"
);

assert.equal(
  first.chest.metadata.source,
  "season-pass"
);

assert.equal(
  first.atomic.maxAtoms,
  5
);

assert.equal(
  second.atomic.maxAtoms,
  3
);


first.atomic.attemptsAtLevel =
  2;

assert.equal(
  second.atomic.attemptsAtLevel,
  0,
  "alterar um Baú Atômico não pode alterar outro"
);


const read =
  getAtomicChestState(
    first.chest
  );

assert.equal(
  read.ok,
  true
);

assert.equal(
  read.state.currentAtoms,
  2
);

assert.equal(
  read.state.attemptsAtLevel,
  2
);


console.log(
  "✅ Estado interno base do Baú Atômico validado."
);
