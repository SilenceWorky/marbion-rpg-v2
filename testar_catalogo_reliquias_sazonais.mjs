import assert from "node:assert/strict";

import {
  normalizeSeasonalRelics
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
      "seasonal:2026-09:chest:relic1",
    seasonId: "2026-09",
    order: 1,
    name: "Baú do Jardim",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  },
  {
    id:
      "seasonal:2026-09:chest:relic2",
    seasonId: "2026-09",
    order: 2,
    name: "Baú do Criador",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  }
];

const normalized =
  normalizeSeasonalRelics(
    [
      {
        id:
          "jardim:fragmento-criador",
        name:
          "Fragmento do Jardim do Criador",
        description:
          "Um fragmento antigo.",
        lore:
          "Vestígio de uma era esquecida.",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id:
          "jardim:semente-primeva",
        name:
          "Semente Primeva",
        description:
          "Uma semente petrificada.",
        lore:
          "Nunca germinou desde a queda do jardim.",
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
  "jardim:fragmento-criador"
);
assert.equal(
  normalized.value[0].lore,
  "Vestígio de uma era esquecida."
);
assert.equal(
  normalized.value[1]
    .introducedInSeasonalChestOrder,
  2
);

const generated =
  normalizeSeasonalRelics(
    [
      {
        name:
          "Fragmento do Jardim do Criador",
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
  "seasonal-relic:fragmento_do_jardim_do_criador:1"
);

const wrongChest =
  normalizeSeasonalRelics(
    [
      {
        id: "jardim:erro",
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
  "INVALID_SEASONAL_RELIC_CHEST"
);

const duplicate =
  normalizeSeasonalRelics(
    [
      {
        id: "jardim:igual",
        name: "Primeira",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "jardim:igual",
        name: "Segunda",
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
  "DUPLICATE_SEASONAL_RELIC_ID"
);

const stored =
  normalizePvpSeasonContent({
    id: "2026-09",
    year: 2026,
    month: 9,
    revision: 1,
    featuredElements: [],
    seasonalChests: chests,
    seasonalSkills: [],
    seasonalConsumables: [],
    seasonalPvpFinishers: [],
    seasonalVictoryMessages: [],
    seasonalCosmetics: [],
    seasonalRelics:
      normalized.value,
    updatedAt: 1
  });

assert.ok(stored);
assert.equal(stored.version, 7);
assert.equal(
  stored.seasonalRelics.length,
  2
);
assert.equal(
  stored.seasonalRelics[0].description,
  "Um fragmento antigo."
);
assert.equal(
  stored.seasonalRelics[0].lore,
  "Vestígio de uma era esquecida."
);

const invalidStored =
  normalizePvpSeasonContent({
    id: "2026-09",
    year: 2026,
    month: 9,
    revision: 1,
    featuredElements: [],
    seasonalChests: chests,
    seasonalRelics: [
      {
        id: "jardim:fora",
        name: "Fora",
        introducedInSeasonalChestId:
          chests[1].id,
        introducedInSeasonalChestOrder: 1
      }
    ]
  });

assert.equal(invalidStored, null);

const empty =
  createEmptyPvpSeasonContent(
    2026,
    9
  );

assert.deepEqual(
  empty.seasonalRelics,
  []
);

const storage =
  new MemoryStorage();

const firstSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 9,
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
      seasonalRelics: [
        {
          id:
            "jardim:fragmento-criador",
          name:
            "Fragmento do Jardim do Criador",
          description:
            "Um fragmento antigo.",
          lore:
            "Vestígio de uma era esquecida.",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );

assert.equal(firstSave.ok, true);
assert.equal(
  firstSave.content.revision,
  1
);

const secondSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 9,
      seasonalChests:
        firstSave.content.seasonalChests,
      seasonalRelics: [
        {
          id:
            "jardim:fragmento-criador",
          name:
            "Fragmento Renomeado",
          description:
            "Descrição revisada.",
          lore:
            "Lore revisada.",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );

assert.equal(secondSave.ok, true);
assert.equal(
  secondSave.content.revision,
  2
);
assert.equal(
  secondSave.content
    .seasonalRelics[0].id,
  "jardim:fragmento-criador",
  "editar nome/lore não pode alterar o ID permanente"
);

const historical =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    9,
    1
  );

assert.equal(historical.ok, true);
assert.equal(
  historical.content
    .seasonalRelics[0].name,
  "Fragmento do Jardim do Criador"
);
assert.equal(
  historical.content
    .seasonalRelics[0].lore,
  "Vestígio de uma era esquecida."
);

console.log(
  "OK: catálogo versionado de Relíquias Sazonais"
);
