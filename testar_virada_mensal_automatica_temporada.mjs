import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

import {
  startMonthlyPvpSeason
} from "./src/systems/pvp-season-service.js";

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


console.log("=== VIRADA MENSAL AUTOMÁTICA DE TEMPORADA ===");


const originalDateNow = Date.now;

try {
  /*
   * Caso 1: não existe temporada autorizada para o mês seguinte.
   * Mesmo assim, a temporada atual precisa possuir alarm próprio
   * de encerramento e terminar exatamente à meia-noite.
   */
  {
    const storage = createStorage();
    const coordinator =
      new PvpCoordinator(
        { storage },
        {}
      );

    const septemberStart =
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      );

    const septemberCheck =
      Date.parse(
        "2026-09-20T12:00:00.000-03:00"
      );

    const octoberStart =
      Date.parse(
        "2026-10-01T00:00:00.000-03:00"
      );

    Date.now = () => septemberCheck;

    const started =
      await startMonthlyPvpSeason(
        storage,
        {
          year: 2026,
          month: 9,
          name: "Um Novo Florescer"
        },
        septemberStart
      );

    assert.equal(started.ok, true);

    const alarm =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(alarm.ok, true);
    assert.equal(alarm.kind, "season");
    assert.equal(alarm.stage, "SEASON_END");
    assert.equal(alarm.alarmAt, octoberStart);
    assert.equal(
      await storage.getAlarm(),
      octoberStart
    );

    console.log("✅ Uma temporada mensal agenda seu próprio encerramento mesmo sem temporada seguinte definida.");


    Date.now = () => octoberStart;

    await coordinator.alarm();

    const ended =
      await readCurrentPvpSeason(storage);

    assert.equal(ended.ok, true);
    assert.equal(ended.season.status, "ENDED");
    assert.equal(ended.season.endedAt, octoberStart);
    assert.equal(
      await storage.getAlarm(),
      null
    );

    console.log("✅ À meia-noite, a temporada termina e nenhum novo mês é inventado quando não existe autorização.");
  }


  /*
   * Caso 2: a temporada seguinte já está autorizada.
   * Na mesma virada, primeiro encerramos agosto e só depois
   * ativamos setembro. O próximo alarm passa a ser o fim de
   * setembro, sem intervenção manual.
   */
  {
    const storage = createStorage();
    const coordinator =
      new PvpCoordinator(
        { storage },
        {}
      );

    const augustStart =
      Date.parse(
        "2026-08-01T00:00:00.000-03:00"
      );

    const planningNow =
      Date.parse(
        "2026-08-20T12:00:00.000-03:00"
      );

    const septemberStart =
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      );

    const octoberStart =
      Date.parse(
        "2026-10-01T00:00:00.000-03:00"
      );

    Date.now = () => planningNow;

    const august =
      await startMonthlyPvpSeason(
        storage,
        {
          year: 2026,
          month: 8,
          name: "Arquivo Desperto"
        },
        augustStart
      );

    assert.equal(august.ok, true);

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

    const beforeRollover =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(beforeRollover.ok, true);
    assert.equal(beforeRollover.kind, "season");
    assert.equal(
      beforeRollover.alarmAt,
      septemberStart
    );

    Date.now = () => septemberStart;

    await coordinator.alarm();

    const current =
      await readCurrentPvpSeason(storage);

    assert.equal(current.ok, true);
    assert.equal(current.season.id, "2026-09");
    assert.equal(current.season.status, "ACTIVE");
    assert.equal(
      current.season.startsAt,
      septemberStart
    );
    assert.equal(
      current.season.endsAt,
      octoberStart
    );

    console.log("✅ Na virada, a temporada anterior encerra antes da ativação do novo mês autorizado.");


    const schedule =
      await readPvpSeasonYearSchedule(
        storage,
        2026
      );

    assert.equal(schedule.ok, true);
    assert.equal(
      schedule.schedule?.months?.["09"] ?? null,
      null
    );

    assert.equal(
      await storage.getAlarm(),
      octoberStart
    );

    console.log("✅ O agendamento consumido é removido e o próximo alarm passa automaticamente para o fim da nova temporada.");
  }
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DA VIRADA MENSAL AUTOMÁTICA PASSARAM.");
