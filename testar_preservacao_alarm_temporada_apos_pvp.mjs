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


function createStorage() {
  const data =
    new Map();

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
      const result =
        new Map();

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
      alarmAt =
        Number(value);
    },

    async deleteAlarm() {
      alarmAt = null;
    }
  };
}


console.log("=== PRESERVAÇÃO DO ALARM DE TEMPORADA APÓS LIMPEZA PvP ===");


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
  const now =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const seasonStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  Date.now = () => now;


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
      now
    );

  assert.equal(scheduled.ok, true);


  const initialAlarm =
    await coordinator.scheduleCoordinatorAlarm();

  assert.equal(initialAlarm.ok, true);
  assert.equal(initialAlarm.kind, "season");
  assert.equal(initialAlarm.alarmAt, seasonStart);
  assert.equal(
    await storage.getAlarm(),
    seasonStart
  );

  console.log("✅ A próxima temporada ocupa corretamente o alarm compartilhado quando não há evento PvP anterior.");


  await coordinator.clearBattleTurnAlarm();

  assert.equal(
    await storage.getAlarm(),
    seasonStart
  );

  console.log("✅ Limpar o timeout de batalha não apaga o alarm da próxima temporada.");


  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ Preservar o alarm não ativa a temporada antes da data mensal.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE PRESERVAÇÃO DO ALARM DE TEMPORADA PASSARAM.");
