import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  MONEY_VALUES_IN_BRONZE,
  addMoney,
  bronzeToCanonicalMoney,
  canAffordMoney,
  moneyToBronze,
  normalizeMoney,
  subtractMoneyWithChange
} from "./src/systems/money.js";


assert.deepEqual(
  createBaseProfile("novo").money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  },
  "perfil novo deve nascer com todas as moedas zeradas"
);


const legacy =
  ensureProfileDefaults(
    {
      version: 2,
      user: "legacy"
    },
    "legacy"
  );

assert.deepEqual(
  legacy.money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  },
  "perfil antigo deve receber a estrutura de moedas sem migração destrutiva"
);


assert.deepEqual(
  normalizeMoney({
    bronze: 25,
    silver: "3",
    gold: -5,
    platinum: 1.9
  }),
  {
    bronze: 25,
    silver: 3,
    gold: 0,
    platinum: 1
  }
);


assert.deepEqual(
  MONEY_VALUES_IN_BRONZE,
  {
    bronze: 1,
    silver: 10,
    gold: 100,
    platinum: 1000
  }
);


assert.equal(
  moneyToBronze({
    bronze: 25,
    silver: 3,
    gold: 1,
    platinum: 0
  }),
  155
);


assert.deepEqual(
  bronzeToCanonicalMoney(
    1895
  ),
  {
    bronze: 5,
    silver: 9,
    gold: 8,
    platinum: 1
  },
  "troco canônico deve usar primeiro as maiores denominações"
);


assert.deepEqual(
  addMoney(
    {
      bronze: 0,
      silver: 0,
      gold: 1,
      platinum: 0
    },
    {
      bronze: 100,
      silver: 0,
      gold: 0,
      platinum: 0
    }
  ),
  {
    bronze: 100,
    silver: 0,
    gold: 1,
    platinum: 0
  },
  "ganhar 100 Bronze não deve virar 1 Ouro automaticamente"
);


assert.equal(
  canAffordMoney(
    {
      platinum: 1
    },
    {
      gold: 1,
      bronze: 5
    }
  ),
  true
);


const purchase =
  subtractMoneyWithChange(
    {
      platinum: 1
    },
    {
      gold: 1,
      bronze: 5
    }
  );

assert.equal(
  purchase.ok,
  true
);

assert.equal(
  purchase.cost,
  105
);

assert.equal(
  purchase.remaining,
  895
);

assert.deepEqual(
  purchase.money,
  {
    bronze: 5,
    silver: 9,
    gold: 8,
    platinum: 0
  },
  "1 Platina - 1 Ouro e 5 Bronze deve resultar em 8 Ouro, 9 Prata e 5 Bronze"
);


const insufficient =
  subtractMoneyWithChange(
    {
      silver: 2
    },
    {
      gold: 1
    }
  );

assert.equal(
  insufficient.ok,
  false
);

assert.equal(
  insufficient.error,
  "INSUFFICIENT_FUNDS"
);


console.log(
  "✅ Base de moedas e conversão do Banco validada."
);
