import assert from "node:assert/strict";

import worker, {
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
  const data =
    new Map();

  let alarmAt =
    null;

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
      alarmAt =
        null;
    }
  };
}


console.log("=== SINCRONIZAÇÃO AUTOMÁTICA DO CATÁLOGO ===");


{
  const scheduledTime =
    Date.parse(
      "2026-08-20T09:00:00.000-03:00"
    );

  let requestedUrl =
    null;

  let waitUntilPromise =
    null;

  const env = {
    PVP_COORDINATOR: {
      idFromName(name) {
        assert.equal(
          name,
          "marbion-global-pvp"
        );

        return name;
      },

      get() {
        return {
          async fetch(request) {
            requestedUrl =
              new URL(request.url);

            return Response.json({
              ok: true,
              changed: false,
              alarm: null
            });
          }
        };
      }
    }
  };

  const ctx = {
    waitUntil(promise) {
      waitUntilPromise =
        promise;
    }
  };

  const result =
    await worker.scheduled(
      { scheduledTime },
      env,
      ctx
    );

  assert.equal(result.ok, true);
  assert.ok(waitUntilPromise);
  assert.ok(requestedUrl);
  assert.equal(
    requestedUrl.pathname,
    "/season/catalog/sync"
  );
  assert.equal(
    Number(
      requestedUrl.searchParams.get("now")
    ),
    scheduledTime
  );

  console.log("✅ O Scheduled Handler chama o coordenador global sem depender de viewer, ADM ou requisição pública.");
}


{
  const storage =
    createStorage();

  const coordinator =
    new PvpCoordinator(
      { storage },
      {}
    );

  const now =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const start =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

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
  assert.equal(
    await storage.getAlarm(),
    null
  );

  const url =
    new URL(
      "https://pvp.internal/season/catalog/sync"
    );

  url.searchParams.set(
    "now",
    String(now)
  );

  /*
   * scheduleCoordinatorAlarm() usa Date.now() para decidir
   * se a temporada ainda está no futuro. Como este teste
   * simula 20/08/2026, o relógio global precisa representar
   * o mesmo instante; caso contrário, executar o teste depois
   * de 01/09 faria a temporada parecer já vencida.
   */
  const originalDateNow =
    Date.now;

  Date.now = () => now;

  try {
    const response =
      await coordinator.fetch(
        new Request(
          url.toString(),
          { method: "POST" }
        )
      );

    const result =
      await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.equal(
      result.alarm.kind,
      "season"
    );
    assert.equal(
      result.alarm.alarmAt,
      start
    );
    assert.equal(
      await storage.getAlarm(),
      start
    );

    const current =
      await readCurrentPvpSeason(
        storage
      );

    assert.equal(current.ok, true);
    assert.equal(current.season, null);
  }
  finally {
    Date.now =
      originalDateNow;
  }

  console.log("✅ A rota automática reconcilia o alarm da próxima temporada sem ativá-la antes da hora.");
}


{
  const storage =
    createStorage();

  const coordinator =
    new PvpCoordinator(
      { storage },
      {}
    );

  const now =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  const response =
    await coordinator.fetch(
      new Request(
        `https://pvp.internal/season/catalog/sync?now=${now}`,
        { method: "POST" }
      )
    );

  const result =
    await response.json();

  assert.equal(result.ok, true);
  assert.equal(result.changed, false);
  assert.equal(
    storage.data.has("pvp_current_season"),
    false
  );
  assert.equal(
    await storage.getAlarm(),
    null
  );

  console.log("✅ Catálogo oficial vazio não inventa temporadas, não cria temporada atual e não cria alarm fantasma.");
}


console.log("\n🏆 TODOS OS TESTES DA SINCRONIZAÇÃO AUTOMÁTICA DO CATÁLOGO PASSARAM.");
