import assert from "node:assert/strict";

import {
  syncPvpSeasonCatalog
} from "./src/systems/pvp-season-catalog-sync.js";

import {
  definePvpSeasonYearMonth,
  readPvpSeasonYearPlan
} from "./src/systems/pvp-season-plan-store.js";

import {
  readPvpSeasonYearSchedule
} from "./src/systems/pvp-season-schedule-store.js";


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
    },

    async list({ prefix } = {}) {
      const result =
        new Map();

      for (
        const [key, value]
        of data.entries()
      ) {
        if (
          !prefix ||
          String(key).startsWith(prefix)
        ) {
          result.set(
            key,
            structuredClone(value)
          );
        }
      }

      return result;
    }
  };
}


console.log("=== SINCRONIZAÇÃO DO CATÁLOGO OFICIAL DE TEMPORADAS ===");


const storage =
  createStorage();

const catalog = {
  2026: {
    8: {
      name: "Mês Já Iniciado"
    },
    9: {
      name: "Nome do Arquivo"
    },
    10: {
      name: "Nome de Outubro"
    }
  },

  2027: {
    1: {
      name: "Nome de Janeiro"
    }
  }
};

const firstSyncAt =
  Date.parse(
    "2026-08-20T12:00:00.000-03:00"
  );


const manualDefinition =
  await definePvpSeasonYearMonth(
    storage,
    {
      year: 2026,
      month: 9,
      name: "Nome Editado no Painel"
    }
  );

assert.equal(
  manualDefinition.ok,
  true
);


const first =
  await syncPvpSeasonCatalog(
    storage,
    {
      catalog,
      now:
        firstSyncAt
    }
  );

assert.equal(first.ok, true);
assert.equal(first.changed, true);

assert.deepEqual(
  first.skippedStartedMonths.map(
    item => `${item.year}-${item.month}`
  ),
  ["2026-8"]
);

console.log("✅ Mês que já começou é ignorado e não vira temporada parcial por causa do catálogo.");


const plan2026 =
  await readPvpSeasonYearPlan(
    storage,
    2026
  );

assert.equal(plan2026.ok, true);
assert.equal(
  plan2026.plan.months["09"].name,
  "Nome Editado no Painel"
);
assert.equal(
  plan2026.plan.months["10"].name,
  "Nome de Outubro"
);

console.log("✅ O catálogo preenche meses vazios, mas não sobrescreve um nome já salvo pelo futuro painel/site.");


const schedule2026 =
  await readPvpSeasonYearSchedule(
    storage,
    2026
  );

const schedule2027 =
  await readPvpSeasonYearSchedule(
    storage,
    2027
  );

assert.equal(schedule2026.ok, true);
assert.equal(schedule2027.ok, true);

assert.equal(
  schedule2026.schedule.months["09"].name,
  "Nome Editado no Painel"
);
assert.equal(
  schedule2026.schedule.months["10"].name,
  "Nome de Outubro"
);
assert.equal(
  schedule2027.schedule.months["01"].name,
  "Nome de Janeiro"
);

console.log("✅ Meses futuros presentes no catálogo são planejados e agendados automaticamente.");


assert.equal(
  storage.data.has("pvp_current_season"),
  false
);

console.log("✅ Sincronizar o catálogo não ativa uma temporada antes da data correta.");


const originalScheduledAt =
  schedule2026.schedule.months["09"].scheduledAt;

const secondSyncAt =
  Date.parse(
    "2026-08-21T12:00:00.000-03:00"
  );

const second =
  await syncPvpSeasonCatalog(
    storage,
    {
      catalog,
      now:
        secondSyncAt
    }
  );

assert.equal(second.ok, true);
assert.equal(second.changed, false);

const scheduleAfterSecondSync =
  await readPvpSeasonYearSchedule(
    storage,
    2026
  );

assert.equal(
  scheduleAfterSecondSync.schedule.months["09"].scheduledAt,
  originalScheduledAt
);

console.log("✅ Reexecutar a sincronização é idempotente e preserva o scheduledAt original.");


console.log("\n🏆 TODOS OS TESTES DA SINCRONIZAÇÃO DO CATÁLOGO PASSARAM.");
