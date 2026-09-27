import assert from "node:assert/strict";

import {
  normalizeSeasonalPvpFinishers
} from "./src/routes/api-admin-seasons.js";

import {
  createEmptyPvpSeasonContent,
  normalizePvpSeasonContent
} from "./src/systems/pvp-season-content-store.js";


const chests = [
  {
    id:
      "seasonal:2026-12:chest:catalog1",
    seasonId:
      "2026-12",
    order: 1,
    name:
      "Baú de Pinheiro",
    poolRevision: 3,
    createdAt: 1,
    updatedAt: 1
  },
  {
    id:
      "seasonal:2026-12:chest:catalog2",
    seasonId:
      "2026-12",
    order: 2,
    name:
      "Baú Rena",
    poolRevision: 3,
    createdAt: 1,
    updatedAt: 1
  }
];

const normalized =
  normalizeSeasonalPvpFinishers(
    [
      {
        id: "natal:nevasca",
        name: "Nevasca Final",
        description:
          "Finalizador do primeiro baú.",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:rena",
        name: "Investida da Rena",
        introducedInSeasonalChestId:
          chests[1].id,
        introducedInSeasonalChestOrder: 2
      }
    ],
    chests
  );

assert.equal(normalized.ok, true);
assert.equal(normalized.value.length, 2);
assert.equal(
  normalized.value[0].id,
  "natal:nevasca"
);
assert.equal(
  normalized.value[1]
    .introducedInSeasonalChestOrder,
  2
);

const generated =
  normalizeSeasonalPvpFinishers(
    [
      {
        name: "Explosão Festiva",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      }
    ],
    chests
  );

assert.equal(generated.ok, true);
assert.equal(
  generated.value[0].id,
  "seasonal-pvp-finisher:explosao_festiva:1"
);

const wrongChest =
  normalizeSeasonalPvpFinishers(
    [
      {
        id: "natal:erro",
        name: "Erro",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 2
      }
    ],
    chests
  );

assert.equal(wrongChest.ok, false);
assert.equal(
  wrongChest.error,
  "INVALID_SEASONAL_PVP_FINISHER_CHEST"
);

const duplicate =
  normalizeSeasonalPvpFinishers(
    [
      {
        id: "natal:igual",
        name: "Primeiro",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:igual",
        name: "Segundo",
        introducedInSeasonalChestId:
          chests[1].id,
        introducedInSeasonalChestOrder: 2
      }
    ],
    chests
  );

assert.equal(duplicate.ok, false);
assert.equal(
  duplicate.error,
  "DUPLICATE_SEASONAL_PVP_FINISHER_ID"
);

const longPrefix =
  "x".repeat(160);

const truncatedDuplicate =
  normalizeSeasonalPvpFinishers(
    [
      {
        id: longPrefix + "a",
        name: "Longo A",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: longPrefix + "b",
        name: "Longo B",
        introducedInSeasonalChestId:
          chests[1].id,
        introducedInSeasonalChestOrder: 2
      }
    ],
    chests
  );

assert.equal(
  truncatedDuplicate.ok,
  false
);
assert.equal(
  truncatedDuplicate.error,
  "DUPLICATE_SEASONAL_PVP_FINISHER_ID"
);

const stored =
  normalizePvpSeasonContent(
    {
      version: 2,
      id: "2026-12",
      year: 2026,
      month: 12,
      revision: 3,
      featuredElements: [],
      seasonalChests: chests,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers:
        normalized.value,
      updatedAt: 1
    }
  );

assert.ok(stored);
assert.equal(
  stored.seasonalPvpFinishers.length,
  2
);
assert.equal(
  stored.seasonalPvpFinishers[0]
    .introducedInSeasonalChestOrder,
  1
);
assert.equal(
  stored.seasonalPvpFinishers[1]
    .introducedInSeasonalChestOrder,
  2
);

const invalidStored =
  normalizePvpSeasonContent(
    {
      version: 2,
      id: "2026-12",
      year: 2026,
      month: 12,
      revision: 3,
      featuredElements: [],
      seasonalChests: chests,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [
        {
          id: "natal:fora",
          name: "Fora",
          introducedInSeasonalChestId:
            chests[1].id,
          introducedInSeasonalChestOrder: 1
        }
      ],
      updatedAt: 1
    }
  );

assert.equal(invalidStored, null);

const empty =
  createEmptyPvpSeasonContent(
    2026,
    12
  );

assert.deepEqual(
  empty.seasonalPvpFinishers,
  []
);

console.log(
  "OK: catálogo versionado de Finalizadores PvP Sazonais"
);
