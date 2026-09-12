import assert from "node:assert/strict";
import fs from "node:fs";

import {
  AFK_PROBATION_MS,
  AFK_BASE_BLOCK_MS,
  getAfkPenaltyDuration,
  getPvpAfkAccess,
  registerPvpAfkIncident,
  resetPvpAfkDiscipline
} from "./src/systems/pvp-afk.js";

import {
  TURN_WARNING_MS,
  TURN_TIMEOUT_MS,
  MAX_TURN_TIMEOUTS,
  startBattleTurnClock,
  ensureBattleTurnClock,
  registerTurnWarning,
  registerTurnTimeouts
} from "./src/systems/pvp-timeout.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  }
  catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
}

function makeProfile() {
  return {
    user: "teste",
    race: "Terrariano",
    pvp: {}
  };
}

function makeBattle() {
  return {
    turn: 1,
    player1: {
      user: "a",
      action: null
    },
    player2: {
      user: "b",
      action: null
    }
  };
}

console.log("=== AFK / TIMEOUT DO PVP ===");

test(
  "aviso acontece aos 60s e timeout continua em 90s",
  () => {
    assert.equal(TURN_WARNING_MS, 60_000);
    assert.equal(TURN_TIMEOUT_MS, 90_000);

    const battle = makeBattle();
    const clock = startBattleTurnClock(battle, 1_000_000);

    assert.equal(clock.turnWarningAt, 1_060_000);
    assert.equal(clock.turnDeadline, 1_090_000);
    assert.equal(clock.turnWarningProcessed, false);
  }
);

test(
  "aviso de 60s não reinicia o relógio do turno",
  () => {
    const battle = makeBattle();
    startBattleTurnClock(battle, 2_000_000);

    const warning = registerTurnWarning(
      battle,
      ["b"],
      2_060_000
    );

    assert.equal(warning.ok, true);
    assert.equal(battle.turnWarningProcessed, true);
    assert.deepEqual(battle.turnWarningUsers, ["b"]);

    const clock = ensureBattleTurnClock(
      battle,
      2_070_000
    );

    assert.equal(clock.turnDeadline, 2_090_000);
  }
);

test(
  "primeiro AFK abre janela de 30min sem bloquear",
  () => {
    const profile = makeProfile();
    const now = 10_000_000;

    const result = registerPvpAfkIncident(profile, now);

    assert.equal(result.action, "WARNING");
    assert.equal(result.penaltyLevel, 0);
    assert.equal(result.blockedUntil, 0);
    assert.equal(
      result.probationUntil,
      now + AFK_PROBATION_MS
    );

    const access = getPvpAfkAccess(profile, now + 1);
    assert.equal(access.allowed, true);
    assert.equal(access.probationActive, true);
  }
);

test(
  "segundo AFK dentro de 30min bloqueia por 15min",
  () => {
    const profile = makeProfile();
    const now = 20_000_000;

    registerPvpAfkIncident(profile, now);

    const second = registerPvpAfkIncident(
      profile,
      now + 60_000
    );

    assert.equal(second.action, "BLOCKED");
    assert.equal(second.penaltyLevel, 1);
    assert.equal(second.durationMs, 15 * 60_000);
    assert.equal(AF K_BASE_BLOCK_MS, 15 * 60_000);
  }
);

test(
  "AFK adicional enquanto bloqueio atual corre não escala de novo",
  () => {
    const profile = makeProfile();
    const now = 30_000_000;

    registerPvpAfkIncident(profile, now);
    const second = registerPvpAfkIncident(profile, now + 60_000);
    const third = registerPvpAfkIncident(profile, now + 120_000);

    assert.equal(second.penaltyLevel, 1);
    assert.equal(third.action, "ALREADY_BLOCKED");
    assert.equal(third.penaltyLevel, 1);
    assert.equal(
      profile.pvp.afkBlockedUntil,
      second.blockedUntil
    );
  }
);

test(
  "reincidência após 15min mas dentro da observação sobe para 1h",
  () => {
    const profile = makeProfile();
    const now = 40_000_000;

    registerPvpAfkIncident(profile, now);
    const level1 = registerPvpAfkIncident(
      profile,
      now + 60_000
    );

    const afterBlock =
      level1.blockedUntil + 60_000;

    const level2 = registerPvpAfkIncident(
      profile,
      afterBlock
    );

    assert.equal(level2.action, "BLOCKED");
    assert.equal(level2.penaltyLevel, 2);
    assert.equal(level2.durationMs, 60 * 60_000);
  }
);

