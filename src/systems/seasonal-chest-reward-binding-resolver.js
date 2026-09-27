import {
  getSeasonalChestRewardBindingSlot
} from "../config/seasonal-chest-reward-bindings.js";


export function resolveSeasonalChestRewardBinding(
  seasonContent,
  key
) {
  if (
    !seasonContent ||
    typeof seasonContent !== "object" ||
    Array.isArray(seasonContent)
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_CONTENT"
    };
  }

  const slot =
    getSeasonalChestRewardBindingSlot(
      key
    );

  if (!slot) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_REWARD_SLOT"
    };
  }

  const bindings =
    Array.isArray(
      seasonContent
        .seasonalChestRewardBindings
    )
      ? seasonContent
          .seasonalChestRewardBindings
      : [];

  const binding =
    bindings.find(
      entry =>
        entry?.key ===
        slot.key
    );

  if (!binding) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_UNBOUND",
      slot
    };
  }

  const chests =
    Array.isArray(
      seasonContent.seasonalChests
    )
      ? seasonContent.seasonalChests
      : [];

  const chest =
    chests.find(
      entry =>
        entry?.id ===
        binding.seasonalChestId
    );

  if (!chest) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_CHEST_NOT_FOUND",
      slot,
      binding
    };
  }

  if (
    chest.seasonId !==
      seasonContent.id
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_SEASON_MISMATCH",
      slot,
      binding
    };
  }

  if (
    !Number.isSafeInteger(
      Number(chest.order)
    ) ||
    Number(chest.order) < 1 ||
    !Number.isSafeInteger(
      Number(chest.poolRevision)
    ) ||
    Number(chest.poolRevision) < 1
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_IDENTITY_INCOMPLETE",
      slot,
      binding
    };
  }

  return {
    ok: true,
    slot,
    binding: {
      key:
        slot.key,
      seasonalChestId:
        chest.id
    },
    chest
  };
}


export function resolveSeasonPassSeasonalChestReward(
  seasonContent,
  {
    tier = null,
    postPass = false
  } = {}
) {
  const key =
    postPass
      ? "season_pass:post"
      : `season_pass:tier:${Math.floor(
          Number(tier)
        )}`;

  return resolveSeasonalChestRewardBinding(
    seasonContent,
    key
  );
}
