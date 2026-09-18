import assert from "node:assert/strict";

import {
  SEASON_PASS_REWARDS,
  getSeasonPassRewards
} from "./src/config/season-pass-rewards.js";

import {
  SEASON_PASS_MAX_TIER
} from "./src/systems/season-pass-progression.js";


assert.equal(
  SEASON_PASS_REWARDS.length,
  SEASON_PASS_MAX_TIER,
  "o catálogo deve ter uma entrada para cada um dos 100 patamares"
);


for (
  let index = 0;
  index <
    SEASON_PASS_REWARDS.length;
  index += 1
) {
  assert.equal(
    SEASON_PASS_REWARDS[index].tier,
    index + 1,
    "os patamares devem ser sequenciais e únicos"
  );

  assert.ok(
    SEASON_PASS_REWARDS[index]
      .rewards.length >= 1,
    "todo patamar deve possuir ao menos uma recompensa"
  );
}


const expectedCosmetics =
  new Map([
    [
      10,
      "accessory"
    ],
    [
      25,
      "shoes"
    ],
    [
      50,
      "bottom"
    ],
    [
      75,
      "top"
    ],
    [
      99,
      "hair"
    ]
  ]);


for (
  const [
    tier,
    slot
  ] of expectedCosmetics
) {
  const entry =
    getSeasonPassRewards(
      tier
    );

  const cosmetic =
    entry.rewards.find(
      reward =>
        reward.type ===
        "season_cosmetic"
    );

  assert.equal(
    cosmetic?.slot,
    slot,
    `patamar ${tier} deve entregar a peça sazonal ${slot}`
  );
}


const finalTier =
  getSeasonPassRewards(
    100
  );

assert.ok(
  finalTier.rewards.some(
    reward =>
      reward.type ===
        "season_special" &&
      reward.key ===
        "annual_season_title"
  ),
  "patamar 100 deve entregar o título anual exclusivo"
);

assert.deepEqual(
  finalTier.rewards.find(
    reward =>
      reward.type ===
      "seasonal_chest"
  ),
  {
    type:
      "seasonal_chest",
    quantity: 3
  },
  "patamar 100 deve entregar 3 Baús Sazonais"
);


const tier97 =
  getSeasonPassRewards(
    97
  );

assert.deepEqual(
  tier97.rewards[0],
  {
    type: "scroll",
    rarity: "R4",
    elemental: true,
    guaranteed: true
  },
  "patamar 97 deve garantir Pergaminho Elemental R4"
);


const atomicRewards =
  SEASON_PASS_REWARDS
    .flatMap(
      entry =>
        entry.rewards
    )
    .filter(
      reward =>
        reward.type ===
        "atomic_chest"
    );

assert.ok(
  atomicRewards.every(
    reward =>
      reward.atoms >= 1 &&
      reward.atoms <= 4
  ),
  "o passe aprovado não deve entregar Baú Atômico V diretamente"
);


assert.equal(
  getSeasonPassRewards(0),
  null
);

assert.equal(
  getSeasonPassRewards(101),
  null
);


console.log(
  "✅ Catálogo de recompensas dos 100 patamares validado."
);
