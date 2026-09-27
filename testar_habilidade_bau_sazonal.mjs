import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  SEASONAL_CHEST_SKILL_RARITY_POOL
} from "./src/config/seasonal-chest-rewards.js";

import {
  getEligibleSeasonalChestSkills,
  resolveSeasonalChestSkillRewards
} from "./src/systems/seasonal-chest-skill-resolver.js";


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


assert.deepEqual(
  SEASONAL_CHEST_SKILL_RARITY_POOL
    .map(entry => [
      entry.rarity,
      entry.weight
    ]),
  [
    ["Comum", 0.40],
    ["Raro", 0.30],
    ["Super Raro", 0.20],
    ["Mítico", 0.08],
    ["Lendário", 0.02]
  ]
);


const chest = {
  id:
    "seasonal:2026-09:chest:teste01",
  seasonId:
    "2026-09",
  order: 1,
  poolRevision: 1,
  name:
    "Baú Sazonal de Setembro"
};

const seasonContent = {
  id: "2026-09",
  revision: 1,
  seasonalChests: [
    chest
  ],
  seasonalSkills: [
    {
      id: "setembro:comum",
      element: "Fogo",
      name: "Chama de Setembro",
      rarity: "Comum",
      baseDamage: 10
    },
    {
      id: "setembro:raro",
      element: "Fogo",
      name: "Brasa de Setembro",
      rarity: "Raro",
      baseDamage: 20
    },
    {
      id: "setembro:mitico",
      element: "Fogo",
      name: "Sol de Setembro",
      rarity: "Mítico",
      baseDamage: 40
    },
    {
      id: "setembro:lendario",
      element: "Fogo",
      name: "Coroa Solar",
      rarity: "Lendário",
      baseDamage: 60
    },
    {
      id: "setembro:unico",
      element: "Fogo",
      name: "Única de Setembro",
      rarity: "Único",
      baseDamage: 100
    },
    {
      id: "setembro:incompativel",
      element: "Água",
      name: "Mar de Setembro",
      rarity: "Comum",
      baseDamage: 10
    },
    {
      id: "setembro:sem-raridade",
      element: "Fogo",
      name: "Legado",
      rarity: null,
      baseDamage: 5
    }
  ]
};

for (
  const skill of
    seasonContent.seasonalSkills
) {
  skill.introducedInSeasonalChestId =
    chest.id;
  skill.introducedInSeasonalChestOrder =
    1;
}


const profile =
  createBaseProfile(
    "bau-sazonal"
  );

profile.elements = [
  "Fogo"
];

profile.skills = [
  "setembro:raro"
];

const eligible =
  getEligibleSeasonalChestSkills(
    profile,
    seasonContent,
    {
      seasonId: "2026-09",
      seasonalChestId:
        chest.id,
      chestOrder: 1,
      poolRevision: 1
    }
  );

assert.equal(
  eligible.ok,
  true
);

assert.deepEqual(
  eligible.candidates
    .map(skill => skill.id)
    .sort(),
  [
    "setembro:comum",
    "setembro:lendario",
    "setembro:mitico"
  ].sort()
);

const pending = {
  seasonId: "2026-09",
  seasonalChestId:
    chest.id,
  chestOrder: 1,
  poolRevision: 1,
  rewardPlan: {
    rewards: [
      {
        type: "seasonal_skill",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const resolved =
  resolveSeasonalChestSkillRewards(
    profile,
    pending,
    seasonContent,
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
    .rewards[0].skill.id,
  "setembro:lendario"
);

assert.equal(
  pending.rewardPlan
    .rewards[0].seasonId,
  "2026-09"
);

assert.equal(
  pending.rewardPlan
    .hasUnresolvedRewards,
  false
);


const exhausted =
  createBaseProfile(
    "bau-sazonal-esgotado"
  );

exhausted.elements = [
  "Fogo"
];

exhausted.skills = [
  "setembro:comum",
  "setembro:raro",
  "setembro:mitico",
  "setembro:lendario"
];

const fallbackPending = {
  seasonId: "2026-09",
  seasonalChestId:
    chest.id,
  chestOrder: 1,
  poolRevision: 1,
  rewardPlan: {
    rewards: [
      {
        type: "seasonal_skill",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const fallback =
  resolveSeasonalChestSkillRewards(
    exhausted,
    fallbackPending,
    seasonContent
  );

assert.equal(
  fallback.ok,
  true
);

assert.deepEqual(
  fallbackPending
    .rewardPlan
    .rewards[0],
  {
    type: "money",
    resolved: true,
    fallbackFrom:
      "seasonal_skill",
    bronzeEquivalent: 1000,
    money: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 1
    }
  }
);


const mismatchPending = {
  seasonId: "2026-08",
  seasonalChestId:
    chest.id,
  chestOrder: 1,
  poolRevision: 1,
  rewardPlan: {
    rewards: [
      {
        type: "seasonal_skill",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const mismatch =
  resolveSeasonalChestSkillRewards(
    profile,
    mismatchPending,
    seasonContent
  );

assert.equal(
  mismatch.ok,
  false
);

assert.equal(
  mismatch.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);

console.log(
  "✅ Habilidade temática do Baú Sazonal validada."
);
