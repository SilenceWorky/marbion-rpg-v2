import assert from "node:assert/strict";

import {
  endCurrentPvpSeason,
  getPvpSeasonState,
  startPvpSeason
} from "./src/systems/pvp-season-service.js";


function createMemoryStorage() {
  const data =
    new Map();

  return {
    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      data.set(key, value);
    },

    async delete(key) {
      data.delete(key);
    }
  };
}


console.log("=== SERVIÇO GLOBAL DE TEMPORADAS ===");


{
  const storage =
    createMemoryStorage();

  const state =
    await getPvpSeasonState(
      storage,
      1_000
    );

  assert.equal(state.ok, true);
  assert.equal(state.season, null);
  assert.equal(state.lifecycle, "NONE");
  assert.equal(state.active, false);
  assert.equal(state.remainingMs, 0);

  console.log("✅ Sem temporada persistida, o serviço retorna estado NONE.");
}


{
  const storage =
    createMemoryStorage();

  const started =
    await startPvpSeason(
      storage,
      {
        id: "S1",
        name: "Temporada 1",
        endsAt: 2_000
      },
      1_000
    );

  assert.equal(started.ok, true);
  assert.equal(started.changed, true);
  assert.equal(started.lifecycle, "ACTIVE");

  const state =
    await getPvpSeasonState(
      storage,
      1_500
    );

  assert.equal(state.ok, true);
  assert.equal(state.season.id, "S1");
  assert.equal(state.lifecycle, "ACTIVE");
  assert.equal(state.active, true);
  assert.equal(state.remainingMs, 500);

  console.log("✅ Início de temporada persiste estado global e pode ser consultado.");
}


{
  const storage =
    createMemoryStorage();

  await startPvpSeason(
    storage,
    {
      id: "S1",
      name: "Temporada 1",
      endsAt: 2_000
    },
    1_000
  );

  const duplicate =
    await startPvpSeason(
      storage,
      {
        id: "S2",
        name: "Temporada 2",
        endsAt: 4_000
      },
      1_500
    );

  assert.equal(duplicate.ok, false);
  assert.equal(
    duplicate.error,
    "SEASON_ALREADY_EXISTS"
  );
  assert.equal(duplicate.season.id, "S1");

  console.log("✅ Uma temporada existente não pode ser sobrescrita silenciosamente.");
}


{
  const storage =
    createMemoryStorage();

  await startPvpSeason(
    storage,
    {
      id: "S1",
      name: "Temporada 1",
      endsAt: 2_000
    },
    1_000
  );

  const firstEnd =
    await endCurrentPvpSeason(
      storage,
      1_500
    );

  assert.equal(firstEnd.ok, true);
  assert.equal(firstEnd.changed, true);
  assert.equal(firstEnd.lifecycle, "ENDED");
  assert.equal(firstEnd.season.endedAt, 1_500);

  const secondEnd =
    await endCurrentPvpSeason(
      storage,
      1_800
    );

  assert.equal(secondEnd.ok, true);
  assert.equal(secondEnd.changed, false);
  assert.equal(secondEnd.season.endedAt, 1_500);

  console.log("✅ Encerramento pelo serviço é persistido e idempotente.");
}


{
  const storage =
    createMemoryStorage();

  await startPvpSeason(
    storage,
    {
      id: "S1",
      name: "Temporada 1",
      endsAt: 2_000
    },
    1_000
  );

  await endCurrentPvpSeason(
    storage,
    1_500
  );

  const next =
    await startPvpSeason(
      storage,
      {
        id: "S2",
        name: "Temporada 2",
        endsAt: 4_000
      },
      3_000
    );

  assert.equal(next.ok, true);
  assert.equal(next.season.id, "S2");
  assert.equal(next.lifecycle, "ACTIVE");

  console.log("✅ Depois de encerrar uma temporada, uma nova pode assumir a chave global.");
}


{
  const storage =
    createMemoryStorage();

  const result =
    await endCurrentPvpSeason(
      storage,
      1_000
    );

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "NO_CURRENT_SEASON"
  );

  console.log("✅ Encerrar sem temporada atual retorna erro explícito.");
}


console.log("\n🏆 TODOS OS TESTES DO SERVIÇO GLOBAL DE TEMPORADAS PASSARAM.");
