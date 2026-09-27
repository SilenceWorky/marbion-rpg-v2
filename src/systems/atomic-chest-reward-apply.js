import {
  getChestById
} from "./chest-inventory.js";

import {
  getAtomicChestState
} from "./atomic-chest-state.js";

import {
  addMoney
} from "./money.js";

import {
  addXp
} from "./progression.js";

import {
  addScrollToInventory
} from "./scroll-inventory.js";

import {
  addConsumableToInventory
} from "./consumable-inventory.js";


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
          "INVALID_ATOMIC_XP_REWARD"
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
          "INVALID_ATOMIC_MONEY_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "scroll"
  ) {
    if (
      !reward.scroll ||
      typeof reward.scroll !==
        "object" ||
      Array.isArray(
        reward.scroll
      ) ||
      !String(
        reward.scroll.tier ?? ""
      ).trim() ||
      !reward.scroll.skill ||
      typeof reward.scroll.skill !==
        "object" ||
      Array.isArray(
        reward.scroll.skill
      ) ||
      !String(
        reward.scroll.skill.id ?? ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_ATOMIC_SCROLL_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "consumable"
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
        reward.consumable.key ?? ""
      ).trim() ||
      !Number.isSafeInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      return {
        ok: false,
        error:
          "INVALID_ATOMIC_CONSUMABLE_REWARD"
      };
    }

    return {
      ok: true,
      applicable: true
    };
  }

  if (
    reward.type ===
      "title"
  ) {
    if (
      !reward.title ||
      typeof reward.title !==
        "object" ||
      Array.isArray(
        reward.title
      ) ||
      !String(
        reward.title.name ?? ""
      ).trim()
    ) {
      return {
        ok: false,
        error:
          "INVALID_ATOMIC_TITLE_REWARD"
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
      "UNSUPPORTED_RESOLVED_ATOMIC_REWARD",
    rewardType:
      reward.type ?? null
  };
}


export function applyResolvedAtomicChestRewards(
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

  const applied =
    new Set(
      plan.appliedRewardIndexes ||
      []
    );

  /*
   * Valida primeiro tudo que será aplicado. Assim, uma
   * recompensa resolvida mas ainda sem handler não causa
   * aplicação parcial de XP/dinheiro antes do erro.
   */
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
  const scrollRewards = [];
  const consumableRewards = [];
  const titleRewards = [];

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
        "scroll"
    ) {
      const delivered =
        addScrollToInventory(
          profile,
          {
            tier:
              reward.scroll.tier,
            skill:
              reward.scroll.skill,
            source:
              "atomic_chest",
            grantId:
              `atomic_chest:${found.chest.id}:reward:${index}`,
            createdAt:
              pendingOpen.createdAt
          }
        );

      if (!delivered.ok) {
        return delivered;
      }

      scrollRewards.push({
        index,
        duplicate:
          delivered.duplicate ===
          true,
        scroll:
          structuredClone(
            delivered.scroll
          )
      });
    }
    else if (
      reward.type ===
        "consumable"
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
                reward.consumable.key,
              name:
                reward.consumable.name,
              source:
                "atomic_chest",
              grantId:
                `atomic_chest:${found.chest.id}:reward:${index}:unit:${unit}`,
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
        "title"
    ) {
      if (
        !Array.isArray(
          profile.unlockedTags
        )
      ) {
        profile.unlockedTags = [];
      }

      const titleName =
        String(
          reward.title.name
        ).trim();

      const alreadyUnlocked =
        profile.unlockedTags
          .includes(
            titleName
          );

      if (!alreadyUnlocked) {
        profile.unlockedTags.push(
          titleName
        );
      }

      titleRewards.push({
        index,
        duplicate:
          alreadyUnlocked,
        title:
          structuredClone(
            reward.title
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

  const unresolvedIndexes =
    [];

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
    atoms:
      pendingOpen.atoms,
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
    scrollRewards,
    consumableRewards,
    titleRewards
  };
}
