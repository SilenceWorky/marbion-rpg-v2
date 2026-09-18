import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";


const expectedSeasonPass = {
  seasonId: null,
  xp: 0,
  tier: 0,
  completed: false,
  postPassXp: 0,
  claimedRewards: []
};


const baseProfile =
  createBaseProfile(
    "silenceworky"
  );

assert.deepEqual(
  baseProfile.seasonPass,
  expectedSeasonPass,
  "perfil novo deve nascer com a base do passe zerada"
);


const legacyProfile =
  ensureProfileDefaults(
    {
      version: 2,
      user: "legacy",
      xp: 123,
      level: 4
    },
    "legacy"
  );

assert.deepEqual(
  legacyProfile.seasonPass,
  expectedSeasonPass,
  "perfil antigo sem seasonPass deve receber defaults sem perder compatibilidade"
);

assert.equal(
  legacyProfile.xp,
  123,
  "normalização do passe não pode alterar XP normal do personagem"
);

assert.equal(
  legacyProfile.level,
  4,
  "normalização do passe não pode alterar nível normal do personagem"
);


const partialProfile =
  ensureProfileDefaults(
    {
      version: 2,
      user: "partial",
      seasonPass: {
        seasonId: "2026-09",
        xp: 1234,
        tier: 7,
        claimedRewards: [
          1,
          2,
          3
        ]
      }
    },
    "partial"
  );

assert.deepEqual(
  partialProfile.seasonPass,
  {
    seasonId: "2026-09",
    xp: 1234,
    tier: 7,
    completed: false,
    postPassXp: 0,
    claimedRewards: [
      1,
      2,
      3
    ]
  },
  "seasonPass parcial deve preservar dados existentes e completar campos ausentes"
);


console.log(
  "✅ Base do Passe de Temporada no perfil validada."
);
