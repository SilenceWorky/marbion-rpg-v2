import {
  SEASON_PASS_REWARDS
} from "./season-pass-rewards.js";


function freezeSlot(
  slot
) {
  return Object.freeze(
    slot
  );
}


const passTierSlots =
  SEASON_PASS_REWARDS
    .map(entry => {
      const rewards =
        entry.rewards.filter(
          reward =>
            reward.type ===
            "seasonal_chest"
        );

      if (
        rewards.length === 0
      ) {
        return null;
      }

      const quantity =
        rewards.reduce(
          (total, reward) =>
            total +
            Math.max(
              0,
              Math.floor(
                Number(
                  reward.quantity
                ) || 0
              )
            ),
          0
        );

      return freezeSlot({
        key:
          `season_pass:tier:${entry.tier}`,
        source:
          "season_pass",
        kind:
          "tier",
        tier:
          entry.tier,
        quantity,
        label:
          `Patamar ${entry.tier}`
      });
    })
    .filter(Boolean);


export const SEASONAL_CHEST_REWARD_BINDING_SLOTS =
  Object.freeze([
    ...passTierSlots,
    freezeSlot({
      key:
        "season_pass:post",
      source:
        "season_pass",
      kind:
        "post_pass",
      tier:
        null,
      quantity: 1,
      label:
        "Pós-passe"
    })
  ]);


const slotByKey =
  new Map(
    SEASONAL_CHEST_REWARD_BINDING_SLOTS
      .map(slot => [
        slot.key,
        slot
      ])
  );


export function getSeasonalChestRewardBindingSlot(
  key
) {
  return (
    slotByKey.get(
      String(key ?? "")
        .trim()
    ) ??
    null
  );
}


export function getSeasonPassSeasonalChestRewardSlots() {
  return [
    ...SEASONAL_CHEST_REWARD_BINDING_SLOTS
  ];
}
