import assert from "node:assert/strict";

import {
  normalizeSeasonalCosmetics
} from "./src/routes/api-admin-seasons.js";

import {
  createEmptyPvpSeasonContent,
  normalizePvpSeasonContent,
  readPvpSeasonContentRevision,
  savePvpSeasonMonthContent
} from "./src/systems/pvp-season-content-store.js";


class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key);
  }

  async put(key, value) {
    this.data.set(
      key,
      structuredClone(value)
    );
  }
}
const chests = [
  {
    id:
      "seasonal:2026-12:chest:cosmetic1",
    seasonId: "2026-12",
    order: 1,
    name: "Baú de Pinheiro",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  },
  {
    id:
      "seasonal:2026-12:chest:cosmetic2",
    seasonId: "2026-12",
    order: 2,
    name: "Baú Rena",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  }
];


const normalized =
  normalizeSeasonalCosmetics(
    [
      {
        id: "natal:cachecol",
        name: "Cachecol Congelado",
        slot: "accessory",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:bota",
        name: "Bota Invernal",
        slot: "shoes",
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
  "natal:cachecol"
);
assert.equal(
  normalized.value[1]
    .introducedInSeasonalChestOrder,
  2
);
assert.equal(
  normalized.value[0].slot,
  "accessory"
);
assert.equal(
  normalized.value[1].slot,
  "shoes"
);


const generated =
  normalizeSeasonalCosmetics(
    [
      {
        name: "Chapéu de Neve",
        slot: "accessory",
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
  "seasonal-cosmetic:chapeu_de_neve:1"
);
assert.equal(
  generated.value[0].slot,
  "accessory"
);

const invalidSlot =
  normalizeSeasonalCosmetics(
    [
      {
        id: "natal:slot-invalido",
        name: "Cosmético inválido",
        slot: "hat",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      }
    ],
    chests
  );

assert.equal(
  invalidSlot.ok,
  false
);
assert.equal(
  invalidSlot.error,
  "INVALID_SEASONAL_COSMETIC"
);

const wrongChest =
  normalizeSeasonalCosmetics(
    [
      {
        id: "natal:erro",
        name: "Erro",
        slot: "hair",
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
  "INVALID_SEASONAL_COSMETIC_CHEST"
);


const duplicate =
  normalizeSeasonalCosmetics(
    [
      {
        id: "natal:igual",
        name: "Primeiro",
        slot: "top",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:igual",
        name: "Segundo",
        slot: "bottom",
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
  "DUPLICATE_SEASONAL_COSMETIC_ID"
);
const stored =
  normalizePvpSeasonContent(
    {
      id: "2026-12",
      year: 2026,
      month: 12,
      revision: 1,
      featuredElements: [],
      seasonalChests: chests,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: [],
      seasonalCosmetics:
        normalized.value,
      updatedAt: 1
    }
  );

assert.ok(stored);
assert.equal(stored.version, 7);
assert.equal(
  stored.seasonalCosmetics.length,
  2
);
assert.equal(
  stored.seasonalCosmetics[0]
    .introducedInSeasonalChestOrder,
  1
);


const legacyStored =
  normalizePvpSeasonContent(
    {
      id: "2026-12",
      year: 2026,
      month: 12,
      revision: 1,
      featuredElements: [],
      seasonalChests: chests,
      seasonalCosmetics: [
        {
          id: "natal:legado",
          name: "Cosmético legado",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );

assert.ok(
  legacyStored,
  "conteúdo histórico sem slot deve continuar legível"
);
assert.equal(
  legacyStored.seasonalCosmetics[0]
    .slot,
  null
);


const invalidStored =
  normalizePvpSeasonContent(
    {
      id: "2026-12",
      year: 2026,
      month: 12,
      revision: 1,
      featuredElements: [],
      seasonalChests: chests,
      seasonalCosmetics: [
        {
          id: "natal:fora",
          name: "Fora",
          introducedInSeasonalChestId:
            chests[1].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );

assert.equal(invalidStored, null);
const empty =
  createEmptyPvpSeasonContent(
    2026,
    12
  );

assert.deepEqual(
  empty.seasonalCosmetics,
  []
);


const storage =
  new MemoryStorage();

const firstSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        chests.map(
          chest => ({
            id: chest.id,
            seasonId: chest.seasonId,
            order: chest.order,
            name: chest.name,
            description: null
          })
        ),
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: [],
      seasonalCosmetics: [
        {
          id: "natal:cachecol",
          name: "Cachecol Congelado",
          slot: "accessory",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );

assert.equal(firstSave.ok, true);
assert.equal(firstSave.content.revision, 1);
const secondSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        firstSave.content.seasonalChests,
      seasonalCosmetics: [
        {
          id: "natal:cachecol",
          name: "Cachecol Congelado Renomeado",
          slot: "accessory",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        },
        {
          id: "natal:bota",
          name: "Bota Invernal",
          slot: "shoes",
          introducedInSeasonalChestId:
            chests[1].id,
          introducedInSeasonalChestOrder: 2
        }
      ]
    }
  );

assert.equal(secondSave.ok, true);
assert.equal(secondSave.content.revision, 2);
assert.equal(
  secondSave.content
    .seasonalCosmetics[0].id,
  "natal:cachecol",
  "editar o nome não pode alterar o ID permanente"
);
assert.equal(
  secondSave.content
    .seasonalCosmetics[0].name,
  "Cachecol Congelado Renomeado"
);
assert.equal(
  secondSave.content
    .seasonalCosmetics[0].slot,
  "accessory"
);
const historical =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    12,
    1
  );

assert.equal(historical.ok, true);
assert.equal(
  historical.content
    .seasonalCosmetics.length,
  1
);
assert.equal(
  historical.content
    .seasonalCosmetics[0].id,
  "natal:cachecol"
);
assert.equal(
  historical.content
    .seasonalCosmetics[0].name,
  "Cachecol Congelado",
  "a revisão histórica não pode ser alterada pelo rename posterior"
);
assert.equal(
  historical.content
    .seasonalCosmetics[0].slot,
  "accessory",
  "a revisão histórica deve preservar também o tipo do cosmético"
);


console.log(
  "OK: catálogo versionado de Cosméticos Sazonais"
);
