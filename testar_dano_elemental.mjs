import assert from "node:assert/strict";

import {
  ELEMENTAL_IMMUNITIES,
  applyElementalDamage,
  getElementalMatchup,
  getSingleElementMultiplier
} from "./src/systems/elemental-damage.js";

import {
  resolveOffensiveSkill
} from "./src/systems/combat.js";


function expectMultiplier(
  attack,
  defender,
  expected
) {
  assert.equal(
    getSingleElementMultiplier(
      attack,
      defender
    ),
    expected,
    `${attack} -> ${defender}`
  );
}


console.log("=== MATRIZ ELEMENTAL ===");

expectMultiplier(
  "Fogo",
  "Natureza",
  1.5
);

expectMultiplier(
  "Fogo",
  "Água",
  0.75
);

expectMultiplier(
  "Água",
  "Fogo",
  1.5
);

expectMultiplier(
  "Vento",
  "Fogo",
  1.5
);

expectMultiplier(
  "Som",
  "Sombra",
  1.5
);

expectMultiplier(
  "Lava",
  "Obsidiana",
  1.5
);

expectMultiplier(
  "Obsidiana",
  "Lava",
  0.75
);

console.log("✅ Vantagens e resistências principais corretas.");


const immunityPairs = [
  ["Terra", "Eletricidade"],
  ["Metal", "Veneno"],
  ["Sombra", "Psíquico"],
  ["Luz", "Matéria"],
  ["Obsidiana", "Fogo"],
  ["Espaço", "Som"],
  ["Plasma", "Veneno"]
];


for (
  const [immuneElement, blockedElement]
  of immunityPairs
) {
  expectMultiplier(
    blockedElement,
    immuneElement,
    0
  );

  expectMultiplier(
    immuneElement,
    blockedElement,
    2
  );
}

assert.equal(
  Object.keys(
    ELEMENTAL_IMMUNITIES
  ).length,
  7
);

console.log("✅ Todas as 7 imunidades aplicam 0x e devolvem 2x no sentido contrário.");


assert.equal(
  getSingleElementMultiplier(
    "Neutro",
    "Fogo"
  ),
  1
);

assert.equal(
  getSingleElementMultiplier(
    "Fogo",
    "Neutro"
  ),
  1
);

assert.equal(
  getSingleElementMultiplier(
    "Universal",
    "Terra"
  ),
  1
);

console.log("✅ Neutro e Universal permanecem 1x.");


const singularityTargets = [
  "Fogo",
  "Água",
  "Vento",
  "Terra",
  "Eletricidade",
  "Fluxo",
  "Cristal",
  "Som",
  "Natureza",
  "Gelo",
  "Psíquico",
  "Lava",
  "Sombra",
  "Luz",
  "Veneno",
  "Metal",
  "Tempo",
  "Espaço",
  "Gravidade",
  "Matéria",
  "Neutro",
  "Vidro",
  "Vapor",
  "Magnetismo",
  "Obsidiana",
  "Ilusão",
  "Ácido",
  "Plasma",
  "Radiação"
];

for (
  const element
  of singularityTargets
) {
  assert.equal(
    getSingleElementMultiplier(
      "Singularidade",
      element
    ),
    1,
    `Singularidade -> ${element}`
  );

  assert.equal(
    getSingleElementMultiplier(
      element,
      "Singularidade"
    ),
    1,
    `${element} -> Singularidade`
  );
}

console.log("✅ Singularidade é totalmente neutra nesta versão.");


const mixed =
  getElementalMatchup(
    "Fogo",
    [
      "Natureza",
      "Água"
    ]
  );

assert.equal(
  mixed.multiplier,
  1.125
);

assert.equal(
  mixed.immune,
  false
);

assert.equal(
  applyElementalDamage(
    40,
    mixed.multiplier
  ),
  45
);

console.log("✅ Elemento duplo multiplica relações: 1.5x × 0.75x = 1.125x.");


const doubleWeakness =
  getElementalMatchup(
    "Fogo",
    [
      "Natureza",
      "Gelo"
    ]
  );

assert.equal(
  doubleWeakness.multiplier,
  2.25
);

assert.equal(
  applyElementalDamage(
    40,
    doubleWeakness.multiplier
  ),
  90
);

console.log("✅ Dupla fraqueza permanece sem cap: 1.5x × 1.5x = 2.25x.");


const immunityDominates =
  getElementalMatchup(
    "Eletricidade",
    [
      "Terra",
      "Água"
    ]
  );

assert.equal(
  immunityDominates.multiplier,
  0
);

assert.equal(
  immunityDominates.immune,
  true
);

console.log("✅ Imunidade domina qualquer segundo elemento do defensor.");


console.log("\n=== INTEGRAÇÃO COM COMBAT.JS ===");

const attacker = {
  strength: 0,
  magicStrength: 0,
  speed: 0,
  accuracy: 100
};

const baseSkill = {
  nome: "Teste Elemental",
  tipo: "Elemental",
  elemento: "Fogo",
  escala: "magicStrength",
  dano: 40,
  precisao: 100,
  critChance: 5,
  critMultiplier: 1.5
};


const originalRandom =
  Math.random;

try {
  Math.random =
    () => 0;

  const strongHit =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Natureza"]
      },
      baseSkill
    );

  assert.equal(
    strongHit.hit,
    true
  );

  assert.equal(
    strongHit.damageBeforeElemental,
    40
  );

  assert.equal(
    strongHit.elementalMultiplier,
    1.5
  );

  assert.equal(
    strongHit.baseDamage,
    60
  );

  assert.equal(
    strongHit.damage,
    60
  );

  console.log("✅ Defesa → elemental: 40 vira 60 contra Natureza.");


  const resistedHit =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Água"]
      },
      baseSkill
    );

  assert.equal(
    resistedHit.elementalMultiplier,
    0.75
  );

  assert.equal(
    resistedHit.damage,
    30
  );

  console.log("✅ Resistência elemental reduz 40 para 30.");


  const immuneHit =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Obsidiana"]
      },
      baseSkill
    );

  assert.equal(
    immuneHit.hit,
    false
  );

  assert.equal(
    immuneHit.blockedByImmunity,
    true
  );

  assert.equal(
    immuneHit.elementalImmune,
    true
  );

  assert.equal(
    immuneHit.damage,
    0
  );

  assert.equal(
    immuneHit.critical,
    false
  );

  console.log("✅ Imunidade bloqueia dano e impede crítico/efeito ofensivo.");


  let rolls = [
    0,
    0.99
  ];

  Math.random =
    () => rolls.shift() ?? 0;

  const criticalStrong =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Natureza"]
      },
      baseSkill
    );

  assert.equal(
    criticalStrong.critical,
    true
  );

  assert.equal(
    criticalStrong.damageBeforeElemental,
    40
  );

  assert.equal(
    criticalStrong.baseDamage,
    60
  );

  assert.equal(
    criticalStrong.damage,
    90
  );

  console.log("✅ Ordem confirmada: 40 → elemental 60 → crítico 90.");
}
finally {
  Math.random =
    originalRandom;
}


console.log("\n💥 TODOS OS TESTES DO DANO ELEMENTAL PASSARAM.");
