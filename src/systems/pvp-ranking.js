export const PVP_STARTING_RATING =
  1000;

/*
 * Legado do Elo tradicional.
 *
 * Mantido exportado por compatibilidade
 * com código/testes antigos. O Ranking
 * Dinâmico V2 não usa este K.
 */
export const PVP_ELO_K =
  32;

export const PRODIGY_MIN_RATING =
  2700;

export const PRODIGY_LIMIT =
  7;

export const PVP_DYNAMIC_BASE =
  30;

export const PVP_DIFFICULTY_MIN =
  1;

export const PVP_DIFFICULTY_MAX =
  2.2;

export const PVP_MAX_WIN_GAIN =
  75;

export const PVP_MAX_NORMAL_LOSS =
  150;

export const PVP_MAX_FORFEIT_LOSS =
  300;

export const PVP_PAIR_WINDOW_MS =
  24 * 60 * 60 * 1000;

export const PVP_RANKED_MATCHES_PER_PAIR =
  3;


const RANKS = [
  {
    min: 2700,
    name: "Imperador",
    division: "I"
  },

  {
    min: 2600,
    name: "Imperador",
    division: "II"
  },

  {
    min: 2500,
    name: "Imperador",
    division: "III"
  },

  {
    min: 2400,
    name: "Corrompido",
    division: "I"
  },

  {
    min: 2300,
    name: "Corrompido",
    division: "II"
  },

  {
    min: 2200,
    name: "Corrompido",
    division: "III"
  },

  {
    min: 2100,
    name: "Diamante",
    division: "I"
  },

  {
    min: 2000,
    name: "Diamante",
    division: "II"
  },

  {
    min: 1900,
    name: "Diamante",
    division: "III"
  },

  {
    min: 1800,
    name: "Platina",
    division: "I"
  },

  {
    min: 1700,
    name: "Platina",
    division: "II"
  },

  {
    min: 1600,
    name: "Platina",
    division: "III"
  },

  {
    min: 1500,
    name: "Ouro",
    division: "I"
  },

  {
    min: 1400,
    name: "Ouro",
    division: "II"
  },

  {
    min: 1300,
    name: "Ouro",
    division: "III"
  },

  {
    min: 1200,
    name: "Prata",
    division: "I"
  },

  {
    min: 1100,
    name: "Prata",
    division: "II"
  },

  {
    min: 0,
    name: "Prata",
    division: "III"
  }
];


function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


function normalizeUser(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeRating(
  value
) {
  const rating =
    Number(value);

  if (
    !Number.isFinite(
      rating
    )
  ) {
    return PVP_STARTING_RATING;
  }

  return Math.max(
    0,
    Math.round(
      rating
    )
  );
}


export function getRankFromRating(
  rating
) {
  const normalized =
    normalizeRating(
      rating
    );


  const rank =
    RANKS.find(
      entry =>
        normalized >=
        entry.min
    ) ||
    RANKS[
      RANKS.length - 1
    ];


  return {
    ...rank,

    rating:
      normalized,

    label:
      `${rank.name} ${rank.division}`,

    prodigyEligible:
      normalized >=
      PRODIGY_MIN_RATING
  };
}


export function getProdigyLabel(
  position
) {
  const positions = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
    7: "VII"
  };


  const roman =
    positions[
      Number(position)
    ];


  if (!roman) {
    return null;
  }


  return `Prodígio ${roman}`;
}


export function getDisplayRank(
  profile
) {
  const position =
    Number(
      profile?.pvp
        ?.prodigyPosition
    );


  const prodigy =
    getProdigyLabel(
      position
    );


  if (prodigy) {
    return prodigy;
  }


  return getRankFromRating(
    profile?.pvp?.rating
  ).label;
}


/*
 * Legado matemático do Elo tradicional.
 * Mantido exportado para compatibilidade.
 */
export function calculateExpectedScore(
  ratingA,
  ratingB
) {
  const a =
    normalizeRating(
      ratingA
    );

  const b =
    normalizeRating(
      ratingB
    );


  return (
    1 /
    (
      1 +
      Math.pow(
        10,
        (b - a) / 400
      )
    )
  );
}


/*
 * Legado do cálculo Elo K=32.
 *
 * O motor V2 usa calculateDynamicRatingResult().
 */