test(
  "progressão continua 15min -> 1h -> 4h",
  () => {
    assert.equal(getAfkPenaltyDuration(1), 15 * 60_000);
    assert.equal(getAfkPenaltyDuration(2), 60 * 60_000);
    assert.equal(getAfkPenaltyDuration(3), 4 * 60 * 60_000);
  }
);

test(
  "se os 30min de observação acabarem, reincidência reseta",
  () => {
    const profile = makeProfile();
    const now = 50_000_000;

    registerPvpAfkIncident(profile, now);
    const level1 = registerPvpAfkIncident(
      profile,
      now + 60_000
    );

    const afterProbation =
      level1.probationUntil + 1;

    const resetIncident = registerPvpAfkIncident(
      profile,
      afterProbation
    );

    assert.equal(resetIncident.action, "WARNING");
    assert.equal(resetIncident.penaltyLevel, 0);
    assert.equal(profile.pvp.afkBlockedUntil, 0);
  }
);

test(
  "partida normal não limpa a janela automaticamente",
  () => {
    const profile = makeProfile();
    const now = 60_000_000;

    const first = registerPvpAfkIncident(profile, now);

    const access1 = getPvpAfkAccess(profile, now + 5 * 60_000);
    const access2 = getPvpAfkAccess(profile, now + 20 * 60_000);

    assert.equal(access1.allowed, true);
    assert.equal(access2.allowed, true);
    assert.equal(
      profile.pvp.afkProbationUntil,
      first.probationUntil
    );
  }
);

test(
  "reset ADM de AFK limpa bloqueio e reincidência",
  () => {
    const profile = makeProfile();
    const now = 70_000_000;

    registerPvpAfkIncident(profile, now);
    registerPvpAfkIncident(profile, now + 60_000);

    const reset = resetPvpAfkDiscipline(profile);

    assert.equal(reset.ok, true);
    assert.equal(profile.pvp.afkPenaltyLevel, 0);
    assert.equal(profile.pvp.afkBlockedUntil, 0);
    assert.equal(profile.pvp.afkProbationUntil, 0);
    assert.equal(profile.pvp.afkLastIncidentAt, 0);
  }
);

test(
  "3 strikes da mesma batalha continuam encerrando por AFK",
  () => {
    const battle = makeBattle();

    const one = registerTurnTimeouts(battle, ["b"], 1);
    const two = registerTurnTimeouts(battle, ["b"], 2);
    const three = registerTurnTimeouts(battle, ["b"], 3);

    assert.equal(one.counts.b, 1);
    assert.equal(two.counts.b, 2);
    assert.equal(three.counts.b, 3);
    assert.deepEqual(three.reachedLimit, ["b"]);
    assert.equal(MAX_TURN_TIMEOUTS, 3);
  }
);

test(
  "integração contém bloqueio, aviso e reset AFK",
  () => {
    const coordinator = fs.readFileSync(
      "src/durable/PvpCoordinator.js",
      "utf8"
    );

    const adminTime = fs.readFileSync(
      "src/systems/admin-time-reset.js",
      "utf8"
    );

    const adminRoute = fs.readFileSync(
      "src/routes/admin.js",
      "utf8"
    );

    const pvpRoute = fs.readFileSync(
      "src/routes/pvp.js",
      "utf8"
    );

    const acceptRoute = fs.readFileSync(
      "src/routes/accept.js",
      "utf8"
    );

    assert.match(coordinator, /AFK_WARNING_30S/);
    assert.match(coordinator, /registerPvpAfkIncident/);
    assert.match(coordinator, /CHALLENGER_AFK_BLOCKED/);
    assert.match(coordinator, /TARGET_AFK_BLOCKED/);
    assert.match(adminTime, /afk:\s*"afk"/);
    assert.match(adminRoute, /scope === "afk"/);
    assert.match(pvpRoute, /CHALLENGER_AFK_BLOCKED/);
    assert.match(acceptRoute, /TARGET_AFK_BLOCKED/);
  }
);

console.log("\n🛡️ TODOS OS TESTES DO AFK/PUNIÇÃO PASSARAM.");
