import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  ATOMIC_CHEST_ABILITY_RARITY_POOL,
  getEligibleAtomicChestAbilitySkills,
  resolveAtomicChestAbilityRewards
} from "./src/systems/atomic-chest-ability-resolver.js";


function sequenceRandom(values) {
  let index = 0;

  return () => {
    if (index >= values.length) {
      throw new Error(
        "RNG_SEQUENCE_EXHAUSTED"
      );
    }

    return values[index++];
  };
}


const skillsData = {
  Fogo: {
    Comum: {
      nome: "Chama Comum",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Fogo"
    },
    Incomum: {
      nome: "Chama Incomum",
      tipo: "Elemental",
      raridade: "Incomum",
      elemento: "Fogo"
    },
    RaroAntigo: {
      nome: "Chama Rara Antiga",
      tipo: "Elemental",
      raridade: "Raro",
      elemento: "Fogo"
    },
    MuitoRaro: {
      nome: "Chama Muito Rara",
      tipo: "Elemental",
      raridade: "Muito Raro",
      elemento: "Fogo"
    },
    Lendario: {
      nome: "Chama Lendária",
      tipo: "Elemental",
      raridade: "Lendário",
      elemento: "Fogo"
    },
    Especial: {
      nome: "Chama Especial",
      tipo: "Elemental",
      raridade: "Especial",
      elemento: "Fogo"
    }
  },
  Universais: {
    Universal: {
      nome: "Universal",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Universal"
    }
  },
  Agua: {
    Agua: {
      nome: "Água",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Água"
    }
  }
};


assert.deepEqual(
  ATOMIC_CHEST_ABILITY_RARITY_POOL
    .map(
      entry => [
        entry.rarity,
        entry.weight
      ]
    ),
  [
    ["Comum", 0.35],
    ["Raro", 0.30],
    ["Super Raro", 0.20],
    ["Mítico", 0.10],
    ["Lendário", 0.05]
  ]
);


const profile =
  createBaseProfile(
    "bau-v"
  );

profile.elements = [
  "Fogo"
];

const eligible =
  getEligibleAtomicChestAbilitySkills(
    profile,
    skillsData
  );

assert.equal(
  eligible.ok,
  true
);

assert.deepEqual(
  eligible.candidates
    .map(
      skill =>
        skill.canonicalRarity
    )
    .sort(),
  [
    "Comum",
    "Lendário",
    "Mítico",
    "Raro",
    "Super Raro"
  ].sort()
);

assert.equal(
  eligible.candidates.some(
    skill =>
      skill.raridade ===
      "Especial"
  ),
  false,
  "Especial antigo deve virar Único e ficar fora do Baú V"
);

assert.equal(
  eligible.candidates.some(
    skill =>
      skill.elemento ===
      "Universal"
  ),
  false,
  "habilidade garantida deve ser elemental, não Universal"
);


const pending = {
  atoms: 5,
  rewardPlan: {
    rewards: [
      {
        type:
          "new_elemental_ability",
        resolved: false,
        compatibleElement: true
      }
    ],
    hasUnresolvedRewards: true
  }
};

const resolved =
  resolveAtomicChestAbilityRewards(
    profile,
    pending,
    skillsData,
    sequenceRandom([
      0.99,
      0
    ])
  );

assert.equal(
  resolved.ok,
  true
);

assert.equal(
  pending.rewardPlan
    .rewards[0].rarity,
  "Lendário"
);

assert.equal(
  pending.rewardPlan
    .rewards[0].skill.nome,
  "Chama Lendária"
);

assert.equal(
  pending.rewardPlan
    .rewards[0].resolved,
  true
);

assert.equal(
  pending.rewardPlan
    .hasUnresolvedRewards,
  false
);


const exhaustedProfile =
  createBaseProfile(
    "bau-v-esgotado"
  );

exhaustedProfile.elements = [
  "Fogo"
];

exhaustedProfile.skills = [
  "Fogo:Comum",
  "Fogo:Incomum",
  "Fogo:RaroAntigo",
  "Fogo:MuitoRaro",
  "Fogo:Lendario"
];

const exhaustedPending = {
  atoms: 5,
  rewardPlan: {
    rewards: [
      {
        type:
          "new_elemental_ability",
        resolved: false,
        compatibleElement: true
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fallbackOne =
  resolveAtomicChestAbilityRewards(
    exhaustedProfile,
    exhaustedPending,
    skillsData,
    sequenceRandom([
      0.74
    ])
  );

assert.equal(
  fallbackOne.ok,
  true
);

assert.deepEqual(
  exhaustedPending.rewardPlan
    .rewards[0].money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 1
  }
);

assert.equal(
  exhaustedPending.rewardPlan
    .rewards[0].fallbackFrom,
  "new_elemental_ability"
);


const exhaustedPendingTwo =
  structuredClone(
    exhaustedPending
  );

exhaustedPendingTwo.rewardPlan.rewards = [
  {
    type:
      "new_elemental_ability",
    resolved: false,
    compatibleElement: true
  }
];

exhaustedPendingTwo.rewardPlan
  .hasUnresolvedRewards = true;

const fallbackTwo =
  resolveAtomicChestAbilityRewards(
    exhaustedProfile,
    exhaustedPendingTwo,
    skillsData,
    sequenceRandom([
      0.99
    ])
  );

assert.equal(
  fallbackTwo.ok,
  true
);

assert.equal(
  exhaustedPendingTwo.rewardPlan
    .rewards[0].money.platinum,
  2
);


console.log(
  "✅ Habilidade garantida do Baú Atômico V validada."
);
