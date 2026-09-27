import assert from "node:assert/strict";

import {
  SKILL_RARITIES
} from "./src/config/skill-rarities.js";

import {
  normalizeSeasonalSkills
} from "./src/routes/api-admin-seasons.js";

import {
  normalizePvpSeasonContent
} from "./src/systems/pvp-season-content-store.js";


const allowedElements = [
  "Luz",
  "Tempo",
  "Fogo"
];

for (
  const rarity of
    Object.values(
      SKILL_RARITIES
    )
) {
  const result =
    normalizeSeasonalSkills(
      [
        {
          id: `raridade-${rarity}`,
          element: "Fogo",
          name: "Habilidade teste",
          rarity,
          baseDamage: 10,
          effect: null,
          description: null
        }
      ],
      allowedElements
    );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.value[0].rarity,
    rarity
  );
}

const missing =
  normalizeSeasonalSkills(
    [
      {
        id: "sem-raridade",
        element: "Luz",
        name: "Sem raridade",
        baseDamage: 10
      }
    ],
    allowedElements
  );

assert.equal(
  missing.ok,
  false
);

assert.equal(
  missing.error,
  "INVALID_SEASON_SKILL"
);


const legacy =
  normalizeSeasonalSkills(
    [
      {
        id: "raridade-legada",
        element: "Tempo",
        name: "Legada",
        rarity: "Especial",
        baseDamage: 10
      }
    ],
    allowedElements
  );

assert.equal(
  legacy.ok,
  false
);

assert.equal(
  legacy.error,
  "INVALID_SEASON_SKILL"
);


const stored =
  normalizePvpSeasonContent({
    year: 2026,
    month: 9,
    seasonalSkills: [
      {
        id: "armazenada",
        element: "Vidro",
        name: "Corte de Vidro",
        rarity: "Mítico",
        baseDamage: 30
      },
      {
        id: "legado-sem-raridade",
        element: "Vapor",
        name: "Névoa Antiga",
        baseDamage: 5
      }
    ]
  });

assert.equal(
  stored.seasonalSkills[0].rarity,
  "Mítico"
);

assert.equal(
  stored.seasonalSkills[1].rarity,
  null
);

console.log(
  "✅ Raridades das habilidades sazonais validadas."
);
