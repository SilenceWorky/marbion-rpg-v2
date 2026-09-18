import assert from "node:assert/strict";

import {
  SEASON_PASS_MAX_TIER,
  SEASON_PASS_POST_REWARD_XP,
  SEASON_PASS_TIER_COSTS,
  SEASON_PASS_TOTAL_XP,
  getSeasonPassProgress,
  getSeasonPassThreshold,
  getSeasonPassTierCost,
  resolvePostPassRewards,
  splitSeasonPassXp
} from "./src/systems/season-pass-progression.js";


assert.equal(
  SEASON_PASS_MAX_TIER,
  100
);

assert.equal(
  SEASON_PASS_TIER_COSTS.length,
  100,
  "o passe deve ter exatamente 100 patamares"
);

assert.equal(
  SEASON_PASS_TIER_COSTS.reduce(
    (sum, value) =>
      sum + value,
    0
  ),
  SEASON_PASS_TOTAL_XP,
  "a curva deve somar exatamente 53.250 XP"
);

assert.equal(
  SEASON_PASS_TOTAL_XP,
  53250
);

assert.equal(
  SEASON_PASS_POST_REWARD_XP,
  550
);


assert.equal(
  getSeasonPassTierCost(1),
  50
);

assert.equal(
  getSeasonPassTierCost(100),
  900
);

assert.equal(
  getSeasonPassTierCost(101),
  null
);


assert.equal(
  getSeasonPassThreshold(0),
  0
);

assert.equal(
  getSeasonPassThreshold(1),
  50
);

assert.equal(
  getSeasonPassThreshold(100),
  53250
);


assert.deepEqual(
  getSeasonPassProgress(0),
  {
    xp: 0,
    tier: 0,
    completed: false,
    xpIntoTier: 0,
    xpForNextTier: 50,
    xpRemainingToNextTier: 50
  }
);

assert.deepEqual(
  getSeasonPassProgress(49),
  {
    xp: 49,
    tier: 0,
    completed: false,
    xpIntoTier: 49,
    xpForNextTier: 50,
    xpRemainingToNextTier: 1
  }
);

assert.equal(
  getSeasonPassProgress(50).tier,
  1,
  "50 XP devem liberar o patamar 1"
);

assert.equal(
  getSeasonPassProgress(117).tier,
  2,
  "50 + 67 XP devem liberar o patamar 2"
);

assert.deepEqual(
  getSeasonPassProgress(53250),
  {
    xp: 53250,
    tier: 100,
    completed: true,
    xpIntoTier: 0,
    xpForNextTier: 0,
    xpRemainingToNextTier: 0
  }
);


assert.deepEqual(
  splitSeasonPassXp(
    53200,
    150
  ),
  {
    passXp: 53250,
    postPassGain: 100
  },
  "XP excedente ao completar o passe deve ir para o pós-passe"
);

assert.deepEqual(
  splitSeasonPassXp(
    53250,
    150
  ),
  {
    passXp: 53250,
    postPassGain: 150
  }
);


assert.deepEqual(
  resolvePostPassRewards(
    500,
    150
  ),
  {
    rewards: 1,
    postPassXp: 100
  },
  "550 XP devem gerar 1 recompensa e preservar o excedente"
);

assert.deepEqual(
  resolvePostPassRewards(
    500,
    1200
  ),
  {
    rewards: 3,
    postPassXp: 50
  },
  "o pós-passe deve suportar múltiplas recompensas na mesma concessão"
);


console.log(
  "✅ Curva e progresso do Passe de Temporada validados."
);
