import assert from "node:assert/strict";

import {
  SEASONAL_SKILL_EFFECTS,
  normalizeSeasonalSkillEffect
} from "./src/config/seasonal-skill-effects.js";

import {
  normalizePvpSeasonContent
} from "./src/systems/pvp-season-content-store.js";

const expected = [
  "Cegueira",
  "Sono",
  "Confusão",
  "Silêncio",
  "Lentidão",
  "Paralisia",
  "Congelamento",
  "Atordoamento",
  "Veneno",
  "Queimadura",
  "Sangramento",
  "Molhado",
  "Eletrocussão",
  "Evaporação",
  "Cura",
  "Recuperação de Mentalidade",
  "Contra-ataque",
  "Reflexão",
  "Buff de Força",
  "Buff de Força Mágica",
  "Buff de Velocidade",
  "Buff de Evasão",
  "Buff de Precisão",
  "Buff de Defesa",
  "Debuff de Força",
  "Debuff de Força Mágica",
  "Debuff de Velocidade",
  "Debuff de Evasão",
  "Debuff de Precisão",
  "Debuff de Defesa"
];

assert.deepEqual(
  [...SEASONAL_SKILL_EFFECTS],
  expected
);

assert.equal(
  SEASONAL_SKILL_EFFECTS.length,
  30
);

for (const effect of expected) {
  assert.equal(
    normalizeSeasonalSkillEffect(effect),
    effect
  );
}

assert.equal(
  normalizeSeasonalSkillEffect(null),
  null
);

assert.equal(
  normalizeSeasonalSkillEffect(""),
  null
);

assert.equal(
  normalizeSeasonalSkillEffect(
    "efeito inventado"
  ),
  undefined
);

const withoutEffect =
  normalizePvpSeasonContent({
    year: 2026,
    month: 1,
    seasonalSkills: [
      {
        id: "sem-efeito",
        element: "Luz",
        name: "Teste sem efeito",
        baseDamage: 10,
        description: null
      }
    ]
  });

assert.equal(
  withoutEffect.seasonalSkills[0].effect,
  null
);

const withEffect =
  normalizePvpSeasonContent({
    year: 2026,
    month: 1,
    seasonalSkills: [
      {
        id: "com-efeito",
        element: "Fogo",
        name: "Teste queimadura",
        baseDamage: 20,
        effect: "Queimadura",
        description: null
      }
    ]
  });

assert.equal(
  withEffect.seasonalSkills[0].effect,
  "Queimadura"
);

console.log(
  "✅ Os 30 efeitos sazonais canônicos, Sem efeito e compatibilidade de dados foram validados."
);
