import assert from "node:assert/strict";

import {
  normalizeSeasonalVictoryMessages
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
      "seasonal:2026-12:chest:message1",
    seasonId:
      "2026-12",
    order: 1,
    name:
      "Baú de Pinheiro",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  },
  {
    id:
      "seasonal:2026-12:chest:message2",
    seasonId:
      "2026-12",
    order: 2,
    name:
      "Baú Rena",
    poolRevision: 1,
    createdAt: 1,
    updatedAt: 1
  }
];


const normalized =
  normalizeSeasonalVictoryMessages(
    [
      {
        id: "natal:neve",
        text:
          "A neve cai sobre mais uma vitória!",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:rena",
        text:
          "A rena chegou primeiro à vitória!",
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
  "natal:neve"
);
assert.equal(
  normalized.value[1]
    .introducedInSeasonalChestOrder,
  2
);


const generated =
  normalizeSeasonalVictoryMessages(
    [
      {
        text: "Vitória Congelada!",
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
  "seasonal-victory-message:vitoria_congelada_:1"
);


const wrongChest =
  normalizeSeasonalVictoryMessages(
    [
      {
        id: "natal:erro",
        text: "Erro",
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
  "INVALID_SEASONAL_VICTORY_MESSAGE_CHEST"
);


const duplicate =
  normalizeSeasonalVictoryMessages(
    [
      {
        id: "natal:igual",
        text: "Primeira",
        introducedInSeasonalChestId:
          chests[0].id,
        introducedInSeasonalChestOrder: 1
      },
      {
        id: "natal:igual",
        text: "Segunda",
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
  "DUPLICATE_SEASONAL_VICTORY_MESSAGE_ID"
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
      seasonalVictoryMessages:
        normalized.value,
      updatedAt: 1
    }
  );

assert.ok(stored);
assert.equal(
  stored.seasonalVictoryMessages.length,
  2
);
assert.equal(
  stored.seasonalVictoryMessages[0]
    .introducedInSeasonalChestOrder,
  1
);
assert.equal(
  stored.seasonalVictoryMessages[1]
    .introducedInSeasonalChestOrder,
  2
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
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: [
        {
          id: "natal:fora",
          text: "Fora",
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
  empty.seasonalVictoryMessages,
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
      seasonalVictoryMessages: [
        {
          id: "natal:neve",
          text:
            "A neve cai sobre mais uma vitória!",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        }
      ]
    }
  );
assert.equal(firstSave.ok, true);
assert.equal(firstSave.content.revision, 1);
assert.equal(
  firstSave.content
    .seasonalVictoryMessages.length,
  1
);


const secondSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        firstSave.content.seasonalChests,
      seasonalVictoryMessages: [
        {
          id: "natal:neve",
          text:
            "Texto atual editado na revisão 2.",
          introducedInSeasonalChestId:
            chests[0].id,
          introducedInSeasonalChestOrder: 1
        },
        {
          id: "natal:rena",
          text:
            "A rena chegou primeiro à vitória!",
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
    .seasonalVictoryMessages.length,
  2
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
    .seasonalVictoryMessages.length,
  1
);
assert.equal(
  historical.content
    .seasonalVictoryMessages[0].text,
  "A neve cai sobre mais uma vitória!"
);
assert.equal(
  historical.content
    .seasonalVictoryMessages[0].id,
  "natal:neve"
);


console.log(
  "OK: catálogo versionado de Mensagens de Vitória Sazonais"
);
