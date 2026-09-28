import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  grantRelic
} from "./src/systems/relic-collection.js";

import {
  getEligibleSeasonalChestRelics,
  resolveSeasonalChestRelicRewards
} from "./src/systems/seasonal-chest-relic-resolver.js";


const chest1 = {
  id: "seasonal:2026-12:chest:relic1",
  seasonId: "2026-12",
  order: 1,
  name: "BaÃº de Pinheiro",
  poolRevision: 11,
  createdAt: 1,
  updatedAt: 1
};

const chest2 = {
  id: "seasonal:2026-12:chest:relic2",
  seasonId: "2026-12",
  order: 2,
  name: "BaÃº Rena",
  poolRevision: 11,
  createdAt: 1,
  updatedAt: 1
};

const content = {
  version: 7,
  id: "2026-12",
  year: 2026,
  month: 12,
  revision: 11,
  featuredElements: [],
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalRelics: [
    {
      id: "jardim:fragmento",
      name: "Fragmento do Jardim",
      description: "Um fragmento antigo.",
      lore: "Vestígio do jardim original.",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "jardim:semente",
      name: "Semente Primeva",
      description: "Uma semente petrificada.",
      lore: "Nunca germinou desde a queda do jardim.",
      introducedInSeasonalChestId:
        chest2.id,
      introducedInSeasonalChestOrder: 2
    }
  ],
  updatedAt: 1
};

function pendingFor(
  chest,
  count = 1
) {
  return {
    seasonId: chest.seasonId,
    seasonalChestId: chest.id,
    chestOrder: chest.order,
    poolRevision: chest.poolRevision,
    createdAt: 10,
    rewardPlan: {
      rewards:
        Array.from(
          { length: count },
          () => ({
            type:
              "seasonal_relic",
            resolved: false
          })
        ),
      hasUnresolvedRewards: true
    }
  };
}


const clean =
  createBaseProfile("clean");

const eligibleChest1 =
  getEligibleSeasonalChestRelics(
    clean,
    pendingFor(chest1),
    content
  );

assert.equal(
  eligibleChest1.ok,
  true
);

assert.deepEqual(
  eligibleChest1.catalogCandidates
    .map(item => item.id),
  ["jardim:fragmento"]
);

const resolvedChest1 =
  resolveSeasonalChestRelicRewards(
    clean,
    pendingFor(chest1),
    content,
    () => 0.99
  );

assert.equal(
  resolvedChest1.ok,
  true
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .relic.id,
  "jardim:fragmento"
);
assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .relic.lore,
  "Vestígio do jardim original."
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .poolRevision,
  11
);


const ownsFirst =
  createBaseProfile("owns-first");

grantRelic(
  ownsFirst,
  {
    seasonId: "2026-12",
    relicId: "jardim:fragmento",
    name: "Fragmento do Jardim"
  }
);

const fallback =
  resolveSeasonalChestRelicRewards(
    ownsFirst,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(fallback.ok, true);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0].type,
  "money"
);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0]
    .fallbackFrom,
  "seasonal_relic"
);
assert.equal(
  fallback.pendingOpen
    .rewardPlan.rewards[0]
    .money.platinum,
  1
);


const eligibleChest2 =
  getEligibleSeasonalChestRelics(
    ownsFirst,
    pendingFor(chest2),
    content
  );

assert.deepEqual(
  eligibleChest2.catalogCandidates
    .map(item => item.id),
  [
    "jardim:fragmento",
    "jardim:semente"
  ]
);

assert.deepEqual(
  eligibleChest2.candidates
    .map(item => item.id),
  ["jardim:semente"]
);

const resolvedChest2 =
  resolveSeasonalChestRelicRewards(
    ownsFirst,
    pendingFor(chest2),
    content,
    () => 0
  );

assert.equal(
  resolvedChest2.pendingOpen
    .rewardPlan.rewards[0]
    .relic.id,
  "jardim:semente"
);


const otherSeason =
  createBaseProfile("other-season");

grantRelic(
  otherSeason,
  {
    seasonId: "2027-12",
    relicId: "jardim:fragmento",
    name: "Mesmo fragmento, outra temporada"
  }
);

const otherSeasonResult =
  resolveSeasonalChestRelicRewards(
    otherSeason,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(
  otherSeasonResult.pendingOpen
    .rewardPlan.rewards[0]
    .relic.id,
  "jardim:fragmento"
);


const threeRewards =
  resolveSeasonalChestRelicRewards(
    createBaseProfile("three"),
    pendingFor(chest2, 3),
    content,
    () => 0
  );

const rewards =
  threeRewards.pendingOpen
    .rewardPlan.rewards;

assert.equal(
  rewards[0].relic.id,
  "jardim:fragmento"
);
assert.equal(
  rewards[1].relic.id,
  "jardim:semente"
);
assert.equal(
  rewards[2].type,
  "money"
);
assert.equal(
  rewards[2].money.platinum,
  1
);


const badRevision =
  pendingFor(chest1);

badRevision.poolRevision = 10;

const mismatch =
  resolveSeasonalChestRelicRewards(
    clean,
    badRevision,
    content,
    () => 0
  );

assert.equal(
  mismatch.ok,
  false
);
assert.equal(
  mismatch.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);


let randomCalls = 0;

const alreadyResolved =
  pendingFor(chest1);

alreadyResolved.rewardPlan.rewards[0] = {
  type: "seasonal_relic",
  resolved: true,
  relic: {
    id: "jardim:fragmento",
    name: "Fragmento do Jardim"
  }
};

const retry =
  resolveSeasonalChestRelicRewards(
    clean,
    alreadyResolved,
    content,
    () => {
      randomCalls += 1;
      return 0.5;
    }
  );

assert.equal(retry.ok, true);
assert.deepEqual(
  retry.resolvedIndexes,
  []
);
assert.equal(
  randomCalls,
  0
);


const empty =
  resolveSeasonalChestRelicRewards(
    clean,
    pendingFor(chest1),
    {
      ...content,
      seasonalRelics: []
    },
    () => 0
  );

assert.equal(empty.ok, false);
assert.equal(
  empty.error,
  "SEASONAL_RELIC_CATALOG_EMPTY"
);


console.log(
  "OK: resolver de Reliquias Sazonais"
);

