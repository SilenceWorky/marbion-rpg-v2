import assert from "node:assert/strict";

import {
  applyElementalDamage,
  getElementalMatchup
} from "./src/systems/elemental-damage.js";

import {
  resolveOffensiveSkill
} from "./src/systems/combat.js";

import {
  matchReaction,
  splitReactionDamage,
  PHYSICAL_COUNTER_TYPE,
  ELEMENTAL_REFLECT_TYPE
} from "./src/systems/reactions.js";


const attacker = {
  strength: 0,
  magicStrength: 0,
  speed: 0,
  accuracy: 100
};


const originalRandom =
  Math.random;


function makeSkill({
  nome = "Teste",
  tipo = "Elemental",
  elemento = "Fogo",
  dano = 40,
  escala = "magicStrength",
  critChance = 0,
  critMultiplier = 1.5
} = {}) {
  return {
    nome,
    tipo,
    elemento,
    dano,
    escala,
    precisao: 100,
    critChance,
    critMultiplier
  };
}


try {
  console.log("=== HARDENING ELEMENTAL ===");


  const mixed =
    getElementalMatchup(
      "Fogo",
      ["Natureza", "Água"]
    );

  assert.equal(
    mixed.multiplier,
    1.125
  );

  assert.equal(
    applyElementalDamage(
      40,
      mixed.multiplier
    ),
    45
  );

  console.log("✅ Elemento duplo misto preserva 1.5x × 0.75x = 1.125x.");


  const doubleWeakness =
    getElementalMatchup(
      "Fogo",
      ["Natureza", "Gelo"]
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

  console.log("✅ Dupla fraqueza continua sem cap: 2.25x.");


  const doubleResistance =
    getElementalMatchup(
      "Fogo",
      ["Água", "Terra"]
    );

  assert.equal(
    doubleResistance.multiplier,
    0.5625
  );

  assert.equal(
    applyElementalDamage(
      40,
      doubleResistance.multiplier
    ),
    23
  );

  console.log("✅ Dupla resistência aplica 0.75x × 0.75x = 0.5625x.");


  const immunityDominates =
    getElementalMatchup(
      "Eletricidade",
      ["Terra", "Água"]
    );

  assert.equal(
    immunityDominates.immune,
    true
  );

  assert.equal(
    immunityDominates.multiplier,
    0
  );

  console.log("✅ Uma imunidade domina qualquer segundo elemento do defensor.");


  Math.random =
    () => 0;

  const immuneExecution =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Terra", "Água"]
      },
      makeSkill({
        elemento: "Eletricidade",
        critChance: 100
      })
    );

  assert.equal(
    immuneExecution.hit,
    false
  );

  assert.equal(
    immuneExecution.blockedByImmunity,
    true
  );

  assert.equal(
    immuneExecution.damage,
    0
  );

  assert.equal(
    immuneExecution.critical,
    false
  );

  console.log("✅ Imunidade continua impedindo dano e crítico mesmo com critChance 100%.");


  let rolls = [
    0,
    0.99
  ];

  Math.random =
    () => rolls.shift() ?? 0;

  const criticalDoubleWeakness =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Natureza", "Gelo"]
      },
      makeSkill({
        elemento: "Fogo",
        critChance: 5,
        critMultiplier: 1.5
      })
    );

  assert.equal(
    criticalDoubleWeakness.damageBeforeElemental,
    40
  );

  assert.equal(
    criticalDoubleWeakness.elementalMultiplier,
    2.25
  );

  assert.equal(
    criticalDoubleWeakness.baseDamage,
    90
  );

  assert.equal(
    criticalDoubleWeakness.critical,
    true
  );

  assert.equal(
    criticalDoubleWeakness.damage,
    135
  );

  console.log("✅ Ordem extrema correta: 40 → dupla fraqueza 90 → crítico 135.");


  assert.deepEqual(
    splitReactionDamage(
      criticalDoubleWeakness.damage
    ),
    {
      rawDamage: 135,
      taken: 68,
      returned: 67
    }
  );

  console.log("✅ Counter/Refletir conseguem dividir dano já modificado por elemento + crítico sem criar dano extra.");


  Math.random =
    () => 0;

  const physicalElementalSkill =
    makeSkill({
      nome: "Golpe de Terra",
      tipo: "Fisica",
      elemento: "Terra",
      dano: 40,
      escala: "strength"
    });

  const physicalElementalHit =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Eletricidade"]
      },
      physicalElementalSkill
    );

  assert.equal(
    physicalElementalHit.elementalMultiplier,
    2
  );

  assert.equal(
    physicalElementalHit.damage,
    80
  );


  const counterMatch =
    matchReaction(
      {
        nome: "Contra-ataque",
        tipo: "Fisica",
        elemento: "Universal",
        dano: 0,
        reactionType:
          PHYSICAL_COUNTER_TYPE
      },
      physicalElementalSkill,
      {
        reflectElements: []
      }
    );

  assert.equal(
    counterMatch.matched,
    true
  );


  const reflectMatch =
    matchReaction(
      {
        nome: "Refletir",
        tipo: "Elemental",
        elemento: "Universal",
        dano: 0,
        reactionType:
          ELEMENTAL_REFLECT_TYPE
      },
      physicalElementalSkill,
      {
        reflectElements: ["Terra"]
      }
    );

  assert.equal(
    reflectMatch.matched,
    false
  );

  console.log("✅ Golpe Físico revestido mantém matchup elemental, mas continua sendo Físico para Counter/Refletir.");


  const universalPhysical =
    resolveOffensiveSkill(
      attacker,
      {
        defense: 0,
        evasion: 0,
        elements: ["Terra", "Água"]
      },
      makeSkill({
        nome: "Ataque Pesado",
        tipo: "Fisica",
        elemento: "Universal",
        dano: 40,
        escala: "strength"
      })
    );

  assert.equal(
    universalPhysical.elementalMultiplier,
    1
  );

  assert.equal(
    universalPhysical.damage,
    40
  );

  console.log("✅ Ataques Universais/Físicos continuam neutros na matriz.");


  const singularityDual =
    getElementalMatchup(
      "Singularidade",
      ["Terra", "Água"]
    );

  assert.equal(
    singularityDual.multiplier,
    1
  );

  assert.equal(
    singularityDual.immune,
    false
  );

  console.log("✅ Singularidade permanece 1x até contra defensor de elemento duplo.");


  console.log("\n🛡️ HARDENING ELEMENTAL PASSOU.");
}
finally {
  Math.random =
    originalRandom;
}
