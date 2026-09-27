import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createSeasonalChest,
  createSeasonalChestFromDefinition
} from "./src/systems/seasonal-chest-state.js";

import {
  prepareSeasonalChestOpen
} from "./src/systems/seasonal-chest-open.js";


const profile =
  createBaseProfile(
    "pending-sazonal"
  );

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:abcdef",
      seasonId:
        "2026-12",
      order: 2,
      poolRevision: 7,
      name:
        "Baú Rena",
      description:
        "Baú do segundo lote."
    },
    {
      createdAt: 100
    }
  );

assert.equal(
  created.ok,
  true
);

const first =
  prepareSeasonalChestOpen(
    created.chest,
    {
      random: () => 0,
      now: 200
    }
  );

assert.equal(
  first.ok,
  true
);

assert.equal(
  first.reused,
  false
);

assert.equal(
  first.pendingOpen.seasonId,
  "2026-12"
);

assert.equal(
  first.pendingOpen
    .seasonalChestId,
  "seasonal:2026-12:chest:abcdef"
);

assert.equal(
  first.pendingOpen.chestOrder,
  2
);

assert.equal(
  first.pendingOpen.poolRevision,
  7
);

assert.equal(
  first.pendingOpen.nameSnapshot,
  "Baú Rena"
);

assert.equal(
  first.pendingOpen.createdAt,
  200
);

assert.deepEqual(
  first.pendingOpen.rewardPlan
    .rewards,
  [
    {
      type: "normal_xp",
      resolved: true,
      amount: 50
    },
    {
      type: "seasonal_skill",
      resolved: false
    }
  ]
);

assert.equal(
  created.chest.metadata
    .seasonal.pendingOpen,
  first.pendingOpen
);


const second =
  prepareSeasonalChestOpen(
    created.chest,
    {
      random: () => {
        throw new Error(
          "NÃO DEVERIA REROLLAR"
        );
      },
      now: 999
    }
  );

assert.equal(
  second.ok,
  true
);

assert.equal(
  second.reused,
  true
);

assert.deepEqual(
  second.pendingOpen,
  first.pendingOpen
);


const legacy =
  createSeasonalChest(
    profile,
    {
      seasonId:
        "2026-12"
    }
  );

assert.equal(
  legacy.ok,
  true
);

assert.equal(
  prepareSeasonalChestOpen(
    legacy.chest
  ).error,
  "SEASONAL_CHEST_IDENTITY_REQUIRED"
);

console.log(
  "✅ PendingOpen congelado do Baú Sazonal validado."
);
