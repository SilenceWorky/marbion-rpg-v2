export const TURN_TIMEOUT_MS =
  90 * 1000;

export const MAX_TURN_TIMEOUTS =
  3;

export const TIMEOUT_PASS_SLOT =
  -1;

export const TIMEOUT_PASS_SKILL =
  Object.freeze({
    id: "Sistema:Timeout_Pass",
    group: "Sistema",
    key: "Timeout_Pass",
    nome: "Tempo esgotado",
    tipo: "Timeout",
    raridade: "Sistema",
    elemento: "Universal",
    custoMentalidade: 0,
    cooldown: 0,
    escala: null,
    dano: 0,
    precisao: 100,
    prioridade: -999,
    efeito: "Ação perdida por timeout do turno."
  });


function normalizeTimeoutCount(value) {
  return Math.max(
    0,
    Math.floor(
      Number(value) || 0
    )
  );
}


export function ensureBattleTimeoutState(
  battle
) {
  if (
    !battle ||
    typeof battle !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_BATTLE"
    };
  }

  if (
    !battle.timeoutCounts ||
    typeof battle.timeoutCounts !== "object" ||
    Array.isArray(battle.timeoutCounts)
  ) {
    battle.timeoutCounts = {};
  }

  const users = [
    battle.player1?.user,
    battle.player2?.user
  ].filter(Boolean);

  for (const user of users) {
    battle.timeoutCounts[user] =
      normalizeTimeoutCount(
        battle.timeoutCounts[user]
      );
  }

  if (!Array.isArray(battle.timeoutEvents)) {
    battle.timeoutEvents = [];
  }

  return {
    ok: true,
    users,
    timeoutCounts:
      battle.timeoutCounts
  };
}


export function startBattleTurnClock(
  battle,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const turn =
    Math.max(
      1,
      Math.floor(
        Number(battle.turn) || 1
      )
    );

  battle.turnClockTurn =
    turn;

  battle.turnStartedAt =
    safeNow;

  battle.turnDeadline =
    safeNow +
    TURN_TIMEOUT_MS;

  return {
    ok: true,
    turn,
    turnStartedAt:
      battle.turnStartedAt,
    turnDeadline:
      battle.turnDeadline
  };
}


export function ensureBattleTurnClock(
  battle,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const turn =
    Math.max(
      1,
      Math.floor(
        Number(battle.turn) || 1
      )
    );

  const clockTurn =
    Math.floor(
      Number(battle.turnClockTurn) || 0
    );

  const deadline =
    Number(battle.turnDeadline);

  if (
    clockTurn !== turn ||
    !Number.isFinite(deadline) ||
    deadline <= 0
  ) {
    return startBattleTurnClock(
      battle,
      now
    );
  }

  return {
    ok: true,
    turn,
    turnStartedAt:
      Number(battle.turnStartedAt) ||
      Math.max(
        0,
        deadline - TURN_TIMEOUT_MS
      ),
    turnDeadline:
      deadline
  };
}


export function getMissingActionUsers(
  battle
) {
  if (!battle) {
    return [];
  }

  return [
    battle.player1,
    battle.player2
  ]
    .filter(
      player =>
        player?.user &&
        player.action == null
    )
    .map(
      player =>
        player.user
    );
}


export function registerTurnTimeouts(
  battle,
  users,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const uniqueUsers =
    [
      ...new Set(
        (Array.isArray(users) ? users : [])
          .filter(Boolean)
      )
    ];

  const counts = {};
  const reachedLimit = [];

  for (const user of uniqueUsers) {
    if (!state.users.includes(user)) {
      continue;
    }

    const nextCount =
      normalizeTimeoutCount(
        battle.timeoutCounts[user]
      ) + 1;

    battle.timeoutCounts[user] =
      nextCount;

    counts[user] =
      nextCount;

    if (
      nextCount >=
      MAX_TURN_TIMEOUTS
    ) {
      reachedLimit.push(
        user
      );
    }
  }

  const event = {
    turn:
      Math.max(
        1,
        Number(battle.turn) || 1
      ),
    at:
      Math.max(
        0,
        Number(now) || Date.now()
      ),
    users:
      uniqueUsers,
    counts,
    reachedLimit
  };

  battle.timeoutEvents.push(
    event
  );

  if (
    battle.timeoutEvents.length > 20
  ) {
    battle.timeoutEvents =
      battle.timeoutEvents.slice(-20);
  }

  return {
    ok: true,
    event,
    counts,
    reachedLimit
  };
}