export function calculateRatingChange(
  winnerRating,
  loserRating
) {
  const winner =
    normalizeRating(
      winnerRating
    );

  const loser =
    normalizeRating(
      loserRating
    );


  const expectedWinner =
    calculateExpectedScore(
      winner,
      loser
    );


  const change =
    Math.round(
      PVP_ELO_K *
      (
        1 -
        expectedWinner
      )
    );


  return Math.max(
    1,
    change
  );
}


export function getRatingDifficulty(
  rating
) {
  const normalized =
    normalizeRating(
      rating
    );

  const difficulty =
    1 +
    0.8 *
    (
      (
        normalized -
        PVP_STARTING_RATING
      ) /
      1700
    );


  return clamp(
    difficulty,
    PVP_DIFFICULTY_MIN,
    PVP_DIFFICULTY_MAX
  );
}


export function calculateWinnerGain(
  winnerRating,
  loserRating
) {
  const winner =
    normalizeRating(
      winnerRating
    );

  const loser =
    normalizeRating(
      loserRating
    );

  const difficulty =
    getRatingDifficulty(
      winner
    );

  const base =
    PVP_DYNAMIC_BASE /
    difficulty;

  const delta =
    loser -
    winner;


  let multiplier =
    1;


  if (
    delta > 0
  ) {
    multiplier =
      1 +
      Math.min(
        1.5,
        delta / 800
      );
  }

  else if (
    delta < 0
  ) {
    multiplier =
      Math.max(
        0.08,
        1 /
        (
          1 +
          Math.abs(delta) / 200
        )
      );
  }


  return clamp(
    Math.round(
      base *
      multiplier
    ),
    1,
    PVP_MAX_WIN_GAIN
  );
}


export function calculateLoserLoss(
  winnerRating,
  loserRating
) {
  const winner =
    normalizeRating(
      winnerRating
    );

  const loser =
    normalizeRating(
      loserRating
    );

  const difficulty =
    getRatingDifficulty(
      loser
    );

  const base =
    PVP_DYNAMIC_BASE *
    difficulty;


  let multiplier =
    1;


  if (
    loser > winner
  ) {
    const gap =
      loser -
      winner;

    multiplier =
      Math.min(
        3,
        1 +
        gap / 600
      );
  }


  return clamp(
    Math.round(
      base *
      multiplier
    ),
    1,
    PVP_MAX_NORMAL_LOSS
  );
}


export function calculateDynamicRatingResult(
  winnerRating,
  loserRating,
  options = {}
) {
  const winner =
    normalizeRating(
      winnerRating
    );

  const loser =
    normalizeRating(
      loserRating
    );

  const forfeit =
    options?.forfeit === true;

  const earlyForfeit =
    options?.earlyForfeit === true;


  const normalWinnerGain =
    calculateWinnerGain(
      winner,
      loser
    );

  const normalLoserLoss =
    calculateLoserLoss(
      winner,
      loser
    );


  const requestedWinnerGain =
    earlyForfeit
      ? 0
      : normalWinnerGain;

  const requestedLoserLoss =
    forfeit
      ? Math.min(
          PVP_MAX_FORFEIT_LOSS,
          normalLoserLoss * 2
        )
      : normalLoserLoss;


  return {
    winnerGain:
      requestedWinnerGain,

    loserLoss:
      Math.min(
        loser,
        requestedLoserLoss
      ),

    requestedLoserLoss,
    normalWinnerGain,
    normalLoserLoss,
    forfeit,
    earlyForfeit,

    winnerDifficulty:
      getRatingDifficulty(
        winner
      ),

    loserDifficulty:
      getRatingDifficulty(
        loser
      )
  };
}


function ensureRecentOpponents(
  pvp
) {
  if (
    !pvp.recentOpponents ||
    typeof pvp.recentOpponents !==
      "object" ||
    Array.isArray(
      pvp.recentOpponents
    )
  ) {
    pvp.recentOpponents = {};
  }


  return pvp.recentOpponents;
}


function normalizeRecentTimestamps(
  values,
  now
) {
  if (!Array.isArray(values)) {
    return [];
  }


  const cutoff =
    now -
    PVP_PAIR_WINDOW_MS;


  return [
    ...new Set(
      values
        .map(
          value =>
            Number(value)
        )
        .filter(
          value =>
            Number.isFinite(value) &&
            value > cutoff &&
            value <= now
        )
    )
  ]
    .sort(
      (a, b) =>
        a - b
    );
}


