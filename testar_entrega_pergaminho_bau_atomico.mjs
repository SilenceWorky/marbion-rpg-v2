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
    "silenceworky"
  );

profile.race =
  "Terrariano";

profile.elements = [
  "Fogo"
];

const created =
  createAtomicChest(
    profile,
    {
      currentAtoms: 4,
      pendingOpen: {
        atoms: 4,
        attemptNumber: 1,
        scripted: false,
        createdAt: 1234,
        rewardPlan: {
          atoms: 4,
          rewards: [
            {
              type: "scroll",
              resolved: true,
              rarity: "R2",
              compatibleElement: true,
              scroll: {
                tier: "R2",
                skillRarity: "Raro",
                skill: {
                  id: "Fogo:Chama_Rara",
                  group: "Fogo",
                  key: "Chama_Rara",
                  nome: "Chama Rara",
                  elemento: "Fogo",
                  raridade: "Raro"
                }
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

const chestId =
  created.chest.id;


const first =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  first.ok,
  true
);

assert.deepEqual(
  first.appliedNow,
  [
    0
  ]
);

assert.equal(
  first.scrollRewards.length,
  1
);

assert.equal(
  first.scrollRewards[0].duplicate,
  false
);

assert.equal(
  profile.inventory.scrolls.length,
  1
);

assert.equal(
  profile.inventory.scrollSequence,
  1
);

assert.equal(
  profile.inventory.scrolls[0].id,
  "scroll:1"
);

assert.equal(
  profile.inventory.scrolls[0].tier,
  "R2"
);

assert.equal(
  profile.inventory.scrolls[0].skill.id,
  "Fogo:Chama_Rara"
);

assert.equal(
  profile.inventory.scrolls[0].source,
  "atomic_chest"
);

assert.equal(
  profile.inventory.scrolls[0].grantId,
  `atomic_chest:${chestId}:reward:0`
);

assert.equal(
  profile.inventory.scrolls[0].createdAt,
  1234
);

assert.deepEqual(
  profile.skills,
  [],
  "entregar o Pergaminho não pode ensinar a habilidade automaticamente"
);


const retry =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  retry.ok,
  true
);

assert.deepEqual(
  retry.appliedNow,
  []
);

assert.deepEqual(
  retry.scrollRewards,
  []
);

assert.equal(
  profile.inventory.scrolls.length,
  1,
  "retry normal não pode duplicar o Pergaminho"
);

assert.equal(
  profile.inventory.scrollSequence,
  1
);


/*
 * Simula perda apenas do marcador de aplicação.
 *
 * O grantId determinístico do item precisa impedir
 * uma segunda cópia mesmo nesse cenário.
 */
created.chest.metadata.atomic
  .pendingOpen.rewardPlan
  .appliedRewardIndexes = [];


const retryWithoutMarker =
  applyResolvedAtomicChestRewards(
    profile,
    chestId
  );

assert.equal(
  retryWithoutMarker.ok,
  true
);

assert.deepEqual(
  retryWithoutMarker.appliedNow,
  [
    0
  ]
);

assert.equal(
  retryWithoutMarker.scrollRewards.length,
  1
);

assert.equal(
  retryWithoutMarker
    .scrollRewards[0]
    .duplicate,
  true
);

assert.equal(
  profile.inventory.scrolls.length,
  1,
  "grantId do reward precisa impedir duplicação mesmo sem appliedRewardIndexes"
);

assert.equal(
  profile.inventory.scrollSequence,
  1,
  "deduplicação não pode consumir outro número de sequência"
);

assert.deepEqual(
  profile.skills,
  []
);


console.log(
  "✅ Entrega idempotente do Pergaminho do Baú Atômico validada."
);
