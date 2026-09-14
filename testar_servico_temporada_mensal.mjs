import assert from "node:assert/strict";

import {
  getPvpSeasonState,
  startMonthlyPvpSeason,
  endCurrentPvpSeason
} from "./src/systems/pvp-season-service.js";


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


console.log("=== SERVIÇO DE TEMPORADA MENSAL ===");


{
  const storage =
    createStorage();

  const now =
    Date.parse(
      "2026-09-14T18:00:00.000-03:00"
    );

  const started =
    await startMonthlyPvpSeason(
      storage,
      {
        year: 2026,
        month: 9,
        baseTheme:
          "Jardim do Criador",
        name:
          "Um Novo Florescer"
      },
      now
    );

  assert.equal(started.ok, true);
  assert.equal(started.changed, true);
  assert.equal(started.lifecycle, "ACTIVE");
  assert.equal(started.season.id, "2026-09");
  assert.equal(started.season.year, 2026);
  assert.equal(started.season.month, 9);
  assert.equal(
    started.season.monthName,
    "Setembro"
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

  console.log("✅ Serviço cria setembro de 2026 usando o mês civil e preserva tema-base + nome anual.");


  const current =
    await getPvpSeasonState(
      storage,
      now
    );

  assert.equal(current.ok, true);
  assert.equal(current.lifecycle, "ACTIVE");
  assert.equal(
    current.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    current.season.name,
    "Um Novo Florescer"
  );
  assert.equal(current.season.year, 2026);
  assert.equal(current.season.month, 9);

  console.log("✅ Persistência e leitura mantêm os metadados mensais sem descartá-los.");


  const duplicate =
    await startMonthlyPvpSeason(
      storage,
      {
        year: 2026,
        month: 10,
        baseTheme:
          "Teste Outubro",
        name:
          "Noite das Almas"
      },
      now
    );

  assert.equal(duplicate.ok, false);
  assert.equal(
    duplicate.error,
    "SEASON_ALREADY_EXISTS"
  );

  console.log("✅ Temporada mensal ativa continua protegida contra sobrescrita silenciosa.");


  const ended =
    await endCurrentPvpSeason(
      storage,
      Date.parse(
        "2026-09-30T23:59:59.000-03:00"
      )
    );

  assert.equal(ended.ok, true);
  assert.equal(ended.changed, true);
  assert.equal(ended.lifecycle, "ENDED");
  assert.equal(
    ended.season.baseTheme,
    "Jardim do Criador"
  );
  assert.equal(
    ended.season.name,
    "Um Novo Florescer"
  );
  assert.equal(ended.season.year, 2026);
  assert.equal(ended.season.month, 9);

  console.log("✅ Encerramento preserva tema-base, nome anual e identidade mensal da temporada.");
}


{
  const storage =
    createStorage();

  const invalidMonth =
    await startMonthlyPvpSeason(
      storage,
      {
        year: 2026,
        month: 13,
        baseTheme: "Teste",
        name: "Teste"
      }
    );

  const invalidTheme =
    await startMonthlyPvpSeason(
      storage,
      {
        year: 2026,
        month: 9,
        baseTheme: "",
        name: "Teste"
      }
    );

  assert.equal(invalidMonth.ok, false);
  assert.equal(
    invalidMonth.error,
    "INVALID_SEASON_MONTH"
  );
  assert.equal(invalidTheme.ok, false);
  assert.equal(
    invalidTheme.error,
    "INVALID_SEASON_BASE_THEME"
  );

  console.log("✅ Serviço rejeita mês e tema-base inválidos antes de persistir qualquer temporada.");
}


console.log("\n🏆 TODOS OS TESTES DO SERVIÇO DE TEMPORADA MENSAL PASSARAM.");
