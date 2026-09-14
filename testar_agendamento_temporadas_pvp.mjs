import assert from "node:assert/strict";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  getPvpSeasonScheduledMonth
} from "./src/systems/pvp-season-schedule.js";

import {
  schedulePvpSeasonYearMonth,
  cancelScheduledPvpSeasonYearMonth,
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";


function createStorage() {
  const data =
    new Map();

  return {
    data,

    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      data.set(
        key,
        structuredClone(value)
      );
    },

    async delete(key) {
      data.delete(key);
    }
  };
}


console.log("=== AGENDAMENTO DE TEMPORADAS ===");


{
  const storage =
    createStorage();

  await definePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 10,
      name: "Noite das Almas"
    }
  );

  const now =
    Date.parse(
      "2026-09-14T18:00:00.000-03:00"
    );

  const scheduled =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10
      },
      now
    );

  assert.equal(scheduled.ok, true);
  assert.equal(scheduled.changed, true);
  assert.equal(scheduled.entry.id, "2026-10");
  assert.equal(scheduled.entry.name, "Noite das Almas");
  assert.equal(scheduled.entry.status, "SCHEDULED");
  assert.equal(
    new Date(scheduled.entry.startsAt).toISOString(),
    "2026-10-01T03:00:00.000Z"
  );
  assert.equal(
    new Date(scheduled.entry.endsAt).toISOString(),
    "2026-11-01T03:00:00.000Z"
  );

  console.log("✅ Temporada previamente definida pode ser agendada para o próximo mês sem ser ativada imediatamente.");


  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ Agendar não cria nem ativa pvp_current_season.");


  const readBack =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(readBack.ok, true);
  assert.equal(
    getPvpSeasonScheduledMonth(
      readBack.schedule,
      10
    ).name,
    "Noite das Almas"
  );

  console.log("✅ Agendamento fica persistido separadamente do planejamento anual.");


  const scheduledAgain =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10
      },
      now
    );

  assert.equal(scheduledAgain.ok, true);
  assert.equal(scheduledAgain.changed, false);

  console.log("✅ Repetir o mesmo agendamento é idempotente.");


  const cancelled =
    await cancelScheduledPvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10
      }
    );

  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.changed, true);
  assert.equal(
    getPvpSeasonScheduledMonth(
      cancelled.schedule,
      10
    ),
    null
  );

  console.log("✅ Agendamento pode ser cancelado sem apagar o nome definido no planejamento anual.");
}


{
  const storage =
    createStorage();

  const missingPlan =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2027,
        month: 1
      },
      Date.parse(
        "2026-12-01T00:00:00.000-03:00"
      )
    );

  assert.equal(missingPlan.ok, false);
  assert.equal(
    missingPlan.error,
    "SEASON_YEAR_PLAN_NOT_FOUND"
  );

  console.log("✅ Não é possível agendar um ano sem planejamento definido.");
}


{
  const storage =
    createStorage();

  await definePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 11,
      name: "Marcha do Caos"
    }
  );

  const undefinedMonth =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 12
      },
      Date.parse(
        "2026-10-01T00:00:00.000-03:00"
      )
    );

  assert.equal(undefinedMonth.ok, false);
  assert.equal(
    undefinedMonth.error,
    "SEASON_MONTH_DEFINITION_NOT_FOUND"
  );

  console.log("✅ Um mês só pode ser agendado depois de receber seu nome anual.");
}


{
  const storage =
    createStorage();

  await definePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 9,
      name: "Um Novo Florescer"
    }
  );

  const late =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9
      },
      Date.parse(
        "2026-09-14T18:00:00.000-03:00"
      )
    );

  assert.equal(late.ok, false);
  assert.equal(
    late.error,
    "SEASON_SCHEDULE_WINDOW_CLOSED"
  );

  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ O sistema rejeita agendar uma temporada depois que o mês já começou.");
}


console.log("\n🏆 TODOS OS TESTES DO AGENDAMENTO DE TEMPORADAS PASSARAM.");
