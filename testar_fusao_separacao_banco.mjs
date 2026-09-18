import assert from "node:assert/strict";

import {
  fuseAllMoney,
  fuseMoney,
  splitMoney
} from "./src/systems/bank-exchange.js";


const fuseBronze =
  fuseMoney(
    {
      bronze: 25,
      silver: 3,
      gold: 1,
      platinum: 0
    },
    "bronze"
  );

assert.equal(
  fuseBronze.ok,
  true
);

assert.deepEqual(
  fuseBronze.money,
  {
    bronze: 5,
    silver: 5,
    gold: 1,
    platinum: 0
  },
  "unir bronze sem quantidade deve converter o máximo possível"
);


const fuseOne =
  fuseMoney(
    {
      bronze: 25,
      silver: 0,
      gold: 0,
      platinum: 0
    },
    "bronze",
    1
  );

assert.deepEqual(
  fuseOne.money,
  {
    bronze: 15,
    silver: 1,
    gold: 0,
    platinum: 0
  },
  "unir bronze 1 deve consumir 10 Bronze e criar 1 Prata"
);


const fuseSilver =
  fuseMoney(
    {
      bronze: 0,
      silver: 25,
      gold: 0,
      platinum: 0
    },
    "silver"
  );

assert.deepEqual(
  fuseSilver.money,
  {
    bronze: 0,
    silver: 5,
    gold: 2,
    platinum: 0
  }
);


const fuseGold =
  fuseMoney(
    {
      bronze: 0,
      silver: 0,
      gold: 21,
      platinum: 1
    },
    "gold"
  );

assert.deepEqual(
  fuseGold.money,
  {
    bronze: 0,
    silver: 0,
    gold: 1,
    platinum: 3
  }
);


assert.equal(
  fuseMoney(
    {
      platinum: 3
    },
    "platinum"
  ).error,
  "PLATINUM_CANNOT_FUSE"
);


const cascade =
  fuseAllMoney(
    {
      bronze: 125,
      silver: 8,
      gold: 9,
      platinum: 0
    }
  );

assert.equal(
  cascade.ok,
  true
);

assert.deepEqual(
  cascade.money,
  {
    bronze: 5,
    silver: 0,
    gold: 1,
    platinum: 1
  },
  "unir tudo deve fazer a cascata Bronze→Prata→Ouro→Platina"
);


const splitPlatinum =
  splitMoney(
    {
      bronze: 0,
      silver: 0,
      gold: 2,
      platinum: 3
    },
    "platinum"
  );

assert.deepEqual(
  splitPlatinum.money,
  {
    bronze: 0,
    silver: 0,
    gold: 32,
    platinum: 0
  },
  "separar platina sem quantidade deve separar todas as Platinas"
);


const splitOneGold =
  splitMoney(
    {
      bronze: 0,
      silver: 5,
      gold: 3,
      platinum: 0
    },
    "gold",
    1
  );

assert.deepEqual(
  splitOneGold.money,
  {
    bronze: 0,
    silver: 15,
    gold: 2,
    platinum: 0
  },
  "separar gold 1 deve gerar 10 Prata"
);


const splitSilver =
  splitMoney(
    {
      bronze: 3,
      silver: 2,
      gold: 0,
      platinum: 0
    },
    "silver"
  );

assert.deepEqual(
  splitSilver.money,
  {
    bronze: 23,
    silver: 0,
    gold: 0,
    platinum: 0
  }
);


assert.equal(
  splitMoney(
    {
      bronze: 10
    },
    "bronze"
  ).error,
  "BRONZE_CANNOT_SPLIT"
);


const tooMuch =
  fuseMoney(
    {
      bronze: 15
    },
    "bronze",
    2
  );

assert.equal(
  tooMuch.ok,
  false
);

assert.equal(
  tooMuch.error,
  "INSUFFICIENT_FUNDS_FOR_FUSION"
);


console.log(
  "✅ Fusão e separação de moedas do Banco validadas."
);
