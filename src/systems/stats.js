const STAT_ALIASES = {
  forca: "strength",
  strength: "strength",

  forcamagica: "magicStrength",
  magia: "magicStrength",
  magicstrength: "magicStrength",

  velocidade: "speed",
  speed: "speed",

  evasao: "evasion",
  evasion: "evasion",

  precisao: "accuracy",
  accuracy: "accuracy",

  defesa: "defense",
  defense: "defense"
};


function normalizeStat(stat) {
  return String(stat ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]/g, "")
    .toLowerCase();
}


export function spendStatusPoints(
  profile,
  stat,
  amount = 1
) {
  const normalizedStat =
    normalizeStat(stat);

  const profileField =
    STAT_ALIASES[normalizedStat];


  if (!profileField) {
    return {
      ok: false,
      error: "INVALID_STAT"
    };
  }


  const points =
    Number(amount);


  if (
    !Number.isInteger(points) ||
    points <= 0
  ) {
    return {
      ok: false,
      error: "INVALID_AMOUNT"
    };
  }


  profile.statusPoints =
    Math.max(
      0,
      Number(profile.statusPoints) || 0
    );


  if (profile.statusPoints < points) {
    return {
      ok: false,
      error: "NOT_ENOUGH_POINTS",
      available:
        profile.statusPoints,
      requested:
        points
    };
  }


  profile[profileField] =
    Math.max(
      0,
      Number(profile[profileField]) || 0
    );


  profile[profileField] +=
    points;

  profile.statusPoints -=
    points;


  return {
    ok: true,

    stat:
      profileField,

    amountSpent:
      points,

    newValue:
      profile[profileField],

    statusPoints:
      profile.statusPoints
  };
}