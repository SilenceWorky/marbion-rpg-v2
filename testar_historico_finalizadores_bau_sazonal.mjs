import assert from "node:assert/strict";

import {
  readPvpSeasonContentRevision,
  savePvpSeasonMonthContent
} from "./src/systems/pvp-season-content-store.js";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  getEligibleSeasonalChestPvpFinishers
} from "./src/systems/seasonal-chest-pvp-finisher-resolver.js";


class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  async get(key) {
    if (!this.map.has(key)) {
      return undefined;
    }

    return structuredClone(
      this.map.get(key)
    );
  }

  async put(key, value) {
    this.map.set(
      key,
      structuredClone(value)
    );
  }
}


const storage =
  new MemoryStorage();

const chest1 = {
  id:
    "seasonal:2026-12:chest:hist001",
  seasonId:
    "2026-12",
  order: 1,
  name:
    "Baú de Pinheiro"
};

const firstSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest1
      ],
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [
        {
          id: "natal:nevasca",
          name: "Nevasca Final",
          introducedInSeasonalChestId:
            chest1.id,
          introducedInSeasonalChestOrder:
            1
        }
      ]
    }
  );

assert.equal(firstSave.ok, true);
assert.equal(
  firstSave.content.revision,
  1
);
assert.equal(
  firstSave.content.seasonalChests[0]
    .poolRevision,
  1
);
assert.deepEqual(
  firstSave.content
    .seasonalPvpFinishers
    .map(item => item.id),
  ["natal:nevasca"]
);

const chest2 = {
  id:
    "seasonal:2026-12:chest:hist002",
  seasonId:
    "2026-12",
  order: 2,
  name:
    "Baú Rena"
};

const secondSave =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest1,
        chest2
      ],
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: [
        {
          id: "natal:nevasca",
          name: "Nevasca Final",
          introducedInSeasonalChestId:
            chest1.id,
          introducedInSeasonalChestOrder:
            1
        },
        {
          id: "natal:rena",
          name: "Investida da Rena",
          introducedInSeasonalChestId:
            chest2.id,
          introducedInSeasonalChestOrder:
            2
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
  secondSave.content.seasonalChests[0]
    .poolRevision,
  1,
  "Baú #1 precisa manter sua revisão histórica original"
);
assert.equal(
  secondSave.content.seasonalChests[1]
    .poolRevision,
  2,
  "Baú #2 nasce na revisão 2"
);
assert.deepEqual(
  secondSave.content
    .seasonalPvpFinishers
    .map(item => item.id),
  [
    "natal:nevasca",
    "natal:rena"
  ]
);

const revision1 =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    12,
    1
  );

const revision2 =
  await readPvpSeasonContentRevision(
    storage,
    2026,
    12,
    2
  );

assert.equal(revision1.ok, true);
assert.equal(revision2.ok, true);

assert.deepEqual(
  revision1.content
    .seasonalPvpFinishers
    .map(item => item.id),
  ["natal:nevasca"],
  "revisão 1 não pode receber Finalizador publicado na revisão 2"
);

assert.deepEqual(
  revision2.content
    .seasonalPvpFinishers
    .map(item => item.id),
  [
    "natal:nevasca",
    "natal:rena"
  ]
);
const profile =
  createBaseProfile(
    "historico-finalizadores"
  );

const pendingChest1 = {
  seasonId: "2026-12",
  seasonalChestId:
    chest1.id,
  chestOrder: 1,
  poolRevision: 1,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_pvp_finisher",
        resolved: false
      }
    ]
  }
};

const eligibleOldChest =
  getEligibleSeasonalChestPvpFinishers(
    profile,
    pendingChest1,
    revision1.content
  );

assert.equal(
  eligibleOldChest.ok,
  true
);
assert.deepEqual(
  eligibleOldChest.catalogCandidates
    .map(item => item.id),
  ["natal:nevasca"]
);

const oldAgainstLatest =
  getEligibleSeasonalChestPvpFinishers(
    profile,
    pendingChest1,
    revision2.content
  );

assert.equal(
  oldAgainstLatest.ok,
  false
);
assert.equal(
  oldAgainstLatest.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH",
  "Baú antigo precisa obrigatoriamente usar seu snapshot histórico"
);

const pendingChest2 = {
  seasonId: "2026-12",
  seasonalChestId:
    chest2.id,
  chestOrder: 2,
  poolRevision: 2,
  rewardPlan: {
    rewards: [
      {
        type:
          "seasonal_pvp_finisher",
        resolved: false
      }
    ]
  }
};

const eligibleNewChest =
  getEligibleSeasonalChestPvpFinishers(
    profile,
    pendingChest2,
    revision2.content
  );

assert.equal(
  eligibleNewChest.ok,
  true
);
assert.deepEqual(
  eligibleNewChest.catalogCandidates
    .map(item => item.id),
  [
    "natal:nevasca",
    "natal:rena"
  ],
  "Baú #2 deve acessar conteúdos #1 + #2 da mesma temporada"
);

console.log(
  "OK: histórico imutável de Finalizadores PvP Sazonais por poolRevision"
);
