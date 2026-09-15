import {
  createPvpSeasonYearSchedule,
  createScheduledPvpSeasonMonth,
  normalizePvpSeasonYearSchedule,
  setPvpSeasonScheduledMonth,
  getPvpSeasonScheduledMonth,
  clearPvpSeasonScheduledMonth
} from "./pvp-season-schedule.js";

import {
  getPvpSeasonPlanMonth
} from "./pvp-season-plan.js";

import {
  readPvpSeasonYearPlan
} from "./pvp-season-plan-store.js";

import {
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";


export const PVP_SEASON_SCHEDULE_STORAGE_PREFIX =
  "pvp_season_schedule:";


function hasMethod(
  value,
  method
) {
  return Boolean(
    value &&
    typeof value[method] === "function"
  );
}


export function getPvpSeasonScheduleStorageKey(
  year
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  if (!normalizedYear) {
    return null;
  }

  return (
    `${PVP_SEASON_SCHEDULE_STORAGE_PREFIX}` +
    `${normalizedYear}`
  );
}


export async function readPvpSeasonYearSchedule(
  storage,
  year
) {
  if (!hasMethod(storage, "get")) {
    return {
      ok: false,
      error: "SEASON_SCHEDULE_STORAGE_UNAVAILABLE"
    };
  }

  const key =
    getPvpSeasonScheduleStorageKey(
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
      error: "SEASON_SCHEDULE_STORAGE_READ_FAILED"
    };
  }

  if (
    stored === null ||
    stored === undefined
  ) {
    return {
      ok: true,
      schedule: null
    };
  }

  const schedule =
    normalizePvpSeasonYearSchedule(
      stored
    );

  if (!schedule) {
    return {
      ok: false,
      error: "INVALID_STORED_SEASON_SCHEDULE"
    };
  }

  return {
    ok: true,
    schedule
  };
}


export async function savePvpSeasonYearSchedule(
  storage,
  schedule
) {
  if (!hasMethod(storage, "put")) {
    return {
      ok: false,
      error: "SEASON_SCHEDULE_STORAGE_UNAVAILABLE"
    };
  }

  const normalized =
    normalizePvpSeasonYearSchedule(
      schedule
    );

  if (!normalized) {
    return {
      ok: false,
      error: "INVALID_SEASON_SCHEDULE"
    };
  }

  const key =
    getPvpSeasonScheduleStorageKey(
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
      error: "SEASON_SCHEDULE_STORAGE_WRITE_FAILED"
    };
  }

  return {
    ok: true,
    schedule:
      normalized
  };
}


export async function schedulePvpSeasonYearMonth(
  storage,
  {
    year,
    month
  } = {},
  now = Date.now()
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (!normalizedYear) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  if (!normalizedMonth) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  const planResult =
    await readPvpSeasonYearPlan(
      storage,
      normalizedYear
    );

  if (!planResult.ok) {
    return planResult;
  }

  if (!planResult.plan) {
    return {
      ok: false,
      error: "SEASON_YEAR_PLAN_NOT_FOUND"
    };
  }

  const definition =
    getPvpSeasonPlanMonth(
      planResult.plan,
      normalizedMonth
    );

  if (!definition) {
    return {
      ok: false,
      error: "SEASON_MONTH_DEFINITION_NOT_FOUND"
    };
  }

  const existing =
    await readPvpSeasonYearSchedule(
      storage,
      normalizedYear
    );

  if (!existing.ok) {
    return existing;
  }

  /*
   * Agendar novamente o mesmo mês é uma operação
   * estritamente idempotente. O primeiro scheduledAt
   * representa quando aquele mês foi oficialmente
   * autorizado e não deve ser reescrito por retries,
   * pelo futuro painel ou por reconciliações repetidas.
   *
   * Edições posteriores do nome são sincronizadas pela
   * operação explícita syncScheduledPvpSeasonYearMonthName,
   * preservando este contrato de idempotência.
   */
  const alreadyScheduled =
    existing.schedule
      ? getPvpSeasonScheduledMonth(
          existing.schedule,
          normalizedMonth
        )
      : null;

  if (alreadyScheduled) {
    return {
      ok: true,
      changed: false,
      entry:
        alreadyScheduled,
      schedule:
        existing.schedule
    };
  }

  const entryResult =
    createScheduledPvpSeasonMonth(
      definition,
      now
    );

  if (!entryResult.ok) {
    return entryResult;
  }

  let schedule =
    existing.schedule;

  if (!schedule) {
    const created =
      createPvpSeasonYearSchedule(
        normalizedYear
      );

    if (!created.ok) {
      return created;
    }

    schedule =
      created.schedule;
  }

  const next =
    setPvpSeasonScheduledMonth(
      schedule,
      entryResult.entry
    );

  if (!next.ok) {
    return next;
  }

  const saved =
    await savePvpSeasonYearSchedule(
      storage,
      next.schedule
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed:
      next.changed,
    entry:
      next.entry,
    schedule:
      saved.schedule
  };
}


