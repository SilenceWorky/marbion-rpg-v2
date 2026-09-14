import assert from "node:assert/strict";

import {
  PVP_SEASON_TIMEZONE,
  getMonthlySeasonId,
  getMonthlySeasonBounds,
  createMonthlySeasonDefinition
} from "./src/systems/pvp-season-calendar.js";


console.log("=== CALENDÁRIO MENSAL DE TEMPORADAS ===");


{
  const result =
    getMonthlySeasonBounds(
      2026,
      9
    );

  assert.equal(result.ok, true);
  assert.equal(result.year, 2026);
  assert.equal(result.month, 9);
  assert.equal(result.monthName, "Setembro");
  assert.equal(result.timezone, PVP_SEASON_TIMEZONE);
  assert.equal(
    new Date(result.startsAt).toISOString(),
    "2026-09-01T03:00:00.000Z"
  );
  assert.equal(
    new Date(result.endsAt).toISOString(),
    "2026-10-01T03:00:00.000Z"
  );

  console.log("✅ Setembro começa no dia 1 às 00:00 e termina exatamente na virada para outubro em America/Fortaleza.");
}


{
  const result =
    getMonthlySeasonBounds(
      2028,
      2
    );

  assert.equal(result.ok, true);
  assert.equal(
    new Date(result.startsAt).toISOString(),
    "2028-02-01T03:00:00.000Z"
  );
  assert.equal(
    new Date(result.endsAt).toISOString(),
    "2028-03-01T03:00:00.000Z"
  );

  const durationDays =
    (result.endsAt - result.startsAt) /
    (24 * 60 * 60 * 1000);

  assert.equal(durationDays, 29);

  console.log("✅ Fevereiro bissexto usa automaticamente 29 dias, sem duração fixa de 30 dias.");
}


{
  const result =
    getMonthlySeasonBounds(
      2026,
      12
    );

  assert.equal(result.ok, true);
  assert.equal(
    new Date(result.endsAt).toISOString(),
    "2027-01-01T03:00:00.000Z"
  );

  console.log("✅ Dezembro atravessa corretamente a virada de ano.");
}


{
  assert.equal(
    getMonthlySeasonId(2026, 9),
    "2026-09"
  );

  assert.equal(
    getMonthlySeasonId(2027, 1),
    "2027-01"
  );

  console.log("✅ ID mensal é estável no formato YYYY-MM.");
}


{
  const result =
    createMonthlySeasonDefinition({
      year: 2026,
      month: 9,
      baseTheme:
        "Jardim do Criador",
      name:
        "Um Novo Florescer"
    });

  assert.equal(result.ok, true);
  assert.deepEqual(
    {
      id: result.definition.id,
      year: result.definition.year,
      month: result.definition.month,
      monthName: result.definition.monthName,
      baseTheme: result.definition.baseTheme,
      name: result.definition.name,
      timezone: result.definition.timezone
    },
    {
      id: "2026-09",
      year: 2026,
      month: 9,
      monthName: "Setembro",
      baseTheme: "Jardim do Criador",
      name: "Um Novo Florescer",
      timezone: "America/Fortaleza"
    }
  );

  console.log("✅ Tema-base permanente e nome anual da temporada ficam separados na definição mensal.");
}


{
  const invalidMonth =
    createMonthlySeasonDefinition({
      year: 2026,
      month: 13,
      baseTheme: "Teste",
      name: "Teste"
    });

  const invalidTheme =
    createMonthlySeasonDefinition({
      year: 2026,
      month: 9,
      baseTheme: "",
      name: "Teste"
    });

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

  console.log("✅ Mês e tema-base inválidos são rejeitados explicitamente.");
}


console.log("\n🏆 TODOS OS TESTES DO CALENDÁRIO MENSAL DE TEMPORADAS PASSARAM.");
