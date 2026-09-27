import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  grantPvpFinisher
} from "./src/systems/pvp-finisher-collection.js";

import {
  handleRequest
} from "./src/router.js";


function createEnv(profile) {
  const store =
    new Map([
      [
        profile.user,
        JSON.stringify(profile)
      ]
    ]);

  return {
    store,
    MARBION_USERS_V2: {
      async get(key) {
        return (
          store.get(key) ??
          null
        );
      },
      async put(
        key,
        value
      ) {
        store.set(
          key,
          value
        );
      },

      async delete(key) {
        store.delete(key);
      }
    }
  };
}


const profile =
  createBaseProfile(
    "colecionador"
  );

profile.race =
  "Metamorfo";

grantPvpFinisher(
  profile,
  {
    seasonId: "2026-10",
    finisherId: "halloween:abobora",
    name: "Explosão de Abóbora",
    source: "seasonal_chest"
  }
);
grantPvpFinisher(
  profile,
  {
    seasonId: "2026-12",
    finisherId: "natal:rena",
    name: "Investida da Rena",
    source: "seasonal_chest"
  }
);

const env =
  createEnv(profile);

const listed =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador"
    ),
    env,
    {}
  );

assert.equal(
  listed.status,
  200
);

const listedText =
  await listed.text();

assert.match(
  listedText,
  /1\. Explosão de Abóbora \(2026-10\)/
);
assert.match(
  listedText,
  /2\. Investida da Rena \(2026-12\)/
);
assert.doesNotMatch(
  listedText,
  /\[ATIVO\]/
);

const equipped =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador&args=equipar%202"
    ),
    env,
    {}
  );

assert.equal(
  equipped.status,
  200
);

const afterEquip =
  JSON.parse(
    env.store.get(
      "colecionador"
    )
  );

assert.deepEqual(
  afterEquip.pvpFinishers.equipped,
  {
    seasonId: "2026-12",
    finisherId: "natal:rena"
  }
);

const listedEquipped =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador"
    ),
    env,
    {}
  );

const equippedText =
  await listedEquipped.text();

assert.match(
  equippedText,
  /2\. Investida da Rena \(2026-12\) \[ATIVO\]/
);

const invalid =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador&args=equipar%2099"
    ),
    env,
    {}
  );

assert.equal(
  invalid.status,
  200
);

const afterInvalid =
  JSON.parse(
    env.store.get(
      "colecionador"
    )
  );

assert.deepEqual(
  afterInvalid.pvpFinishers.equipped,
  {
    seasonId: "2026-12",
    finisherId: "natal:rena"
  },
  "seleção inválida não pode alterar o Finalizador ativo"
);

const unequipped =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador&args=desequipar"
    ),
    env,
    {}
  );

assert.equal(
  unequipped.status,
  200
);

const afterUnequip =
  JSON.parse(
    env.store.get(
      "colecionador"
    )
  );

assert.equal(
  afterUnequip.pvpFinishers.equipped,
  null
);

const unequipAgain =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador&args=desequipar"
    ),
    env,
    {}
  );

const unequipAgainText =
  await unequipAgain.text();

assert.match(
  unequipAgainText,
  /não possui Finalizador PvP equipado/
);

const badUsage =
  await handleRequest(
    new Request(
      "https://worker.test/finalizador?user=colecionador&args=qualquer%20coisa"
    ),
    env,
    {}
  );

const badUsageText =
  await badUsage.text();

assert.match(
  badUsageText,
  /uso: !finalizador/
);

console.log(
  "OK: rota de listar, equipar e desequipar Finalizadores PvP"
);