/*
 * Mantém o snapshot de um mês futuro alinhado com o nome
 * do planejamento anual sem recriar o agendamento.
 *
 * O scheduledAt original, o ID e os limites civis permanecem
 * intactos. Se o mês já foi ativado, seu agendamento já foi
 * consumido/removido; portanto esta operação vira no-op e nunca
 * renomeia automaticamente uma temporada ACTIVE.
 */
export async function syncScheduledPvpSeasonYearMonthName(
  storage,
  {
    year,
    month,
    name
  } = {}
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  const normalizedName =
    String(name ?? "")
      .trim();

  if (!normalizedYear) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  if (!normalizedMonth) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  if (!normalizedName) {
    return {
      ok: false,
      error: "INVALID_SEASON_NAME"
    };
  }

  const existing =
    await readPvpSeasonYearSchedule(
      storage,
      normalizedYear
    );

  if (!existing.ok) {
    return existing;
  }

  if (!existing.schedule) {
    return {
      ok: true,
      changed: false,
      synced: false,
      reason: "NO_SEASON_SCHEDULE",
      schedule: null,
      entry: null
    };
  }

  const scheduled =
    getPvpSeasonScheduledMonth(
      existing.schedule,
      normalizedMonth
    );

  if (!scheduled) {
    return {
      ok: true,
      changed: false,
      synced: false,
      reason: "NO_SCHEDULED_SEASON_FOR_MONTH",
      schedule:
        existing.schedule,
      entry: null
    };
  }

  if (scheduled.name === normalizedName) {
    return {
      ok: true,
      changed: false,
      synced: true,
      entry:
        scheduled,
      schedule:
        existing.schedule
    };
  }

  const next =
    setPvpSeasonScheduledMonth(
      existing.schedule,
      {
        ...scheduled,
        name:
          normalizedName
      }
    );

  if (!next.ok) {
    return next;
  }

  const saved =
    await savePvpSeasonYearSchedule(
      storage,
      next.schedule
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed: true,
    synced: true,
    entry:
      next.entry,
    schedule:
      saved.schedule
  };
}


export async function cancelScheduledPvpSeasonYearMonth(
  storage,
  {
    year,
    month
  } = {}
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

  if (!normalizedYear) {
    return {
      ok: false,
      error: "INVALID_SEASON_YEAR"
    };
  }

  if (!normalizedMonth) {
    return {
      ok: false,
      error: "INVALID_SEASON_MONTH"
    };
  }

  const existing =
    await readPvpSeasonYearSchedule(
      storage,
      normalizedYear
    );

  if (!existing.ok) {
    return existing;
  }

  if (!existing.schedule) {
    return {
      ok: true,
      changed: false,
      schedule: null
    };
  }

  const cleared =
    clearPvpSeasonScheduledMonth(
      existing.schedule,
      normalizedMonth
    );

  if (!cleared.ok) {
    return cleared;
  }

  if (!cleared.changed) {
    return {
      ok: true,
      changed: false,
      schedule:
        cleared.schedule
    };
  }

  const saved =
    await savePvpSeasonYearSchedule(
      storage,
      cleared.schedule
    );

  if (!saved.ok) {
    return saved;
  }

  return {
    ok: true,
    changed: true,
    schedule:
      saved.schedule
  };
}
