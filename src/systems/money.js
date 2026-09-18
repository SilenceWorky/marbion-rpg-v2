export const MONEY_VALUES_IN_BRONZE =
  Object.freeze({
    bronze: 1,
    silver: 10,
    gold: 100,
    platinum: 1000
  });


export const MONEY_DENOMINATIONS =
  Object.freeze([
    "bronze",
    "silver",
    "gold",
    "platinum"
  ]);


function normalizeCount(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return 0;
  }

  return Math.floor(number);
}


export function createEmptyMoney() {
  return {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  };
}


export function normalizeMoney(
  value = {}
) {
  return {
    bronze:
      normalizeCount(
        value?.bronze
      ),

    silver:
      normalizeCount(
        value?.silver
      ),

    gold:
      normalizeCount(
        value?.gold
      ),

    platinum:
      normalizeCount(
        value?.platinum
      )
  };
}


export function moneyToBronze(
  value = {}
) {
  const money =
    normalizeMoney(
      value
    );

  return (
    money.bronze *
      MONEY_VALUES_IN_BRONZE.bronze +
    money.silver *
      MONEY_VALUES_IN_BRONZE.silver +
    money.gold *
      MONEY_VALUES_IN_BRONZE.gold +
    money.platinum *
      MONEY_VALUES_IN_BRONZE.platinum
  );
}


export function bronzeToCanonicalMoney(
  value
) {
  let remaining =
    normalizeCount(
      value
    );

  const money =
    createEmptyMoney();

  money.platinum =
    Math.floor(
      remaining /
      MONEY_VALUES_IN_BRONZE.platinum
    );

  remaining %=
    MONEY_VALUES_IN_BRONZE.platinum;

  money.gold =
    Math.floor(
      remaining /
      MONEY_VALUES_IN_BRONZE.gold
    );

  remaining %=
    MONEY_VALUES_IN_BRONZE.gold;

  money.silver =
    Math.floor(
      remaining /
      MONEY_VALUES_IN_BRONZE.silver
    );

  remaining %=
    MONEY_VALUES_IN_BRONZE.silver;

  money.bronze =
    remaining;

  return money;
}


export function addMoney(
  current,
  earned
) {
  const money =
    normalizeMoney(
      current
    );

  const addition =
    normalizeMoney(
      earned
    );

  /*
   * Ganhos não são convertidos automaticamente.
   * Cada denominação permanece exatamente na moeda
   * em que foi recebida até uma ação explícita do banco
   * ou uma transação exigir troco.
   */
  return {
    bronze:
      money.bronze +
      addition.bronze,

    silver:
      money.silver +
      addition.silver,

    gold:
      money.gold +
      addition.gold,

    platinum:
      money.platinum +
      addition.platinum
  };
}


export function canAffordMoney(
  current,
  price
) {
  return (
    moneyToBronze(
      current
    ) >=
    moneyToBronze(
      price
    )
  );
}


export function subtractMoneyWithChange(
  current,
  price
) {
  const balance =
    moneyToBronze(
      current
    );

  const cost =
    moneyToBronze(
      price
    );

  if (cost <= 0) {
    return {
      ok: false,
      error: "INVALID_PRICE"
    };
  }

  if (balance < cost) {
    return {
      ok: false,
      error: "INSUFFICIENT_FUNDS",
      balance,
      cost
    };
  }

  const remaining =
    balance - cost;

  return {
    ok: true,
    cost,
    remaining,
    money:
      bronzeToCanonicalMoney(
        remaining
      )
  };
}
