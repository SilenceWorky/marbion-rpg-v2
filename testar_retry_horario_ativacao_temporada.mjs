import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth,
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";

import {
  readCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";


function createStorage() {
  const data = new Map();
  let alarmAt = null;
  let failCurrentSeasonWrite = false;

  return {
    data,

    setFailCurrentSeasonWrite(value) {
      failCurrentSeasonWrite =
        Boolean(value);
    },

    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      if (
        key === "pvp_current_season" &&
        failCurrentSeasonWrite
      ) {
        throw new Error(
          "simulated-current-season-write-failure"
        );
      }

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
    },

    async getAlarm() {
      return alarmAt;
    },

    async setAlarm(value) {
      alarmAt = Number(value);
    },

    async deleteAlarm() {
      alarmAt = null;
    }
  };
}


console.log("=== RETRY HORÁRIO DA ATIVAÇÃO DE TEMPORADA ===");


const storage = createStorage();
const coordinator =
  new PvpCoordinator(
    { storage },
    {}
  );

const originalDateNow = Date.now;

try {
  const planningNow =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const septemberStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  const firstRetry =
    Date.parse(
      "2026-09-01T01:00:00.000-03:00"
    );

  const octoberStart =
    Date.parse(
      "2026-10-01T00:00:00.000-03:00"
    );

  Date.now = () => planningNow;

  const defined =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9,
        name: "Um Novo Florescer"
      }
    );

  assert.equal(defined.ok, true);

  const scheduled =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9
      },
      planningNow
    );

  assert.equal(scheduled.ok, true);

  const initialAlarm =
    await coordinator.scheduleCoordinatorAlarm();

  assert.equal(initialAlarm.ok, true);
  assert.equal(initialAlarm.stage, "SEASON_START");
  assert.equal(initialAlarm.alarmAt, septemberStart);
  assert.equal(
    await storage.getAlarm(),
    septemberStart
  );

  console.log("✅ Antes do mês começar, o alarm normal continua apontando para a meia-noite da ativação.");


  Date.now = () => septemberStart;
  storage.setFailCurrentSeasonWrite(true);

  await coordinator.alarm();

  const afterFailure =
    await readCurrentPvpSeason(storage);

  assert.equal(afterFailure.ok, true);
  assert.equal(afterFailure.season, null);

  const scheduleAfterFailure =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(scheduleAfterFailure.ok, true);
  assert.equal(
    scheduleAfterFailure.schedule.months["09"].id,
    "2026-09"
  );

  assert.equal(
    await storage.getAlarm(),
    firstRetry
  );

  console.log("✅ Se a ativação falhar à meia-noite, o mês continua autorizado e ganha retry automático para 01:00.");


  storage.setFailCurrentSeasonWrite(false);
  Date.now = () => firstRetry;

  await coordinator.alarm();

  const active =
    await readCurrentPvpSeason(storage);

  assert.equal(active.ok, true);
  assert.equal(active.season.id, "2026-09");
  assert.equal(active.season.status, "ACTIVE");
  assert.equal(
    active.season.startsAt,
    septemberStart
  );
  assert.equal(
    active.season.endsAt,
    octoberStart
  );

  const scheduleAfterRecovery =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(scheduleAfterRecovery.ok, true);
  assert.equal(
    scheduleAfterRecovery.schedule?.months?.["09"] ?? null,
    null
  );

  assert.equal(
    await storage.getAlarm(),
    octoberStart
  );

  console.log("✅ No retry seguinte, a temporada ativa normalmente quando a falha desaparece.");
  console.log("✅ O atraso não altera startsAt nem endsAt: a hora perdida não é carregada para outubro.");
  console.log("✅ Depois da recuperação, o retry some e o próximo alarm volta a ser o encerramento mensal.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE RETRY HORÁRIO DA TEMPORADA PASSARAM.");
