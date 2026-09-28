import {
  getChestById
} from "./chest-inventory.js";

import {
  getSeasonalChestState
} from "./seasonal-chest-state.js";

import {
  addMoney
} from "./money.js";

import {
  addXp
} from "./progression.js";

import {
  learnResolvedSkillReward,
  playerHasSkill
} from "./skill-learning.js";

import {
  addConsumableToInventory
} from "./consumable-inventory.js";

import {
  grantPvpFinisher
} from "./pvp-finisher-collection.js";

import {
  grantVictoryMessage
} from "./victory-message-collection.js";

import {
  grantCosmetic
} from "./cosmetic-collection.js";


function validateResolvedReward(
  reward
) {
  if (
    !reward ||
    reward.resolved !== true
  ) {
    return {
      ok: true,
      applicable: false
    };
  }

  if (
    reward.type ===
      "normal_xp"
  ) {
    const amount =
      Number(
        reward.amount
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_XP_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "money"
  ) {
    if (
      !reward.money ||
      typeof reward.money !==
        "object" ||
      Array.isArray(
        reward.money
      )
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_MONEY_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "seasonal_consumable"
  ) {
    const quantity =
      reward.quantity ?? 1;

    if (
      !reward.consumable ||
      typeof reward.consumable !==
        "object" ||
      Array.isArray(
        reward.consumable
      ) ||
      !String(
        reward.consumable.key ??
        reward.consumable.id ??
        ""
      ).trim() ||
      !Number.isSafeInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CONSUMABLE_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "seasonal_pvp_finisher"
  ) {
    if (
      !reward.finisher ||
      typeof reward.finisher !==
        "object" ||
      Array.isArray(
        reward.finisher
      ) ||
      !String(
        reward.finisher.id ?? ""
      ).trim() ||
      !String(
        reward.finisher.name ?? ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_PVP_FINISHER_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "seasonal_victory_message"
  ) {
    if (
      !reward.message ||
      typeof reward.message !==
        "object" ||
      Array.isArray(
        reward.message
      ) ||
      !String(
        reward.message.id ?? ""
      ).trim() ||
      !String(
        reward.message.text ?? ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_VICTORY_MESSAGE_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "seasonal_cosmetic"
  ) {
    if (
      !reward.cosmetic ||
      typeof reward.cosmetic !==
        "object" ||
      Array.isArray(
        reward.cosmetic
      ) ||
      !String(
        reward.cosmetic.id ?? ""
      ).trim() ||
      !String(
        reward.cosmetic.name ?? ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_COSMETIC_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "seasonal_skill"
  ) {
    if (
      !reward.skill ||
      typeof reward.skill !==
        "object" ||
      Array.isArray(
        reward.skill
      ) ||
      !String(
        reward.skill.id ?? ""
      ).trim() ||
      !String(
        reward.skill.element ??
        reward.skill.elemento ??
        ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_SKILL_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  return {
    ok: false,
    error:
      "UNSUPPORTED_RESOLVED_SEASONAL_REWARD",
    rewardType:
      reward.type ?? null
  };
}


export function applyResolvedSeasonalChestRewards(
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

  const seasonal =
    getSeasonalChestState(
      found.chest
    );

  if (!seasonal.ok) {
    return seasonal;
  }

  const pendingOpen =
    found.chest?.metadata
      ?.seasonal
      ?.pendingOpen;

  if (
    !pendingOpen ||
    typeof pendingOpen !== "object" ||
    Array.isArray(pendingOpen)
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_NOT_PENDING_OPEN"
    };
  }

  if (
    pendingOpen.seasonId !==
      seasonal.state.seasonId ||
    pendingOpen.seasonalChestId !==
      seasonal.state.seasonalChestId ||
    Number(
      pendingOpen.chestOrder
    ) !==
      Number(
        seasonal.state.chestOrder
      ) ||
    Number(
      pendingOpen.poolRevision
    ) !==
      Number(
        seasonal.state.poolRevision
      )
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_PENDING_IDENTITY_MISMATCH"
    };
  }

  const plan =
    pendingOpen.rewardPlan;

  if (
    !plan ||
    !Array.isArray(
      plan.rewards
    )
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_REWARD_PLAN"
    };
  }

  const applied =
    new Set(
      Array.isArray(
        plan.appliedRewardIndexes
      )
        ? plan.appliedRewardIndexes
        : []
    );

  for (
    let index = 0;
    index <
      plan.rewards.length;
    index += 1
  ) {
    if (applied.has(index)) {
      continue;
    }

    const checked =
      validateResolvedReward(
        plan.rewards[index]
      );

    if (!checked.ok) {
      return checked;
    }
  }

  const appliedNow = [];
  const xpResults = [];
  const moneyRewards = [];
  const consumableRewards = [];
  const abilityRewards = [];
  const pvpFinisherRewards = [];
  const victoryMessageRewards = [];
  const cosmeticRewards = [];

  for (
    let index = 0;
    index <
      plan.rewards.length;
    index += 1
  ) {
    if (applied.has(index)) {
      continue;
    }

    const reward =
      plan.rewards[index];

    if (
      reward?.resolved !== true
    ) {
      continue;
    }

    if (
      reward.type ===
        "normal_xp"
    ) {
      const result =
        addXp(
          profile,
          reward.amount
        );

      xpResults.push(
        result
      );
    }
    else if (
      reward.type ===
        "money"
    ) {
      profile.money =
        addMoney(
          profile.money,
          reward.money
        );

      moneyRewards.push(
        structuredClone(
          reward.money
        )
      );
    }
    else if (
      reward.type ===
        "seasonal_consumable"
    ) {
      const quantity =
        reward.quantity ?? 1;

      for (
        let unit = 0;
        unit < quantity;
        unit += 1
      ) {
        const delivered =
          addConsumableToInventory(
            profile,
            {
              key:
                reward.consumable.key ??
                reward.consumable.id,
              name:
                reward.consumable.name,
              source:
                "seasonal_chest",
              grantId:
                `seasonal_chest:${found.chest.id}:reward:${index}:unit:${unit}`,
              createdAt:
                pendingOpen.createdAt
            }
          );

        if (!delivered.ok) {
          return delivered;
        }

        consumableRewards.push({
          index,
          unit,
          duplicate:
            delivered.duplicate ===
            true,
          consumable:
            structuredClone(
              delivered.consumable
            )
        });
      }
    }
    else if (
      reward.type ===
        "seasonal_pvp_finisher"
    ) {
      if (
        reward.seasonId !==
          pendingOpen.seasonId ||
        reward.seasonalChestId !==
          pendingOpen.seasonalChestId ||
        Number(reward.chestOrder) !==
          Number(pendingOpen.chestOrder) ||
        Number(reward.poolRevision) !==
          Number(pendingOpen.poolRevision)
      ) {
        return {
          ok: false,
          error:
            "SEASONAL_PVP_FINISHER_REWARD_IDENTITY_MISMATCH"
        };
      }

      const delivered =
        grantPvpFinisher(
          profile,
          {
            seasonId:
              pendingOpen.seasonId,
            finisherId:
              reward.finisher.id,
            name:
              reward.finisher.name,
            description:
              reward.finisher.description,
            source:
              "seasonal_chest",
            seasonalChestId:
              pendingOpen.seasonalChestId,
            chestOrder:
              pendingOpen.chestOrder,
            poolRevision:
              pendingOpen.poolRevision,
            acquiredAt:
              pendingOpen.createdAt
          }
        );

      if (!delivered.ok) {
        return delivered;
      }

      pvpFinisherRewards.push({
        index,
        duplicate:
          delivered.duplicate === true,
        finisher:
          structuredClone(
            delivered.finisher
          )
      });
    }
    else if (
      reward.type ===
        "seasonal_victory_message"
    ) {
      if (
        reward.seasonId !==
          pendingOpen.seasonId ||
        reward.seasonalChestId !==
          pendingOpen.seasonalChestId ||
        Number(reward.chestOrder) !==
          Number(pendingOpen.chestOrder) ||
        Number(reward.poolRevision) !==
          Number(pendingOpen.poolRevision)
      ) {
        return {
          ok: false,
          error:
            "SEASONAL_VICTORY_MESSAGE_REWARD_IDENTITY_MISMATCH"
        };
      }

      const delivered =
        grantVictoryMessage(
          profile,
          {
            seasonId:
              pendingOpen.seasonId,
            messageId:
              reward.message.id,
            text:
              reward.message.text,
            source:
              "seasonal_chest",
            seasonalChestId:
              pendingOpen.seasonalChestId,
            chestOrder:
              pendingOpen.chestOrder,
            poolRevision:
              pendingOpen.poolRevision,
            acquiredAt:
              pendingOpen.createdAt
          }
        );

      if (!delivered.ok) {
        return delivered;
      }

      victoryMessageRewards.push({
        index,
        duplicate:
          delivered.duplicate === true,
        message:
          structuredClone(
            delivered.message
          )
      });
    }
    else if (
      reward.type ===
        "seasonal_cosmetic"
    ) {
      if (
        reward.seasonId !==
          pendingOpen.seasonId ||
        reward.seasonalChestId !==
          pendingOpen.seasonalChestId ||
        Number(reward.chestOrder) !==
          Number(pendingOpen.chestOrder) ||
        Number(reward.poolRevision) !==
          Number(pendingOpen.poolRevision)
      ) {
        return {
          ok: false,
          error:
            "SEASONAL_COSMETIC_REWARD_IDENTITY_MISMATCH"
        };
      }

      const delivered =
        grantCosmetic(
          profile,
          {
            seasonId:
              pendingOpen.seasonId,
            cosmeticId:
              reward.cosmetic.id,
            name:
              reward.cosmetic.name,
            slot:
              reward.cosmetic.slot,
            source:
              "seasonal_chest",
            seasonalChestId:
              pendingOpen.seasonalChestId,
            chestOrder:
              pendingOpen.chestOrder,
            poolRevision:
              pendingOpen.poolRevision,
            acquiredAt:
              pendingOpen.createdAt
          }
        );

      if (!delivered.ok) {
        return delivered;
      }

      cosmeticRewards.push({
        index,
        duplicate:
          delivered.duplicate === true,
        cosmetic:
          structuredClone(
            delivered.cosmetic
          )
      });
    }
    else if (
      reward.type ===
        "seasonal_skill"
    ) {
      const learnedSkill = {
        ...structuredClone(
          reward.skill
        ),
        elemento:
          reward.skill.elemento ??
          reward.skill.element
      };

      const alreadyLearned =
        playerHasSkill(
          profile,
          learnedSkill.id
        );

      if (!alreadyLearned) {
        const learned =
          learnResolvedSkillReward(
            profile,
            learnedSkill,
            {
              source:
                "seasonal_chest"
            }
          );

        if (!learned.ok) {
          return learned;
        }
      }

      abilityRewards.push({
        index,
        duplicate:
          alreadyLearned,
        skill:
          structuredClone(
            reward.skill
          )
      });
    }

    applied.add(index);
    appliedNow.push(index);
  }

  plan.appliedRewardIndexes =
    Array.from(
      applied
    ).sort(
      (left, right) =>
        left - right
    );

  const unresolvedIndexes = [];

  for (
    let index = 0;
    index <
      plan.rewards.length;
    index += 1
  ) {
    if (
      plan.rewards[index]
        ?.resolved !== true
    ) {
      unresolvedIndexes.push(
        index
      );
    }
  }

  return {
    ok: true,
    chestId:
      found.chest.id,
    seasonId:
      seasonal.state.seasonId,
    seasonalChestId:
      seasonal.state.seasonalChestId,
    chestOrder:
      seasonal.state.chestOrder,
    poolRevision:
      seasonal.state.poolRevision,
    appliedNow,
    appliedRewardIndexes:
      [
        ...plan.appliedRewardIndexes
      ],
    unresolvedIndexes,
    fullyResolved:
      unresolvedIndexes.length ===
      0,
    xpResults,
    moneyRewards,
    consumableRewards,
    abilityRewards,
    pvpFinisherRewards,
    victoryMessageRewards,
    cosmeticRewards
  };
}
