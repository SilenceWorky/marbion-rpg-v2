import assert from "node:assert/strict";

import {
  normalizeSeasonalConsumables
} from "./src/routes/api-admin-seasons.js";

import {
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
  normalizeSeasonalConsumables(
    [
      {
        id:
          "natal:biscoito",
        key:
          "natal:biscoito",
        name:
          "Biscoito de Pinheiro",
        rarity:
          "Comum",
        description:
          "Consumível de Natal.",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder:
          1
      },
      {
        id:
          "natal:estrela",
        name:
          "Estrela Comestível",
        rarity:
          "Único",
        introducedInSeasonalChestId:
          chests[1].id,
        introducedInSeasonalChestOrder:
          2
      }
    ],
    chests
  );

assert.equal(
  normalized.ok,
  true
);

assert.equal(
  normalized.value.length,
  2
);

assert.equal(
  normalized.value[1].rarity,
  "Único"
);

const wrongChest =
  normalizeSeasonalConsumables(
    [
      {
        id:
          "natal:erro",
        name:
          "Erro",
        rarity:
          "Raro",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder:
          2
      }
    ],
    chests
  );

assert.equal(
  wrongChest.ok,
  false
);

assert.equal(
  wrongChest.error,
  "INVALID_SEASONAL_CONSUMABLE_CHEST"
);


const stored =
  normalizePvpSeasonContent(
    {
      version: 2,
      id:
        "2026-12",
      year: 2026,
      month: 12,
      revision: 3,
      featuredElements: [],
      seasonalChests:
        chests,
      seasonalSkills: [],
      seasonalConsumables:
        normalized.value,
      updatedAt: 1
    }
  );

assert.ok(
  stored
);

assert.equal(
  stored.seasonalConsumables
    .length,
  2
);

assert.equal(
  stored.seasonalConsumables[0]
    .introducedInSeasonalChestOrder,
  1
);

assert.equal(
  stored.seasonalConsumables[1]
    .introducedInSeasonalChestOrder,
  2
);

console.log(
  "✅ Catálogo persistente de Consumíveis Sazonais validado."
);
