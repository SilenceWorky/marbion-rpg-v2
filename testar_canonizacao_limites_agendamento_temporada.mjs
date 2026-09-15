import assert from "node:assert/strict";

import {
  normalizePvpSeasonScheduleMonth,
  normalizePvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule.js";

import {
  getMonthlySeasonBounds
} from "./src/systems/pvp-season-calendar.js";


console.log("=== CANONIZAÇÃO DOS LIMITES DO AGENDAMENTO ===");


const bounds =
  getMonthlySeasonBounds(
    2026,
    9
  );

assert.equal(bounds.ok, true);


const scheduledAt =
  Date.parse(
    "2026-08-20T12:00:00.000-03:00"
  );


const normalizedMonth =
  normalizePvpSeasonScheduleMonth({
    id: "qualquer-id-antigo",
    year: 2026,
    month: 9,
    monthName: "Qualquer nome antigo",
    name: "Um Novo Florescer",
    status: "SCHEDULED",
    startsAt:
      Date.parse(
        "2026-09-15T08:00:00.000-03:00"
      ),
    endsAt:
      Date.parse(
        "2026-10-20T22:00:00.000-03:00"
      ),
    scheduledAt
  });

assert.ok(normalizedMonth);
assert.equal(
  normalizedMonth.id,
  "2026-09"
);
assert.equal(
  normalizedMonth.monthName,
  "Setembro"
);
assert.equal(
  normalizedMonth.startsAt,
  bounds.startsAt
);
assert.equal(
  normalizedMonth.endsAt,
  bounds.endsAt
);

console.log("✅ startsAt, endsAt, ID e nome do mês são sempre reconstruídos pelo calendário canônico.");


const lateAuthorization =
  normalizePvpSeasonScheduleMonth({
    year: 2026,
    month: 9,
    name: "Um Novo Florescer",
    startsAt: bounds.startsAt,
    endsAt: bounds.endsAt,
    scheduledAt: bounds.startsAt
  });

assert.equal(
  lateAuthorization,
  null
);

console.log("✅ Um snapshot com scheduledAt já dentro do mês é rejeitado mesmo que os demais campos pareçam válidos.");


const wrongYearSchedule =
  normalizePvpSeasonYearSchedule({
    version: 1,
    year: 2026,
    months: {
      "09": {
        year: 2027,
        month: 9,
        name: "Ano errado",
        startsAt: bounds.startsAt,
        endsAt: bounds.endsAt,
        scheduledAt
      }
    }
  });

assert.equal(
  wrongYearSchedule,
  null
);

console.log("✅ Uma entrada mensal não pode declarar ano diferente do calendário anual que a contém.");


console.log("\n🏆 TODOS OS TESTES DE CANONIZAÇÃO DOS LIMITES PASSARAM.");
