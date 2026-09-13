import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resetProfileEloState
} from "./src/systems/admin-elo-reset.js";


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


console.log("=== RESET ADMINISTRATIVO DE ELO ===");

{
  const profile = makeProfile();
  const before = structuredClone(profile.pvp);

  const result = resetProfileEloState(profile);

  assert.equal(result.ok, true);
  assert.equal(profile.pvp.rating, 1000);
  assert.equal(profile.pvp.rank, "Prata III");
  assert.equal(profile.pvp.prodigyPosition, null);

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

  console.log("✅ reset individual altera somente Elo/rank/Prodígio");
}

{
  const profile = makeProfile();
  profile.pvp.rating = 0;

  const result = resetProfileEloState(profile);

  assert.equal(result.before.rating, 0);
  assert.equal(profile.pvp.rating, 1000);

  console.log("✅ rating 0 é preservado corretamente no estado anterior");
}

{
  const dispatcher = fs.readFileSync(
    "src/routes/admin-dispatcher.js",
    "utf8"
  );

  assert.match(
    dispatcher,
    /admin-elo-reset\.js/
  );

  assert.match(
    dispatcher,
    /command === "elo"/
  );

  const route = fs.readFileSync(
    "src/routes/admin-elo-reset.js",
    "utf8"
  );

  assert.match(
    route,
    /adminResetIndividualElo/
  );

  assert.match(
    route,
    /reset geral de Elo ainda não está disponível com segurança/
  );

  console.log("✅ !adm elo reset está roteado e reset geral segue bloqueado");
}

console.log("\n🏆 TODOS OS TESTES DO RESET INDIVIDUAL DE ELO PASSARAM.");
