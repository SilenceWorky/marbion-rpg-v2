import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createSeasonalChest,
  getSeasonalChestState
} from "./src/systems/seasonal-chest-state.js";


const profile =
  createBaseProfile(
    "seasonaltest"
  );

const created =
  createSeasonalChest(
    profile,
    {
      seasonId:
        "2026-09",
      createdAt:
        123456
    }
  );

assert.equal(
  created.ok,
  true
);

assert.equal(
  created.chest.type,
  "seasonal"
);

assert.equal(
  created.chest.createdAt,
  123456
);

assert.deepEqual(
  created.chest.metadata,
  {
    seasonal: {
      seasonId:
        "2026-09"
    }
  }
);

assert.deepEqual(
  getSeasonalChestState(
    created.chest
  ),
  {
    ok: true,
    state: {
      seasonId:
        "2026-09"
    }
  }
);

assert.equal(
  createSeasonalChest(
    profile,
    {
      seasonId:
        "2026-13"
    }
  ).error,
  "INVALID_SEASON_ID"
);

assert.equal(
  createSeasonalChest(
    profile,
    {}
  ).error,
  "INVALID_SEASON_ID"
);

assert.equal(
  getSeasonalChestState({
    type:
      "seasonal",
    metadata: {}
  }).error,
  "SEASONAL_CHEST_SEASON_NOT_BOUND"
);


console.log(
  "✅ Vínculo permanente do Baú Sazonal com a temporada validado."
);
