import assert from "node:assert/strict";

import {
  BASE_CRITICAL_CHANCE,
  BASE_CRITICAL_MULTIPLIER,
  getSkillCriticalChance,
  getSkillCriticalMultiplier,
  applyCriticalDamage,
  resolveOffensiveSkill
} from "./src/systems/combat.js";


const attacker = {
  strength: 0,
  magicStrength: 0,
  accuracy: 90
};

const defender = {
  defense: 0,
  evasion: 0
};

const skill = {
  nome: "Golpe de Teste",
  dano: 40,
  precisao: 100,
  escala: "strength"
};


assert.equal(
  BASE_CRITICAL_CHANCE,
  5,
  "Chance-base de crítico deve ser 5%."
);

assert.equal(
  BASE_CRITICAL_MULTIPLIER,
  1.5,
  "Multiplicador-base de crítico deve ser 1.5x."
);

assert.equal(
  getSkillCriticalChance(
    skill
  ),
  5
);

assert.equal(
  getSkillCriticalMultiplier(
    skill
  ),
  1.5
);

assert.equal(
  applyCriticalDamage(
    40,
    1.5
  ),
  60,
  "40 de dano deve virar 60 em crítico 1.5x."
);

assert.equal(
  applyCriticalDamage(
    0,
    1.5
  ),
  0,
  "Dano zero nunca deve virar dano crítico."
);


const originalRandom =
  Math.random;

try {
  let rolls = [
    0,
    0.95
  ];

  Math.random =
    () =>
      rolls.shift() ?? 0;


  const criticalResult =
    resolveOffensiveSkill(
      attacker,
      defender,
      skill
    );


  assert.equal(
    criticalResult.hit,
    true
  );

  assert.equal(
    criticalResult.critical,
    true,
    "Roll de 95 deve critar com chance de 5%."
  );

  assert.equal(
    criticalResult.baseDamage,
    40
  );

  assert.equal(
    criticalResult.damage,
    60
  );


  rolls = [
    0,
    0.949
  ];

  Math.random =
    () =>
      rolls.shift() ?? 0;


  const nonCriticalResult =
    resolveOffensiveSkill(
      attacker,
      defender,
      skill
    );


  assert.equal(
    nonCriticalResult.hit,
    true
  );

  assert.equal(
    nonCriticalResult.critical,
    false,
    "Roll de 94.9 não deve critar em chance de 5%."
  );

  assert.equal(
    nonCriticalResult.damage,
    40
  );


  rolls = [
    0.999
  ];

  Math.random =
    () =>
      rolls.shift() ?? 0;


  const missResult =
    resolveOffensiveSkill(
      attacker,
      {
        ...defender,
        evasion: 96
      },
      {
        ...skill,
        precisao: 5
      }
    );


  assert.equal(
    missResult.hit,
    false
  );

  assert.equal(
    missResult.critical,
    false,
    "Ataque que erra nunca pode critar."
  );


  rolls = [
    0
  ];

  Math.random =
    () =>
      rolls.shift() ?? 0;


  const deterministicNormalHit =
    resolveOffensiveSkill(
      attacker,
      defender,
      skill
    );


  assert.equal(
    deterministicNormalHit.hit,
    true
  );

  assert.equal(
    deterministicNormalHit.critical,
    false,
    "Math.random = 0 deve continuar gerando acerto normal nos testes antigos."
  );


  rolls = [
    0
  ];

  Math.random =
    () =>
      rolls.shift() ?? 0;


  const forcedCritical =
    resolveOffensiveSkill(
      attacker,
      defender,
      {
        ...skill,
        critChance: 100,
        critMultiplier: 2
      }
    );


  assert.equal(
    forcedCritical.critical,
    true,
    "Skill futura com critChance 100 deve sempre critar após acertar."
  );

  assert.equal(
    forcedCritical.damage,
    80,
    "critMultiplier individual deve poder substituir o padrão."
  );
}
finally {
  Math.random =
    originalRandom;
}


console.log(
  "✅ Chance-base de crítico: 5%."
);
console.log(
  "✅ Multiplicador-base: 1.5x no dano direto."
);
console.log(
  "✅ Crítico só é sorteado depois que o golpe acerta."
);
console.log(
  "✅ Dano zero não critica."
);
console.log(
  "✅ Faixa crítica 95-100 preserva RNG = 0 dos testes antigos."
);
console.log(
  "✅ Estrutura aceita critChance/critMultiplier por habilidade no futuro."
);
console.log(
  "\n⏳ TESTES BASE DO CRÍTICO PASSARAM."
);
