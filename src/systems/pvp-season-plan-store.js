import {
  createPvpSeasonYearPlan,
  definePvpSeasonPlanMonth,
  normalizePvpSeasonYearPlan
} from "./pvp-season-plan.js";

import {
  normalizeSeasonYear
} from "./pvp-season-calendar.js";


export const PVP_SEASON_PLAN_STORAGE_PREFIX =
  "pvp_season_plan:";


function hasMethod(
  value,
  method
) {
  return Boolean(
    value &&
    typeof value[method] === "function"
  );
}


export function getPvpSeasonPlanStorageKey(
  year
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  if (!normalizedYear) {
    return null;
  }

  return (
    `${PVP_SEASON_PLAN_STORAGE_PREFIX}` +
    `${normalizedYear}`
  );
}


export async function readPvpSeasonYearPlan(
  storage,
  year
) {
  if (!hasMethod(storage, "get")) {
    return {
      ok: false,
      error: "SEASON_PLAN_STORAGE_UNAVAILABLE"
    };
  }

  const key =
    getPvpSeasonPlanStorageKey(
      year
    );

  if (!key) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  let stored;

  try {
    stored =
      await storage.get(key);
  }
  catch {
    return {
      ok: false,
      error: "SEASON_PLAN_STORAGE_READ_FAILED"
    };
  }

  if (
    stored === null ||
    stored === undefined
  ) {
    return {
      ok: true,
      plan: null
    };
  }

  const plan =
    normalizePvpSeasonYearPlan(
      stored
    );

  if (!plan) {
    return {
      ok: false,
      error: "INVALID_STORED_SEASON_PLAN"
    };
  }

  return {
    ok: true,
    plan
  };
}


export async function savePvpSeasonYearPlan(
  storage,
  plan
) {
  if (!hasMethod(storage, "put")) {
    return {
      ok: false,
      error: "SEASON_PLAN_STORAGE_UNAVAILABLE"
    };
  }

  const normalized =
    normalizePvpSeasonYearPlan(
      plan
    );

  if (!normalized) {
    return {
      ok: false,
      error: "INVALID_SEASON_PLAN"
    };
  }

  const key =
    getPvpSeasonPlanStorageKey(
      normalized.year
    );

  try {
    await storage.put(
      key,
      normalized
    );
  }
  catch {
    return {
      ok: false,
      error: "SEASON_PLAN_STORAGE_WRITE_FAILED"
    };
  }

  return {
    ok: true,
    plan:
      normalized
  };
}


export async function definePvpSeasonYearMonth(
  storage,
  {
    year,
    month,
    name
  } = {}
) {
  const existing =
    await readPvpSeasonYearPlan(
      storage,
      year
    );

  if (!existing.ok) {
    return existing;
  }

  let plan =
    existing.plan;

  if (!plan) {
    const created =
      createPvpSeasonYearPlan(
        year
      );

    if (!created.ok) {
      return created;
    }

    plan =
      created.plan;
  }

  const defined =
    definePvpSeasonPlanMonth(
      plan,
      {
        month,
        name
      }
    );

  if (!defined.ok) {
    return defined;
  }

  const saved =
    await savePvpSeasonYearPlan(
      storage,
      defined.plan
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed:
      defined.changed,
    definition:
      defined.definition,
    plan:
      saved.plan
  };
}
