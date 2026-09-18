import {
  CHEST_TYPES
} from "./chest-inventory.js";

import {
  selectChestByGroupNumber
} from "./chest-selection.js";

import {
  getAtomicChestState
} from "./atomic-chest-state.js";

import {
  resolveAtomicChestAttempt
} from "./atomic-chest-mechanic.js";

import {
  rollAtomicChestRewardPlan
} from "./atomic-chest-reward-plan.js";


function normalizeNow(
  value
) {
  const now =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(now) ||
    now < 0
  ) {
    return Date.now();
  }

  return now;
}


export function attemptChestOpen(
  profile,
  selection,
  {
    random = Math.random,
    now = Date.now()
  } = {}
) {
  const selected =
    selectChestByGroupNumber(
      profile,
      selection
    );

  if (!selected.ok) {
    return selected;
  }

  const chest =
    selected.chest;

  if (
    chest.type !==
      CHEST_TYPES.ATOMIC
  ) {
    return {
      ok: false,
      error:
        "CHEST_OPEN_NOT_IMPLEMENTED",
      chestType:
        chest.type,
      chestId:
        chest.id
    };
  }

  const atomic =
    getAtomicChestState(
      chest
    );

  if (!atomic.ok) {
    return atomic;
  }

  if (
    atomic.state.pendingOpen
  ) {
    return {
      ok: true,
      action:
        "open",
      pending: true,
      chestId:
        chest.id,
      chestType:
        chest.type,
      currentAtoms:
        atomic.state.pendingOpen
          .atoms,
      pendingOpen:
        atomic.state.pendingOpen
    };
  }

  const result =
    resolveAtomicChestAttempt(
      chest,
      {
        random
      }
    );

  if (!result.ok) {
    return result;
  }

  if (
    result.action === "open"
  ) {
    /*
     * resolveAtomicChestAttempt() normaliza novamente o estado
     * interno do baú e pode substituir chest.metadata.atomic.
     * Portanto, não devemos gravar pendingOpen pela referência
     * "atomic" obtida antes da tentativa: ela pode estar stale.
     */
    const latestAtomic =
      getAtomicChestState(
        chest
      );

    if (!latestAtomic.ok) {
      return latestAtomic;
    }

    const rewardPlan =
      rollAtomicChestRewardPlan(
        result.currentAtoms,
        random
      );

    if (!rewardPlan.ok) {
      return rewardPlan;
    }

    latestAtomic.state.pendingOpen = {
      atoms:
        result.currentAtoms,
      attemptNumber:
        result.attemptNumber,
      scripted:
        result.scripted === true,
      createdAt:
        normalizeNow(
          now
        ),
      rewardPlan: {
        atoms:
          rewardPlan.atoms,
        rewards:
          structuredClone(
            rewardPlan.rewards
          ),
        hasUnresolvedRewards:
          rewardPlan.hasUnresolvedRewards
      }
    };

    return {
      ...result,
      chestId:
        chest.id,
      chestType:
        chest.type,
      pending: true,
      pendingOpen:
        latestAtomic.state.pendingOpen
    };
  }

  return {
    ...result,
    chestId:
      chest.id,
    chestType:
      chest.type,
    pending: false
  };
}
