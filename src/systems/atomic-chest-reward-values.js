import {
  getAtomicChestMoneyRange,
  getAtomicChestXpRange
} from "../config/atomic-chest-rewards.js";

import {
  bronzeToCanonicalMoney
} from "./money.js";


function normalizeRandomValue(
  random
) {
  const value =
    Number(
      random()
    );

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error:
        "INVALID_RANDOM_VALUE"
    };
  }

  return {
    ok: true,
    value
  };
}


function rollInclusiveInteger(
  min,
  max,
  random
) {
  const randomValue =
    normalizeRandomValue(
      random
    );

  if (!randomValue.ok) {
    return randomValue;
  }

  const amount =
    min +
    Math.floor(
      randomValue.value *
      (
        max -
        min +
        1
      )
    );

  return {
    ok: true,
    amount
  };
}


export function rollAtomicChestXpValue(
  atoms,
  random = Math.random
) {
  const range =
    getAtomicChestXpRange(
      atoms
    );

  if (!range) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_CHEST_ATOMS"
    };
  }

  const rolled =
    rollInclusiveInteger(
      range.min,
      range.max,
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  return {
    ok: true,
    type:
      "normal_xp",
    atoms:
      Math.floor(
        Number(atoms)
      ),
    amount:
      rolled.amount,
    range
  };
}


export function rollAtomicChestMoneyValue(
  atoms,
  random = Math.random
) {
  const range =
    getAtomicChestMoneyRange(
      atoms
    );

  if (!range) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_CHEST_ATOMS"
    };
  }

  const rolled =
    rollInclusiveInteger(
      range.min,
      range.max,
      random
    );

  if (!rolled.ok) {
    return rolled;
  }

  const money =
    bronzeToCanonicalMoney(
      rolled.amount
    );

  return {
    ok: true,
    type:
      "money",
    atoms:
      Math.floor(
        Number(atoms)
      ),
    bronzeEquivalent:
      rolled.amount,
    money,
    range
  };
}
