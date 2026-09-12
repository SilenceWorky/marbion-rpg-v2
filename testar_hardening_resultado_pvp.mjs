import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PVP_RESULT_LEDGER_LIMIT,
  createPvpResultRecord,
  getPvpResultRecord,
  restorePvpRankingState,
  snapshotPvpRankingState,
  storePvpResultRecord,
  validatePvpResultRecord
} from "./src/systems/pvp-result-idempotency.js";


function makeProfile(user, rating = 1000) {
  return {
    user,
    pvp: {
      rating,
      peakRating: rating,
      wins: 0,
      losses: 0,
      duels: 0,
      streak: 0,
      bestStreak: 0,
      rank: "Prata III",
      recentOpponents: {},
      afkPenaltyLevel: 2,
      afkBlockedUntil: 123456,
      afkProbationUntil: 654321
    }
  };
}


console.log("=== HARDENING RESULTADO PvP EXACT-ONCE ===");

{
  const winner = makeProfile("alice", 1020);
  const loser = makeProfile("bob", 980);

  winner.pvp.rating = 1048;
  winner.pvp.peakRating = 1048;
  winner.pvp.wins = 1;
  winner.pvp.duels = 1;
  winner.pvp.streak = 1;
  winner.pvp.bestStreak = 1;
  winner.pvp.recentOpponents.bob = [1000];

  loser.pvp.rating = 950;
  loser.pvp.losses = 1;
  loser.pvp.duels = 1;
  loser.pvp.recentOpponents.alice = [1000];

  const result = {
    rated: true,
    winner: { before: 1020, after: 1048, gain: 28 },
    loser: { before: 980, after: 950, loss: 30 }
  };

  const record = createPvpResultRecord({
    battleId: "battle-1",
    winnerUser: "alice",
    loserUser: "bob",
    result,
    winnerProfile: winner,
    loserProfile: loser,
    lastCombat: 1000
  });

  assert.ok(record);
  assert.equal(
    validatePvpResultRecord(
      record,
      "battle-1",
      "alice",
      "bob"
    ),
    true
  );

  console.log("✅ registro determinístico é criado e validado");
}

{
  const winner = makeProfile("alice", 1048);
  const loser = makeProfile("bob", 980);

  winner.pvp.wins = 1;
  winner.pvp.duels = 1;
  winner.pvp.streak = 1;
  winner.pvp.bestStreak = 1;
  winner.pvp.recentOpponents.bob = [1000];

  const expectedLoser = makeProfile("bob", 950);
  expectedLoser.pvp.losses = 1;
  expectedLoser.pvp.duels = 1;
  expectedLoser.pvp.recentOpponents.alice = [1000];

  const result = {
    rated: true,
    winner: { after: 1048, gain: 28 },
    loser: { after: 950, loss: 30 }
  };

  const record = createPvpResultRecord({
    battleId: "battle-partial",
    winnerUser: "alice",
    loserUser: "bob",
    result,
    winnerProfile: winner,
    loserProfile: expectedLoser,
    lastCombat: 2000
  });

  storePvpResultRecord(winner, record);

  assert.ok(
    getPvpResultRecord(
      winner,
      "battle-partial"
    )
  );
  assert.equal(
    getPvpResultRecord(
      loser,
      "battle-partial"
    ),
    null
  );

  const afkBefore = {
    level: loser.pvp.afkPenaltyLevel,
    blocked: loser.pvp.afkBlockedUntil,
    probation: loser.pvp.afkProbationUntil
  };

  restorePvpRankingState(
    loser,
    record.loserState
  );
  storePvpResultRecord(
    loser,
    record
  );

  assert.equal(loser.pvp.rating, 950);
  assert.equal(loser.pvp.losses, 1);
  assert.equal(loser.pvp.duels, 1);
  assert.deepEqual(
    loser.pvp.recentOpponents.alice,
    [1000]
  );

  assert.deepEqual(
    {
      level: loser.pvp.afkPenaltyLevel,
      blocked: loser.pvp.afkBlockedUntil,
      probation: loser.pvp.afkProbationUntil
    },
    afkBefore
  );

  console.log("✅ save parcial pode reparar somente ranking sem apagar disciplina AFK");
}

{
  const profile = makeProfile("alice", 1000);

  for (let i = 0; i < PVP_RESULT_LEDGER_LIMIT + 25; i += 1) {
    storePvpResultRecord(profile, {
      battleId: `battle-${i}`,
      winnerUser: "alice",
      loserUser: "bob",
      lastCombat: i,
      result: { i },
      winnerState: snapshotPvpRankingState(profile, "bob"),
      loserState: snapshotPvpRankingState(makeProfile("bob"), "alice")
    });
  }

  assert.equal(
    profile.pvp.resultLedger.length,
    PVP_RESULT_LEDGER_LIMIT
  );
  assert.equal(
    profile.pvp.resultLedger[0].battleId,
    "battle-25"
  );

  console.log("✅ ledger é limitado para não crescer indefinidamente");
}

{
  const coordinator = fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

  assert.match(
    coordinator,
    /pvp-result-idempotency\.js/
  );
  assert.match(
    coordinator,
    /RANKED_RESULT_LEDGER_CONFLICT/
  );
  assert.match(
    coordinator,
    /repairedPartialWrite/
  );

  const battleIdUses =
    coordinator.match(
      /battleId:\s*\n\s*battle\.id/g
    ) || [];

  assert.ok(
    battleIdUses.length >= 3,
    `esperado >=3 usos de battle.id, encontrado ${battleIdUses.length}`
  );

  console.log("✅ integrações ranqueadas usam UUID da batalha");
}

console.log("\n🛡️ TODOS OS TESTES DE HARDENING EXACT-ONCE PASSARAM.");
