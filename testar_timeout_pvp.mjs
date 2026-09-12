import assert from "node:assert/strict";
import fs from "node:fs";

import {
  TURN_TIMEOUT_MS,
  MAX_TURN_TIMEOUTS,
  TIMEOUT_PASS_SLOT,
  TIMEOUT_PASS_SKILL,
  ensureBattleTurnClock,
  startBattleTurnClock,
  getMissingActionUsers,
  registerTurnTimeouts
} from "./src/systems/pvp-timeout.js";

function makeBattle() {
  return {
    id: "battle-test",
    status: "ACTIVE",
    state: "WAITING_ACTIONS",
    turn: 1,
    player1: {
      user: "alice",
      action: null
    },
    player2: {
      user: "bob",
      action: null
    }
  };
}

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

console.log("=== TIMEOUT DE TURNO DO PVP ===");


test("timeout canônico é 90 segundos", () => {
  assert.equal(
    TURN_TIMEOUT_MS,
    90_000
  );

  assert.equal(
    MAX_TURN_TIMEOUTS,
    3
  );
});


test("slot de timeout é interno e diferente dos slots públicos", () => {
  assert.equal(
    TIMEOUT_PASS_SLOT,
    -1
  );

  assert.equal(
    TIMEOUT_PASS_SKILL.custoMentalidade,
    0
  );

  assert.equal(
    TIMEOUT_PASS_SKILL.dano,
    0
  );
});


test("novo turno recebe deadline de 90 segundos", () => {
  const battle =
    makeBattle();

  const result =
    startBattleTurnClock(
      battle,
      1_000
    );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    battle.turnStartedAt,
    1_000
  );

  assert.equal(
    battle.turnDeadline,
    91_000
  );

  assert.equal(
    battle.turnClockTurn,
    1
  );
});


test("ensure não reinicia relógio do mesmo turno", () => {
  const battle =
    makeBattle();

  startBattleTurnClock(
    battle,
    1_000
  );

  const before =
    battle.turnDeadline;

  ensureBattleTurnClock(
    battle,
    50_000
  );

  assert.equal(
    battle.turnDeadline,
    before
  );
});


test("mudança de turno cria um novo relógio sem zerar strikes", () => {
  const battle =
    makeBattle();

  startBattleTurnClock(
    battle,
    1_000
  );

  registerTurnTimeouts(
    battle,
    ["alice"],
    91_000
  );

  battle.turn = 2;

  ensureBattleTurnClock(
    battle,
    100_000
  );

  assert.equal(
    battle.turnDeadline,
    190_000
  );

  assert.equal(
    battle.timeoutCounts.alice,
    1
  );
});


test("detecta exatamente quem não escolheu ação", () => {
  const battle =
    makeBattle();

  battle.player1.action = {
    slot: 5
  };

  assert.deepEqual(
    getMissingActionUsers(
      battle
    ),
    ["bob"]
  );
});


test("timeout incrementa somente o jogador ausente", () => {
  const battle =
    makeBattle();

  const result =
    registerTurnTimeouts(
      battle,
      ["alice"],
      10_000
    );

  assert.equal(
    result.counts.alice,
    1
  );

  assert.equal(
    battle.timeoutCounts.alice,
    1
  );

  assert.equal(
    battle.timeoutCounts.bob,
    0
  );
});


test("timeouts são cumulativos dentro da mesma luta", () => {
  const battle =
    makeBattle();

  registerTurnTimeouts(
    battle,
    ["alice"],
    10_000
  );

  registerTurnTimeouts(
    battle,
    ["alice"],
    20_000
  );

  const third =
    registerTurnTimeouts(
      battle,
      ["alice"],
      30_000
    );

  assert.equal(
    battle.timeoutCounts.alice,
    3
  );

  assert.deepEqual(
    third.reachedLimit,
    ["alice"]
  );
});


test("timeout simultâneo conta para os dois jogadores", () => {
  const battle =
    makeBattle();

  const result =
    registerTurnTimeouts(
      battle,
      ["alice", "bob"],
      10_000
    );

  assert.equal(
    result.counts.alice,
    1
  );

  assert.equal(
    result.counts.bob,
    1
  );
});


test("histórico de timeout mantém apenas os 20 eventos mais recentes", () => {
  const battle =
    makeBattle();

  for (
    let index = 0;
    index < 25;
    index += 1
  ) {
    registerTurnTimeouts(
      battle,
      ["alice"],
      index
    );
  }

  assert.equal(
    battle.timeoutEvents.length,
    20
  );
});


const coordinatorSource =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const attackSource =
  fs.readFileSync(
    "src/routes/attack.js",
    "utf8"
  );


test("Durable Object possui handler alarm", () => {
  assert.match(
    coordinatorSource,
    /async alarm\(\)/
  );

  assert.match(
    coordinatorSource,
    /storage\.setAlarm/
  );

  assert.match(
    coordinatorSource,
    /storage\.deleteAlarm/
  );
});


test("timeout interno não vira um slot público", () => {
  assert.match(
    coordinatorSource,
    /internalTimeout === true/
  );

  assert.match(
    coordinatorSource,
    /rawSlot === "__timeout__"/
  );

  assert.doesNotMatch(
    attackSource,
    /!ataque timeout/i
  );
});


test("terceiro timeout força forfeit sem early forfeit", () => {
  assert.match(
    coordinatorSource,
    /forceLateForfeit: true/
  );

  assert.match(
    coordinatorSource,
    /finishReason: "TIMEOUT_FORFEIT"/
  );
});


test("timeout duplo no limite encerra em empate", () => {
  assert.match(
    coordinatorSource,
    /finishReason = "DOUBLE_TIMEOUT"/
  );

  assert.match(
    coordinatorSource,
    /timeoutDraw = true/
  );
});


test("turno expirado é rejeitado pela rota de ataque", () => {
  assert.match(
    coordinatorSource,
    /error: "TURN_EXPIRED"/
  );

  assert.match(
    attackSource,
    /TURN_EXPIRED/
  );
});


console.log("\n⏱️ TODOS OS TESTES DO TIMEOUT DE PVP PASSARAM.");
