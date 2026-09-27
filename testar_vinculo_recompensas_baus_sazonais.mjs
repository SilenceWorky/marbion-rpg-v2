import assert from "node:assert/strict";

import {
  getSeasonPassSeasonalChestRewardSlots
} from "./src/config/seasonal-chest-reward-bindings.js";

import {
  normalizePvpSeasonContent,
  readPvpSeasonContentRevision,
  readPvpSeasonMonthContent,
  savePvpSeasonMonthContent
} from "./src/systems/pvp-season-content-store.js";

import {
  resolveSeasonPassSeasonalChestReward
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


const slots =
  getSeasonPassSeasonalChestRewardSlots();

assert.equal(
  slots.length,
  14,
  "13 patamares + pós-passe devem exigir configuração"
);

assert.equal(
  slots.find(
    slot =>
      slot.key ===
      "season_pass:tier:75"
  )?.quantity,
  2
);

assert.equal(
  slots.find(
    slot =>
      slot.key ===
      "season_pass:tier:100"
  )?.quantity,
  3
);

assert.equal(
  slots.find(
    slot =>
      slot.key ===
      "season_pass:post"
  )?.quantity,
  1
);


const legacy =
  normalizePvpSeasonContent({
    version: 2,
    year: 2025,
    month: 12,
    seasonalChests: [],
    seasonalSkills: [],
    seasonalConsumables: []
  });

assert.equal(
  legacy.version,
  3
);

assert.deepEqual(
  legacy.seasonalChestRewardBindings,
  [],
  "dados antigos não podem ganhar binding automaticamente"
);


const storage =
  new MemoryStorage();

const chest1 = {
  id:
    "seasonal:2026-12:chest:natal001",
  seasonId:
    "2026-12",
  order: 1,
  name:
    "Baú Congelado",
  description: null
};

const chest2 = {
  id:
    "seasonal:2026-12:chest:natal002",
  seasonId:
    "2026-12",
  order: 2,
  name:
    "Baú Rena",
  description: null
};

const save1 =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests: [
        chest1,
        chest2
      ],
      seasonalChestRewardBindings: [
        {
          key:
            "season_pass:tier:5",
          seasonalChestId:
            chest1.id
        },
        {
          key:
            "season_pass:tier:75",
          seasonalChestId:
            chest2.id
        },
        {
          key:
            "season_pass:tier:100",
          seasonalChestId:
            chest2.id
        },
        {
          key:
            "season_pass:post",
          seasonalChestId:
            chest2.id
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: []
    }
  );

assert.equal(
  save1.ok,
  true
);

assert.equal(
  save1.content.revision,
  1
);


const tier5v1 =
  resolveSeasonPassSeasonalChestReward(
    save1.content,
    {
      tier: 5
    }
  );

assert.equal(
  tier5v1.ok,
  true
);

assert.equal(
  tier5v1.chest.id,
  chest1.id
);

assert.equal(
  tier5v1.slot.quantity,
  1
);


const tier75v1 =
  resolveSeasonPassSeasonalChestReward(
    save1.content,
    {
      tier: 75
    }
  );

assert.equal(
  tier75v1.ok,
  true
);

assert.equal(
  tier75v1.chest.id,
  chest2.id
);

assert.equal(
  tier75v1.slot.quantity,
  2
);


const postV1 =
  resolveSeasonPassSeasonalChestReward(
    save1.content,
    {
      postPass: true
    }
  );

assert.equal(
  postV1.ok,
  true
);

assert.equal(
  postV1.chest.id,
  chest2.id
);


const save2 =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        save1.content
          .seasonalChests,
      seasonalChestRewardBindings:
        save1.content
          .seasonalChestRewardBindings
          .map(binding =>
            binding.key ===
            "season_pass:tier:5"
              ? {
                  ...binding,
                  seasonalChestId:
                    chest2.id
                }
              : binding
          ),
      seasonalSkills: [],
      seasonalConsumables: []
    }
  );

assert.equal(
  save2.ok,
  true
);

assert.equal(
  save2.content.revision,
  2
);

assert.equal(
  resolveSeasonPassSeasonalChestReward(
    save2.content,
    {
      tier: 5
    }
  ).chest.id,
  chest2.id,
  "configuração atual deve poder apontar o patamar para outro baú do mesmo ano"
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
  resolveSeasonPassSeasonalChestReward(
    revision1.content,
    {
      tier: 5
    }
  ).chest.id,
  chest1.id,
  "revisão histórica precisa preservar o binding antigo"
);


const chest2027 = {
  id:
    "seasonal:2027-12:chest:natal701",
  seasonId:
    "2027-12",
  order: 1,
  name:
    "Baú Natal 2027",
  description: null
};

const save2027 =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2027,
      month: 12,
      seasonalChests: [
        chest2027
      ],
      seasonalChestRewardBindings: [
        {
          key:
            "season_pass:tier:5",
          seasonalChestId:
            chest2027.id
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: []
    }
  );

assert.equal(
  save2027.ok,
  true
);

assert.equal(
  resolveSeasonPassSeasonalChestReward(
    save2027.content,
    {
      tier: 5
    }
  ).chest.id,
  chest2027.id,
  "2027 deve poder mapear o mesmo patamar para outro ID"
);


const crossSeason =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        save2.content
          .seasonalChests,
      seasonalChestRewardBindings: [
        {
          key:
            "season_pass:tier:5",
          seasonalChestId:
            chest2027.id
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: []
    }
  );

assert.equal(
  crossSeason.ok,
  false,
  "binding não pode apontar para baú de outro seasonId"
);


const unknownSlot =
  await savePvpSeasonMonthContent(
    storage,
    {
      year: 2026,
      month: 12,
      seasonalChests:
        save2.content
          .seasonalChests,
      seasonalChestRewardBindings: [
        {
          key:
            "season_pass:tier:6",
          seasonalChestId:
            chest1.id
        }
      ],
      seasonalSkills: [],
      seasonalConsumables: []
    }
  );

assert.equal(
  unknownSlot.ok,
  false,
  "patamar sem seasonal_chest não pode ganhar binding artificial"
);


const current =
  await readPvpSeasonMonthContent(
    storage,
    2026,
    12
  );

assert.equal(
  current.ok,
  true
);

assert.equal(
  current.content.revision,
  2,
  "tentativas inválidas não podem avançar a revisão persistida"
);


console.log(
  "✅ Vínculo anual de recompensas do Passe com Baús Sazonais validado."
);
