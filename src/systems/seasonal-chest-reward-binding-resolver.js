import {
  getSeasonalChestRewardBindingSlot
} from "../config/seasonal-chest-reward-bindings.js";


function getSeasonalChests(
  seasonContent
) {
  return Array.isArray(
    seasonContent?.seasonalChests
  )
    ? seasonContent.seasonalChests
    : [];
}


function validateResolvedChest(
  seasonContent,
  chest,
  context = {}
) {
  if (!chest) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_CHEST_NOT_FOUND",
      ...context
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
      ...context
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
      ...context
    };
  }

  return {
    ok: true,
    chest
  };
}


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

  const override =
    bindings.find(
      entry =>
        entry?.key ===
        slot.key
    ) ??
    null;

  const seasonalChestId =
    override?.seasonalChestId ??
    seasonContent
      .defaultSeasonalChestId ??
    null;

  if (!seasonalChestId) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_REWARD_UNBOUND",
      slot
    };
  }

  const chest =
    getSeasonalChests(
      seasonContent
    ).find(
      entry =>
        entry?.id ===
        seasonalChestId
    );

  const validated =
    validateResolvedChest(
      seasonContent,
      chest,
      {
        slot,
        binding:
          override
            ? {
                key:
                  slot.key,
                seasonalChestId
              }
            : null,
        source:
          override
            ? "override"
            : "default"
      }
    );

  if (!validated.ok) {
    return validated;
  }

  return {
    ok: true,
    slot,
    binding:
      override
        ? {
            key:
              slot.key,
            seasonalChestId
          }
        : null,
    source:
      override
        ? "override"
        : "default",
    chest:
      validated.chest
  };
}


export function getSeasonPassPostSeasonalChestRewardPool(
  seasonContent
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

  const configuredPool =
    Array.isArray(
      seasonContent
        .seasonalChestPostPassPool
    )
      ? seasonContent
          .seasonalChestPostPassPool
      : [];

  if (
    configuredPool.length === 0
  ) {
    const fallback =
      resolveSeasonalChestRewardBinding(
        seasonContent,
        "season_pass:post"
      );

    if (!fallback.ok) {
      return fallback;
    }

    return {
      ok: true,
      source:
        fallback.source,
      pool: [
        {
          seasonalChestId:
            fallback.chest.id,
          chancePercent: 100,
          chest:
            fallback.chest
        }
      ]
    };
  }

  const chests =
    getSeasonalChests(
      seasonContent
    );

  const pool = [];

  for (
    const entry of
      configuredPool
  ) {
    const chest =
      chests.find(
        candidate =>
          candidate?.id ===
          entry?.seasonalChestId
      );

    const validated =
      validateResolvedChest(
        seasonContent,
        chest,
        {
          entry
        }
      );

    if (!validated.ok) {
      return validated;
    }

    pool.push({
      seasonalChestId:
        validated.chest.id,
      chancePercent:
        Number(
          entry.chancePercent
        ),
      chest:
        validated.chest
    });
  }

  return {
    ok: true,
    source:
      "post_pass_pool",
    pool
  };
}


export function rollSeasonPassPostSeasonalChestReward(
  seasonContent,
  random = Math.random
) {
  const resolved =
    getSeasonPassPostSeasonalChestRewardPool(
      seasonContent
    );

  if (!resolved.ok) {
    return resolved;
  }

  const roll =
    Math.min(
      0.999999999999,
      Math.max(
        0,
        Number(
          random()
        ) || 0
      )
    ) * 100;

  let cursor = 0;

  for (
    const entry of
      resolved.pool
  ) {
    cursor +=
      entry.chancePercent;

    if (
      roll <
      cursor
    ) {
      return {
        ok: true,
        slot:
          getSeasonalChestRewardBindingSlot(
            "season_pass:post"
          ),
        source:
          resolved.source,
        roll,
        selected:
          entry,
        chest:
          entry.chest,
        pool:
          resolved.pool
      };
    }
  }

  const selected =
    resolved.pool[
      resolved.pool.length - 1
    ];

  return selected
    ? {
        ok: true,
        slot:
          getSeasonalChestRewardBindingSlot(
            "season_pass:post"
          ),
        source:
          resolved.source,
        roll,
        selected,
        chest:
          selected.chest,
        pool:
          resolved.pool
      }
    : {
        ok: false,
        error:
          "SEASONAL_CHEST_REWARD_UNBOUND"
      };
}


export function resolveSeasonPassSeasonalChestReward(
  seasonContent,
  {
    tier = null,
    postPass = false,
    random = Math.random
  } = {}
) {
  if (postPass) {
    return rollSeasonPassPostSeasonalChestReward(
      seasonContent,
      random
    );
  }

  const key =
    `season_pass:tier:${Math.floor(
      Number(tier)
    )}`;

  return resolveSeasonalChestRewardBinding(
    seasonContent,
    key
  );
}
