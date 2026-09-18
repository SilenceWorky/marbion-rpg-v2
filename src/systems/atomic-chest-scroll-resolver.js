import {
  rollScrollRewardSkill
} from "./scroll-reward-selector.js";


export function resolveAtomicChestScrollRewards(
  profile,
  pendingOpen,
  skillsData,
  random = Math.random
) {
  if (
    !pendingOpen ||
    typeof pendingOpen !== "object" ||
    Array.isArray(pendingOpen) ||
    !pendingOpen.rewardPlan ||
    !Array.isArray(
      pendingOpen.rewardPlan.rewards
    )
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_PENDING_OPEN"
    };
  }

  const rewards =
    pendingOpen.rewardPlan.rewards;

  const replacements = [];

  for (
    let index = 0;
    index < rewards.length;
    index += 1
  ) {
    const reward =
      rewards[index];

    if (
      reward?.type !== "scroll" ||
      reward?.resolved === true
    ) {
      continue;
    }

    const selected =
      rollScrollRewardSkill(
        profile,
        skillsData,
        reward.rarity,
        random
      );

    if (!selected.ok) {
      return {
        ...selected,
        rewardIndex:
          index
      };
    }

    replacements.push({
      index,
      reward: {
        ...structuredClone(
          reward
        ),
        resolved: true,
        scroll: {
          tier:
            selected.tier,
          skillRarity:
            selected.skillRarity,
          skill:
            structuredClone(
              selected.skill
            )
        }
      }
    });
  }

  /*
   * Só muta o plano depois de todos os pergaminhos terem
   * sido resolvidos com sucesso. Se um pool estiver vazio,
   * nenhum pergaminho anterior fica parcialmente congelado.
   */
  for (
    const replacement of
      replacements
  ) {
    rewards[
      replacement.index
    ] =
      replacement.reward;
  }

  pendingOpen.rewardPlan
    .hasUnresolvedRewards =
      rewards.some(
        reward =>
          reward?.resolved !== true
      );

  return {
    ok: true,
    resolvedIndexes:
      replacements.map(
        replacement =>
          replacement.index
      ),
    pendingOpen
  };
}
