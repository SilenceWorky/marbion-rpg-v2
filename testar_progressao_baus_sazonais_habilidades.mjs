import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  getEligibleSeasonalChestSkills,
  resolveSeasonalChestSkillRewards
} from "./src/systems/seasonal-chest-skill-resolver.js";


const profile =
  createBaseProfile(
    "bau-sazonal-progressao"
  );

profile.elements = [
  "Fogo"
];

const chest1 = {
  id:
    "seasonal:2026-12:chest:aaaaaa",
  seasonId:
    "2026-12",
  order: 1,
  poolRevision: 1,
  name: "Baú de Pinheiro"
};

const chest2 = {
  id:
    "seasonal:2026-12:chest:bbbbbb",
  seasonId:
    "2026-12",
  order: 2,
  poolRevision: 2,
  name: "Baú Rena"
};

const skillA = {
  id: "natal:a",
  element: "Fogo",
  name: "Presente A",
  rarity: "Comum",
  introducedInSeasonalChestId:
    chest1.id,
  introducedInSeasonalChestOrder:
    1
};

const skillB = {
  id: "natal:b",
  element: "Fogo",
  name: "Presente B",
  rarity: "Comum",
  introducedInSeasonalChestId:
    chest2.id,
  introducedInSeasonalChestOrder:
    2
};

const revision1 = {
  id: "2026-12",
  revision: 1,
  seasonalChests: [
    chest1
  ],
  seasonalSkills: [
    skillA
  ]
};

const revision2 = {
  id: "2026-12",
  revision: 2,
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalSkills: [
    skillA,
    skillB
  ]
};


const eligibleChest1 =
  getEligibleSeasonalChestSkills(
    profile,
    revision1,
    {
      seasonId: "2026-12",
      seasonalChestId:
        chest1.id,
      chestOrder: 1,
      poolRevision: 1
    }
  );

assert.equal(
  eligibleChest1.ok,
  true
);

assert.deepEqual(
  eligibleChest1.candidates
    .map(skill => skill.id),
  ["natal:a"]
);

const eligibleChest2 =
  getEligibleSeasonalChestSkills(
    profile,
    revision2,
    {
      seasonId: "2026-12",
      seasonalChestId:
        chest2.id,
      chestOrder: 2,
      poolRevision: 2
    }
  );

assert.equal(
  eligibleChest2.ok,
  true
);

assert.deepEqual(
  eligibleChest2.candidates
    .map(skill => skill.id)
    .sort(),
  [
    "natal:a",
    "natal:b"
  ].sort()
);


const oldChestAgainstNewRevision =
  getEligibleSeasonalChestSkills(
    profile,
    revision2,
    {
      seasonId: "2026-12",
      seasonalChestId:
        chest1.id,
      chestOrder: 1,
      poolRevision: 1
    }
  );

assert.equal(
  oldChestAgainstNewRevision.ok,
  false
);

assert.equal(
  oldChestAgainstNewRevision.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);


const otherSeason = {
  id: "2027-03",
  revision: 1,
  seasonalChests: [
    {
      id:
        "seasonal:2027-03:chest:cccccc",
      seasonId:
        "2027-03",
      order: 1,
      poolRevision: 1,
      name: "Baú Primavera"
    }
  ],
  seasonalSkills: [
    {
      id: "primavera:x",
      element: "Fogo",
      name: "Flor X",
      rarity: "Comum",
      introducedInSeasonalChestId:
        "seasonal:2027-03:chest:cccccc",
      introducedInSeasonalChestOrder:
        1
    }
  ]
};

const crossSeason =
  getEligibleSeasonalChestSkills(
    profile,
    otherSeason,
    {
      seasonId: "2026-12",
      seasonalChestId:
        chest1.id,
      chestOrder: 1,
      poolRevision: 1
    }
  );

assert.equal(
  crossSeason.ok,
  false
);

assert.equal(
  crossSeason.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);


const pendingChest2 = {
  seasonId: "2026-12",
  seasonalChestId:
    chest2.id,
  chestOrder: 2,
  poolRevision: 2,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_skill",
        resolved: false
      }
    ],
    hasUnresolvedRewards: true
  }
};

const resolved =
  resolveSeasonalChestSkillRewards(
    profile,
    pendingChest2,
    revision2,
    () => 0
  );

assert.equal(
  resolved.ok,
  true
);

assert.equal(
  pendingChest2.rewardPlan
    .rewards[0].seasonalChestId,
  chest2.id
);

assert.equal(
  pendingChest2.rewardPlan
    .rewards[0].poolRevision,
  2
);

assert.equal(
  pendingChest2.rewardPlan
    .rewards[0].skill.id,
  "natal:a"
);

console.log(
  "✅ Progressão cumulativa e isolamento dos Baús Sazonais validados."
);
