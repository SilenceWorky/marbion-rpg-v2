export const PVP_RESULT_LEDGER_LIMIT = 100;


function cloneJson(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function ensurePvp(profile) {
  if (
    !profile.pvp ||
    typeof profile.pvp !== "object" ||
    Array.isArray(profile.pvp)
  ) {
    profile.pvp = {};
  }

  return profile.pvp;
}


export function ensurePvpResultLedger(profile) {
  const pvp =
    ensurePvp(profile);

  if (
    !Array.isArray(
      pvp.resultLedger
    )
  ) {
    pvp.resultLedger = [];
  }

  return pvp.resultLedger;
}


export function snapshotPvpRankingState(
  profile,
  opponentUser
) {
  const pvp =
    ensurePvp(profile);

  const opponent =
    normalizeUser(opponentUser);

  const recentOpponents =
    pvp.recentOpponents &&
    typeof pvp.recentOpponents === "object" &&
    !Array.isArray(pvp.recentOpponents)
      ? pvp.recentOpponents
      : {};

  return {
    rating:
      Number(pvp.rating) || 0,
    peakRating:
      Number(pvp.peakRating) || 0,
    wins:
      Number(pvp.wins) || 0,
    losses:
      Number(pvp.losses) || 0,
    duels:
      Number(pvp.duels) || 0,
    streak:
      Number(pvp.streak) || 0,
    bestStreak:
      Number(pvp.bestStreak) || 0,
    rank:
      pvp.rank ?? null,
    opponent,
    pairHistory:
      opponent &&
      Array.isArray(
        recentOpponents[opponent]
      )
        ? [...recentOpponents[opponent]]
        : []
  };
}


export function restorePvpRankingState(
  profile,
  state
) {
  if (!state || typeof state !== "object") {
    return false;
  }

  const pvp =
    ensurePvp(profile);

  const scalarFields = [
    "rating",
    "peakRating",
    "wins",
    "losses",
    "duels",
    "streak",
    "bestStreak"
  ];

  for (const field of scalarFields) {
    if (
      Object.prototype.hasOwnProperty.call(
        state,
        field
      )
    ) {
      pvp[field] =
        Number(state[field]) || 0;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      state,
      "rank"
    )
  ) {
    pvp.rank =
      state.rank ?? null;
  }

  const opponent =
    normalizeUser(
      state.opponent
    );

  if (opponent) {
    if (
      !pvp.recentOpponents ||
      typeof pvp.recentOpponents !== "object" ||
      Array.isArray(pvp.recentOpponents)
    ) {
      pvp.recentOpponents = {};
    }

    pvp.recentOpponents[opponent] =
      Array.isArray(state.pairHistory)
        ? [...state.pairHistory]
        : [];
  }

  return true;
}


export function getPvpResultRecord(
  profile,
  battleId
) {
  const normalizedBattleId =
    String(battleId ?? "")
      .trim();

  if (!normalizedBattleId) {
    return null;
  }

  const ledger =
    ensurePvpResultLedger(profile);

  return (
    ledger.find(
      entry =>
        String(
          entry?.battleId ?? ""
        ) === normalizedBattleId
    ) || null
  );
}


export function storePvpResultRecord(
  profile,
  record
) {
  const battleId =
    String(
      record?.battleId ?? ""
    ).trim();

  if (!battleId) {
    return {
      ok: false,
      error: "INVALID_BATTLE_ID"
    };
  }

  const ledger =
    ensurePvpResultLedger(profile);

  const next =
    ledger.filter(
      entry =>
        String(
          entry?.battleId ?? ""
        ) !== battleId
    );

  next.push(
    cloneJson(record)
  );

  profile.pvp.resultLedger =
    next.slice(
      -PVP_RESULT_LEDGER_LIMIT
    );

  return {
    ok: true,
    size:
      profile.pvp.resultLedger.length
  };
}


export function createPvpResultRecord({
  battleId,
  winnerUser,
  loserUser,
  result,
  winnerProfile,
  loserProfile,
  lastCombat
}) {
  const normalizedBattleId =
    String(battleId ?? "")
      .trim();

  const winner =
    normalizeUser(winnerUser);

  const loser =
    normalizeUser(loserUser);

  if (
    !normalizedBattleId ||
    !winner ||
    !loser ||
    winner === loser
  ) {
    return null;
  }

  return {
    battleId:
      normalizedBattleId,
    winnerUser:
      winner,
    loserUser:
      loser,
    lastCombat:
      Math.max(
        0,
        Number(lastCombat) || Date.now()
      ),
    result:
      cloneJson(result),
    winnerState:
      snapshotPvpRankingState(
        winnerProfile,
        loser
      ),
    loserState:
      snapshotPvpRankingState(
        loserProfile,
        winner
      )
  };
}


export function validatePvpResultRecord(
  record,
  battleId,
  winnerUser,
  loserUser
) {
  if (!record) {
    return false;
  }

  return (
    String(record.battleId ?? "") ===
      String(battleId ?? "").trim() &&
    normalizeUser(record.winnerUser) ===
      normalizeUser(winnerUser) &&
    normalizeUser(record.loserUser) ===
      normalizeUser(loserUser) &&
    record.result &&
    typeof record.result === "object" &&
    record.winnerState &&
    record.loserState
  );
}
