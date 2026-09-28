import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  findOwnedRelic,
  getRelicCollection,
  grantRelic
} from "./src/systems/relic-collection.js";

const profile =
  createBaseProfile(
    "colecao-reliquias"
  );

assert.deepEqual(
  profile.relics,
  {
    owned: []
  }
);

const first =
  grantRelic(
    profile,
    {
      seasonId: "2026-09",
      relicId:
        "jardim:fragmento-criador",
      name:
        "Fragmento do Jardim do Criador",
      description:
        "Um fragmento antigo.",
      lore:
        "Dizem que pertenceu ao primeiro jardim.",
      source:
        "seasonal_chest",
      seasonalChestId:
        "seasonal:2026-09:chest:relic01",
      chestOrder: 1,
      poolRevision: 7,
      acquiredAt: 123
    }
  );

assert.equal(first.ok, true);
assert.equal(first.duplicate, false);
assert.equal(
  profile.relics.owned.length,
  1
);
assert.equal(
  profile.relics.owned[0].relicId,
  "jardim:fragmento-criador"
);
assert.equal(
  profile.relics.owned[0].name,
  "Fragmento do Jardim do Criador"
);
assert.equal(
  profile.relics.owned[0].description,
  "Um fragmento antigo."
);
assert.equal(
  profile.relics.owned[0].lore,
  "Dizem que pertenceu ao primeiro jardim."
);
assert.equal(
  profile.relics.owned[0].seasonalChestId,
  "seasonal:2026-09:chest:relic01"
);
assert.equal(
  profile.relics.owned[0].chestOrder,
  1
);
assert.equal(
  profile.relics.owned[0].poolRevision,
  7
);

const duplicate =
  grantRelic(
    profile,
    {
      seasonId: "2026-09",
      relicId:
        "jardim:fragmento-criador",
      name: "Nome alterado"
    }
  );

assert.equal(duplicate.ok, true);
assert.equal(duplicate.duplicate, true);
assert.equal(
  profile.relics.owned.length,
  1
);
assert.equal(
  profile.relics.owned[0].name,
  "Fragmento do Jardim do Criador",
  "retry não deve substituir a relíquia já adquirida"
);

const anotherSeason =
  grantRelic(
    profile,
    {
      seasonId: "2027-09",
      relicId:
        "jardim:fragmento-criador",
      name:
        "Fragmento do Jardim do Criador 2027"
    }
  );

assert.equal(
  anotherSeason.ok,
  true
);
assert.equal(
  anotherSeason.duplicate,
  false
);
assert.equal(
  profile.relics.owned.length,
  2
);

const found =
  findOwnedRelic(
    profile,
    "2026-09",
    "jardim:fragmento-criador"
  );

assert.equal(found.ok, true);
assert.equal(found.found, true);
assert.equal(
  found.relic.name,
  "Fragmento do Jardim do Criador"
);

const collection =
  getRelicCollection(profile);

assert.equal(collection.ok, true);
assert.equal(
  collection.owned.length,
  2
);

const legacy =
  ensureProfileDefaults({
    user: "legacy"
  });

assert.deepEqual(
  legacy.relics,
  {
    owned: []
  }
);

const preserved =
  ensureProfileDefaults({
    user: "preserved",
    relics: {
      owned: [
        {
          seasonId: "2026-09",
          relicId:
            "jardim:fragmento-criador",
          name:
            "Fragmento do Jardim do Criador"
        }
      ]
    }
  });

assert.equal(
  preserved.relics.owned.length,
  1
);
assert.equal(
  preserved.relics.owned[0].relicId,
  "jardim:fragmento-criador"
);

console.log(
  "OK: coleção permanente de Relíquias Sazonais"
);
