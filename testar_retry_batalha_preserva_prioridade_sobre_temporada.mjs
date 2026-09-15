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


console.log("=== RETRY DE BATALHA x TEMPORADA FUTURA ===");


const storage = createStorage();
const coordinator =
  new PvpCoordinator(
    { storage },
    {}
  );

const originalDateNow = Date.now;

try {
  const now =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const seasonStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  const expectedRetryAt =
    now + 1000;

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


  const data =
    await coordinator.getData();

  data.battles = [
    {
      id: "battle-deferred-retry-test",
      status: "ACTIVE",
      state: "RESOLVING",
      turn: 1,
      player1: {
        user: "alice",
        action: null
      },
      player2: {
        user: "bob",
        action: null
      },
      turnClockTurn: 1,
      turnStartedAt: now - 90_000,
      turnWarningAt: now - 30_000,
      turnWarningProcessed: true,
      turnDeadline: now - 1,
      timeoutCounts: {},
      timeoutEvents: []
    }
  ];

  await coordinator.saveData(data);


  const result =
    await coordinator.alarm();

  assert.equal(result.ok, true);
  assert.equal(result.deferred, true);
  assert.equal(result.state, "RESOLVING");

  assert.equal(
    await storage.getAlarm(),
    expectedRetryAt
  );

  assert.notEqual(
    await storage.getAlarm(),
    seasonStart
  );

  console.log("✅ Uma batalha em estado transitório preserva o retry PvP de 1 segundo em vez de entregar o alarm à temporada futura.");


  const schedule =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(schedule.ok, true);
  assert.equal(
    schedule.schedule?.months?.["09"]?.name,
    "Um Novo Florescer"
  );

  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ A temporada continua somente agendada e não é apagada nem ativada pelo retry da batalha.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE RETRY PvP x TEMPORADA PASSARAM.");
