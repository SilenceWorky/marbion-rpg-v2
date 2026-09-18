import assert from "node:assert/strict";

import {
  applySeasonPassXp,
  createSeasonPassState,
  syncSeasonPassState
} from "./src/systems/season-pass-state.js";


const profile = {
  user: "silenceworky",
  seasonPass:
    createSeasonPassState()
};


const firstSync =
  syncSeasonPassState(
    profile,
    "2026-09"
  );

assert.equal(
  firstSync.ok,
  true
);

assert.equal(
  firstSync.changedSeason,
  true
);

assert.deepEqual(
  profile.seasonPass,
  {
    seasonId: "2026-09",
    xp: 0,
    tier: 0,
    completed: false,
    postPassXp: 0,
    claimedRewards: []
  }
);


const firstAward =
  applySeasonPassXp(
    profile,
    {
      seasonId: "2026-09",
      amount: 50
    }
  );

assert.equal(
  firstAward.ok,
  true
);

assert.equal(
  firstAward.xpGained,
  50
);

assert.equal(
  firstAward.tier,
  1
);

assert.deepEqual(
  firstAward.unlockedTiers,
  [
    1
  ]
);


const subAward =
  applySeasonPassXp(
    profile,
    {
      seasonId: "2026-09",
      amount: 50,
      multiplier: 2
    }
  );

assert.equal(
  subAward.xpGained,
  100,
  "SUB deve conseguir receber 2x XP do passe quando o multiplicador for 2"
);

assert.equal(
  profile.seasonPass.xp,
  150
);


const nearEndProfile = {
  user: "fim",
  seasonPass: {
    seasonId: "2026-09",
    xp: 53200,
    tier: 99,
    completed: false,
    postPassXp: 500,
    claimedRewards: [
      1,
      10,
      99
    ]
  }
};

const crossing =
  applySeasonPassXp(
    nearEndProfile,
    {
      seasonId: "2026-09",
      amount: 150
    }
  );

assert.equal(
  crossing.ok,
  true
);

assert.equal(
  crossing.xp,
  53250
);

assert.equal(
  crossing.tier,
  100
);

assert.equal(
  crossing.completed,
  true
);

assert.deepEqual(
  crossing.unlockedTiers,
  [
    100
  ]
);

assert.equal(
  crossing.postPassXpGained,
  100,
  "os 100 XP excedentes devem ir para o pós-passe"
);

assert.equal(
  crossing.postPassRewardsUnlocked,
  1,
  "500 + 100 deve liberar 1 recompensa pós-passe"
);

assert.equal(
  crossing.postPassXp,
  50,
  "depois de gastar 550 XP, devem sobrar 50"
);

assert.deepEqual(
  nearEndProfile.seasonPass
    .claimedRewards,
  [
    1,
    10,
    99
  ],
  "ganhar XP não deve marcar recompensas como resgatadas automaticamente"
);


const resetProfile = {
  user: "virada",
  seasonPass: {
    seasonId: "2026-09",
    xp: 53250,
    tier: 100,
    completed: true,
    postPassXp: 400,
    claimedRewards: [
      1,
      100
    ]
  }
};

const october =
  applySeasonPassXp(
    resetProfile,
    {
      seasonId: "2026-10",
      amount: 50
    }
  );

assert.equal(
  october.seasonReset,
  true,
  "mudança de seasonId deve iniciar um passe novo"
);

assert.deepEqual(
  resetProfile.seasonPass,
  {
    seasonId: "2026-10",
    xp: 50,
    tier: 1,
    completed: false,
    postPassXp: 0,
    claimedRewards: []
  }
);


const invalid =
  applySeasonPassXp(
    {},
    {
      seasonId: "",
      amount: 50
    }
  );

assert.equal(
  invalid.ok,
  false
);


console.log(
  "✅ Estado e concessão de XP do Passe de Temporada validados."
);
