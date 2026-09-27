import assert from "node:assert/strict";

import {
  SKILL_RARITIES,
  LEGACY_SKILL_RARITY_TO_CANONICAL,
  SCROLL_RARITY_TO_SKILL_RARITY,
  getSkillRarityForScrollTier,
  normalizeLegacySkillRarity,
  normalizeSkillRarity,
  detectLegacySkillRarityScale,
  normalizeCatalogSkillRarity,
  isScrollEligibleSkillRarity
} from "./src/config/skill-rarities.js";


assert.deepEqual(
  Object.values(
    SKILL_RARITIES
  ),
  [
    "Comum",
    "Raro",
    "Super Raro",
    "Mítico",
    "Lendário",
    "Único"
  ]
);


assert.deepEqual(
  LEGACY_SKILL_RARITY_TO_CANONICAL,
  {
    Comum: "Comum",
    Incomum: "Raro",
    Raro: "Super Raro",
    "Muito Raro": "Mítico",
    Lendário: "Lendário",
    Especial: "Único"
  }
);


assert.deepEqual(
  SCROLL_RARITY_TO_SKILL_RARITY,
  {
    R1: "Comum",
    R2: "Raro",
    R3: "Super Raro",
    R4: "Mítico",
    R5: "Lendário"
  }
);


assert.equal(
  getSkillRarityForScrollTier(
    "r1"
  ),
  "Comum"
);

assert.equal(
  getSkillRarityForScrollTier(
    "R5"
  ),
  "Lendário"
);

assert.equal(
  getSkillRarityForScrollTier(
    "R6"
  ),
  null
);


for (
  const [
    source,
    expected
  ] of [
    ["Comum", "Comum"],
    ["Incomum", "Raro"],
    ["Raro", "Super Raro"],
    ["Muito Raro", "Mítico"],
    ["Lendário", "Lendário"],
    ["Especial", "Único"]
  ]
) {
  assert.equal(
    normalizeLegacySkillRarity(
      source
    ),
    expected
  );
}


for (
  const rarity of [
    "Comum",
    "Raro",
    "Super Raro",
    "Mítico",
    "Lendário",
    "Único"
  ]
) {
  assert.equal(
    normalizeSkillRarity(
      rarity
    ),
    rarity
  );
}


assert.equal(
  detectLegacySkillRarityScale([
    "Comum",
    "Incomum",
    "Raro"
  ]),
  true
);

assert.equal(
  detectLegacySkillRarityScale([
    "Comum",
    "Raro",
    "Super Raro"
  ]),
  false
);

assert.equal(
  normalizeCatalogSkillRarity(
    "Raro",
    {
      legacyScale: true
    }
  ),
  "Super Raro"
);

assert.equal(
  normalizeCatalogSkillRarity(
    "Raro",
    {
      legacyScale: false
    }
  ),
  "Raro"
);


for (
  const rarity of [
    "Comum",
    "Raro",
    "Super Raro",
    "Mítico",
    "Lendário"
  ]
) {
  assert.equal(
    isScrollEligibleSkillRarity(
      rarity
    ),
    true
  );
}

assert.equal(
  isScrollEligibleSkillRarity(
    "Único"
  ),
  false,
  "raridade Único fica fora da escala normal R1–R5"
);


console.log(
  "✅ Escala canônica de raridades e Pergaminhos R1–R5 validada."
);
