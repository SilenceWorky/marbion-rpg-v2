import {
  getMonthlySeasonId,
  getSeasonMonthName,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";


export const PVP_SEASON_PLAN_VERSION = 1;


function normalizeText(value) {
  const text =
    String(value ?? "")
      .trim();

  return text || null;
}


function getMonthKey(month) {
  const normalized =
    normalizeSeasonMonth(month);

  if (!normalized) {
    return null;
  }

  return String(normalized)
    .padStart(2, "0");
}


export function createPvpSeasonYearPlan(
  year
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  if (!normalizedYear) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  return {
    ok: true,
    plan: {
      version:
        PVP_SEASON_PLAN_VERSION,
      year:
        normalizedYear,
      months: {}
    }
  };
}


export function normalizePvpSeasonPlanMonth(
  value,
  fallbackYear = null
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const year =
    normalizeSeasonYear(
      value.year ??
      fallbackYear
    );

  const month =
    normalizeSeasonMonth(
      value.month
    );

  const name =
    normalizeText(
      value.name
    );

  if (
    !year ||
    !month ||
    !name
  ) {
    return null;
  }

  return {
    id:
      getMonthlySeasonId(
        year,
        month
      ),
    year,
    month,
    monthName:
      getSeasonMonthName(month),
    name
  };
}


export function normalizePvpSeasonYearPlan(
  value
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const year =
    normalizeSeasonYear(
      value.year
    );

  if (!year) {
    return null;
  }

  const rawMonths =
    value.months &&
    typeof value.months === "object"
      ? value.months
      : {};

  const months = {};

  for (
    let month = 1;
    month <= 12;
    month += 1
  ) {
    const key =
      getMonthKey(month);

    const raw =
      rawMonths[key] ??
      rawMonths[month];

    if (
      raw === null ||
      raw === undefined
    ) {
      continue;
    }

    const normalized =
      normalizePvpSeasonPlanMonth(
        {
          ...raw,
          month
        },
        year
      );

    if (!normalized) {
      return null;
    }

    months[key] =
      normalized;
  }

  return {
    version:
      PVP_SEASON_PLAN_VERSION,
    year,
    months
  };
}


export function definePvpSeasonPlanMonth(
  plan,
  {
    month,
    name
  } = {}
) {
  const normalizedPlan =
    normalizePvpSeasonYearPlan(
      plan
    );

  if (!normalizedPlan) {
    return {
      ok: false,
      error: "INVALID_SEASON_PLAN"
    };
  }

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (!normalizedMonth) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  const normalizedName =
    normalizeText(name);

  if (!normalizedName) {
    return {
      ok: false,
      error: "INVALID_SEASON_NAME"
    };
  }

  const key =
    getMonthKey(
      normalizedMonth
    );

  const definition =
    normalizePvpSeasonPlanMonth(
      {
        year:
          normalizedPlan.year,
        month:
          normalizedMonth,
        name:
          normalizedName
      }
    );

  const previous =
    normalizedPlan.months[key] ??
    null;

  const nextPlan = {
    ...normalizedPlan,
    months: {
      ...normalizedPlan.months,
      [key]: definition
    }
  };

  return {
    ok: true,
    changed:
      !previous ||
      previous.name !==
        definition.name,
    definition,
    plan:
      nextPlan
  };
}


export function getPvpSeasonPlanMonth(
  plan,
  month
) {
  const normalizedPlan =
    normalizePvpSeasonYearPlan(
      plan
    );

  const key =
    getMonthKey(month);

  if (
    !normalizedPlan ||
    !key
  ) {
    return null;
  }

  return (
    normalizedPlan.months[key] ??
    null
  );
}


export function clearPvpSeasonPlanMonth(
  plan,
  month
) {
  const normalizedPlan =
    normalizePvpSeasonYearPlan(
      plan
    );

  if (!normalizedPlan) {
    return {
      ok: false,
      error: "INVALID_SEASON_PLAN"
    };
  }

  const key =
    getMonthKey(month);

  if (!key) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  if (!normalizedPlan.months[key]) {
    return {
      ok: true,
      changed: false,
      plan:
        normalizedPlan
    };
  }

  const months = {
    ...normalizedPlan.months
  };

  delete months[key];

  return {
    ok: true,
    changed: true,
    plan: {
      ...normalizedPlan,
      months
    }
  };
}
