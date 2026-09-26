import assert from "node:assert/strict";

import {
  getSeasonalFeaturedElements
} from "./src/systems/pvp-season-calendar.js";

import {
  normalizePvpSeasonContent
} from "./src/systems/pvp-season-content-store.js";

const BASE_2026 = [
  ["Luz", "Tempo", "Fogo"],
  ["Cristal", "Ilusão", "Radiação"],
  ["Eletricidade", "Som", "Vento"],
  ["Psíquico", "Sombra", "Neutro"],
  ["Natureza", "Terra", "Água"],
  ["Lava", "Plasma", "Metal"],
  ["Gelo", "Fluxo", "Gravidade"],
  ["Espaço", "Matéria", "Singularidade"],
  ["Vidro", "Vapor", "Magnetismo"],
  ["Veneno", "Ácido", "Obsidiana"],
  ["Água", "Fogo", "Vento"],
  ["Gelo", "Terra", "Natureza"]
];
function mod(value, divisor) {
  return (
    (value % divisor) +
    divisor
  ) % divisor;
}

for (
  let year = 2026;
  year <= 2040;
  year += 1
) {
  const displacement =
    year - 2026;

  for (
    let month = 1;
    month <= 12;
    month += 1
  ) {
    const baseIndex =
      mod(
        month - 1 - displacement,
        12
      );
    const actual =
      getSeasonalFeaturedElements(
        year,
        month
      );

    assert.deepEqual(
      actual,
      BASE_2026[baseIndex],
      `Rotação incorreta em ${year}-${String(month).padStart(2, "0")}`
    );

    assert.equal(
      actual.length,
      3
    );
  }
}

assert.deepEqual(
  getSeasonalFeaturedElements(
    2027,
    1
  ),
  ["Gelo", "Terra", "Natureza"]
);
assert.deepEqual(
  getSeasonalFeaturedElements(
    2027,
    2
  ),
  ["Luz", "Tempo", "Fogo"]
);

assert.deepEqual(
  getSeasonalFeaturedElements(
    2035,
    12
  ),
  ["Eletricidade", "Som", "Vento"]
);

assert.deepEqual(
  getSeasonalFeaturedElements(
    2040,
    1
  ),
  ["Água", "Fogo", "Vento"]
);

assert.deepEqual(
  getSeasonalFeaturedElements(
    2040,
    12
  ),
  ["Veneno", "Ácido", "Obsidiana"]
);

assert.equal(
  getSeasonalFeaturedElements(
    "ano-invalido",
    1
  ),
  null
);

const legacyContent =
  normalizePvpSeasonContent({
    year: 2027,
    month: 1,
    featuredElements: [
      "Elemento Manual",
    ],
    seasonalSkills: [],
  });

assert.deepEqual(
  legacyContent.featuredElements,
  ["Gelo", "Terra", "Natureza"],
  "Registro antigo não pode sobrescrever o trio canônico calculado."
);

console.log(
  "✅ Elementos sazonais: 180 meses de 2026 a 2040 seguem a rotação canônica."
);
