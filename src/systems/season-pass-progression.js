export const SEASON_PASS_MAX_TIER =
  100;

export const SEASON_PASS_TOTAL_XP =
  53250;

export const SEASON_PASS_POST_REWARD_XP =
  550;


/*
 * Custo de cada patamar, do 1 ao 100.
 *
 * A soma canônica é exatamente 53.250 XP.
 */
export const SEASON_PASS_TIER_COSTS =
  Object.freeze([
    50, 67, 83, 100, 117,
    133, 150, 167, 183, 200,

    200, 211, 221, 232, 243,
    254, 264, 275, 286, 296,
    307, 318, 329, 339, 350,

    350, 358, 367, 375, 383,
    392, 400, 408, 417, 425,
    433, 442, 450, 458, 467,
    475, 483, 492, 500, 508,
    517, 525, 533, 542, 550,

    550, 558, 565, 572, 580,
    588, 595, 602, 610, 618,
    625, 632, 640, 648, 655,
    662, 670, 678, 685, 692,
    700, 708, 715, 722, 730,

    750, 756, 762, 769, 775,
    781, 788, 794, 800, 806,
    812, 819, 825, 831, 838,
    844, 850, 856, 862, 869,
    875, 881, 888, 894, 900
  ]);


function normalizeNonNegativeInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return 0;
  }

  return Math.floor(number);
}


export function getSeasonPassTierCost(
  tier
) {
  const normalizedTier =
    Math.floor(
      Number(tier)
    );

  if (
    !Number.isFinite(normalizedTier) ||
    normalizedTier < 1 ||
    normalizedTier >
      SEASON_PASS_MAX_TIER
  ) {
    return null;
  }

  return (
    SEASON_PASS_TIER_COSTS[
      normalizedTier - 1
    ] ?? null
  );
}


export function getSeasonPassThreshold(
  tier
) {
  const normalizedTier =
    Math.floor(
      Number(tier)
    );

  if (
    !Number.isFinite(normalizedTier) ||
    normalizedTier < 0 ||
    normalizedTier >
      SEASON_PASS_MAX_TIER
  ) {
    return null;
  }

  let total = 0;

  for (
    let index = 0;
    index < normalizedTier;
    index += 1
  ) {
    total +=
      SEASON_PASS_TIER_COSTS[
        index
      ];
  }

  return total;
}


export function getSeasonPassProgress(
  xp
) {
  const totalXp =
    normalizeNonNegativeInteger(
      xp
    );

  const cappedPassXp =
    Math.min(
      totalXp,
      SEASON_PASS_TOTAL_XP
    );

  let tier = 0;
  let consumedXp = 0;

  for (
    const cost of
      SEASON_PASS_TIER_COSTS
  ) {
    if (
      consumedXp + cost >
      cappedPassXp
    ) {
      break;
    }

    consumedXp += cost;
    tier += 1;
  }

  const completed =
    tier >=
    SEASON_PASS_MAX_TIER;

  if (completed) {
    return {
      xp:
        cappedPassXp,
      tier:
        SEASON_PASS_MAX_TIER,
      completed: true,
      xpIntoTier: 0,
      xpForNextTier: 0,
      xpRemainingToNextTier: 0
    };
  }

  const xpForNextTier =
    getSeasonPassTierCost(
      tier + 1
    );

  const xpIntoTier =
    cappedPassXp -
    consumedXp;

  return {
    xp:
      cappedPassXp,
    tier,
    completed: false,
    xpIntoTier,
    xpForNextTier,
    xpRemainingToNextTier:
      xpForNextTier -
      xpIntoTier
  };
}


export function splitSeasonPassXp(
  currentPassXp,
  gainedXp
) {
  const current =
    Math.min(
      normalizeNonNegativeInteger(
        currentPassXp
      ),
      SEASON_PASS_TOTAL_XP
    );

  const gained =
    normalizeNonNegativeInteger(
      gainedXp
    );

  const remainingInPass =
    Math.max(
      0,
      SEASON_PASS_TOTAL_XP -
      current
    );

  const passGain =
    Math.min(
      gained,
      remainingInPass
    );

  return {
    passXp:
      current + passGain,
    postPassGain:
      gained - passGain
  };
}


export function resolvePostPassRewards(
  currentPostPassXp,
  gainedXp
) {
  const total =
    normalizeNonNegativeInteger(
      currentPostPassXp
    ) +
    normalizeNonNegativeInteger(
      gainedXp
    );

  return {
    rewards:
      Math.floor(
        total /
        SEASON_PASS_POST_REWARD_XP
      ),
    postPassXp:
      total %
      SEASON_PASS_POST_REWARD_XP
  };
}
