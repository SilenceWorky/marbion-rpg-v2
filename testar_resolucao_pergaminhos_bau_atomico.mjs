import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  resolveAtomicChestScrollRewards
} from "./src/systems/atomic-chest-scroll-resolver.js";


const skillsData = {
  Fogo: {
    Chama_Rara: {
      nome: "Chama Rara",
      raridade: "Raro",
      elemento: "Fogo"
    },

    Inferno_Mitico: {
      nome: "Inferno Mítico",
      raridade: "Mítico",
      elemento: "Fogo"
    }
  },

  Luz: {
    Clarão_Raro: {
      nome: "Clarão Raro",
      raridade: "Raro",
      elemento: "Luz"
    }
  },

  Agua: {
    Onda_Rara: {
      nome: "Onda Rara",
      raridade: "Raro",
      elemento: "Água"
    }
  }
};


const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.elements = [
  "Fogo"
];


const pendingOpen = {
  atoms: 4,
  attemptNumber: 1,
  scripted: false,
  createdAt: 1000,
  rewardPlan: {
    atoms: 4,
    rewards: [
      {
        type: "normal_xp",
        resolved: true,
        amount: 100
      },
      {
        type: "money",
        resolved: true,
        money: {
          bronze: 2,
          silver: 1,
          gold: 0,
          platinum: 0
        }
      },
      {
        type: "scroll",
        resolved: false,
        rarity: "R2",
        compatibleElement: true
      }
    ],
    hasUnresolvedRewards: true,
    appliedRewardIndexes: []
  }
};


const first =
  resolveAtomicChestScrollRewards(
    profile,
    pendingOpen,
    skillsData,
    () => 0
  );

assert.equal(
  first.ok,
  true
);

assert.deepEqual(
  first.resolvedIndexes,
  [
    2
  ]
);

assert.equal(
  pendingOpen.rewardPlan
    .rewards[2]
    .resolved,
  true
);

assert.equal(
  pendingOpen.rewardPlan
    .rewards[2]
    .scroll
    .tier,
  "R2"
);

assert.equal(
  pendingOpen.rewardPlan
    .rewards[2]
    .scroll
    .skillRarity,
  "Raro"
);

assert.equal(
  pendingOpen.rewardPlan
    .rewards[2]
    .scroll
    .skill
    .id,
  "Fogo:Chama_Rara"
);

assert.equal(
  pendingOpen.rewardPlan
    .hasUnresolvedRewards,
  false
);


const frozen =
  structuredClone(
    pendingOpen
  );

const retry =
  resolveAtomicChestScrollRewards(
    profile,
    pendingOpen,
    skillsData,
    () => {
      throw new Error(
        "não deve rerrolar pergaminho já resolvido"
      );
    }
  );

assert.equal(
  retry.ok,
  true
);

assert.deepEqual(
  retry.resolvedIndexes,
  []
);

assert.deepEqual(
  pendingOpen,
  frozen,
  "retry precisa preservar exatamente o mesmo pergaminho"
);


const exhaustedPending = {
  atoms: 4,
  attemptNumber: 1,
  scripted: false,
  createdAt: 2000,
  rewardPlan: {
    atoms: 4,
    rewards: [
      {
        type: "scroll",
        resolved: false,
        rarity: "R4",
        compatibleElement: true
      },
      {
        type: "scroll",
        resolved: false,
        rarity: "R2",
        compatibleElement: true
      }
    ],
    hasUnresolvedRewards: true,
    appliedRewardIndexes: []
  }
};

profile.skills = [
  "Fogo:Inferno_Mitico"
];

const beforeFailure =
  structuredClone(
    exhaustedPending
  );

const exhausted =
  resolveAtomicChestScrollRewards(
    profile,
    exhaustedPending,
    skillsData,
    () => 0
  );

assert.equal(
  exhausted.ok,
  false
);

assert.equal(
  exhausted.error,
  "SCROLL_REWARD_POOL_EXHAUSTED"
);

assert.equal(
  exhausted.rewardIndex,
  0
);

assert.deepEqual(
  exhaustedPending,
  beforeFailure,
  "falha de um pool não pode resolver parcialmente outros pergaminhos"
);


console.log(
  "✅ Resolução congelada de Pergaminhos do Baú Atômico validada."
);
