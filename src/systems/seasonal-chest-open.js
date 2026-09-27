import {
  rollSeasonalChestRewardPlan
} from "../config/seasonal-chest-rewards.js";

import {
  getSeasonalChestState
} from "./seasonal-chest-state.js";


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

function getStoredPendingOpen(
  chest
) {
  const pending =
    chest?.metadata
      ?.seasonal
      ?.pendingOpen;

  if (
    !pending ||
    typeof pending !== "object" ||
    Array.isArray(pending)
  ) {
    return null;
  }

  return pending;
}


export function prepareSeasonalChestOpen(
  chest,
  {
    random = Math.random,
    now = Date.now()
  } = {}
) {
  const seasonal =
    getSeasonalChestState(
      chest
    );

  if (!seasonal.ok) {
    return seasonal;
  }

  const identity =
    seasonal.state;

  if (
    identity.identityComplete !==
      true ||
    !identity.seasonalChestId ||
    !identity.chestOrder ||
    !identity.poolRevision
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_IDENTITY_REQUIRED"
    };
  }

  const existingPending =
    getStoredPendingOpen(
      chest
    );

  if (existingPending) {
    return {
      ok: true,
      pending: true,
      reused: true,
      pendingOpen:
        existingPending
    };
  }

  const rewardPlan =
    rollSeasonalChestRewardPlan(
      random
    );

  if (!rewardPlan.ok) {
    return rewardPlan;
  }

  const pendingOpen = {
    seasonId:
      identity.seasonId,
    seasonalChestId:
      identity.seasonalChestId,
    chestOrder:
      identity.chestOrder,
    poolRevision:
      identity.poolRevision,
    nameSnapshot:
      identity.nameSnapshot ??
      identity.name ??
      null,
    descriptionSnapshot:
      identity.descriptionSnapshot ??
      identity.description ??
      null,
    createdAt:
      normalizeNow(
        now
      ),
    rewardPlan: {
      rewards:
        structuredClone(
          rewardPlan.rewards
        ),
      hasUnresolvedRewards:
        rewardPlan.hasUnresolvedRewards ===
          true
    }
  };

  chest.metadata.seasonal
    .pendingOpen =
      pendingOpen;

  return {
    ok: true,
    pending: true,
    reused: false,
    pendingOpen
  };
}
