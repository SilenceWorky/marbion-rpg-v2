import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  finalizeAtomicChestOpen
} from "./src/systems/atomic-chest-finalizer.js";


function makeChest(
  profile,
  rewards,
  appliedRewardIndexes
) {
  return createAtomicChest(
    profile,
    {
      currentAtoms: 2,
      pendingOpen: {
        atoms: 2,
        attemptNumber: 1,
        scripted: false,
        createdAt: 1234,
        rewardPlan: {
          atoms: 2,
          rewards,
          hasUnresolvedRewards:
            rewards.some(
              reward =>
                reward?.resolved !== true
            ),
          appliedRewardIndexes
        }
      }
    }
  );
}


const profile =
  createBaseProfile(
    "silenceworky"
  );

const unresolved =
  makeChest(
    profile,
    [
      {
        type: "normal_xp",
        resolved: true,
        amount: 10
      },
      {
        type: "scroll",
        resolved: false,
        rarity: "R1"
      }
    ],
    [0]
  );

assert.equal(
  unresolved.ok,
  true
);

const blockedUnresolved =
  finalizeAtomicChestOpen(
    profile,
    unresolved.chest.id
  );
assert.equal(
  blockedUnresolved.ok,
  false
);

assert.equal(
  blockedUnresolved.error,
  "ATOMIC_CHEST_REWARDS_UNRESOLVED"
);

assert.deepEqual(
  blockedUnresolved
    .unresolvedIndexes,
  [1]
);

assert.equal(
  profile.chests.some(
    chest =>
      chest.id ===
      unresolved.chest.id
  ),
  true,
  "baú com recompensa não resolvida não pode ser removido"
);


const unapplied =
  makeChest(
    profile,
    [
      {
        type: "normal_xp",
        resolved: true,
        amount: 10
      }
    ],
    []
  );
const blockedUnapplied =
  finalizeAtomicChestOpen(
    profile,
    unapplied.chest.id
  );

assert.equal(
  blockedUnapplied.ok,
  false
);

assert.equal(
  blockedUnapplied.error,
  "ATOMIC_CHEST_REWARDS_UNAPPLIED"
);

assert.deepEqual(
  blockedUnapplied
    .unappliedIndexes,
  [0]
);

assert.equal(
  profile.chests.some(
    chest =>
      chest.id ===
      unapplied.chest.id
  ),
  true,
  "baú com recompensa não aplicada não pode ser removido"
);


const complete =
  makeChest(
    profile,
    [
      {
        type: "normal_xp",
        resolved: true,
        amount: 10
      },
      {
        type: "money",
        resolved: true,
        money: {
          bronze: 5,
          silver: 0,
          gold: 0,
          platinum: 0
        }
      }
    ],
    [0, 1]
  );

const beforeCount =
  profile.chests.length;

const finalized =
  finalizeAtomicChestOpen(
    profile,
    complete.chest.id
  );

assert.equal(
  finalized.ok,
  true
);

assert.equal(
  finalized.finalized,
  true
);

assert.equal(
  finalized.snapshot.chestId,
  complete.chest.id
);
assert.equal(
  finalized.snapshot.atoms,
  2
);

assert.deepEqual(
  finalized.snapshot
    .rewardPlan
    .appliedRewardIndexes,
  [0, 1]
);

assert.equal(
  profile.chests.length,
  beforeCount - 1
);

assert.equal(
  profile.chests.some(
    chest =>
      chest.id ===
      complete.chest.id
  ),
  false,
  "baú só deve sumir depois de todas as recompensas resolvidas e aplicadas"
);


console.log(
  "✅ Finalização segura do Baú Atômico validada."
);
