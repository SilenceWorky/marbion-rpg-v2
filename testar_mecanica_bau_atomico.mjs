import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  resolveAtomicChestAttempt
} from "./src/systems/atomic-chest-mechanic.js";


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


const failProfile =
  createBaseProfile(
    "falha"
  );

const failChest =
  createAtomicChest(
    failProfile
  ).chest;


const failOne =
  resolveAtomicChestAttempt(
    failChest,
    {
      random:
        sequenceRandom([
          0.10
        ])
    }
  );

assert.equal(
  failOne.action,
  "nothing"
);

assert.equal(
  failOne.attemptNumber,
  1
);

assert.equal(
  failChest.metadata.atomic
    .attemptsAtLevel,
  1
);


const failTwo =
  resolveAtomicChestAttempt(
    failChest,
    {
      random:
        sequenceRandom([
          0.20
        ])
    }
  );

assert.equal(
  failTwo.action,
  "nothing"
);

assert.equal(
  failTwo.attemptNumber,
  2
);


const thirdGuaranteed =
  resolveAtomicChestAttempt(
    failChest,
    {
      random:
        sequenceRandom([
          0.20
        ])
    }
  );

assert.equal(
  thirdGuaranteed.attemptNumber,
  3
);

assert.notEqual(
  thirdGuaranteed.action,
  "nothing",
  "a terceira tentativa nunca pode falhar"
);

assert.equal(
  thirdGuaranteed.action,
  "evolve",
  "em ⚛, roll 0.20 deve cair nos 50% de evolução"
);

assert.equal(
  failChest.metadata.atomic
    .currentAtoms,
  2
);

assert.equal(
  failChest.metadata.atomic
    .attemptsAtLevel,
  0,
  "evoluir deve reiniciar as tentativas do novo nível"
);


const openProfile =
  createBaseProfile(
    "abre"
  );

const openChest =
  createAtomicChest(
    openProfile,
    {
      currentAtoms: 2
    }
  ).chest;

const opens =
  resolveAtomicChestAttempt(
    openChest,
    {
      random:
        sequenceRandom([
          0.90,
          0.90
        ])
    }
  );

assert.equal(
  opens.action,
  "open",
  "após escapar dos 35%, roll 0.90 não evolui ⚛⚛"
);

assert.equal(
  opens.currentAtoms,
  2
);


const evolveProfile =
  createBaseProfile(
    "evolui"
  );

const evolveChest =
  createAtomicChest(
    evolveProfile,
    {
      currentAtoms: 3
    }
  ).chest;

const evolves =
  resolveAtomicChestAttempt(
    evolveChest,
    {
      random:
        sequenceRandom([
          0.90,
          0.05
        ])
    }
  );

assert.equal(
  evolves.action,
  "evolve"
);

assert.equal(
  evolves.fromAtoms,
  3
);

assert.equal(
  evolves.currentAtoms,
  4,
  "⚛⚛⚛ usa 10% de evolução"
);


const maxProfile =
  createBaseProfile(
    "maximo"
  );

const maxChest =
  createAtomicChest(
    maxProfile,
    {
      currentAtoms: 5,
      maxAtoms: 5,
      minimumOpenAtoms: 1
    }
  ).chest;

const maxOpen =
  resolveAtomicChestAttempt(
    maxChest,
    {
      random:
        sequenceRandom([
          0.90
        ])
    }
  );

assert.equal(
  maxOpen.action,
  "open",
  "⚛⚛⚛⚛⚛ não pode evoluir além do máximo"
);


const lockedProfile =
  createBaseProfile(
    "travado"
  );

const lockedChest =
  createAtomicChest(
    lockedProfile,
    {
      currentAtoms: 2,
      minimumOpenAtoms: 3
    }
  ).chest;

const lockedResult =
  resolveAtomicChestAttempt(
    lockedChest,
    {
      random:
        sequenceRandom([
          0.90
        ])
    }
  );

assert.equal(
  lockedResult.action,
  "evolve"
);

assert.equal(
  lockedResult.forced,
  true
);

assert.equal(
  lockedResult.currentAtoms,
  3,
  "bloqueio interno impede abertura abaixo do piso"
);


const scriptedProfile =
  createBaseProfile(
    "roteiro"
  );

const scriptedChest =
  createAtomicChest(
    scriptedProfile,
    {
      scriptedSteps: [
        "evolve",
        "evolve",
        "open"
      ]
    }
  ).chest;

const scriptedOne =
  resolveAtomicChestAttempt(
    scriptedChest,
    {
      random:
        sequenceRandom([])
    }
  );

const scriptedTwo =
  resolveAtomicChestAttempt(
    scriptedChest,
    {
      random:
        sequenceRandom([])
    }
  );

const scriptedThree =
  resolveAtomicChestAttempt(
    scriptedChest,
    {
      random:
        sequenceRandom([])
    }
  );

assert.deepEqual(
  [
    scriptedOne.action,
    scriptedTwo.action,
    scriptedThree.action
  ],
  [
    "evolve",
    "evolve",
    "open"
  ]
);

assert.equal(
  scriptedChest.metadata.atomic
    .scriptIndex,
  3
);


const invalidScriptProfile =
  createBaseProfile(
    "script-invalido"
  );

const invalidScriptChest =
  createAtomicChest(
    invalidScriptProfile,
    {
      currentAtoms: 5,
      maxAtoms: 5,
      scriptedSteps: [
        "evolve"
      ]
    }
  ).chest;

const invalidScriptResult =
  resolveAtomicChestAttempt(
    invalidScriptChest,
    {
      random:
        sequenceRandom([])
    }
  );

assert.equal(
  invalidScriptResult.ok,
  false
);

assert.equal(
  invalidScriptResult.error,
  "ATOMIC_SCRIPT_EVOLVE_AT_MAX"
);

assert.equal(
  invalidScriptChest.metadata.atomic
    .scriptIndex,
  0,
  "um passo de roteiro impossível não pode ser consumido"
);


console.log(
  "✅ Mecânica de tentativas e evolução do Baú Atômico validada."
);
