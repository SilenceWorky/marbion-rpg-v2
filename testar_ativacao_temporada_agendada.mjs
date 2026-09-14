import assert from "node:assert/strict";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth,
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";

import {
  getPvpSeasonScheduledMonth
} from "./src/systems/pvp-season-schedule.js";

import {
  readCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";

import {
  activateDueScheduledPvpSeason
} from "./src/systems/pvp-season-activation.js";


function createStorage() {
  const data = new Map();

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


console.log("=== ATIVAÇÃO DE TEMPORADA AGENDADA ===");


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

  const scheduledAt =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const scheduled =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9
      },
      scheduledAt
    );

  assert.equal(scheduled.ok, true);

  const activated =
    await activateDueScheduledPvpSeason(
      storage,
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      )
    );

  assert.equal(activated.ok, true);
  assert.equal(activated.changed, true);
  assert.equal(activated.activated, true);
  assert.equal(
    activated.season.id,
    "2026-09"
  );
  assert.equal(
    activated.season.name,
    "Um Novo Florescer"
  );
  assert.equal(
    activated.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    activated.season.monthName,
    "Setembro"
  );
  assert.equal(
    activated.season.status,
    "ACTIVE"
  );

  console.log("✅ Temporada agendada é ativada exatamente no início do mês e recebe o tema-base permanente.");


  const current =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(current.ok, true);
  assert.equal(current.season.id, "2026-09");

  const scheduleAfter =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(scheduleAfter.ok, true);
  assert.equal(
    getPvpSeasonScheduledMonth(
      scheduleAfter.schedule,
      9
    ),
    null
  );

  console.log("✅ Após ativar, o agendamento pendente do mês é limpo sem apagar a temporada atual.");


  const second =
    await activateDueScheduledPvpSeason(
      storage,
      Date.parse(
        "2026-09-01T00:00:01.000-03:00"
      )
    );

  assert.equal(second.ok, true);
  assert.equal(second.changed, false);
  assert.equal(second.activated, false);

  console.log("✅ Reexecutar o motor após a ativação é idempotente e não cria temporada duplicada.");
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

  const result =
    await activateDueScheduledPvpSeason(
      storage,
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      )
    );

  assert.equal(result.ok, true);
  assert.equal(result.changed, false);
  assert.equal(result.activated, false);

  const current =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(current.ok, true);
  assert.equal(current.season, null);

  console.log("✅ Definir o nome anual sem agendar não ativa temporada automaticamente.");
}


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

  await schedulePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 10
    },
    Date.parse(
      "2026-09-20T12:00:00.000-03:00"
    )
  );

  const result =
    await activateDueScheduledPvpSeason(
      storage,
      Date.parse(
        "2026-10-01T00:00:00.000-03:00"
      )
    );

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "SEASON_BASE_THEME_NOT_CONFIGURED"
  );

  const current =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(current.ok, true);
  assert.equal(current.season, null);

  console.log("✅ Mês sem tema-base canônico não é ativado por engano.");
}


console.log("\n🏆 TODOS OS TESTES DA ATIVAÇÃO DE TEMPORADA AGENDADA PASSARAM.");
