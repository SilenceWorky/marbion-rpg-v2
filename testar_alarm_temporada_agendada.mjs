import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

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

      for (
        const [key, value]
        of data.entries()
      ) {
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


console.log("=== ALARM DE TEMPORADA AGENDADA ===");


const storage =
  createStorage();

const coordinator =
  new PvpCoordinator(
    { storage },
    {}
  );

const originalDateNow =
  Date.now;

try {
  const scheduledAt =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  Date.now = () =>
    scheduledAt;

  await definePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 9,
      name: "Um Novo Florescer"
    }
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

  const alarmResult =
    await coordinator.scheduleCoordinatorAlarm();

  const expectedStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  assert.equal(
    alarmResult.ok,
    true
  );
  assert.equal(
    alarmResult.kind,
    "season"
  );
  assert.equal(
    alarmResult.alarmAt,
    expectedStart
  );
  assert.equal(
    await storage.getAlarm(),
    expectedStart
  );

  console.log("✅ O alarm compartilhado agenda a temporada exatamente para o início do mês civil.");


  Date.now = () =>
    expectedStart;

  await coordinator.alarm();

  const current =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(current.ok, true);
  assert.equal(
    current.season.id,
    "2026-09"
  );
  assert.equal(
    current.season.name,
    "Um Novo Florescer"
  );
  assert.equal(
    current.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    current.season.status,
    "ACTIVE"
  );

  console.log("✅ Ao disparar, o alarm real do coordenador ativa a temporada agendada.");


  assert.equal(
    await storage.getAlarm(),
    null
  );

  console.log("✅ Depois da ativação, o alarm mensal não entra em loop nem fica reagendado para now + 1.");
}
finally {
  Date.now =
    originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DO ALARM DE TEMPORADA PASSARAM.");
