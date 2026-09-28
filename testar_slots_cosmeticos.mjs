import assert from "node:assert/strict";

import {
  SEASON_COSMETIC_SLOT_DEFINITIONS,
  SEASON_COSMETIC_SLOTS,
  getSeasonCosmeticSlotDefinition,
  normalizeSeasonCosmeticSlot
} from "./src/config/cosmetic-slots.js";

import {
  SEASON_PASS_REWARDS
} from "./src/config/season-pass-rewards.js";


assert.deepEqual(
  SEASON_COSMETIC_SLOTS,
  [
    "hair",
    "accessory",
    "top",
    "bottom",
    "shoes"
  ]
);

assert.deepEqual(
  SEASON_COSMETIC_SLOT_DEFINITIONS
    .map(entry => entry.id),
  SEASON_COSMETIC_SLOTS
);

assert.equal(
  normalizeSeasonCosmeticSlot(
    " Shoes "
  ),
  "shoes"
);

assert.equal(
  normalizeSeasonCosmeticSlot(
    "hat"
  ),
  null
);

assert.equal(
  getSeasonCosmeticSlotDefinition(
    "bottom"
  )?.label,
  "Parte de baixo (calça, short, saia etc.)"
);

const passCosmeticSlots =
  SEASON_PASS_REWARDS
    .flatMap(
      tier =>
        tier.rewards
    )
    .filter(
      reward =>
        reward.type ===
        "season_cosmetic"
    )
    .map(
      reward =>
        reward.slot
    );

assert.deepEqual(
  passCosmeticSlots,
  [
    "accessory",
    "shoes",
    "bottom",
    "top",
    "hair"
  ]
);

for (
  const slot of
    passCosmeticSlots
) {
  assert.equal(
    normalizeSeasonCosmeticSlot(
      slot
    ),
    slot,
    `slot ${slot} do Passe precisa existir na taxonomia canônica`
  );
}


console.log(
  "OK: tipos canônicos de cosméticos alinhados ao Passe"
);
