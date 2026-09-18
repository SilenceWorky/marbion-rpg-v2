import assert from "node:assert/strict";

import {
  canClaimSeasonPassTier,
  ensureSeasonPassClaimState,
  getClaimableSeasonPassTiers,
  markSeasonPassTierClaimed,
  markSeasonPassTiersClaimed
} from "./src/systems/season-pass-rewards-state.js";


const profile = {
  user: "silenceworky",
  seasonPass: {
    seasonId: "2026-09",
    xp: 243,
    tier: 3,
    completed: false,
    postPassXp: 0,
    claimedRewards: [
      2,
      2,
      "1",
      999,
      "abc"
    ]
  }
};


const ensured =
  ensureSeasonPassClaimState(
    profile
  );

assert.equal(
  ensured.ok,
  true
);

assert.deepEqual(
  profile.seasonPass
    .claimedRewards,
  [
    1,
    2
  ],
  "claimedRewards deve ser normalizado, ordenado e sem duplicatas"
);


const claimable =
  getClaimableSeasonPassTiers(
    profile
  );

assert.deepEqual(
  claimable.claimableTiers,
  [
    3
  ],
  "apenas recompensas liberadas e ainda não resgatadas devem aparecer"
);


assert.deepEqual(
  canClaimSeasonPassTier(
    profile,
    4
  ),
  {
    ok: false,
    error:
      "PASS_TIER_LOCKED",
    tier: 4
  },
  "não pode resgatar patamar ainda bloqueado"
);


assert.deepEqual(
  canClaimSeasonPassTier(
    profile,
    2
  ),
  {
    ok: false,
    error:
      "PASS_REWARD_ALREADY_CLAIMED",
    tier: 2
  },
  "não pode resgatar o mesmo patamar duas vezes"
);


const marked =
  markSeasonPassTierClaimed(
    profile,
    3
  );

assert.equal(
  marked.ok,
  true
);

assert.deepEqual(
  profile.seasonPass
    .claimedRewards,
  [
    1,
    2,
    3
  ]
);


const bulkProfile = {
  user: "bulk",
  seasonPass: {
    seasonId: "2026-09",
    xp: 1000,
    tier: 8,
    completed: false,
    postPassXp: 0,
    claimedRewards: [
      1,
      3
    ]
  }
};

const bulk =
  markSeasonPassTiersClaimed(
    bulkProfile,
    [
      2,
      4,
      5,
      6,
      7,
      8
    ]
  );

assert.equal(
  bulk.ok,
  true
);

assert.deepEqual(
  bulkProfile.seasonPass
    .claimedRewards,
  [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8
  ],
  "resgate em lote deve preservar o histórico e marcar todos os novos patamares"
);


const atomicityProfile = {
  user: "atomicity",
  seasonPass: {
    seasonId: "2026-09",
    xp: 500,
    tier: 5,
    completed: false,
    postPassXp: 0,
    claimedRewards: [
      1
    ]
  }
};

const before =
  JSON.stringify(
    atomicityProfile.seasonPass
      .claimedRewards
  );

const failedBulk =
  markSeasonPassTiersClaimed(
    atomicityProfile,
    [
      2,
      6
    ]
  );

assert.equal(
  failedBulk.ok,
  false
);

assert.equal(
  failedBulk.error,
  "PASS_TIER_LOCKED"
);

assert.equal(
  JSON.stringify(
    atomicityProfile.seasonPass
      .claimedRewards
  ),
  before,
  "resgate em lote inválido não pode marcar parcialmente recompensas"
);


console.log(
  "✅ Estado de resgate das recompensas do Passe validado."
);
