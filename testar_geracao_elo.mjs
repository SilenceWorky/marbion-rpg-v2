import assert from "node:assert/strict";

import {
  nextEloGeneration,
  syncProfileEloGeneration
} from "./src/systems/pvp-elo-generation.js";


function makeProfile() {
  return {
    user: "alice",
    race: "Terrariano",
    pvp: {
      rating: 2475,
      peakRating: 2600,
      wins: 31,
      losses: 12,
      duels: 43,
      streak: 5,
      bestStreak: 9,
      rank: "Corrompido I",
      prodigyPosition: 4,
      recentOpponents: {
        bob: [1000, 2000]
      },
      afkPenaltyLevel: 3,
      afkBlockedUntil: 123456,
      afkProbationUntil: 654321,
      resultLedger: [
        {
          battleId: "battle-1"
        }
      ]
    }
  };
}


console.log("=== GERAÇÃO GLOBAL DE ELO ===");

{
  const profile = makeProfile();
  const before = structuredClone(profile.pvp);

  const result =
    syncProfileEloGeneration(
      profile,
      0
    );

  assert.equal(result.ok, true);
  assert.equal(result.changed, false);
  assert.deepEqual(profile.pvp, before);

  console.log("✅ geração inicial 0 não reseta perfis legados");
}

{
  const profile = makeProfile();
  const before = structuredClone(profile.pvp);

  const result =
    syncProfileEloGeneration(
      profile,
      1
    );

  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  assert.equal(result.reset, true);

  assert.equal(profile.pvp.rating, 1000);
  assert.equal(profile.pvp.rank, "Prata III");
  assert.equal(profile.pvp.prodigyPosition, null);
  assert.equal(profile.pvp.eloGeneration, 1);

  assert.equal(profile.pvp.peakRating, before.peakRating);
  assert.equal(profile.pvp.wins, before.wins);
  assert.equal(profile.pvp.losses, before.losses);
  assert.equal(profile.pvp.duels, before.duels);
  assert.equal(profile.pvp.streak, before.streak);
  assert.equal(profile.pvp.bestStreak, before.bestStreak);
  assert.deepEqual(
    profile.pvp.recentOpponents,
    before.recentOpponents
  );
  assert.equal(
    profile.pvp.afkPenaltyLevel,
    before.afkPenaltyLevel
  );
  assert.equal(
    profile.pvp.afkBlockedUntil,
    before.afkBlockedUntil
  );
  assert.equal(
    profile.pvp.afkProbationUntil,
    before.afkProbationUntil
  );
  assert.deepEqual(
    profile.pvp.resultLedger,
    before.resultLedger
  );

  console.log("✅ geração nova reseta somente Elo/rank/Prodígio");
}

{
  const profile = makeProfile();

  const first =
    syncProfileEloGeneration(
      profile,
      2
    );

  assert.equal(first.changed, true);

  profile.pvp.rating = 1337;

  const second =
    syncProfileEloGeneration(
      profile,
      2
    );

  assert.equal(second.ok, true);
  assert.equal(second.changed, false);
  assert.equal(profile.pvp.rating, 1337);

  console.log("✅ mesma geração é idempotente e não reseta novamente");
}

{
  const profile = makeProfile();
  profile.pvp.eloGeneration = 1;

  const result =
    syncProfileEloGeneration(
      profile,
      4
    );

  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  assert.equal(profile.pvp.eloGeneration, 4);
  assert.equal(profile.pvp.rating, 1000);

  console.log("✅ perfil atrasado pode avançar várias gerações de uma vez");
}

{
  const profile = makeProfile();
  profile.pvp.eloGeneration = 5;

  const result =
    syncProfileEloGeneration(
      profile,
      4
    );

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "PROFILE_ELO_GENERATION_AHEAD"
  );
  assert.equal(profile.pvp.rating, 2475);

  console.log("✅ geração futura é rejeitada sem alterar o perfil");
}

{
  const next =
    nextEloGeneration(7);

  assert.deepEqual(
    next,
    {
      ok: true,
      before: 7,
      after: 8
    }
  );

  const overflow =
    nextEloGeneration(
      Number.MAX_SAFE_INTEGER
    );

  assert.equal(overflow.ok, false);
  assert.equal(
    overflow.error,
    "ELO_GENERATION_OVERFLOW"
  );

  console.log("✅ avanço da geração é determinístico e protegido contra overflow");
}


console.log("\n🏆 TODOS OS TESTES DA GERAÇÃO DE ELO PASSARAM.");
