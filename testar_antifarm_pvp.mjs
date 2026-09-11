import assert from "node:assert/strict";

import {
  PVP_PAIR_WINDOW_MS,
  applyRankedResult,
  getRankFromRating
} from "./src/systems/pvp-ranking.js";


function profile(
  user,
  rating = 1000
) {
  return {
    user,
    pvp: {
      rating,
      peakRating: rating,
      rank:
        getRankFromRating(
          rating
        ).label,
      wins: 0,
      losses: 0,
      duels: 0,
      streak: 0,
      bestStreak: 0,
      recentOpponents: {}
    }
  };
}


function snapshotRankedStats(
  player
) {
  return {
    rating:
      player.pvp.rating,
    peakRating:
      player.pvp.peakRating,
    wins:
      player.pvp.wins,
    losses:
      player.pvp.losses,
    duels:
      player.pvp.duels,
    streak:
      player.pvp.streak,
    bestStreak:
      player.pvp.bestStreak
  };
}


console.log("\n=== ANTI-FARM PVP ===\n");


const a =
  profile("antifarm_a");

const b =
  profile("antifarm_b");

const c =
  profile("antifarm_c");

const base =
  1_800_000_000_000;


const first =
  applyRankedResult(
    a,
    b,
    {
      now: base
    }
  );

assert.equal(first.rated, true);
assert.equal(first.friendly, false);
assert.equal(first.pairMatchesInWindow, 1);


const second =
  applyRankedResult(
    b,
    a,
    {
      now: base + 1_000
    }
  );

assert.equal(second.rated, true);
assert.equal(second.friendly, false);
assert.equal(second.pairMatchesInWindow, 2);


const third =
  applyRankedResult(
    a,
    b,
    {
      now: base + 2_000
    }
  );

assert.equal(third.rated, true);
assert.equal(third.friendly, false);
assert.equal(third.pairMatchesInWindow, 3);

console.log("✅ As 3 primeiras partidas da mesma dupla em 24h são ranqueadas.");


const aBeforeFriendly =
  snapshotRankedStats(a);

const bBeforeFriendly =
  snapshotRankedStats(b);


const fourth =
  applyRankedResult(
    b,
    a,
    {
      now: base + 3_000
    }
  );

assert.equal(fourth.rated, false);
assert.equal(fourth.friendly, true);
assert.equal(fourth.antiFarm, true);
assert.equal(fourth.winner.gain, 0);
assert.equal(fourth.loser.loss, 0);
assert.equal(fourth.previousPairMatchesInWindow, 3);
assert.equal(fourth.pairMatchesInWindow, 4);

assert.deepEqual(
  snapshotRankedStats(a),
  aBeforeFriendly
);

assert.deepEqual(
  snapshotRankedStats(b),
  bBeforeFriendly
);

console.log("✅ A 4ª partida vira amistosa ±0 e não altera estatísticas ranqueadas.");


const fifth =
  applyRankedResult(
    a,
    b,
    {
      now: base + 4_000
    }
  );

assert.equal(fifth.rated, false);
assert.equal(fifth.friendly, true);
assert.equal(fifth.pairMatchesInWindow, 5);

console.log("✅ Partidas amistosas continuam entrando na janela móvel anti-farm.");


assert.equal(
  a.pvp.recentOpponents.antifarm_b.length,
  5
);
assert.equal(
  b.pvp.recentOpponents.antifarm_a.length,
  5
);

console.log("✅ A x B e B x A compartilham o mesmo histórico da dupla.");


const vsOtherOpponent =
  applyRankedResult(
    a,
    c,
    {
      now: base + 5_000
    }
  );

assert.equal(vsOtherOpponent.rated, true);
assert.equal(vsOtherOpponent.friendly, false);
assert.equal(vsOtherOpponent.pairMatchesInWindow, 1);

console.log("✅ Outro adversário não herda o bloqueio da dupla A x B.");


const afterRollingExpiry =
  applyRankedResult(
    a,
    b,
    {
      now:
        base +
        PVP_PAIR_WINDOW_MS +
        2_500
    }
  );

assert.equal(
  afterRollingExpiry.previousPairMatchesInWindow,
  2
);
assert.equal(
  afterRollingExpiry.rated,
  true
);
assert.equal(
  afterRollingExpiry.friendly,
  false
);

console.log("✅ A dupla volta a ranquear quando restam menos de 3 partidas na janela móvel de 24h.");


const legacyProfile = {
  user: "legacy_a",
  pvp: {
    rating: 1000,
    peakRating: 1000,
    wins: 0,
    losses: 0,
    duels: 0,
    streak: 0,
    bestStreak: 0
  }
};

const legacyOpponent = {
  user: "legacy_b",
  pvp: {
    rating: 1000,
    peakRating: 1000,
    wins: 0,
    losses: 0,
    duels: 0,
    streak: 0,
    bestStreak: 0
  }
};

const legacyResult =
  applyRankedResult(
    legacyProfile,
    legacyOpponent,
    {
      now: base
    }
  );

assert.equal(legacyResult.rated, true);
assert.ok(
  legacyProfile.pvp.recentOpponents
);
assert.ok(
  legacyOpponent.pvp.recentOpponents
);

console.log("✅ Perfis antigos sem recentOpponents recebem compatibilidade automática.");


console.log("\n🛡️ TODOS OS TESTES DO ANTI-FARM PVP PASSARAM.\n");
