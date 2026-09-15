import assert from "node:assert/strict";

import {
  activateDueScheduledPvpSeason
} from "./src/systems/pvp-season-activation.js";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth
} from "./src/systems/pvp-season-schedule-store.js";

import {
  readCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";


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
    },

    async list({ prefix } = {}) {
      const result = new Map();

      for (const [key, value] of data.entries()) {
        if (
          !prefix ||
          String(key).startsWith(prefix)
        ) {
          result.set(
            key,
            structuredClone(value)
          );
        }
      }

      return result;
    }
  };
}


async function defineAndSchedule(
  storage,
  {
    year,
    month,
    name,
    scheduledAt
  }
) {
  const defined =
    await definePvpSeasonYearMonth(
      storage,
      {
        year,
        month,
        name
      }
    );

  assert.equal(defined.ok, true);

  const scheduled =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year,
        month
      },
      scheduledAt
    );

  assert.equal(scheduled.ok, true);
}


console.log("=== ATIVAÇÃO ATRASADA SEM PRORROGAR A TEMPORADA ===");


/*
 * Caso 1:
 * Agosto estava autorizado, mas o processamento que deveria
 * acontecer à meia-noite só ocorre dez horas depois.
 *
 * A temporada deve iniciar normalmente porque ainda estamos em
 * agosto. Porém seus limites continuam sendo os limites civis
 * canônicos: 01/08 00:00 até 01/09 00:00. As dez horas perdidas
 * não são empurradas para setembro.
 */
{
  const storage = createStorage();

  const scheduledAt =
    Date.parse(
      "2026-07-31T12:00:00.000-03:00"
    );

  const augustStart =
    Date.parse(
      "2026-08-01T00:00:00.000-03:00"
    );

  const delayedActivation =
    Date.parse(
      "2026-08-01T10:00:00.000-03:00"
    );

  const septemberStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  await defineAndSchedule(
    storage,
    {
      year: 2026,
      month: 8,
      name: "Arquivo Desperto",
      scheduledAt
    }
  );

  const activated =
    await activateDueScheduledPvpSeason(
      storage,
      delayedActivation
    );

  assert.equal(activated.ok, true);
  assert.equal(activated.activated, true);
  assert.equal(activated.changed, true);
  assert.equal(activated.season.id, "2026-08");
  assert.equal(
    activated.season.startsAt,
    augustStart
  );
  assert.equal(
    activated.season.endsAt,
    septemberStart
  );

  assert.equal(
    activated.season.startsAt <
      delayedActivation,
    true
  );

  assert.equal(
    activated.season.endsAt -
      activated.season.startsAt,
    septemberStart -
      augustStart
  );

  console.log("✅ Um atraso de 10 horas ainda ativa o mês autorizado enquanto ele estiver em andamento.");
  console.log("✅ O startsAt permanece na meia-noite original e o endsAt continua na virada do mês seguinte; o atraso não é prorrogado.");
}


/*
 * Caso 2:
 * Agosto foi autorizado, mas o sistema só tenta processá-lo já
 * em setembro. Agosto não pode nascer atrasado no mês seguinte.
 */
{
  const storage = createStorage();

  const scheduledAt =
    Date.parse(
      "2026-07-31T12:00:00.000-03:00"
    );

  const septemberLate =
    Date.parse(
      "2026-09-01T00:05:00.000-03:00"
    );

  await defineAndSchedule(
    storage,
    {
      year: 2026,
      month: 8,
      name: "Arquivo Desperto",
      scheduledAt
    }
  );

  const result =
    await activateDueScheduledPvpSeason(
      storage,
      septemberLate
    );

  assert.equal(result.ok, true);
  assert.equal(result.activated, false);
  assert.equal(result.changed, false);
  assert.equal(
    result.reason,
    "NO_SCHEDULED_SEASON_FOR_CURRENT_MONTH"
  );

  const current =
    await readCurrentPvpSeason(storage);

  assert.equal(current.ok, true);
  assert.equal(current.season, null);

  console.log("✅ Se o processamento só ocorrer no mês seguinte, a temporada do mês anterior não é iniciada.");
}


/*
 * Caso 3:
 * Agosto ficou para trás, mas setembro também estava previamente
 * autorizado. Ao acordar já em setembro, o sistema deve considerar
 * somente setembro e manter novamente os limites civis do próprio
 * mês, sem carregar qualquer atraso ou duração de agosto.
 */
{
  const storage = createStorage();

  const julyPlanning =
    Date.parse(
      "2026-07-31T12:00:00.000-03:00"
    );

  const augustPlanning =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const septemberStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  const septemberLate =
    Date.parse(
      "2026-09-01T10:00:00.000-03:00"
    );

  const octoberStart =
    Date.parse(
      "2026-10-01T00:00:00.000-03:00"
    );

  await defineAndSchedule(
    storage,
    {
      year: 2026,
      month: 8,
      name: "Arquivo Desperto",
      scheduledAt: julyPlanning
    }
  );

  await defineAndSchedule(
    storage,
    {
      year: 2026,
      month: 9,
      name: "Um Novo Florescer",
      scheduledAt: augustPlanning
    }
  );

  const activated =
    await activateDueScheduledPvpSeason(
      storage,
      septemberLate
    );

  assert.equal(activated.ok, true);
  assert.equal(activated.activated, true);
  assert.equal(activated.season.id, "2026-09");
  assert.equal(
    activated.season.startsAt,
    septemberStart
  );
  assert.equal(
    activated.season.endsAt,
    octoberStart
  );

  console.log("✅ Ao acordar em um novo mês autorizado, somente o mês atual é ativado e seus limites continuam canônicos.");
}


console.log("\n🏆 TODOS OS TESTES DE ATIVAÇÃO ATRASADA PASSARAM.");
