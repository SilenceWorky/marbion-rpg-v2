import fs from "node:fs";
import assert from "node:assert/strict";

import {
  applyRankedResult,
  PVP_MAX_FORFEIT_LOSS
} from "./src/systems/pvp-ranking.js";

function profile(
  user,
  rating = 1000,
  overrides = {}
) {
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
      recentOpponents: {},
      ...overrides
    }
  };
}

function ok(label, fn) {
  fn();
  console.log(`✅ ${label}`);
}

console.log("=== !DESISTIR / FORFEIT ===");

const now = 2_000_000_000_000;

ok(
  "desistência antes do Turno 3 dá +0 ao vencedor e perda 2x ao desistente",
  () => {
    const winner = profile(
      "winner",
      1000,
      {
        wins: 5,
        duels: 8,
        streak: 2,
        bestStreak: 4
      }
    );

    const loser = profile(
      "loser",
      1000,
      {
        losses: 3,
        duels: 7,
        streak: 4
      }
    );

    const result = applyRankedResult(
      winner,
      loser,
      {
        winnerUser: "winner",
        loserUser: "loser",
        now,
        forfeit: true,
        earlyForfeit: true
      }
    );

    assert.equal(result.forfeit, true);
    assert.equal(result.earlyForfeit, true);
    assert.equal(result.winner.gain, 0);
    assert.equal(result.winner.after, 1000);
    assert.equal(result.loser.loss, 60);
    assert.equal(result.loser.after, 940);

    assert.equal(winner.pvp.wins, 5);
    assert.equal(winner.pvp.duels, 9);
    assert.equal(winner.pvp.streak, 2);
    assert.equal(winner.pvp.bestStreak, 4);

    assert.equal(loser.pvp.losses, 4);
    assert.equal(loser.pvp.duels, 8);
    assert.equal(loser.pvp.streak, 0);
  }
);

ok(
  "desistência a partir do Turno 3 dá vitória normal e perda 2x",
  () => {
    const winner = profile(
      "winner",
      1000,
      {
        wins: 2,
        duels: 4,
        streak: 1,
        bestStreak: 3
      }
    );

    const loser = profile(
      "loser",
      1000,
      {
        losses: 1,
        duels: 4,
        streak: 5
      }
    );

    const result = applyRankedResult(
      winner,
      loser,
      {
        winnerUser: "winner",
        loserUser: "loser",
        now: now + 10_000,
        forfeit: true,
        earlyForfeit: false
      }
    );

    assert.equal(result.winner.gain, 30);
    assert.equal(result.winner.after, 1030);
    assert.equal(result.loser.loss, 60);
    assert.equal(result.loser.after, 940);

    assert.equal(winner.pvp.wins, 3);
    assert.equal(winner.pvp.duels, 5);
    assert.equal(winner.pvp.streak, 2);
    assert.equal(winner.pvp.bestStreak, 3);

    assert.equal(loser.pvp.losses, 2);
    assert.equal(loser.pvp.duels, 5);
    assert.equal(loser.pvp.streak, 0);
  }
);

ok(
  "cap de perda por desistência permanece em -300",
  () => {
    const winner = profile(
      "underdog",
      1000
    );

    const loser = profile(
      "favorite",
      2700
    );

    const result = applyRankedResult(
      winner,
      loser,
      {
        winnerUser: "underdog",
        loserUser: "favorite",
        now: now + 20_000,
        forfeit: true,
        earlyForfeit: false
      }
    );

    assert.equal(
      result.loser.loss,
      PVP_MAX_FORFEIT_LOSS
    );
    assert.equal(result.loser.loss, 300);
  }
);

ok(
  "rating do desistente nunca fica abaixo de zero",
  () => {
    const winner = profile(
      "winner",
      1000
    );

    const loser = profile(
      "loser",
      40
    );

    const result = applyRankedResult(
      winner,
      loser,
      {
        winnerUser: "winner",
        loserUser: "loser",
        now: now + 30_000,
        forfeit: true,
        earlyForfeit: false
      }
    );

    assert.equal(result.loser.loss, 40);
    assert.equal(result.loser.after, 0);
  }
);

ok(
  "anti-farm bloqueia recompensa do vencedor, mas não apaga punição do desistente",
  () => {
    const t1 = now - 3000;
    const t2 = now - 2000;
    const t3 = now - 1000;

    const winner = profile(
      "winner",
      1000,
      {
        wins: 7,
        duels: 10,
        streak: 3,
        bestStreak: 4,
        recentOpponents: {
          loser: [t1, t2, t3]
        }
      }
    );

    const loser = profile(
      "loser",
      1000,
      {
        losses: 6,
        duels: 10,
        streak: 2,
        recentOpponents: {
          winner: [t1, t2, t3]
        }
      }
    );

    const result = applyRankedResult(
      winner,
      loser,
      {
        winnerUser: "winner",
        loserUser: "loser",
        now,
        forfeit: true,
        earlyForfeit: false
      }
    );

    assert.equal(result.antiFarm, true);
    assert.equal(result.winnerRewardSuppressed, true);
    assert.equal(result.winner.gain, 0);
    assert.equal(result.winner.after, 1000);

    assert.equal(winner.pvp.wins, 7);
    assert.equal(winner.pvp.duels, 10);
    assert.equal(winner.pvp.streak, 3);

    assert.equal(result.loser.loss, 60);
    assert.equal(result.loser.after, 940);
    assert.equal(loser.pvp.losses, 7);
    assert.equal(loser.pvp.duels, 11);
    assert.equal(loser.pvp.streak, 0);

    assert.equal(
      winner.pvp.recentOpponents.loser.length,
      4
    );
    assert.equal(
      loser.pvp.recentOpponents.winner.length,
      4
    );
  }
);

const coordinator = fs.readFileSync(
  "src/durable/PvpCoordinator.js",
  "utf8"
);

const router = fs.readFileSync(
  "src/router.js",
  "utf8"
);

const route = fs.readFileSync(
  "src/routes/forfeit.js",
  "utf8"
);

ok(
  "Durable Object possui método de desistência",
  () => {
    assert.match(
      coordinator,
      /async forfeitBattle\s*\(/
    );
  }
);

ok(
  "desistência usa forfeit e detecta Turno 1-2 como precoce",
  () => {
    assert.match(
      coordinator,
      /const earlyForfeit\s*=\s*\n\s*turn < 3;/
    );
    assert.match(
      coordinator,
      /forfeit:\s*true/
    );
  }
);

ok(
  "resultado ranqueado recebe identidades explícitas da dupla",
  () => {
    assert.match(
      coordinator,
      /winnerUser,\s*\n\s*loserUser,\s*\n\s*now/
    );
  }
);

ok(
  "desistência encerra ações e promove a fila global",
  () => {
    assert.match(
      coordinator,
      /battle\.player1\.action\s*=\s*\n\s*null;/
    );
    assert.match(
      coordinator,
      /battle\.player2\.action\s*=\s*\n\s*null;/
    );
    assert.match(
      coordinator,
      /await this\.startNextQueuedBattle\(\)/
    );
  }
);

ok(
  "endpoint interno /forfeit existe",
  () => {
    assert.match(
      coordinator,
      /url\.pathname ===\s*\n\s*"\/forfeit"/
    );
  }
);

ok(
  "rota pública /desistir existe",
  () => {
    assert.match(
      router,
      /path === "\/desistir"/
    );
    assert.match(
      route,
      /pvp\.internal\/forfeit/
    );
  }
);

console.log("\n🏳️ TODOS OS TESTES DO !DESISTIR PASSARAM.");
