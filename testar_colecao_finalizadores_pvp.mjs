import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  equipPvpFinisher,
  findOwnedPvpFinisher,
  getEquippedPvpFinisher,
  getPvpFinisherCollection,
  grantPvpFinisher,
  unequipPvpFinisher
} from "./src/systems/pvp-finisher-collection.js";


const profile =
  createBaseProfile(
    "finalizador-teste"
  );

assert.deepEqual(
  profile.pvpFinishers,
  {
    owned: [],
    equipped: null
  }
);
const first =
  grantPvpFinisher(
    profile,
    {
      seasonId: "2026-12",
      finisherId: "nevasca-final",
      name: "Nevasca Final",
      description: "Finalizador de teste.",
      source: "seasonal_chest",
      seasonalChestId:
        "seasonal:2026-12:chest:001",
      chestOrder: 1,
      poolRevision: 7,
      acquiredAt: 1000
    }
  );

assert.equal(first.ok, true);
assert.equal(first.duplicate, false);
assert.equal(
  profile.pvpFinishers.owned.length,
  1
);
assert.equal(
  first.finisher.seasonId,
  "2026-12"
);
assert.equal(
  first.finisher.finisherId,
  "nevasca-final"
);
assert.equal(
  first.finisher.seasonalChestId,
  "seasonal:2026-12:chest:001"
);
assert.equal(first.finisher.chestOrder, 1);
assert.equal(first.finisher.poolRevision, 7);

const duplicate =
  grantPvpFinisher(
    profile,
    {
      seasonId: "2026-12",
      finisherId: "nevasca-final",
      name: "Nome alterado"
    }
  );

assert.equal(duplicate.ok, true);
assert.equal(duplicate.duplicate, true);
assert.equal(
  profile.pvpFinishers.owned.length,
  1
);
const otherSeason =
  grantPvpFinisher(
    profile,
    {
      seasonId: "2027-12",
      finisherId: "nevasca-final",
      name: "Nevasca Final 2027"
    }
  );

assert.equal(otherSeason.ok, true);
assert.equal(otherSeason.duplicate, false);
assert.equal(
  profile.pvpFinishers.owned.length,
  2
);

const foundOriginal =
  findOwnedPvpFinisher(
    profile,
    "2026-12",
    "nevasca-final"
  );

assert.equal(foundOriginal.ok, true);
assert.equal(foundOriginal.found, true);
assert.equal(
  foundOriginal.finisher.name,
  "Nevasca Final"
);
const missing =
  findOwnedPvpFinisher(
    profile,
    "2026-12",
    "nao-existe"
  );

assert.equal(missing.ok, true);
assert.equal(missing.found, false);

const equipOriginal =
  equipPvpFinisher(
    profile,
    "2026-12",
    "nevasca-final"
  );

assert.equal(equipOriginal.ok, true);
assert.equal(equipOriginal.changed, true);
assert.deepEqual(
  profile.pvpFinishers.equipped,
  {
    seasonId: "2026-12",
    finisherId: "nevasca-final"
  }
);
const equipSame =
  equipPvpFinisher(
    profile,
    "2026-12",
    "nevasca-final"
  );

assert.equal(equipSame.ok, true);
assert.equal(equipSame.changed, false);

const equipOther =
  equipPvpFinisher(
    profile,
    "2027-12",
    "nevasca-final"
  );

assert.equal(equipOther.ok, true);
assert.equal(equipOther.changed, true);
assert.deepEqual(
  profile.pvpFinishers.equipped,
  {
    seasonId: "2027-12",
    finisherId: "nevasca-final"
  }
);
const equipped =
  getEquippedPvpFinisher(profile);

assert.equal(equipped.ok, true);
assert.equal(
  equipped.finisher.name,
  "Nevasca Final 2027"
);

const denied =
  equipPvpFinisher(
    profile,
    "2026-12",
    "nao-existe"
  );

assert.equal(denied.ok, false);
assert.equal(
  denied.error,
  "PVP_FINISHER_NOT_OWNED"
);
assert.deepEqual(
  profile.pvpFinishers.equipped,
  {
    seasonId: "2027-12",
    finisherId: "nevasca-final"
  }
);
const unequipped =
  unequipPvpFinisher(profile);

assert.equal(unequipped.ok, true);
assert.equal(unequipped.changed, true);
assert.equal(
  profile.pvpFinishers.equipped,
  null
);

const unequipAgain =
  unequipPvpFinisher(profile);

assert.equal(unequipAgain.ok, true);
assert.equal(unequipAgain.changed, false);

const legacy =
  ensureProfileDefaults(
    {
      user: "perfil-legado",
      xp: 33
    }
  );

assert.deepEqual(
  legacy.pvpFinishers,
  {
    owned: [],
    equipped: null
  }
);

const preserved =
  ensureProfileDefaults({
    user: "perfil-preservado",
    pvpFinishers: {
      owned: [
        {
          seasonId: "2026-10",
          finisherId: "abobora",
          name: "Abóbora"
        }
      ],
      equipped: {
        seasonId: "2026-10",
        finisherId: "abobora"
      }
    }
  });

assert.equal(
  preserved.pvpFinishers.owned.length,
  1
);
assert.deepEqual(
  preserved.pvpFinishers.equipped,
  {
    seasonId: "2026-10",
    finisherId: "abobora"
  }
);

const snapshot =
  getPvpFinisherCollection(
    profile
  );

assert.equal(snapshot.ok, true);
assert.equal(snapshot.owned.length, 2);
assert.equal(snapshot.equipped, null);

console.log(
  "OK: coleção permanente de Finalizadores PvP"
);
