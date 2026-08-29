export const PVP_STARTING_RATING =
  1000;

export const PVP_ELO_K =
  32;

export const PRODIGY_MIN_RATING =
  2700;

export const PRODIGY_LIMIT =
  7;


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
 * Probabilidade matemática de A
 * derrotar B no sistema Elo.
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
 * Calcula quanto o vencedor ganha.
 *
 * Como estamos usando o mesmo K
 * para ambos, o perdedor perde
 * o mesmo valor.
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


  return pvp;
}


/*
 * Aplica o resultado de uma
 * partida ranqueada aos perfis.
 *
 * Esta função NÃO salva no KV.
 */
export function applyRankedResult(
  winnerProfile,
  loserProfile
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


  const change =
    calculateRatingChange(
      winnerBefore,
      loserBefore
    );


  winnerPvp.rating =
    winnerBefore +
    change;


  loserPvp.rating =
    Math.max(
      0,
      loserBefore -
      change
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
    change,

    winner: {
      before:
        winnerBefore,

      after:
        winnerPvp.rating,

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

      rank:
        loserRank.label,

      losses:
        loserPvp.losses
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