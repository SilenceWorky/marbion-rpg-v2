import {
  PVP_SEASON_CATALOG
} from "../config/pvp-season-catalog.js";

import {
  getMonthlySeasonBounds,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";

import {
  getPvpSeasonPlanMonth
} from "./pvp-season-plan.js";

import {
  definePvpSeasonYearMonth,
  readPvpSeasonYearPlan
} from "./pvp-season-plan-store.js";

import {
  getPvpSeasonScheduledMonth
} from "./pvp-season-schedule.js";

import {
  readPvpSeasonYearSchedule,
  schedulePvpSeasonYearMonth
} from "./pvp-season-schedule-store.js";


function normalizeTimestamp(value) {
  const timestamp =
    Number(value);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return null;
  }

  return Math.round(timestamp);
}


export function listPvpSeasonCatalogEntries(
  catalog = PVP_SEASON_CATALOG
) {
  if (
    !catalog ||
    typeof catalog !== "object" ||
    Array.isArray(catalog)
  ) {
    return {
      ok: false,
      error: "INVALID_SEASON_CATALOG"
    };
  }

  const entries = [];

  for (
    const [rawYear, rawMonths]
    of Object.entries(catalog)
  ) {
    const year =
      normalizeSeasonYear(rawYear);

    if (
      !year ||
      !rawMonths ||
      typeof rawMonths !== "object" ||
      Array.isArray(rawMonths)
    ) {
      return {
        ok: false,
        error: "INVALID_SEASON_CATALOG_YEAR"
      };
    }

    for (
      const [rawMonth, rawDefinition]
      of Object.entries(rawMonths)
    ) {
      const month =
        normalizeSeasonMonth(rawMonth);

      const name =
        String(
          rawDefinition?.name ?? ""
        ).trim();

      if (
        !month ||
        !name
      ) {
        return {
          ok: false,
          error: "INVALID_SEASON_CATALOG_ENTRY",
          year,
          month:
            rawMonth
        };
      }

      const bounds =
        getMonthlySeasonBounds(
          year,
          month
        );

      if (!bounds.ok) {
        return bounds;
      }

      entries.push({
        year,
        month,
        name,
        startsAt:
          bounds.startsAt,
        endsAt:
          bounds.endsAt
      });
    }
  }

  entries.sort(
    (a, b) =>
      a.startsAt - b.startsAt
  );

  return {
    ok: true,
    entries
  };
}


/*
 * Sincroniza o catálogo de código com o planejamento e o
 * agendamento persistidos.
 *
 * Regras:
 * - catálogo apenas PREENCHE lacunas;
 * - definição já salva tem prioridade (futuro painel/site);
 * - agendamento já existente é preservado integralmente;
 * - mês que já começou não é criado no meio do caminho;
 * - nenhum pvp_current_season é criado aqui.
 */
export async function syncPvpSeasonCatalog(
  storage,
  {
    catalog = PVP_SEASON_CATALOG,
    now = Date.now()
  } = {}
) {
  const timestamp =
    normalizeTimestamp(now);

  if (timestamp === null) {
    return {
      ok: false,
      error: "INVALID_SEASON_CATALOG_SYNC_TIME"
    };
  }

  const listed =
    listPvpSeasonCatalogEntries(
      catalog
    );

  if (!listed.ok) {
    return listed;
  }

  const result = {
    ok: true,
    changed: false,
    defined: [],
    scheduled: [],
    preservedDefinitions: [],
    preservedSchedules: [],
    skippedStartedMonths: []
  };

  for (
    const entry
    of listed.entries
  ) {
    /*
     * Não criamos temporadas parciais.
     * Se o mês já começou (ou exatamente chegou ao início),
     * o catálogo não tenta cadastrá-lo tardiamente.
     */
    if (
      entry.startsAt <= timestamp
    ) {
      result.skippedStartedMonths.push({
        year:
          entry.year,
        month:
          entry.month,
        name:
          entry.name
      });

      continue;
    }

    const planResult =
      await readPvpSeasonYearPlan(
        storage,
        entry.year
      );

    if (!planResult.ok) {
      return planResult;
    }

    let definition =
      planResult.plan
        ? getPvpSeasonPlanMonth(
            planResult.plan,
            entry.month
          )
        : null;

    if (definition) {
      result.preservedDefinitions.push({
        year:
          entry.year,
        month:
          entry.month,
        name:
          definition.name
      });
    }
    else {
      const defined =
        await definePvpSeasonYearMonth(
          storage,
          {
            year:
              entry.year,
            month:
              entry.month,
            name:
              entry.name
          }
        );

      if (!defined.ok) {
        return defined;
      }

      definition =
        defined.definition;

      if (defined.changed) {
        result.changed = true;
      }

      result.defined.push({
        year:
          entry.year,
        month:
          entry.month,
        name:
          definition.name
      });
    }

    const scheduleResult =
      await readPvpSeasonYearSchedule(
        storage,
        entry.year
      );

    if (!scheduleResult.ok) {
      return scheduleResult;
    }

    const existingSchedule =
      scheduleResult.schedule
        ? getPvpSeasonScheduledMonth(
            scheduleResult.schedule,
            entry.month
          )
        : null;

    if (existingSchedule) {
      result.preservedSchedules.push({
        year:
          entry.year,
        month:
          entry.month,
        name:
          existingSchedule.name,
        scheduledAt:
          existingSchedule.scheduledAt
      });

      continue;
    }

    const scheduled =
      await schedulePvpSeasonYearMonth(
        storage,
        {
          year:
            entry.year,
          month:
            entry.month
        },
        timestamp
      );

    if (!scheduled.ok) {
      return scheduled;
    }

    if (scheduled.changed) {
      result.changed = true;
    }

    result.scheduled.push({
      year:
        entry.year,
      month:
        entry.month,
      name:
        scheduled.entry.name,
      scheduledAt:
        scheduled.entry.scheduledAt
    });
  }

  return result;
}
