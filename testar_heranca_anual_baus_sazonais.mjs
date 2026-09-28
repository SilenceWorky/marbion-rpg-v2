import assert from "node:assert/strict";

import {
  readPvpSeasonMonthContent,
  savePvpSeasonMonthContent
} from "./src/systems/pvp-season-content-store.js";

import {
  createSeasonalChestFromDefinition,
  getSeasonalChestState
} from "./src/systems/seasonal-chest-state.js";

import {
  createBaseProfile
} from "./src/core/profile.js";


class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    const value =
      this.data.get(key);

    return value === undefined
      ? undefined
      : structuredClone(value);
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

const chest2026A = {
  id:
    "seasonal:2026-12:chest:madeira01",
  seasonId:
    "2026-12",
  order: 1,
  name:
    "Baú De Madeira Congelada",
  description:
    "Madeiras geladas."
};

const chest2026B = {
  id:
    "seasonal:2026-12:chest:rena0002",
  seasonId:
    "2026-12",
  order: 2,
  name:
    "Baú De Rena",
  description:
    "Rena."
};


const save2026 =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest2026A,
        chest2026B
      ],
      defaultSeasonalChestId:
        chest2026A.id,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: []
    }
  );

assert.equal(
  save2026.ok,
  true
);

assert.equal(
  save2026.content.version,
  5
);

assert.equal(
  save2026.content
    .seasonalChests[0].id,
  chest2026A.id
);

assert.equal(
  save2026.content
    .seasonalChests[0].poolRevision,
  1
);


const read2027BeforeSave =
  await readPvpSeasonMonthContent(
    storage,
    2027,
    12
  );

assert.equal(
  read2027BeforeSave.ok,
  true
);

assert.deepEqual(
  read2027BeforeSave.content
    .seasonalChests
    .map(chest => chest.id),
  [
    chest2026A.id,
    chest2026B.id
  ],
  "Dezembro/2027 deve herdar os mesmos IDs de Dezembro/2026"
);

for (
  const chest of
    read2027BeforeSave.content
      .seasonalChests
) {
  assert.equal(
    chest.seasonId,
    "2027-12"
  );

  assert.equal(
    chest.originSeasonId,
    "2026-12"
  );

  assert.equal(
    chest.poolRevision,
    null,
    "baú herdado ainda não publicado em 2027 não pode reutilizar a revisão de 2026"
  );

  assert.equal(
    chest.inherited,
    true
  );
}


const save2027Initial =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2027,
      month: 12,
      seasonalChests:
        read2027BeforeSave.content
          .seasonalChests,
      defaultSeasonalChestId:
        chest2026B.id,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: []
    }
  );

assert.equal(
  save2027Initial.ok,
  true
);

assert.deepEqual(
  save2027Initial.content
    .seasonalChests
    .map(chest => [
      chest.id,
      chest.seasonId,
      chest.originSeasonId,
      chest.poolRevision
    ]),
  [
    [
      chest2026A.id,
      "2027-12",
      "2026-12",
      1
    ],
    [
      chest2026B.id,
      "2027-12",
      "2026-12",
      1
    ]
  ],
  "primeiro save de 2027 deve publicar os mesmos IDs numa revisão anual de 2027"
);


const chest2027C = {
  id:
    "seasonal:2027-12:chest:novo0003",
  seasonId:
    "2027-12",
  order: 3,
  name:
    "Baú Novo de 2027",
  description:
    "Só existe a partir de 2027."
};

const save2027WithNewChest =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2027,
      month: 12,
      seasonalChests: [
        ...save2027Initial.content
          .seasonalChests
          .map(chest =>
            chest.id ===
            chest2026A.id
              ? {
                  ...chest,
                  name:
                    "Baú De Madeira Congelada 2"
                }
              : chest
          ),
        chest2027C
      ],
      defaultSeasonalChestId:
        chest2026B.id,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: []
    }
  );

assert.equal(
  save2027WithNewChest.ok,
  true
);

assert.equal(
  save2027WithNewChest.content
    .seasonalChests[2].id,
  chest2027C.id
);


const read2028 =
  await readPvpSeasonMonthContent(
    storage,
    2028,
    12
  );

assert.deepEqual(
  read2028.content
    .seasonalChests
    .map(chest => chest.id),
  [
    chest2026A.id,
    chest2026B.id,
    chest2027C.id
  ],
  "2028 deve herdar todos os baús criados até 2027"
);

assert.equal(
  read2028.content
    .seasonalChests[0].name,
  "Baú De Madeira Congelada 2",
  "edição de 2027 deve seguir para os anos futuros"
);

for (
  const chest of
    read2028.content
      .seasonalChests
) {
  assert.equal(
    chest.seasonId,
    "2028-12"
  );

  assert.equal(
    chest.poolRevision,
    null
  );
}


const read2026Again =
  await readPvpSeasonMonthContent(
    storage,
    2026,
    12
  );

assert.deepEqual(
  read2026Again.content
    .seasonalChests
    .map(chest => chest.id),
  [
    chest2026A.id,
    chest2026B.id
  ],
  "baú criado em 2027 não pode retroagir para 2026"
);

assert.equal(
  read2026Again.content
    .seasonalChests[0].name,
  "Baú De Madeira Congelada",
  "snapshot anual de 2026 deve permanecer histórico"
);


const save2026Again =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        read2026Again.content
          .seasonalChests,
      defaultSeasonalChestId:
        chest2026A.id,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [],
      seasonalVictoryMessages: []
    }
  );

assert.equal(
  save2026Again.ok,
  true
);

const read2029 =
  await readPvpSeasonMonthContent(
    storage,
    2029,
    12
  );

assert.equal(
  read2029.content
    .seasonalChests[0].name,
  "Baú De Madeira Congelada 2",
  "salvar 2026 depois de 2027 não pode reverter o catálogo mensal"
);


const november2027 =
  await readPvpSeasonMonthContent(
    storage,
    2027,
    11
  );

assert.equal(
  november2027.content
    .seasonalChests.length,
  0,
  "baús de Dezembro nunca podem aparecer em Novembro"
);


const profile =
  createBaseProfile(
    "inheritance-test"
  );

const definition2027 =
  save2027WithNewChest.content
    .seasonalChests
    .find(
      chest =>
        chest.id ===
        chest2026A.id
    );

const created =
  createSeasonalChestFromDefinition(
    profile,
    definition2027,
    {
      createdAt: 12345
    }
  );

assert.equal(
  created.ok,
  true,
  "instância de 2027 deve aceitar ID originado em 2026 do mesmo mês"
);

const state =
  getSeasonalChestState(
    created.chest
  );

assert.equal(
  state.ok,
  true
);

assert.equal(
  state.state.seasonId,
  "2027-12"
);

assert.equal(
  state.state.seasonalChestId,
  chest2026A.id
);

assert.equal(
  state.state.poolRevision,
  1
);


console.log(
  "✅ Herança anual dos Baús Sazonais validada: mesmo ID, histórico anual preservado e sem retroação."
);
