import assert from "node:assert/strict";

import {
  createPvpSeason
} from "./src/systems/pvp-season.js";

import {
  PVP_SEASON_STORAGE_KEY,
  clearCurrentPvpSeason,
  readCurrentPvpSeason,
  saveCurrentPvpSeason
} from "./src/systems/pvp-season-store.js";


function createFakeStorage() {
  const data =
    new Map();

  return {
    data,

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


console.log("=== PERSISTÊNCIA GLOBAL DE TEMPORADA ===");


{
  const storage =
    createFakeStorage();

  const result =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(result.ok, true);
  assert.equal(result.season, null);

  console.log("✅ Storage vazio retorna temporada inexistente sem erro.");
}


{
  const storage =
    createFakeStorage();

  const season =
    createPvpSeason({
      id: "S1",
      name: "Temporada 1",
      startsAt: 1_000,
      endsAt: 2_000
    }).season;

  const saved =
    await saveCurrentPvpSeason(
      storage,
      season
    );

  assert.equal(saved.ok, true);
  assert.equal(
    storage.data.has(
      PVP_SEASON_STORAGE_KEY
    ),
    true
  );

  const loaded =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(loaded.ok, true);
  assert.equal(loaded.season.id, "S1");
  assert.equal(loaded.season.name, "Temporada 1");
  assert.equal(loaded.season.startsAt, 1_000);
  assert.equal(loaded.season.endsAt, 2_000);

  console.log("✅ Temporada salva pode ser lida novamente de forma normalizada.");
}


{
  const storage =
    createFakeStorage();

  const result =
    await saveCurrentPvpSeason(
      storage,
      {
        id: "quebrada"
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.error, "INVALID_SEASON");
  assert.equal(storage.data.size, 0);

  console.log("✅ Estado inválido nunca é persistido.");
}


{
  const storage =
    createFakeStorage();

  storage.data.set(
    PVP_SEASON_STORAGE_KEY,
    {
      id: "corrompida",
      name: "Sem datas"
    }
  );

  const result =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "INVALID_STORED_SEASON"
  );

  console.log("✅ Estado persistido corrompido é detectado em vez de aceito silenciosamente.");
}


{
  const storage =
    createFakeStorage();

  const season =
    createPvpSeason({
      id: "S2",
      name: "Temporada 2",
      startsAt: 10_000,
      endsAt: 20_000
    }).season;

  await saveCurrentPvpSeason(
    storage,
    season
  );

  const cleared =
    await clearCurrentPvpSeason(
      storage
    );

  assert.equal(cleared.ok, true);

  const loaded =
    await readCurrentPvpSeason(
      storage
    );

  assert.equal(loaded.ok, true);
  assert.equal(loaded.season, null);

  console.log("✅ Limpeza remove somente a temporada atual do storage.");
}


{
  const readFailure =
    await readCurrentPvpSeason({
      async get() {
        throw new Error("boom");
      }
    });

  assert.equal(readFailure.ok, false);
  assert.equal(
    readFailure.error,
    "SEASON_STORAGE_READ_FAILED"
  );

  const writeFailure =
    await saveCurrentPvpSeason(
      {
        async put() {
          throw new Error("boom");
        }
      },
      createPvpSeason({
        id: "S3",
        name: "Temporada 3",
        startsAt: 1,
        endsAt: 2
      }).season
    );

  assert.equal(writeFailure.ok, false);
  assert.equal(
    writeFailure.error,
    "SEASON_STORAGE_WRITE_FAILED"
  );

  console.log("✅ Falhas reais de storage retornam erros explícitos.");
}


console.log("\n🏆 TODOS OS TESTES DE PERSISTÊNCIA DE TEMPORADA PASSARAM.");
