export const PVP_SEASON_TIMEZONE =
  "America/Fortaleza";

export const PVP_SEASON_UTC_OFFSET =
  "-03:00";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

/*
 * Temas-base permanentes por mês.
 *
 * Os 12 temas abaixo foram confirmados canonicamente.
 * O nome anual da temporada continua separado do
 * tema-base e pode variar de um ano para outro.
 */
const BASE_THEMES = {
  1: "Novo Amanhecer",
  2: "Festival das Cores",
  3: "Marcha das Tempestades",
  4: "Véu das Ilusões",
  5: "Florescimento de Auroris",
  6: "Fogueiras de Marbion",
  7: "Coração do Inverno",
  8: "Arquivo do Infinito",
  9: "Jardim do Criador",
  10: "Noite do Terror",
  11: "Marcha do Caos",
  12: "Festival de Natal"
};


export const PVP_SEASON_ELEMENT_BASE_YEAR =
  2026;

const SEASONAL_ELEMENT_TRIOS_2026 = [
  ["Luz", "Tempo", "Fogo"],
  ["Cristal", "Ilusão", "Radiação"],
  ["Eletricidade", "Som", "Vento"],
  ["Psíquico", "Sombra", "Neutro"],
  ["Natureza", "Terra", "Água"],
  ["Lava", "Plasma", "Metal"],
  ["Gelo", "Fluxo", "Gravidade"],
  ["Espaço", "Matéria", "Singularidade"],
  ["Vidro", "Vapor", "Magnetismo"],
  ["Veneno", "Ácido", "Obsidiana"],
  ["Água", "Fogo", "Vento"],
  ["Gelo", "Terra", "Natureza"]
];

function positiveModulo(
  value,
  divisor
) {
  return (
    (value % divisor) +
    divisor
  ) % divisor;
}

export function getSeasonalFeaturedElements(
  year,
  month
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (
    !normalizedYear ||
    !normalizedMonth
  ) {
    return null;
  }

  const displacement =
    normalizedYear -
    PVP_SEASON_ELEMENT_BASE_YEAR;

  const monthIndex =
    normalizedMonth - 1;

  const baseIndex =
    positiveModulo(
      monthIndex - displacement,
      SEASONAL_ELEMENT_TRIOS_2026.length
    );

  return [
    ...SEASONAL_ELEMENT_TRIOS_2026[
      baseIndex
    ]
  ];
}


function normalizeText(value) {
  const text =
    String(value ?? "")
      .trim();

  return text || null;
}


export function normalizeSeasonYear(value) {
  const year =
    Number(value);

  if (
    !Number.isInteger(year) ||
    year < 2020 ||
    year > 9999
  ) {
    return null;
  }

  return year;
}


export function normalizeSeasonMonth(value) {
  const month =
    Number(value);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return month;
}


export function getSeasonMonthName(month) {
  const normalized =
    normalizeSeasonMonth(month);

  if (!normalized) {
    return null;
  }

  return MONTH_NAMES[
    normalized - 1
  ];
}


export function getSeasonBaseTheme(month) {
  const normalized =
    normalizeSeasonMonth(month);

  if (!normalized) {
    return null;
  }

  return BASE_THEMES[normalized] ?? null;
}


export function getMonthlySeasonId(
  year,
  month
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (
    !normalizedYear ||
    !normalizedMonth
  ) {
    return null;
  }

  return `${normalizedYear}-${String(normalizedMonth).padStart(2, "0")}`;
}


function formatMonthStartIso(
  year,
  month
) {
  return (
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000` +
    PVP_SEASON_UTC_OFFSET
  );
}


export function getMonthlySeasonBounds(
  year,
  month
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (
    !normalizedYear ||
    !normalizedMonth
  ) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  const nextYear =
    normalizedMonth === 12
      ? normalizedYear + 1
      : normalizedYear;

  const nextMonth =
    normalizedMonth === 12
      ? 1
      : normalizedMonth + 1;

  const startsAt =
    Date.parse(
      formatMonthStartIso(
        normalizedYear,
        normalizedMonth
      )
    );

  const endsAt =
    Date.parse(
      formatMonthStartIso(
        nextYear,
        nextMonth
      )
    );

  if (
    !Number.isFinite(startsAt) ||
    !Number.isFinite(endsAt) ||
    endsAt <= startsAt
  ) {
    return {
      ok: false,
      error: "INVALID_SEASON_BOUNDS"
    };
  }

  return {
    ok: true,
    year: normalizedYear,
    month: normalizedMonth,
    monthName:
      getSeasonMonthName(
        normalizedMonth
      ),
    startsAt,
    endsAt,
    timezone:
      PVP_SEASON_TIMEZONE
  };
}


export function getSeasonCalendarPartsAt(
  timestamp = Date.now()
) {
  const normalized =
    Number(timestamp);

  if (
    !Number.isFinite(normalized) ||
    normalized < 0
  ) {
    return null;
  }

  const fortalezaTime =
    new Date(
      Math.round(normalized) -
      3 * 60 * 60 * 1000
    );

  return {
    year:
      fortalezaTime.getUTCFullYear(),
    month:
      fortalezaTime.getUTCMonth() + 1,
    day:
      fortalezaTime.getUTCDate(),
    hour:
      fortalezaTime.getUTCHours(),
    minute:
      fortalezaTime.getUTCMinutes(),
    second:
      fortalezaTime.getUTCSeconds(),
    timezone:
      PVP_SEASON_TIMEZONE
  };
}


export function createMonthlySeasonDefinition({
  year,
  month,
  baseTheme,
  name
} = {}) {
  const bounds =
    getMonthlySeasonBounds(
      year,
      month
    );

  if (!bounds.ok) {
    return bounds;
  }

  const normalizedBaseTheme =
    normalizeText(
      baseTheme ??
      getSeasonBaseTheme(bounds.month)
    );

  const normalizedName =
    normalizeText(name);

  if (!normalizedBaseTheme) {
    return {
      ok: false,
      error: "INVALID_SEASON_BASE_THEME"
    };
  }

  if (!normalizedName) {
    return {
      ok: false,
      error: "INVALID_SEASON_NAME"
    };
  }

  return {
    ok: true,
    definition: {
      id:
        getMonthlySeasonId(
          bounds.year,
          bounds.month
        ),
      year:
        bounds.year,
      month:
        bounds.month,
      monthName:
        bounds.monthName,
      baseTheme:
        normalizedBaseTheme,
      name:
        normalizedName,
      startsAt:
        bounds.startsAt,
      endsAt:
        bounds.endsAt,
      timezone:
        bounds.timezone
    }
  };
}
