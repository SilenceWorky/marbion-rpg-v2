import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

import {
  adminSeasonRoute
} from "./src/routes/admin-season.js";

import {
  readPvpSeasonYearPlan
} from "./src/systems/pvp-season-plan-store.js";

import {
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";

import {
  readCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";

import {
  startMonthlyPvpSeason
} from "./src/systems/pvp-season-service.js";


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


function createEnv(coordinator) {
  return {
    MARBION_ADMIN_KEY:
      "test-admin-key",

    PVP_COORDINATOR: {
      idFromName() {
        return "marbion-global-pvp";
      },

      get() {
        return coordinator;
      }
    }
  };
}


async function callAdmin(
  env,
  args
) {
  const url =
    new URL(
      "https://worker.test/admin"
    );

  url.searchParams.set(
    "actor",
    "silenceworky"
  );

  url.searchParams.set(
    "key",
    "test-admin-key"
  );

  url.searchParams.set(
    "args",
    args
  );

  const response =
    await adminSeasonRoute(
      new Request(
        url.toString()
      ),
      env
    );

  return {
    response,
    text:
      await response.text()
  };
}


console.log("=== COMANDOS ADM DA TEMPORADA MENSAL ===");


const storage = createStorage();
const coordinator =
  new PvpCoordinator(
    { storage },
    {}
  );

const env =
  createEnv(coordinator);

const originalDateNow =
  Date.now;

try {
  const planningNow =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const septemberStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  Date.now = () => planningNow;


  const defined =
    await callAdmin(
      env,
      "temporada definir 2026 9 Um Novo Florescer"
    );

  assert.equal(
    defined.response.status,
    200
  );
  assert.match(
    defined.text,
    /Setembro\/2026 preparada/
  );
  assert.match(
    defined.text,
    /Um Novo Florescer/
  );

  const plan =
    await readPvpSeasonYearPlan(
      storage,
      2026
    );

  assert.equal(plan.ok, true);
  assert.equal(
    plan.plan.months["09"].name,
    "Um Novo Florescer"
  );

  const schedule =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(schedule.ok, true);
  assert.equal(
    schedule.schedule.months["09"].name,
    "Um Novo Florescer"
  );
  assert.equal(
    schedule.schedule.months["09"].startsAt,
    septemberStart
  );
  assert.equal(
    await storage.getAlarm(),
    septemberStart
  );

  const currentBeforeStart =
    await readCurrentPvpSeason(storage);

  assert.equal(currentBeforeStart.ok, true);
  assert.equal(currentBeforeStart.season, null);

  console.log("✅ !adm temporada definir cria o planejamento, autoriza o mês e agenda a virada sem iniciar a temporada imediatamente.");


  const originalScheduledAt =
    schedule.schedule.months["09"].scheduledAt;

  const renamed =
    await callAdmin(
      env,
      "temporada definir 2026 9 Jardim do Amanhã"
    );

  assert.match(
    renamed.text,
    /Jardim do Amanhã/
  );

  const renamedSchedule =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(
    renamedSchedule.schedule.months["09"].name,
    "Jardim do Amanhã"
  );
  assert.equal(
    renamedSchedule.schedule.months["09"].scheduledAt,
    originalScheduledAt
  );
  assert.equal(
    renamedSchedule.schedule.months["09"].startsAt,
    septemberStart
  );

  console.log("✅ Repetir definir com outro nome renomeia a temporada futura sem recriar sua autorização temporal.");


  const legacyStart =
    await callAdmin(
      env,
      "temporada iniciar qualquer-id Temporada Legada"
    );

  assert.match(
    legacyStart.text,
    /desativado/
  );

  const stillNoCurrent =
    await readCurrentPvpSeason(storage);

  assert.equal(stillNoCurrent.ok, true);
  assert.equal(stillNoCurrent.season, null);

  console.log("✅ O antigo !adm temporada iniciar não pode mais criar temporadas arbitrárias de 30 dias.");


  const unsupportedTheme =
    await callAdmin(
      env,
      "temporada definir 2026 10 Temporada de Outubro"
    );

  assert.match(
    unsupportedTheme.text,
    /tema-base canônico/
  );

  const planAfterUnsupported =
    await readPvpSeasonYearPlan(
      storage,
      2026
    );

  assert.equal(
    planAfterUnsupported.plan.months["10"] ?? null,
    null
  );

  console.log("✅ Um mês sem tema-base canônico não pode ser autorizado por engano.");


  const cancelled =
    await callAdmin(
      env,
      "temporada cancelar 2026 9"
    );

  assert.match(
    cancelled.text,
    /Agendamento de Setembro\/2026 cancelado/
  );

  const afterCancelSchedule =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(
    afterCancelSchedule.schedule?.months?.["09"] ?? null,
    null
  );

  const afterCancelPlan =
    await readPvpSeasonYearPlan(
      storage,
      2026
    );

  assert.equal(
    afterCancelPlan.plan.months["09"].name,
    "Jardim do Amanhã"
  );

  assert.equal(
    await storage.getAlarm(),
    null
  );

  console.log("✅ !adm temporada cancelar remove o agendamento, preserva o nome planejado e recalcula o alarm.");


  Date.now = () =>
    septemberStart +
    (60 * 60 * 1000);

  const lateDefine =
    await callAdmin(
      env,
      "temporada definir 2026 9 Nome Tardio"
    );

  assert.match(
    lateDefine.text,
    /só é possível definir e autorizar uma temporada antes do início do mês/
  );

  const scheduleAfterLateDefine =
    await readPvpSeasonYearSchedule(
      storage,
      2026
    );

  assert.equal(
    scheduleAfterLateDefine.schedule?.months?.["09"] ?? null,
    null
  );

  console.log("✅ O comando definir não cria uma nova autorização manual depois que o mês já começou.");


  const manuallyStarted =
    await startMonthlyPvpSeason(
      storage,
      {
        year: 2026,
        month: 9,
        name: "Jardim do Amanhã"
      },
      septemberStart
    );

  assert.equal(manuallyStarted.ok, true);

  const ended =
    await callAdmin(
      env,
      "temporada encerrar"
    );

  assert.match(
    ended.text,
    /Temporada encerrada/
  );

  const currentAfterEnd =
    await readCurrentPvpSeason(storage);

  assert.equal(currentAfterEnd.ok, true);
  assert.equal(
    currentAfterEnd.season.status,
    "ENDED"
  );

  console.log("✅ !adm temporada encerrar continua disponível como ferramenta emergencial para a temporada ACTIVE.");
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DOS COMANDOS ADM DE TEMPORADA PASSARAM.");
