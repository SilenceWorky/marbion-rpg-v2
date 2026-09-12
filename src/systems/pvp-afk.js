export const AFK_PROBATION_MS =
  30 * 60 * 1000;

export const AFK_BASE_BLOCK_MS =
  15 * 60 * 1000;

export const AFK_BLOCK_MULTIPLIER =
  4;


function safeTime(value) {
  return Math.max(
    0,
    Number(value) || 0
  );
}


function safeLevel(value) {
  return Math.max(
    0,
    Math.floor(
      Number(value) || 0
    )
  );
}


export function ensurePvpAfkDiscipline(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }

  if (
    !profile.pvp ||
    typeof profile.pvp !== "object" ||
    Array.isArray(profile.pvp)
  ) {
    profile.pvp = {};
  }

  profile.pvp.afkPenaltyLevel =
    safeLevel(
      profile.pvp.afkPenaltyLevel
    );

  profile.pvp.afkBlockedUntil =
    safeTime(
      profile.pvp.afkBlockedUntil
    );

  profile.pvp.afkProbationUntil =
    safeTime(
      profile.pvp.afkProbationUntil
    );

  profile.pvp.afkLastIncidentAt =
    safeTime(
      profile.pvp.afkLastIncidentAt
    );

  return {
    ok: true,
    pvp: profile.pvp
  };
}


export function getAfkPenaltyDuration(
  level
) {
  const safePenaltyLevel =
    Math.max(
      1,
      safeLevel(level)
    );

  const duration =
    AFK_BASE_BLOCK_MS *
    Math.pow(
      AFK_BLOCK_MULTIPLIER,
      safePenaltyLevel - 1
    );

  if (!Number.isFinite(duration)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.round(duration)
  );
}


export function getPvpAfkAccess(
  profile,
  now = Date.now()
) {
  const state =
    ensurePvpAfkDiscipline(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const pvp =
    state.pvp;

  const blocked =
    pvp.afkBlockedUntil >
    safeNow;

  return {
    ok: true,
    allowed: !blocked,
    blocked,
    penaltyLevel:
      pvp.afkPenaltyLevel,
    blockedUntil:
      pvp.afkBlockedUntil,
    probationUntil:
      pvp.afkProbationUntil,
    remainingMs:
      blocked
        ? pvp.afkBlockedUntil - safeNow
        : 0,
    probationActive:
      !blocked &&
      pvp.afkProbationUntil > safeNow
  };
}


export function registerPvpAfkIncident(
  profile,
  now = Date.now()
) {
  const state =
    ensurePvpAfkDiscipline(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const pvp =
    state.pvp;

  /*
   * Um terceiro timeout da MESMA luta pode acontecer
   * depois de a punição de 15 minutos já ter sido
   * registrada no segundo incidente.
   *
   * Enquanto o bloqueio atual ainda está correndo,
   * novos strikes da batalha não escalam a punição.
   */
  if (
    pvp.afkBlockedUntil >
    safeNow
  ) {
    pvp.afkLastIncidentAt =
      safeNow;

    return {
      ok: true,
      action: "ALREADY_BLOCKED",
      escalated: false,
      penaltyLevel:
        pvp.afkPenaltyLevel,
      blockedUntil:
        pvp.afkBlockedUntil,
      probationUntil:
        pvp.afkProbationUntil,
      remainingMs:
        pvp.afkBlockedUntil - safeNow
    };
  }

  /*
   * Se a janela de 30 minutos acabou,
   * a reincidência anterior deixa de valer.
   * O próximo AFK vira um primeiro aviso novo.
   */
  if (
    pvp.afkProbationUntil <=
    safeNow
  ) {
    pvp.afkPenaltyLevel = 0;
    pvp.afkBlockedUntil = 0;
    pvp.afkProbationUntil =
      safeNow +
      AFK_PROBATION_MS;
    pvp.afkLastIncidentAt =
      safeNow;

    return {
      ok: true,
      action: "WARNING",
      escalated: false,
      penaltyLevel: 0,
      blockedUntil: 0,
      probationUntil:
        pvp.afkProbationUntil,
      probationMs:
        AFK_PROBATION_MS,
      nextPenaltyLevel: 1,
      nextPenaltyMs:
        getAfkPenaltyDuration(1)
    };
  }

  /*
   * Houve novo AFK dentro da janela ativa.
   *
   * Nível 1 = 15 min
   * Nível 2 = 1 h
   * Nível 3 = 4 h
   * Nível 4 = 16 h
   * ... progressão x4 sem tabela fixa.
   */
  const nextLevel =
    Math.max(
      1,
      pvp.afkPenaltyLevel + 1
    );

  const durationMs =
    getAfkPenaltyDuration(
      nextLevel
    );

  const blockedUntil =
    Math.min(
      Number.MAX_SAFE_INTEGER,
      safeNow + durationMs
    );

  const probationUntil =
    Math.min(
      Number.MAX_SAFE_INTEGER,
      blockedUntil +
      AFK_PROBATION_MS
    );

  pvp.afkPenaltyLevel =
    nextLevel;

  pvp.afkBlockedUntil =
    blockedUntil;

  pvp.afkProbationUntil =
    probationUntil;

  pvp.afkLastIncidentAt =
    safeNow;

  return {
    ok: true,
    action: "BLOCKED",
    escalated: true,
    penaltyLevel:
      nextLevel,
    durationMs,
    blockedUntil,
    probationUntil,
    probationMs:
      AFK_PROBATION_MS
  };
}


export function resetPvpAfkDiscipline(
  profile
) {
  const state =
    ensurePvpAfkDiscipline(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const pvp =
    state.pvp;

  pvp.afkPenaltyLevel = 0;
  pvp.afkBlockedUntil = 0;
  pvp.afkProbationUntil = 0;
  pvp.afkLastIncidentAt = 0;

  return {
    ok: true,
    resetFields: [
      "pvp.afkPenaltyLevel",
      "pvp.afkBlockedUntil",
      "pvp.afkProbationUntil",
      "pvp.afkLastIncidentAt"
    ]
  };
}
