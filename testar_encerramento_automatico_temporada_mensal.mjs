import assert from "node:assert/strict";

import {
  startMonthlyPvpSeason,
  startPvpSeason
} from "./src/systems/pvp-season-service.js";

import {
  closeExpiredMonthlyPvpSeason
} from "./src/systems/pvp-season-expiration.js";

import {
  readCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";


function createStorage() {
  const data = new Map();

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
    }
  };
}


console.log("=== ENCERRAMENTO AUTOMÁTICO DA TEMPORADA MENSAL ===");


{
  const storage = createStorage();

  const septemberStart =
    Date.parse(
      "2026-09-01T00:00:00.000-03:00"
    );

  const octoberStart =
    Date.parse(
      "2026-10-01T00:00:00.000-03:00"
    );

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
  assert.equal(started.season.status, "ACTIVE");


  const beforeMidnight =
    await closeExpiredMonthlyPvpSeason(
      storage,
      octoberStart - 1
    );

  assert.equal(beforeMidnight.ok, true);
  assert.equal(beforeMidnight.changed, false);
  assert.equal(beforeMidnight.ended, false);

  const stillActive =
    await readCurrentPvpSeason(storage);

  assert.equal(stillActive.ok, true);
  assert.equal(stillActive.season.status, "ACTIVE");

  console.log("✅ A temporada continua ACTIVE até o último milissegundo do mês.");


  const atMidnight =
    await closeExpiredMonthlyPvpSeason(
      storage,
      octoberStart
    );

  assert.equal(atMidnight.ok, true);
  assert.equal(atMidnight.changed, true);
  assert.equal(atMidnight.ended, true);
  assert.equal(atMidnight.endedAt, octoberStart);

  const ended =
    await readCurrentPvpSeason(storage);

  assert.equal(ended.ok, true);
  assert.equal(ended.season.status, "ENDED");
  assert.equal(ended.season.endedAt, octoberStart);
  assert.equal(ended.season.endsAt, octoberStart);

  console.log("✅ À meia-noite da virada mensal, a temporada encerra exatamente no endsAt canônico.");


  const retry =
    await closeExpiredMonthlyPvpSeason(
      storage,
      octoberStart + 60_000
    );

  assert.equal(retry.ok, true);
  assert.equal(retry.changed, false);
  assert.equal(retry.ended, false);

  console.log("✅ Repetir o processamento depois do encerramento é idempotente.");
}


{
  const storage = createStorage();

  const legacyStart =
    Date.parse(
      "2026-08-01T12:00:00.000-03:00"
    );

  const legacyEnd =
    Date.parse(
      "2026-08-10T12:00:00.000-03:00"
    );

  const legacy =
    await startPvpSeason(
      storage,
      {
        id: "legacy-test",
        name: "Temporada Legada",
        startsAt: legacyStart,
        endsAt: legacyEnd
      },
      legacyStart
    );

  assert.equal(legacy.ok, true);

  const result =
    await closeExpiredMonthlyPvpSeason(
      storage,
      legacyEnd + 1000
    );

  assert.equal(result.ok, true);
  assert.equal(result.changed, false);
  assert.equal(result.ended, false);

  const current =
    await readCurrentPvpSeason(storage);

  assert.equal(current.ok, true);
  assert.equal(current.season.status, "ACTIVE");

  console.log("✅ O encerramento automático mensal não altera temporadas legadas sem metadados mensais.");
}


console.log("\n🏆 TODOS OS TESTES DE ENCERRAMENTO AUTOMÁTICO MENSAL PASSARAM.");
