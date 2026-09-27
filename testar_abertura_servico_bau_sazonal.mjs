import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  createSeasonalChestFromDefinition
} from "./src/systems/seasonal-chest-state.js";

import {
  attemptChestOpen
} from "./src/systems/chest-open-service.js";


const profile =
  createBaseProfile(
    "servico-bau-sazonal"
  );

const created =
  createSeasonalChestFromDefinition(
    profile,
    {
      id:
        "seasonal:2026-12:chest:service1",
      seasonId:
        "2026-12",
      order: 1,
      poolRevision: 4,
      name:
        "Baú de Pinheiro"
    },
    {
      createdAt: 10
    }
  );

assert.equal(
  created.ok,
  true
);

const first =
  attemptChestOpen(
    profile,
    1,
    {
      random: () => 0,
      now: 20
    }
  );

assert.equal(
  first.ok,
  true
);

assert.equal(
  first.chestType,
  "seasonal"
);

assert.equal(
  first.action,
  "open"
);

assert.equal(
  first.pending,
  true
);

assert.equal(
  first.reused,
  false
);

assert.equal(
  first.pendingOpen
    .seasonalChestId,
  "seasonal:2026-12:chest:service1"
);

assert.equal(
  first.pendingOpen
    .poolRevision,
  4
);

const second =
  attemptChestOpen(
    profile,
    1,
    {
      random: () => {
        throw new Error(
          "NÃO DEVE REROLLAR"
        );
      },
      now: 999
    }
  );

assert.equal(
  second.ok,
  true
);

assert.equal(
  second.reused,
  true
);

assert.deepEqual(
  second.pendingOpen,
  first.pendingOpen
);

console.log(
  "✅ Serviço de abertura reconhece o Baú Sazonal e preserva o pendingOpen."
);
