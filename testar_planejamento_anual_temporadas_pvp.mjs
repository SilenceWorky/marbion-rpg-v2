import assert from "node:assert/strict";

import {
  getPvpSeasonPlanMonth
} from "./src/systems/pvp-season-plan.js";

import {
  definePvpSeasonYearMonth,
  readPvpSeasonYearPlan
} from "./src/systems/pvp-season-plan-store.js";


function createStorage() {
  const data =
    new Map();

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


console.log("=== PLANEJAMENTO ANUAL DE TEMPORADAS ===");


{
  const storage =
    createStorage();

  const september =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9,
        name:
          "Um Novo Florescer"
      }
    );

  assert.equal(september.ok, true);
  assert.equal(september.changed, true);
  assert.equal(
    september.definition.id,
    "2026-09"
  );
  assert.equal(
    september.definition.monthName,
    "Setembro"
  );
  assert.equal(
    september.definition.name,
    "Um Novo Florescer"
  );

  const october =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10,
        name:
          "Noite das Almas"
      }
    );

  assert.equal(october.ok, true);
  assert.equal(october.changed, true);

  const plan =
    await readPvpSeasonYearPlan(
      storage,
      2026
    );

  assert.equal(plan.ok, true);
  assert.equal(plan.plan.year, 2026);
  assert.equal(
    getPvpSeasonPlanMonth(
      plan.plan,
      9
    ).name,
    "Um Novo Florescer"
  );
  assert.equal(
    getPvpSeasonPlanMonth(
      plan.plan,
      10
    ).name,
    "Noite das Almas"
  );

  console.log("✅ Um mesmo ano pode guardar nomes diferentes para vários meses antecipadamente.");


  assert.equal(
    storage.data.has(
      "pvp_current_season"
    ),
    false
  );

  console.log("✅ Definir o calendário anual não cria nem ativa uma temporada atual.");


  const renamed =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10,
        name:
          "Hora do Pesadelo"
      }
    );

  assert.equal(renamed.ok, true);
  assert.equal(renamed.changed, true);
  assert.equal(
    renamed.definition.name,
    "Hora do Pesadelo"
  );

  const septemberAfter =
    getPvpSeasonPlanMonth(
      renamed.plan,
      9
    );

  assert.equal(
    septemberAfter.name,
    "Um Novo Florescer"
  );

  console.log("✅ Editar o nome de um mês não altera as definições dos outros meses.");


  const sameName =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 10,
        name:
          "Hora do Pesadelo"
      }
    );

  assert.equal(sameName.ok, true);
  assert.equal(sameName.changed, false);

  console.log("✅ Salvar novamente a mesma definição é idempotente.");
}


{
  const storage =
    createStorage();

  const invalidMonth =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 13,
        name: "Teste"
      }
    );

  const invalidYear =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 12,
        month: 1,
        name: "Teste"
      }
    );

  const invalidName =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 1,
        name: ""
      }
    );

  assert.equal(invalidMonth.ok, false);
  assert.equal(
    invalidMonth.error,
    "INVALID_SEASON_MONTH"
  );
  assert.equal(invalidYear.ok, false);
  assert.equal(
    invalidYear.error,
    "INVALID_SEASON_YEAR"
  );
  assert.equal(invalidName.ok, false);
  assert.equal(
    invalidName.error,
    "INVALID_SEASON_NAME"
  );

  console.log("✅ Ano, mês e nome inválidos são rejeitados sem criar planejamento incorreto.");
}


{
  const storage =
    createStorage();

  const missing =
    await readPvpSeasonYearPlan(
      storage,
      2027
    );

  assert.equal(missing.ok, true);
  assert.equal(missing.plan, null);

  console.log("✅ Ano ainda não configurado é distinguido corretamente de um ano já planejado.");
}


console.log("\n🏆 TODOS OS TESTES DO PLANEJAMENTO ANUAL DE TEMPORADAS PASSARAM.");
