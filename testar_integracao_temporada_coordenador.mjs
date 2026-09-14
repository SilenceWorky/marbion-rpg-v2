import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

import {
  PvpCoordinator as BasePvpCoordinator
} from "./src/durable/PvpCoordinator.js";


function createStorage() {
  const data =
    new Map();

  return {
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


function createCoordinator() {
  const state = {
    storage:
      createStorage()
  };

  return new PvpCoordinator(
    state,
    {}
  );
}


async function readJson(
  response
) {
  return response.json();
}


console.log("=== INTEGRAÇÃO TEMPORADA + PVP COORDINATOR ===");


{
  const coordinator =
    createCoordinator();

  assert.equal(
    coordinator instanceof BasePvpCoordinator,
    true
  );

  const response =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/current"
      )
    );

  const result =
    await readJson(response);

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.lifecycle, "NONE");
  assert.equal(result.season, null);

  console.log("✅ Coordenador exportado preserva o motor original e consulta temporada vazia.");
}


{
  const coordinator =
    createCoordinator();

  const now =
    Date.now();

  const startUrl =
    new URL(
      "https://pvp.internal/season/start"
    );

  startUrl.searchParams.set(
    "id",
    "S1"
  );

  startUrl.searchParams.set(
    "name",
    "Temporada 1"
  );

  startUrl.searchParams.set(
    "startsAt",
    String(now - 1_000)
  );

  startUrl.searchParams.set(
    "endsAt",
    String(now + 60_000)
  );

  const startResponse =
    await coordinator.fetch(
      new Request(
        startUrl.toString()
      )
    );

  const started =
    await readJson(startResponse);

  assert.equal(startResponse.status, 200);
  assert.equal(started.ok, true);
  assert.equal(started.season.id, "S1");

  const currentResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/current"
      )
    );

  const current =
    await readJson(currentResponse);

  assert.equal(current.ok, true);
  assert.equal(current.lifecycle, "ACTIVE");
  assert.equal(current.active, true);
  assert.equal(current.season.id, "S1");

  console.log("✅ /season/start persiste no storage real do coordenador e /season/current lê o mesmo estado.");

  const duplicateResponse =
    await coordinator.fetch(
      new Request(
        startUrl.toString()
      )
    );

  const duplicate =
    await readJson(duplicateResponse);

  assert.equal(duplicateResponse.status, 409);
  assert.equal(
    duplicate.error,
    "SEASON_ALREADY_EXISTS"
  );

  console.log("✅ Coordenador impede sobrescrita silenciosa da temporada atual.");

  const endUrl =
    new URL(
      "https://pvp.internal/season/end"
    );

  endUrl.searchParams.set(
    "endedAt",
    String(now)
  );

  const endResponse =
    await coordinator.fetch(
      new Request(
        endUrl.toString()
      )
    );

  const ended =
    await readJson(endResponse);

  assert.equal(endResponse.status, 200);
  assert.equal(ended.ok, true);
  assert.equal(ended.lifecycle, "ENDED");
  assert.equal(ended.season.status, "ENDED");

  console.log("✅ /season/end encerra e persiste a temporada pelo próprio coordenador.");
}


{
  const coordinator =
    createCoordinator();

  const response =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/ping"
      )
    );

  assert.equal(response.status, 200);
  assert.equal(
    await response.text(),
    "PVP_COORDINATOR_OK"
  );

  console.log("✅ Rotas antigas continuam delegadas ao PvpCoordinator original.");
}


console.log("\n🏆 TODOS OS TESTES DE INTEGRAÇÃO DE TEMPORADA NO COORDENADOR PASSARAM.");
