import assert from "node:assert/strict";

import {
  handleRequest
} from "./src/router.js";

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


function createEnv() {
  const storage =
    createStorage();

  const coordinator =
    new PvpCoordinator(
      { storage },
      {}
    );

  return {
    storage,
    coordinator,
    env: {
      PVP_COORDINATOR: {
        idFromName(name) {
          return name;
        },

        get() {
          return coordinator;
        }
      }
    }
  };
}


async function readText(
  url,
  env
) {
  const response =
    await handleRequest(
      new Request(url),
      env,
      {}
    );

  return {
    response,
    text:
      await response.text()
  };
}


async function coordinatorJson(
  coordinator,
  url
) {
  const response =
    await coordinator.fetch(
      new Request(
        url,
        { method: "POST" }
      )
    );

  return {
    response,
    json:
      await response.json()
  };
}


console.log("=== !TEMPORADA COM AGENDAMENTO FUTURO ===");


const {
  storage,
  coordinator,
  env
} = createEnv();

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

  const defined =
    await coordinatorJson(
      coordinator,
      defineUrl.toString()
    );

  assert.equal(defined.response.status, 200);
  assert.equal(defined.json.ok, true);


  const scheduleUrl =
    new URL(
      "https://pvp.internal/season/schedule/add"
    );

  scheduleUrl.searchParams.set("year", "2026");
  scheduleUrl.searchParams.set("month", "9");

  const scheduled =
    await coordinatorJson(
      coordinator,
      scheduleUrl.toString()
    );

  assert.equal(scheduled.response.status, 200);
  assert.equal(scheduled.json.ok, true);
  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );

  console.log("✅ A temporada futura continua somente agendada, sem criar temporada atual.");


  const publicScheduled =
    await readText(
      "https://worker.test/temporada",
      env
    );

  assert.equal(
    publicScheduled.response.status,
    200
  );
  assert.match(
    publicScheduled.text,
    /Um Novo Florescer \[2026-09\]/
  );
  assert.match(
    publicScheduled.text,
    /Status: AGENDADA/
  );
  assert.match(
    publicScheduled.text,
    /Início:/
  );
  assert.match(
    publicScheduled.text,
    /01\/09\/2026/
  );

  console.log("✅ !temporada exibe a próxima temporada agendada mesmo sem pvp_current_season.");


  const nextResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/schedule/next"
      )
    );

  const next =
    await nextResponse.json();

  assert.equal(nextResponse.status, 200);
  assert.equal(next.ok, true);
  assert.equal(next.entry.id, "2026-09");
  assert.equal(
    next.entry.name,
    "Um Novo Florescer"
  );

  console.log("✅ O coordenador expõe a próxima temporada agendada para consumidores públicos e para o futuro site.");


  const cancelUrl =
    new URL(
      "https://pvp.internal/season/schedule/cancel"
    );

  cancelUrl.searchParams.set("year", "2026");
  cancelUrl.searchParams.set("month", "9");

  const cancelled =
    await coordinatorJson(
      coordinator,
      cancelUrl.toString()
    );

  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.json.ok, true);
  assert.equal(cancelled.json.changed, true);


  const publicAfterCancel =
    await readText(
      "https://worker.test/temporada",
      env
    );

  assert.match(
    publicAfterCancel.text,
    /não há temporada ranqueada cadastrada/i
  );

  console.log("✅ Depois do cancelamento, !temporada deixa de anunciar o mês sem apagar seu planejamento anual.");
}
finally {
  Date.now =
    originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DO !TEMPORADA AGENDADO PASSARAM.");
