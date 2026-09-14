import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";


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
  return new PvpCoordinator(
    {
      storage:
        createStorage()
    },
    {}
  );
}


async function readJson(response) {
  return response.json();
}


console.log("=== INTEGRAÇÃO TEMPORADA MENSAL + COORDENADOR ===");


{
  const coordinator =
    createCoordinator();

  const startUrl =
    new URL(
      "https://pvp.internal/season/start-monthly"
    );

  startUrl.searchParams.set(
    "year",
    "2026"
  );

  startUrl.searchParams.set(
    "month",
    "9"
  );

  startUrl.searchParams.set(
    "baseTheme",
    "Jardim do Criador"
  );

  startUrl.searchParams.set(
    "name",
    "Um Novo Florescer"
  );

  const startedResponse =
    await coordinator.fetch(
      new Request(
        startUrl.toString()
      )
    );

  const started =
    await readJson(
      startedResponse
    );

  assert.equal(
    startedResponse.status,
    200
  );
  assert.equal(started.ok, true);
  assert.equal(
    started.season.id,
    "2026-09"
  );
  assert.equal(
    started.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    started.season.name,
    "Um Novo Florescer"
  );
  assert.equal(
    started.season.year,
    2026
  );
  assert.equal(
    started.season.month,
    9
  );
  assert.equal(
    started.season.timezone,
    "America/Fortaleza"
  );
  assert.equal(
    new Date(
      started.season.startsAt
    ).toISOString(),
    "2026-09-01T03:00:00.000Z"
  );
  assert.equal(
    new Date(
      started.season.endsAt
    ).toISOString(),
    "2026-10-01T03:00:00.000Z"
  );

  console.log("✅ /season/start-monthly cria o mês civil com tema-base e nome anual separados.");


  const currentResponse =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/season/current"
      )
    );

  const current =
    await readJson(
      currentResponse
    );

  assert.equal(current.ok, true);
  assert.equal(
    current.season.id,
    "2026-09"
  );
  assert.equal(
    current.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    current.season.name,
    "Um Novo Florescer"
  );

  console.log("✅ /season/current lê os metadados mensais persistidos pelo coordenador.");


  const duplicateResponse =
    await coordinator.fetch(
      new Request(
        startUrl.toString()
      )
    );

  const duplicate =
    await readJson(
      duplicateResponse
    );

  assert.equal(
    duplicateResponse.status,
    409
  );
  assert.equal(
    duplicate.error,
    "SEASON_ALREADY_EXISTS"
  );

  console.log("✅ Coordenador mantém proteção contra sobrescrita da temporada mensal atual.");
}


{
  const coordinator =
    createCoordinator();

  const invalidUrl =
    new URL(
      "https://pvp.internal/season/start-monthly"
    );

  invalidUrl.searchParams.set(
    "year",
    "2026"
  );
  invalidUrl.searchParams.set(
    "month",
    "13"
  );
  invalidUrl.searchParams.set(
    "baseTheme",
    "Teste"
  );
  invalidUrl.searchParams.set(
    "name",
    "Teste"
  );

  const response =
    await coordinator.fetch(
      new Request(
        invalidUrl.toString()
      )
    );

  const result =
    await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "INVALID_SEASON_MONTH"
  );

  console.log("✅ Coordenador rejeita mês inválido antes de persistir temporada.");
}


console.log("\n🏆 TODOS OS TESTES DA TEMPORADA MENSAL NO COORDENADOR PASSARAM.");
