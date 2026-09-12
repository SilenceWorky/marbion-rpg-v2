export const TURN_WARNING_MS =
  60 * 1000;

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

  battle.turnWarningAt =
    safeNow +
    TURN_WARNING_MS;

  battle.turnWarningProcessed =
    false;

  battle.turnWarningUsers =
    [];

  battle.turnDeadline =
    safeNow +
    TURN_TIMEOUT_MS;

  return {
    ok: true,
    turn,
    turnStartedAt:
      battle.turnStartedAt,
    turnWarningAt:
      battle.turnWarningAt,
    turnWarningProcessed:
      battle.turnWarningProcessed === true,
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

  const startedAt =
    Number(battle.turnStartedAt) ||
    Math.max(
      0,
      deadline - TURN_TIMEOUT_MS
    );

  const rawWarningAt =
    Number(battle.turnWarningAt);

  const warningAt =
    Number.isFinite(rawWarningAt) &&
    rawWarningAt > 0
      ? rawWarningAt
      : startedAt + TURN_WARNING_MS;

  battle.turnStartedAt =
    startedAt;

  battle.turnWarningAt =
    warningAt;

  if (
    typeof battle.turnWarningProcessed !==
    "boolean"
  ) {
    battle.turnWarningProcessed =
      false;
  }

  if (!Array.isArray(battle.turnWarningUsers)) {
    battle.turnWarningUsers = [];
  }

  return {
    ok: true,
    turn,
    turnStartedAt:
      startedAt,
    turnWarningAt:
      warningAt,
    turnWarningProcessed:
      battle.turnWarningProcessed === true,
    turnDeadline:
      deadline
  };
}


export function getNextBattleTurnAlarmAt(
  battle,
  now = Date.now()
) {
  const clock =
    ensureBattleTurnClock(
      battle,
      now
    );

  if (!clock.ok) {
    return clock;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const desiredAt =
    !clock.turnWarningProcessed
      ? clock.turnWarningAt
      : clock.turnDeadline;

  return {
    ok: true,
    turn: clock.turn,
    stage:
      !clock.turnWarningProcessed
        ? "WARNING"
        : "TIMEOUT",
    alarmAt:
      Math.max(
        safeNow + 1,
        desiredAt
      ),
    turnWarningAt:
      clock.turnWarningAt,
    turnDeadline:
      clock.turnDeadline
  };
}


export function registerTurnWarning(
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
          .filter(
            user =>
              user &&
              state.users.includes(user)
          )
      )
    ];

  battle.turnWarningProcessed =
    true;

  battle.turnWarningUsers =
    uniqueUsers;

  if (!Array.isArray(battle.timeoutWarningEvents)) {
    battle.timeoutWarningEvents = [];
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
      uniqueUsers
  };

  battle.timeoutWarningEvents.push(
    event
  );

  if (
    battle.timeoutWarningEvents.length > 20
  ) {
    battle.timeoutWarningEvents =
      battle.timeoutWarningEvents.slice(-20);
  }

  return {
    ok: true,
    event,
    users:
      uniqueUsers
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
