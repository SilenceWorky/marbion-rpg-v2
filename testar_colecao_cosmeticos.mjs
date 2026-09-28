import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  findOwnedCosmetic,
  getCosmeticCollection,
  grantCosmetic
} from "./src/systems/cosmetic-collection.js";


const profile =
  createBaseProfile(
    "colecao-cosmeticos"
  );

assert.deepEqual(
  profile.cosmetics,
  {
    owned: []
  }
);

const first =
  grantCosmetic(
    profile,
    {
      seasonId: "2026-12",
      cosmeticId: "natal:cachecol",
      name: "Cachecol Congelado",
      source: "seasonal_chest",
      seasonalChestId:
        "seasonal:2026-12:chest:cosmetic01",
      chestOrder: 1,
      poolRevision: 7,
      acquiredAt: 123
    }
  );

assert.equal(first.ok, true);
assert.equal(first.duplicate, false);
assert.equal(
  profile.cosmetics.owned.length,
  1
);
assert.equal(
  profile.cosmetics.owned[0]
    .cosmeticId,
  "natal:cachecol"
);
assert.equal(
  profile.cosmetics.owned[0].name,
  "Cachecol Congelado"
);
assert.equal(
  profile.cosmetics.owned[0]
    .seasonalChestId,
  "seasonal:2026-12:chest:cosmetic01"
);
assert.equal(
  profile.cosmetics.owned[0]
    .chestOrder,
  1
);
assert.equal(
  profile.cosmetics.owned[0]
    .poolRevision,
  7
);

const duplicate =
  grantCosmetic(
    profile,
    {
      seasonId: "2026-12",
      cosmeticId: "natal:cachecol",
      name: "Nome alterado"
    }
  );

assert.equal(duplicate.ok, true);
assert.equal(duplicate.duplicate, true);
assert.equal(
  profile.cosmetics.owned.length,
  1
);
assert.equal(
  profile.cosmetics.owned[0].name,
  "Cachecol Congelado",
  "retry não deve substituir o item já adquirido"
);
const anotherSeason =
  grantCosmetic(
    profile,
    {
      seasonId: "2027-12",
      cosmeticId: "natal:cachecol",
      name: "Cachecol Congelado 2027"
    }
  );

assert.equal(
  anotherSeason.ok,
  true
);
assert.equal(
  anotherSeason.duplicate,
  false
);
assert.equal(
  profile.cosmetics.owned.length,
  2
);

const global =
  grantCosmetic(
    profile,
    {
      seasonId: null,
      cosmeticId: "global:teste",
      name: "Item Global"
    }
  );

assert.equal(global.ok, true);
assert.equal(
  profile.cosmetics.owned.length,
  3
);
const foundSeasonal =
  findOwnedCosmetic(
    profile,
    "2026-12",
    "natal:cachecol"
  );

assert.equal(
  foundSeasonal.ok,
  true
);
assert.equal(
  foundSeasonal.found,
  true
);
assert.equal(
  foundSeasonal.cosmetic.name,
  "Cachecol Congelado"
);

const collection =
  getCosmeticCollection(
    profile
  );

assert.equal(collection.ok, true);
assert.equal(
  collection.owned.length,
  3
);
assert.equal(
  Object.hasOwn(
    profile.cosmetics,
    "equipped"
  ),
  false,
  "v1.0 não deve criar sistema de equipar cosméticos"
);
const legacy =
  ensureProfileDefaults({
    user: "legacy"
  });

assert.deepEqual(
  legacy.cosmetics,
  {
    owned: []
  }
);

const preserved =
  ensureProfileDefaults({
    user: "preserved",
    cosmetics: {
      owned: [
        {
          seasonId: "2026-12",
          cosmeticId: "natal:cachecol",
          name: "Cachecol Congelado"
        }
      ]
    }
  });

assert.equal(
  preserved.cosmetics.owned.length,
  1
);
assert.equal(
  preserved.cosmetics.owned[0]
    .cosmeticId,
  "natal:cachecol"
);

console.log(
  "OK: coleção permanente e inerte de Cosméticos"
);
