import assert from "node:assert/strict";

import {
  savePvpSeasonMonthContent
} from "./src/systems/pvp-season-content-store.js";

import {
  getSeasonPassPostSeasonalChestRewardPool,
  resolveSeasonPassSeasonalChestReward,
  rollSeasonPassPostSeasonalChestReward
} from "./src/systems/seasonal-chest-reward-binding-resolver.js";


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

const chest1 = {
  id:
    "seasonal:2026-12:chest:padrao01",
  seasonId:
    "2026-12",
  order: 1,
  name:
    "Baú de Madeira Congelada",
  description: null
};

const chest2 = {
  id:
    "seasonal:2026-12:chest:rena0002",
  seasonId:
    "2026-12",
  order: 2,
  name:
    "Baú de Rena",
  description: null
};

const chest3 = {
  id:
    "seasonal:2026-12:chest:bau00003",
  seasonId:
    "2026-12",
  order: 3,
  name:
    "Baú 3",
  description: null
};


const saved =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest1,
        chest2,
        chest3
      ],
      defaultSeasonalChestId:
        chest1.id,
      seasonalChestRewardBindings: [
        {
          key:
            "season_pass:tier:75",
          seasonalChestId:
            chest2.id
        }
      ],
      seasonalChestPostPassPool: [
        {
          seasonalChestId:
            chest1.id,
          chancePercent: 50
        },
        {
          seasonalChestId:
            chest2.id,
          chancePercent: 30
        },
        {
          seasonalChestId:
            chest3.id,
          chancePercent: 20
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: []
    }
  );

assert.equal(
  saved.ok,
  true
);

assert.equal(
  saved.content.version,
  4
);

assert.equal(
  saved.content
    .defaultSeasonalChestId,
  chest1.id
);


const tier5 =
  resolveSeasonPassSeasonalChestReward(
    saved.content,
    {
      tier: 5
    }
  );

assert.equal(
  tier5.ok,
  true
);

assert.equal(
  tier5.source,
  "default"
);

assert.equal(
  tier5.chest.id,
  chest1.id,
  "patamar sem exceção deve herdar o baú padrão do mês"
);


const tier75 =
  resolveSeasonPassSeasonalChestReward(
    saved.content,
    {
      tier: 75
    }
  );

assert.equal(
  tier75.ok,
  true
);

assert.equal(
  tier75.source,
  "override"
);

assert.equal(
  tier75.chest.id,
  chest2.id,
  "exceção do patamar deve substituir o padrão"
);

assert.equal(
  tier75.slot.quantity,
  2,
  "quantidade do catálogo do Passe deve continuar intacta"
);


const postPool =
  getSeasonPassPostSeasonalChestRewardPool(
    saved.content
  );

assert.equal(
  postPool.ok,
  true
);

assert.equal(
  postPool.source,
  "post_pass_pool"
);

assert.deepEqual(
  postPool.pool.map(
    entry => [
      entry.chest.id,
      entry.chancePercent
    ]
  ),
  [
    [chest1.id, 50],
    [chest2.id, 30],
    [chest3.id, 20]
  ]
);


const rollA =
  rollSeasonPassPostSeasonalChestReward(
    saved.content,
    () => 0.10
  );

assert.equal(
  rollA.chest.id,
  chest1.id
);

const rollB =
  rollSeasonPassPostSeasonalChestReward(
    saved.content,
    () => 0.60
  );

assert.equal(
  rollB.chest.id,
  chest2.id
);

const rollC =
  rollSeasonPassPostSeasonalChestReward(
    saved.content,
    () => 0.95
  );

assert.equal(
  rollC.chest.id,
  chest3.id
);


const noCustomPost =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        saved.content.seasonalChests,
      defaultSeasonalChestId:
        chest1.id,
      seasonalChestRewardBindings: [],
      seasonalChestPostPassPool: [],
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: []
    }
  );

assert.equal(
  noCustomPost.ok,
  true
);

const fallbackPost =
  getSeasonPassPostSeasonalChestRewardPool(
    noCustomPost.content
  );

assert.equal(
  fallbackPost.ok,
  true
);

assert.equal(
  fallbackPost.source,
  "default"
);

assert.equal(
  fallbackPost.pool.length,
  1
);

assert.equal(
  fallbackPost.pool[0]
    .chest.id,
  chest1.id
);

assert.equal(
  fallbackPost.pool[0]
    .chancePercent,
  100
);


const invalidTotal =
  await savePvpSeasonMonthContent(
    new MemoryStorage(),
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest1,
        chest2
      ],
      defaultSeasonalChestId:
        chest1.id,
      seasonalChestPostPassPool: [
        {
          seasonalChestId:
            chest1.id,
          chancePercent: 70
        },
        {
          seasonalChestId:
            chest2.id,
          chancePercent: 20
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: []
    }
  );

assert.equal(
  invalidTotal.ok,
  false,
  "pool personalizado do pós-passe precisa somar 100%"
);


const crossSeasonDefault =
  await savePvpSeasonMonthContent(
    new MemoryStorage(),
    {
      year: 2027,
      month: 12,
      seasonalChests: [
        {
          ...chest1,
          id:
            "seasonal:2027-12:chest:novo2027",
          seasonId:
            "2027-12"
        }
      ],
      defaultSeasonalChestId:
        chest1.id,
      seasonalSkills: [],
      seasonalConsumables: [],
      seasonalPvpFinishers: []
    }
  );

assert.equal(
  crossSeasonDefault.ok,
  false,
  "baú padrão não pode apontar para identidade de outro seasonId"
);


console.log(
  "✅ Baú padrão, exceções e sorteio ponderado do pós-passe validados."
);
