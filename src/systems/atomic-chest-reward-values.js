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


export function rollAtomicChestBaseRewards(
  atoms,
  random = Math.random
) {
  const normalizedAtoms =
    Math.floor(
      Number(atoms)
    );

  if (
    !Number.isFinite(
      normalizedAtoms
    ) ||
    normalizedAtoms < 1 ||
    normalizedAtoms > 5
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_CHEST_ATOMS"
    };
  }

  /*
   * ⚛ (1 átomo):
   * 50% XP OU 50% dinheiro.
   *
   * ⚛⚛+:
   * XP E dinheiro garantidos.
   */
  if (normalizedAtoms === 1) {
    const choice =
      normalizeRandomValue(
        random
      );

    if (!choice.ok) {
      return choice;
    }

    const reward =
      choice.value < 0.50
        ? rollAtomicChestXpValue(
            1,
            random
          )
        : rollAtomicChestMoneyValue(
            1,
            random
          );

    if (!reward.ok) {
      return reward;
    }

    return {
      ok: true,
      atoms: 1,
      rewards: [
        reward
      ]
    };
  }

  const xp =
    rollAtomicChestXpValue(
      normalizedAtoms,
      random
    );

  if (!xp.ok) {
    return xp;
  }

  const money =
    rollAtomicChestMoneyValue(
      normalizedAtoms,
      random
    );

  if (!money.ok) {
    return money;
  }

  return {
    ok: true,
    atoms:
      normalizedAtoms,
    rewards: [
      xp,
      money
    ]
  };
}
