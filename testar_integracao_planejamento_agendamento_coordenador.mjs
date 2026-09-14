import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";


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


async function readJson(response) {
  return response.json();
}


console.log("=== PLANEJAMENTO + AGENDAMENTO NO COORDENADOR ===");


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

  Date.now = () => now;


  const defineUrl =
    new URL(
      "https://pvp.internal/season/plan/define"
    );

  defineUrl.searchParams.set("year", "2026");
  defineUrl.searchParams.set("month", "9");
  defineUrl.searchParams.set(
    "name",
    "Um Novo Florescer"
  );

  const defineResponse =
    await coordinator.fetch(
      new Request(
        defineUrl.toString(),
        { method: "POST" }
      )
    );

  const defined =
    await readJson(
      defineResponse
    );

  assert.equal(defineResponse.status, 200);
  assert.equal(defined.ok, true);
  assert.equal(
    defined.definition.id,
    "2026-09"
  );
  assert.equal(
    defined.definition.name,
    "Um Novo Florescer"
  );
  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ Coordenador define o nome anual sem criar temporada atual.");


  const planResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/plan?year=2026"
      )
    );

  const plan =
    await readJson(planResponse);

  assert.equal(plan.ok, true);
  assert.equal(
    plan.plan.months["09"].name,
    "Um Novo Florescer"
  );

  console.log("✅ Coordenador lê o planejamento anual persistido.");


  const scheduleUrl =
    new URL(
      "https://pvp.internal/season/schedule/add"
    );

  scheduleUrl.searchParams.set("year", "2026");
  scheduleUrl.searchParams.set("month", "9");

  const scheduleResponse =
    await coordinator.fetch(
      new Request(
        scheduleUrl.toString(),
        { method: "POST" }
      )
    );

  const scheduled =
    await readJson(
      scheduleResponse
    );

  const expectedStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  assert.equal(scheduleResponse.status, 200);
  assert.equal(scheduled.ok, true);
  assert.equal(
    scheduled.entry.status,
    "SCHEDULED"
  );
  assert.equal(
    scheduled.entry.startsAt,
    expectedStart
  );
  assert.equal(
    scheduled.alarm.kind,
    "season"
  );
  assert.equal(
    await storage.getAlarm(),
    expectedStart
  );
  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ Agendar pelo coordenador registra imediatamente o alarm mensal sem ativar a temporada.");


  const scheduleReadResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/schedule?year=2026"
      )
    );

  const scheduleRead =
    await readJson(
      scheduleReadResponse
    );

  assert.equal(scheduleRead.ok, true);
  assert.equal(
    scheduleRead.schedule.months["09"].name,
    "Um Novo Florescer"
  );

  console.log("✅ Coordenador lê o calendário de meses agendados.");


  const cancelUrl =
    new URL(
      "https://pvp.internal/season/schedule/cancel"
    );

  cancelUrl.searchParams.set("year", "2026");
  cancelUrl.searchParams.set("month", "9");

  const cancelResponse =
    await coordinator.fetch(
      new Request(
        cancelUrl.toString(),
        { method: "POST" }
      )
    );

  const cancelled =
    await readJson(
      cancelResponse
    );

  assert.equal(cancelResponse.status, 200);
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.changed, true);
  assert.equal(
    cancelled.schedule.months["09"],
    undefined
  );
  assert.equal(
    await storage.getAlarm(),
    null
  );

  const planAfterCancelResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/plan?year=2026"
      )
    );

  const planAfterCancel =
    await readJson(
      planAfterCancelResponse
    );

  assert.equal(
    planAfterCancel.plan.months["09"].name,
    "Um Novo Florescer"
  );

  console.log("✅ Cancelar remove o agendamento e o alarm, mas preserva o nome anual definido.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DA INTEGRAÇÃO DE PLANEJAMENTO E AGENDAMENTO PASSARAM.");
