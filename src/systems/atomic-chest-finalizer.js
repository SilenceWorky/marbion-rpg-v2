import {
  getChestById,
  removeChestById
} from "./chest-inventory.js";

import {
  getAtomicChestState
} from "./atomic-chest-state.js";


export function finalizeAtomicChestOpen(
  profile,
  chestId
) {
  const found =
    getChestById(
      profile,
      chestId
    );

  if (!found.ok) {
    return found;
  }

  const atomic =
    getAtomicChestState(
      found.chest
    );

  if (!atomic.ok) {
    return atomic;
  }

  const pendingOpen =
    atomic.state.pendingOpen;

  if (!pendingOpen) {
    return {
      ok: false,
      error:
        "ATOMIC_CHEST_NOT_PENDING_OPEN"
    };
  }

  const plan =
    pendingOpen.rewardPlan;

  const rewards =
    Array.isArray(
      plan?.rewards
    )
      ? plan.rewards
      : [];

  const unresolvedIndexes =
    rewards
      .map(
        (reward, index) => ({
          reward,
          index
        })
      )
      .filter(
        entry =>
          entry.reward
            ?.resolved !== true
      )
      .map(
        entry =>
          entry.index
      );

  if (
    unresolvedIndexes.length >
      0
  ) {
    return {
      ok: false,
      error:
        "ATOMIC_CHEST_REWARDS_UNRESOLVED",
      unresolvedIndexes
    };
  }

  const applied =
    new Set(
      Array.isArray(
        plan?.appliedRewardIndexes
      )
        ? plan.appliedRewardIndexes
        : []
    );

  const unappliedIndexes =
    rewards
      .map(
        (_, index) =>
          index
      )
      .filter(
        index =>
          !applied.has(index)
      );

  if (
    unappliedIndexes.length >
      0
  ) {
    return {
      ok: false,
      error:
        "ATOMIC_CHEST_REWARDS_UNAPPLIED",
      unappliedIndexes
    };
  }

  const snapshot = {
    chestId:
      found.chest.id,
    atoms:
      pendingOpen.atoms,
    attemptNumber:
      pendingOpen.attemptNumber,
    scripted:
      pendingOpen.scripted === true,
    createdAt:
      pendingOpen.createdAt,
    rewardPlan:
      structuredClone(
        plan
      )
  };

  const removed =
    removeChestById(
      profile,
      found.chest.id
    );

  if (!removed.ok) {
    return removed;
  }

  return {
    ok: true,
    finalized: true,
    snapshot,
    removedChest:
      removed.chest
  };
}
