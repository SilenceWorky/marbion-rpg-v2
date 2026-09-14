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


console.log("=== MÚLTIPLAS TEMPORADAS FUTURAS ===");


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

  const september2026Start =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  const september2027Start =
    Date.parse(
      "2027-09-01T00:00:00.000-03:00"
    );

  Date.now = () => now;


  for (const definition of [
    {
      year: 2026,
      month: 9,
      name: "Um Novo Florescer"
    },
    {
      year: 2027,
      month: 9,
      name: "Jardim do Amanhã"
    }
  ]) {
    const defined =
      await definePvpSeasonYearMonth(
        storage,
        definition
      );

    assert.equal(defined.ok, true);

    const scheduled =
      await schedulePvpSeasonYearMonth(
        storage,
        {
          year: definition.year,
          month: definition.month
        },
        now
      );

    assert.equal(scheduled.ok, true);
  }


  const firstAlarm =
    await coordinator.scheduleCoordinatorAlarm();

  assert.equal(firstAlarm.ok, true);
  assert.equal(firstAlarm.kind, "season");
  assert.equal(
    firstAlarm.alarmAt,
    september2026Start
  );
  assert.equal(
    await storage.getAlarm(),
    september2026Start
  );

  console.log("✅ Com várias temporadas futuras, o alarm escolhe sempre a mais próxima.");


  Date.now = () => september2026Start;

  await coordinator.alarm();

  const current =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(current.ok, true);
  assert.equal(
    current.season?.id,
    "2026-09"
  );
  assert.equal(
    current.season?.status,
    "ACTIVE"
  );

  console.log("✅ A primeira temporada futura é ativada normalmente quando chega sua virada mensal.");


  const schedule2026 =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  const schedule2027 =
    await readPvpSeasonYearSchedule(
      storage,
      2027
    );

  assert.equal(schedule2026.ok, true);
  assert.equal(schedule2027.ok, true);
  assert.equal(
    schedule2026.schedule?.months?.["09"] ?? null,
    null
  );
  assert.equal(
    schedule2027.schedule?.months?.["09"]?.name,
    "Jardim do Amanhã"
  );

  console.log("✅ Ativar um mês remove somente seu próprio agendamento e preserva temporadas futuras de outros anos.");


  assert.equal(
    await storage.getAlarm(),
    september2027Start
  );

  const nextAlarm =
    await coordinator.scheduleCoordinatorAlarm();

  assert.equal(nextAlarm.ok, true);
  assert.equal(nextAlarm.kind, "season");
  assert.equal(
    nextAlarm.alarmAt,
    september2027Start
  );

  console.log("✅ Após a ativação, o coordenador mantém automaticamente o próximo mês/ano futuro no alarm.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE MÚLTIPLAS TEMPORADAS FUTURAS PASSARAM.");