function pruneRecentOpponents(
  pvp,
  now
) {
  const recentOpponents =
    ensureRecentOpponents(
      pvp
    );

  const cleaned = {};


  for (
    const [
      rawOpponent,
      timestamps
    ] of Object.entries(
      recentOpponents
    )
  ) {
    const opponent =
      normalizeUser(
        rawOpponent
      );

    if (!opponent) {
      continue;
    }


    const normalized =
      normalizeRecentTimestamps(
        timestamps,
        now
      );


    if (
      normalized.length > 0
    ) {
      cleaned[opponent] =
        normalized;
    }
  }


  pvp.recentOpponents =
    cleaned;


  return cleaned;
}


function ensurePvp(
  profile
) {
  if (!profile.pvp) {
    profile.pvp = {};
  }


  const pvp =
    profile.pvp;


  pvp.rating =
    normalizeRating(
      pvp.rating
    );

  pvp.peakRating =
    Math.max(
      pvp.rating,
      normalizeRating(
        pvp.peakRating
      )
    );

  pvp.wins =
    Number(pvp.wins) || 0;

  pvp.losses =
    Number(pvp.losses) || 0;

  pvp.duels =
    Number(pvp.duels) || 0;

  pvp.streak =
    Number(pvp.streak) || 0;

  pvp.bestStreak =
    Number(
      pvp.bestStreak
    ) || 0;


  ensureRecentOpponents(
    pvp
  );


  return pvp;
}


function registerPairMatch(
  winnerProfile,
  loserProfile,
  winnerPvp,
  loserPvp,
  now,
  options = {}
) {
  const winnerUser =
    normalizeUser(
      options?.winnerUser ??
      winnerProfile?.user
    );

  const loserUser =
    normalizeUser(
      options?.loserUser ??
      loserProfile?.user
    );


  pruneRecentOpponents(
    winnerPvp,
    now
  );

  pruneRecentOpponents(
    loserPvp,
    now
  );


  if (
    !winnerUser ||
    !loserUser ||
    winnerUser === loserUser
  ) {
    return {
      tracked: false,
      previousMatchesInWindow: 0,
      matchesInWindow: 0,
      friendly: false
    };
  }


  const winnerHistory =
    normalizeRecentTimestamps(
      winnerPvp
        .recentOpponents[
          loserUser
        ],
      now
    );

  const loserHistory =
    normalizeRecentTimestamps(
      loserPvp
        .recentOpponents[
          winnerUser
        ],
      now
    );


  const merged =
    [
      ...new Set([
        ...winnerHistory,
        ...loserHistory
      ])
    ]
      .sort(
        (a, b) =>
          a - b
      );


  const previousMatchesInWindow =
    merged.length;

  const friendly =
    previousMatchesInWindow >=
    PVP_RANKED_MATCHES_PER_PAIR;


  const updated =
    normalizeRecentTimestamps(
      [
        ...merged,
        now
      ],
      now
    );


  winnerPvp.recentOpponents[
    loserUser
  ] = updated;

  loserPvp.recentOpponents[
    winnerUser
  ] = updated;


  return {
    tracked: true,
    winnerUser,
    loserUser,
    previousMatchesInWindow,
    matchesInWindow:
      updated.length,
    friendly
  };
}


/*
 * Aplica o resultado de uma partida aos perfis.
 *
 * Ranking Dinâmico V2:
 * - ganho/perda assimétricos;
 * - anti-farm por repetição da dupla;
 * - suporte estrutural a forfeit.
 *
 * Esta função NÃO salva no KV.
 */
