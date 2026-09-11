import assert from "node:assert/strict";

import {
  PVP_MAX_FORFEIT_LOSS,
  calculateDynamicRatingResult,
  calculateLoserLoss,
  calculateWinnerGain,
  getRatingDifficulty,
  getRankFromRating,
  applyRankedResult
} from "./src/systems/pvp-ranking.js";


function profile(
  user,
  rating
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


function approx(
  actual,
  expected,
  epsilon = 1e-9
) {
  assert.ok(
    Math.abs(
      actual - expected
    ) <= epsilon,
    `Esperado ${expected}, recebido ${actual}`
  );
}


console.log("\n=== RANKING DINÂMICO V2 ===\n");


assert.equal(
  getRatingDifficulty(500),
  1
);

approx(
  getRatingDifficulty(1000),
  1
);

approx(
  getRatingDifficulty(2700),
  1.8
);

approx(
  getRatingDifficulty(99999),
  2.2
);

console.log("✅ Fator de dificuldade respeita mínimo 1.0 e máximo 2.2.");


assert.equal(
  calculateWinnerGain(1000, 1000),
  30
);
assert.equal(
  calculateLoserLoss(1000, 1000),
  30
);

console.log("✅ 1000 x 1000 resulta em +30 / -30.");


assert.equal(
  calculateWinnerGain(1000, 1500),
  49
);
assert.equal(
  calculateLoserLoss(1000, 1500),
  68
);

console.log("✅ 1000 vencendo 1500 resulta em +49 / -68.");


assert.equal(
  calculateWinnerGain(1500, 1000),
  7
);
assert.equal(
  calculateLoserLoss(1500, 1000),
  30
);

console.log("✅ 1500 vencendo 1000 resulta em +7 / -30.");


assert.equal(
  calculateWinnerGain(1000, 2700),
  75
);
assert.equal(
  calculateLoserLoss(1000, 2700),
  150
);

console.log("✅ Underdog extremo respeita caps de +75 / -150.");


assert.equal(
  calculateWinnerGain(2700, 1000),
  2
);
assert.equal(
  calculateLoserLoss(2700, 1000),
  30
);

console.log("✅ Imperador vencendo jogador inicial recebe apenas +2.");


assert.equal(
  calculateWinnerGain(2100, 1000),
  3
);

console.log("✅ Diamante I vencendo jogador inicial recebe aproximadamente +3.");


const forfeit =
  calculateDynamicRatingResult(
    1000,
    2700,
    {
      forfeit: true
    }
  );

assert.equal(
  forfeit.loserLoss,
  PVP_MAX_FORFEIT_LOSS
);

const earlyForfeit =
  calculateDynamicRatingResult(
    1000,
    2700,
    {
      forfeit: true,
      earlyForfeit: true
    }
  );

assert.equal(
  earlyForfeit.winnerGain,
  0
);
assert.equal(
  earlyForfeit.loserLoss,
  PVP_MAX_FORFEIT_LOSS
);

console.log("✅ Forfeit dobra a perda até -300 e early forfeit zera o ganho do vencedor.");


const floorResult =
  calculateDynamicRatingResult(
    1000,
    20
  );

assert.equal(
  floorResult.loserLoss,
  20
);

console.log("✅ Rating nunca pode cair abaixo de zero.");


const winner =
  profile(
    "ranking_a",
    2100
  );

const loser =
  profile(
    "ranking_b",
    1000
  );

const applied =
  applyRankedResult(
    winner,
    loser,
    {
      now: 1_800_000_000_000
    }
  );

assert.equal(
  applied.rated,
  true
);
assert.equal(
  applied.friendly,
  false
);
assert.equal(
  applied.winner.gain,
  3
);
assert.equal(
  applied.loser.loss,
  30
);
assert.notEqual(
  applied.winner.gain,
  applied.loser.loss
);
assert.equal(
  winner.pvp.rating,
  2103
);
assert.equal(
  loser.pvp.rating,
  970
);
assert.equal(
  winner.pvp.wins,
  1
);
assert.equal(
  loser.pvp.losses,
  1
);

console.log("✅ applyRankedResult aplica ganho/perda independentes e atualiza estatísticas.");


assert.equal(
  getRankFromRating(2099).label,
  "Diamante II"
);
assert.equal(
  getRankFromRating(2100).label,
  "Diamante I"
);

console.log("✅ Thresholds de Elo existentes foram preservados.");


console.log("\n🏆 TODOS OS TESTES DO RANKING DINÂMICO V2 PASSARAM.\n");
