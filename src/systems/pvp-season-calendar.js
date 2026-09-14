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
 * Só registramos aqui temas já definidos canonicamente.
 * Meses ainda não fechados ficam sem tema e não podem
 * ser ativados em produção até receberem um tema-base.
 */
const BASE_THEMES = {
  8: "Arquivo do Infinito",
  9: "Jardim do Criador"
};


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
