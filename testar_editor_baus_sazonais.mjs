import assert from "node:assert/strict";

import {
  normalizeSeasonalChests,
  normalizeSeasonalSkills
} from "./src/routes/api-admin-seasons.js";

import {
  normalizePvpSeasonContent,
  readPvpSeasonContentRevision,
  readPvpSeasonMonthContent,
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


const storage =
  new MemoryStorage();


const legacy =
  normalizePvpSeasonContent({
    version: 1,
    year: 2026,
    month: 11,
    summary:
      "Conteúdo anterior ao editor de baús.",
    seasonalSkills: [
      {
        id: "legada",
        element: "Fogo",
        name: "Habilidade Legada",
        rarity: "Comum"
      }
    ]
  });

assert.equal(
  legacy.version,
  4
);

assert.equal(
  legacy.revision,
  0
);

assert.deepEqual(
  legacy.seasonalChests,
  []
);

assert.equal(
  legacy.defaultSeasonalChestId,
  null,
  "conteúdo antigo não pode receber baú padrão automaticamente"
);

assert.deepEqual(
  legacy.seasonalChestRewardBindings,
  [],
  "conteúdo antigo não pode receber distribuição de baús automaticamente"
);

assert.deepEqual(
  legacy.seasonalChestPostPassPool,
  [],
  "conteúdo antigo não pode receber sorteio de pós-passe automaticamente"
);

assert.equal(
  legacy.seasonalSkills[0]
    .introducedInSeasonalChestId,
  null
);

assert.equal(
  legacy.seasonalSkills[0]
    .introducedInSeasonalChestOrder,
  null
);


const seasonId =
  "2026-12";

const chest1 = {
  id:
    "seasonal:2026-12:chest:pinheiro01",
  seasonId,
  order: 1,
  name:
    "Baú de Pinheiro",
  description:
    "Primeiro baú do Natal."
};

const normalizedChests =
  normalizeSeasonalChests(
    [chest1],
    seasonId
  );

assert.equal(
  normalizedChests.ok,
  true
);

const normalizedSkills =
  normalizeSeasonalSkills(
    [
      {
        id: "natal:a",
        element: "Fogo",
        name: "Presente A",
        rarity: "Comum",
        introducedInSeasonalChestId:
          chest1.id,
        introducedInSeasonalChestOrder:
          1
      }
    ],
    ["Fogo"],
    normalizedChests.value
  );

assert.equal(
  normalizedSkills.ok,
  true
);


const firstSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      summary:
        "Natal 2026",
      seasonalChests:
        normalizedChests.value,
      seasonalSkills:
        normalizedSkills.value
    }
  );

assert.equal(
  firstSave.ok,
  true
);

assert.equal(
  firstSave.content.revision,
  1
);

assert.equal(
  firstSave.content
    .seasonalChests[0]
    .poolRevision,
  1
);

assert.equal(
  firstSave.content
    .seasonalChests[0]
    .createdAt > 0,
  true
);


const reloaded1 =
  await readPvpSeasonMonthContent(
    storage,
    2026,
    12
  );

assert.equal(
  reloaded1.ok,
  true
);

assert.equal(
  reloaded1.content
    .seasonalChests[0].id,
  chest1.id
);

assert.equal(
  reloaded1.content
    .seasonalChests[0].name,
  "Baú de Pinheiro"
);


const revision1 =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    12,
    1
  );

assert.equal(
  revision1.ok,
  true
);

assert.equal(
  revision1.content
    .seasonalChests[0].name,
  "Baú de Pinheiro"
);


const editedChest1 = {
  ...reloaded1.content
    .seasonalChests[0],
  name:
    "Baú Pinheiro Real",
  description:
    "Descrição editada pelo ADM."
};

const secondSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      summary:
        reloaded1.content.summary,
      seasonalChests: [
        editedChest1
      ],
      seasonalSkills:
        reloaded1.content
          .seasonalSkills
    }
  );

assert.equal(
  secondSave.ok,
  true
);

assert.equal(
  secondSave.content.revision,
  2
);

assert.equal(
  secondSave.content
    .seasonalChests[0]
    .id,
  chest1.id
);

assert.equal(
  secondSave.content
    .seasonalChests[0]
    .order,
  1
);

assert.equal(
  secondSave.content
    .seasonalChests[0]
    .poolRevision,
  1
);

assert.equal(
  secondSave.content
    .seasonalChests[0]
    .name,
  "Baú Pinheiro Real"
);

assert.equal(
  secondSave.content
    .seasonalChests[0]
    .description,
  "Descrição editada pelo ADM."
);


const revision1AfterRename =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    12,
    1
  );

assert.equal(
  revision1AfterRename.content
    .seasonalChests[0].name,
  "Baú de Pinheiro",
  "Editar o nome atual não pode reescrever a revisão histórica."
);


const chest2 = {
  id:
    "seasonal:2026-12:chest:rena0002",
  seasonId,
  order: 2,
  name:
    "Baú Rena",
  description:
    "Segundo baú do Natal."
};

const thirdSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      summary:
        secondSave.content.summary,
      seasonalChests: [
        ...secondSave.content
          .seasonalChests,
        chest2
      ],
      seasonalSkills: [
        ...secondSave.content
          .seasonalSkills,
        {
          id: "natal:b",
          element: "Fogo",
          name: "Presente B",
          rarity: "Raro",
          introducedInSeasonalChestId:
            chest2.id,
          introducedInSeasonalChestOrder:
            2
        }
      ]
    }
  );

assert.equal(
  thirdSave.ok,
  true
);

assert.equal(
  thirdSave.content.revision,
  3
);

assert.deepEqual(
  thirdSave.content
    .seasonalChests
    .map(chest => [
      chest.order,
      chest.poolRevision
    ]),
  [
    [1, 1],
    [2, 3]
  ]
);


const forbiddenReorder =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        thirdSave.content
          .seasonalChests
          .map(chest =>
            chest.id === chest1.id
              ? {
                  ...chest,
                  order: 9
                }
              : chest
          ),
      seasonalSkills:
        thirdSave.content
          .seasonalSkills
    }
  );

assert.equal(
  forbiddenReorder.ok,
  false
);

assert.equal(
  forbiddenReorder.error,
  "SEASONAL_CHEST_IDENTITY_IMMUTABLE"
);


const forbiddenRemoval =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        thirdSave.content
          .seasonalChests[1]
      ],
      seasonalSkills:
        thirdSave.content
          .seasonalSkills
    }
  );

assert.equal(
  forbiddenRemoval.ok,
  false
);

assert.equal(
  forbiddenRemoval.error,
  "SEASONAL_CHEST_REMOVAL_FORBIDDEN"
);


const badAssociation =
  normalizeSeasonalSkills(
    [
      {
        id: "natal:erro",
        element: "Fogo",
        name: "Associação Inválida",
        rarity: "Comum",
        introducedInSeasonalChestId:
          chest2.id,
        introducedInSeasonalChestOrder:
          1
      }
    ],
    ["Fogo"],
    thirdSave.content
      .seasonalChests
  );

assert.equal(
  badAssociation.ok,
  false
);

assert.equal(
  badAssociation.error,
  "INVALID_SEASON_SKILL_CHEST"
);


console.log(
  "✅ Editor de Baús Sazonais: persistência, edição, recarregamento e imutabilidade validados."
);
