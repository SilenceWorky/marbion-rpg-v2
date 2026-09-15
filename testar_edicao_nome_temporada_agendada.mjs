import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

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


async function callCoordinator(
  coordinator,
  path,
  params = {},
  method = "POST"
) {
  const url =
    new URL(
      `https://pvp.internal${path}`
    );

  for (
    const [key, value]
    of Object.entries(params)
  ) {
    url.searchParams.set(
      key,
      String(value)
    );
  }

  const response =
    await coordinator.fetch(
      new Request(
        url.toString(),
        { method }
      )
    );

  return {
    response,
    body:
      await response.json()
  };
}


console.log("=== EDIÇÃO DO NOME DE TEMPORADA AGENDADA ===");


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

  const octoberStart =
    Date.parse(
      "2026-10-01T00:00:00.000-03:00"
    );

  Date.now = () => planningNow;


  const firstDefinition =
    await callCoordinator(
      coordinator,
      "/season/plan/define",
      {
        year: 2026,
        month: 9,
        name: "Um Novo Florescer"
      }
    );

  assert.equal(
    firstDefinition.response.status,
    200
  );
  assert.equal(
    firstDefinition.body.ok,
    true
  );


  const scheduled =
    await callCoordinator(
      coordinator,
      "/season/schedule/add",
      {
        year: 2026,
        month: 9
      }
    );

  assert.equal(scheduled.body.ok, true);
  assert.equal(
    scheduled.body.entry.name,
    "Um Novo Florescer"
  );
  assert.equal(
    scheduled.body.entry.startsAt,
    septemberStart
  );
  assert.equal(
    scheduled.body.entry.endsAt,
    octoberStart
  );

  const originalScheduledAt =
    scheduled.body.entry.scheduledAt;

  assert.equal(
    await storage.getAlarm(),
    septemberStart
  );


  const renamed =
    await callCoordinator(
      coordinator,
      "/season/plan/define",
      {
        year: 2026,
        month: 9,
        name: "Jardim do Amanhã"
      }
    );

  assert.equal(renamed.response.status, 200);
  assert.equal(renamed.body.ok, true);
  assert.equal(renamed.body.changed, true);
  assert.equal(
    renamed.body.definition.name,
    "Jardim do Amanhã"
  );
  assert.equal(
    renamed.body.scheduleSync.ok,
    true
  );
  assert.equal(
    renamed.body.scheduleSync.changed,
    true
  );
  assert.equal(
    renamed.body.scheduleSync.synced,
    true
  );
  assert.equal(
    renamed.body.scheduleSync.entry.name,
    "Jardim do Amanhã"
  );
  assert.equal(
    renamed.body.scheduleSync.entry.scheduledAt,
    originalScheduledAt
  );
  assert.equal(
    renamed.body.scheduleSync.entry.startsAt,
    septemberStart
  );
  assert.equal(
    renamed.body.scheduleSync.entry.endsAt,
    octoberStart
  );
  assert.equal(
    await storage.getAlarm(),
    septemberStart
  );

  console.log("✅ Renomear uma temporada ainda agendada atualiza seu snapshot sem recriar o agendamento.");
  console.log("✅ scheduledAt, startsAt, endsAt e o alarm mensal permanecem intactos após a edição do nome.");


  const sameName =
    await callCoordinator(
      coordinator,
      "/season/plan/define",
      {
        year: 2026,
        month: 9,
        name: "Jardim do Amanhã"
      }
    );

  assert.equal(sameName.body.ok, true);
  assert.equal(sameName.body.changed, false);
  assert.equal(
    sameName.body.scheduleSync.changed,
    false
  );
  assert.equal(
    sameName.body.scheduleSync.entry.scheduledAt,
    originalScheduledAt
  );

  console.log("✅ Repetir o mesmo nome é idempotente e não regrava a autorização temporal.");


  Date.now = () => septemberStart;

  await coordinator.alarm();

  const active =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(active.ok, true);
  assert.equal(active.season.id, "2026-09");
  assert.equal(active.season.status, "ACTIVE");
  assert.equal(
    active.season.name,
    "Jardim do Amanhã"
  );

  console.log("✅ Ao iniciar, a temporada usa o último nome salvo enquanto ainda estava agendada.");


  Date.now = () =>
    septemberStart +
    (60 * 60 * 1000);

  const afterStartRename =
    await callCoordinator(
      coordinator,
      "/season/plan/define",
      {
        year: 2026,
        month: 9,
        name: "Nome Editado Depois do Início"
      }
    );

  assert.equal(afterStartRename.body.ok, true);
  assert.equal(
    afterStartRename.body.definition.name,
    "Nome Editado Depois do Início"
  );
  assert.equal(
    afterStartRename.body.scheduleSync.changed,
    false
  );
  assert.equal(
    afterStartRename.body.scheduleSync.synced,
    false
  );

  const stillActive =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(stillActive.ok, true);
  assert.equal(
    stillActive.season.name,
    "Jardim do Amanhã"
  );

  console.log("✅ Depois da ativação, editar o planejamento não renomeia automaticamente a temporada ACTIVE.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE EDIÇÃO DE NOME DA TEMPORADA PASSARAM.");
