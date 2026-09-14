import assert from "node:assert/strict";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth,
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";


function createStorage() {
  const data = new Map();
  let putCount = 0;

  return {
    data,

    get putCount() {
      return putCount;
    },

    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      putCount += 1;
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


console.log("=== IDEMPOTÊNCIA DO AGENDAMENTO MENSAL ===");


const storage = createStorage();

const firstScheduledAt =
  Date.parse(
    "2026-08-20T12:00:00.000-03:00"
  );

const retryScheduledAt =
  Date.parse(
    "2026-08-25T18:30:00.000-03:00"
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


const first =
  await schedulePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 9
    },
    firstScheduledAt
  );

assert.equal(first.ok, true);
assert.equal(first.changed, true);
assert.equal(
  first.entry.scheduledAt,
  firstScheduledAt
);

const writesAfterFirst =
  storage.putCount;

console.log("✅ O primeiro agendamento grava a data original de autorização.");


const second =
  await schedulePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 9
    },
    retryScheduledAt
  );

assert.equal(second.ok, true);
assert.equal(second.changed, false);
assert.equal(
  second.entry.scheduledAt,
  firstScheduledAt
);
assert.equal(
  storage.putCount,
  writesAfterFirst
);

console.log("✅ Repetir o mesmo agendamento não regrava o storage nem altera scheduledAt.");


const stored =
  await readPvpSeasonYearSchedule(
    storage,
    2026
  );

assert.equal(stored.ok, true);
assert.equal(
  stored.schedule.months["09"].scheduledAt,
  firstScheduledAt
);
assert.equal(
  stored.schedule.months["09"].name,
  "Um Novo Florescer"
);

console.log("✅ O snapshot persistido do mês permanece intacto após retries.");


console.log("\n🏆 TODOS OS TESTES DE IDEMPOTÊNCIA DO AGENDAMENTO PASSARAM.");
