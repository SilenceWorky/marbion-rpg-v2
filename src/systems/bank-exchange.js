import {
  normalizeMoney
} from "./money.js";


const FUSION_RULES =
  Object.freeze({
    bronze: "silver",
    silver: "gold",
    gold: "platinum"
  });


const SPLIT_RULES =
  Object.freeze({
    platinum: "gold",
    gold: "silver",
    silver: "bronze"
  });


function normalizeCoin(
  value
) {
  const coin =
    String(value ?? "")
      .trim()
      .toLowerCase();

  return coin || null;
}


function normalizeOptionalAmount(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return amount;
}


export function fuseMoney(
  current,
  coin,
  amount = null
) {
  const money =
    normalizeMoney(
      current
    );

  const source =
    normalizeCoin(
      coin
    );

  const target =
    FUSION_RULES[
      source
    ] || null;

  if (!target) {
    return {
      ok: false,
      error:
        source === "platinum"
          ? "PLATINUM_CANNOT_FUSE"
          : "INVALID_FUSION_COIN"
    };
  }

  const requested =
    normalizeOptionalAmount(
      amount
    );

  if (
    amount !== null &&
    amount !== undefined &&
    amount !== "" &&
    !requested
  ) {
    return {
      ok: false,
      error:
        "INVALID_FUSION_AMOUNT"
    };
  }

  const maxConversions =
    Math.floor(
      money[source] /
      10
    );

  const conversions =
    requested === null
      ? maxConversions
      : requested;

  if (conversions <= 0) {
    return {
      ok: false,
      error:
        "INSUFFICIENT_FUNDS_FOR_FUSION",
      required:
        10,
      available:
        money[source]
    };
  }

  if (
    conversions >
    maxConversions
  ) {
    return {
      ok: false,
      error:
        "INSUFFICIENT_FUNDS_FOR_FUSION",
      required:
        conversions * 10,
      available:
        money[source]
    };
  }

  const result = {
    ...money
  };

  result[source] -=
    conversions * 10;

  result[target] +=
    conversions;

  return {
    ok: true,
    source,
    target,
    conversions,
    money:
      result
  };
}


export function fuseAllMoney(
  current
) {
  let money =
    normalizeMoney(
      current
    );

  const steps = [];

  for (
    const source of
      [
        "bronze",
        "silver",
        "gold"
      ]
  ) {
    const result =
      fuseMoney(
        money,
        source
      );

    if (!result.ok) {
      if (
        result.error ===
        "INSUFFICIENT_FUNDS_FOR_FUSION"
      ) {
        continue;
      }

      return result;
    }

    money =
      result.money;

    steps.push({
      source:
        result.source,
      target:
        result.target,
      conversions:
        result.conversions
    });
  }

  return {
    ok: true,
    money,
    steps
  };
}


export function splitMoney(
  current,
  coin,
  amount = null
) {
  const money =
    normalizeMoney(
      current
    );

  const source =
    normalizeCoin(
      coin
    );

  const target =
    SPLIT_RULES[
      source
    ] || null;

  if (!target) {
    return {
      ok: false,
      error:
        source === "bronze"
          ? "BRONZE_CANNOT_SPLIT"
          : "INVALID_SPLIT_COIN"
    };
  }

  const requested =
    normalizeOptionalAmount(
      amount
    );

  if (
    amount !== null &&
    amount !== undefined &&
    amount !== "" &&
    !requested
  ) {
    return {
      ok: false,
      error:
        "INVALID_SPLIT_AMOUNT"
    };
  }

  const conversions =
    requested === null
      ? money[source]
      : requested;

  if (conversions <= 0) {
    return {
      ok: false,
      error:
        "INSUFFICIENT_FUNDS_FOR_SPLIT",
      required:
        1,
      available:
        money[source]
    };
  }

  if (
    conversions >
    money[source]
  ) {
    return {
      ok: false,
      error:
        "INSUFFICIENT_FUNDS_FOR_SPLIT",
      required:
        conversions,
      available:
        money[source]
    };
  }

  const result = {
    ...money
  };

  result[source] -=
    conversions;

  result[target] +=
    conversions * 10;

  return {
    ok: true,
    source,
    target,
    conversions,
    money:
      result
  };
}