export function applyRankedResult(
  winnerProfile,
  loserProfile,
  options = {}
) {
  const winnerPvp =
    ensurePvp(
      winnerProfile
    );

  const loserPvp =
    ensurePvp(
      loserProfile
    );


  const winnerBefore =
    winnerPvp.rating;

  const loserBefore =
    loserPvp.rating;

  const now =
    Math.max(
      0,
      Number(
        options?.now
      ) ||
      Date.now()
    );


  const pair =
    registerPairMatch(
      winnerProfile,
      loserProfile,
      winnerPvp,
      loserPvp,
      now,
      options
    );


  const friendly =
    pair.friendly === true;


  if (friendly) {
    const winnerRank =
      getRankFromRating(
        winnerPvp.rating
      );

    const loserRank =
      getRankFromRating(
        loserPvp.rating
      );


    winnerPvp.rank =
      winnerRank.label;

    loserPvp.rank =
      loserRank.label;


    return {
      rated: false,
      friendly: true,
      antiFarm: true,
      pairTracked:
        pair.tracked,
      previousPairMatchesInWindow:
        pair.previousMatchesInWindow,
      pairMatchesInWindow:
        pair.matchesInWindow,
      windowMs:
        PVP_PAIR_WINDOW_MS,

      /*
       * Compatibilidade: change não deve mais
       * ser usado como fonte de verdade.
       */
      change: 0,

      winner: {
        before:
          winnerBefore,
        after:
          winnerPvp.rating,
        gain: 0,
        rank:
          winnerRank.label,
        wins:
          winnerPvp.wins,
        streak:
          winnerPvp.streak
      },

      loser: {
        before:
          loserBefore,
        after:
          loserPvp.rating,
        loss: 0,
        rank:
          loserRank.label,
        losses:
          loserPvp.losses
      }
    };
  }


  const calculation =
    calculateDynamicRatingResult(
      winnerBefore,
      loserBefore,
      options
    );

  const winnerGain =
    calculation.winnerGain;

  const loserLoss =
    calculation.loserLoss;


  winnerPvp.rating =
    winnerBefore +
    winnerGain;

  loserPvp.rating =
    Math.max(
      0,
      loserBefore -
      loserLoss
    );


  winnerPvp.wins += 1;
  winnerPvp.duels += 1;

  loserPvp.losses += 1;
  loserPvp.duels += 1;


  winnerPvp.streak += 1;

  winnerPvp.bestStreak =
    Math.max(
      winnerPvp.bestStreak,
      winnerPvp.streak
    );

  loserPvp.streak =
    0;


  winnerPvp.peakRating =
    Math.max(
      winnerPvp.peakRating,
      winnerPvp.rating
    );

  loserPvp.peakRating =
    Math.max(
      loserPvp.peakRating,
      loserPvp.rating
    );


  const winnerRank =
    getRankFromRating(
      winnerPvp.rating
    );

  const loserRank =
    getRankFromRating(
      loserPvp.rating
    );


  winnerPvp.rank =
    winnerRank.label;

  loserPvp.rank =
    loserRank.label;


  return {
    rated: true,
    friendly: false,
    antiFarm: false,
    pairTracked:
      pair.tracked,
    previousPairMatchesInWindow:
      pair.previousMatchesInWindow,
    pairMatchesInWindow:
      pair.matchesInWindow,
    windowMs:
      PVP_PAIR_WINDOW_MS,

    forfeit:
      calculation.forfeit,

    earlyForfeit:
      calculation.earlyForfeit,

    /*
     * Compatibilidade legada.
     * Agora representa APENAS o ganho do vencedor.
     * Código novo deve usar winner.gain / loser.loss.
     */
    change:
      winnerGain,

    winner: {
      before:
        winnerBefore,

      after:
        winnerPvp.rating,

      gain:
        winnerGain,

      rank:
        winnerRank.label,

      wins:
        winnerPvp.wins,

      streak:
        winnerPvp.streak,

      difficulty:
        calculation.winnerDifficulty
    },

    loser: {
      before:
        loserBefore,

      after:
        loserPvp.rating,

      loss:
        loserLoss,

      requestedLoss:
        calculation.requestedLoserLoss,

      rank:
        loserRank.label,

      losses:
        loserPvp.losses,

      difficulty:
        calculation.loserDifficulty
    }
  };
}


/*
 * Recebe a classificação geral
 * e retorna apenas quem pode
 * ocupar as 7 vagas de Prodígio.
 */
export function getProdigies(
  ranking
) {
  return ranking
    .filter(
      entry =>
        normalizeRating(
          entry.rating
        ) >=
        PRODIGY_MIN_RATING
    )
    .sort(
      (a, b) =>
        b.rating -
        a.rating
    )
    .slice(
      0,
      PRODIGY_LIMIT
    )
    .map(
      (entry, index) => ({
        ...entry,

        position:
          index + 1,

        rank:
          getProdigyLabel(
            index + 1
          )
      })
    );
}
