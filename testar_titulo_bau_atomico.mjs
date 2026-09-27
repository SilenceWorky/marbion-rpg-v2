import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createAtomicChest
} from "./src/systems/atomic-chest-state.js";

import {
  applyResolvedAtomicChestRewards
} from "./src/systems/atomic-chest-reward-apply.js";


const profile =
  createBaseProfile(
    "titulo"
  );

const created =
  createAtomicChest(
    profile,
    {
      currentAtoms: 5,
      pendingOpen: {
        atoms: 5,
        attemptNumber: 1,
        scripted: false,
        createdAt: 1234,
        rewardPlan: {
          atoms: 5,
          rewards: [
            {
              type: "title",
              resolved: true,
              bonus: true,
              bonusSource:
                "atomic_bonus",
              title: {
                id:
                  "mago_dos_baus",
                name:
                  "Mago dos Baús",
                description:
                  "Nem todo baú deveria ser aberto."
              }
            }
          ],
          hasUnresolvedRewards: false,
          appliedRewardIndexes: []
        }
      }
    }
  );

assert.equal(
  created.ok,
  true
);

const first =
  applyResolvedAtomicChestRewards(
    profile,
    created.chest.id
  );

assert.equal(
  first.ok,
  true
);

assert.deepEqual(
  first.appliedNow,
  [0]
);

assert.equal(
  first.titleRewards.length,
  1
);

assert.equal(
  first.titleRewards[0]
    .duplicate,
  false
);

assert.deepEqual(
  profile.unlockedTags,
  [
    "Mago dos Baús"
  ]
);

created.chest.metadata.atomic
  .pendingOpen.rewardPlan
  .appliedRewardIndexes = [];

const retry =
  applyResolvedAtomicChestRewards(
    profile,
    created.chest.id
  );

assert.equal(
  retry.ok,
  true
);

assert.equal(
  retry.titleRewards[0]
    .duplicate,
  true
);

assert.deepEqual(
  profile.unlockedTags,
  [
    "Mago dos Baús"
  ],
  "retry não pode duplicar o título"
);


console.log(
  "✅ Título especial do Baú Atômico validado."
);
