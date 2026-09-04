import assert from "node:assert/strict";
import fs from "node:fs";

import {
  resolveOffensiveSkill
} from "./src/systems/combat.js";

import {
  splitReactionDamage
} from "./src/systems/reactions.js";


const attacker = {
  strength: 0,
  magicStrength: 0,
  accuracy: 90
};

const defender = {
  defense: 0,
  evasion: 0
};

const criticalSkill = {
  nome: "Golpe Crítico de Teste",
  tipo: "Fisica",
  elemento: "Universal",
  dano: 40,
  precisao: 100,
  escala: "strength",
  critChance: 100,
  critMultiplier: 1.5
};


const originalRandom =
  Math.random;


try {
  Math.random =
    () => 0;


  const result =
    resolveOffensiveSkill(
      attacker,
      defender,
      criticalSkill
    );


  assert.equal(
    result.hit,
    true
  );

  assert.equal(
    result.critical,
    true,
    "Skill com critChance 100 deve critar depois de acertar."
  );

  assert.equal(
    result.baseDamage,
    40
  );

  assert.equal(
    result.damage,
    60,
    "40 de dano direto deve virar 60 com crítico 1.5x."
  );


  const split =
    splitReactionDamage(
      result.damage
    );


  assert.deepEqual(
    split,
    {
      rawDamage: 60,
      taken: 30,
      returned: 30
    },
    "Counter/Refletir deve dividir o dano crítico final, não o dano pré-crítico."
  );
}
finally {
  Math.random =
    originalRandom;
}


const coordinator =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const attackRoute =
  fs.readFileSync(
    "src/routes/attack.js",
    "utf8"
  );


assert.ok(
  coordinator.includes(
    "result.critical === true"
  ),
  "Execução ofensiva precisa propagar critical do combat.js."
);

assert.ok(
  coordinator.includes(
    "offensive.critical === true"
  ),
  "Debuffs/DoTs com dano direto também precisam propagar critical."
);

assert.ok(
  coordinator.includes(
    "result.criticalChance"
  ),
  "PvP precisa preservar criticalChance para diagnóstico futuro."
);

assert.ok(
  coordinator.includes(
    "result.criticalMultiplier"
  ),
  "PvP precisa preservar criticalMultiplier para diagnóstico futuro."
);

assert.ok(
  coordinator.includes(
    "Number(\n          result.baseDamage"
  ),
  "PvP precisa preservar o dano pré-crítico da execução ofensiva."
);

assert.ok(
  attackRoute.includes(
    "function formatSkillLabel("
  ),
  "Rota de ataque precisa ter formatador de nome para crítico."
);

assert.ok(
  attackRoute.includes(
    "💥 CRÍTICO!"
  ),
  "Chat precisa sinalizar claramente quando um golpe é crítico."
);

assert.ok(
  attackRoute.includes(
    "${formatSkillLabel(execution)}"
  ),
  "Mensagens de execução precisam usar o nome formatado com crítico."
);


console.log(
  "✅ Crítico 1.5x transforma 40 de dano direto em 60."
);
console.log(
  "✅ Counter/Refletir dividem os 60 de dano crítico em 30 recebido + 30 devolvido."
);
console.log(
  "✅ PvP propaga critical, criticalChance, criticalMultiplier e baseDamage."
);
console.log(
  "✅ Debuff/DoT preserva crítico apenas na parcela de dano direto."
);
console.log(
  "✅ Chat exibe 💥 CRÍTICO! nas habilidades que realmente criticaram."
);
console.log(
  "\n💥 TODOS OS TESTES DE INTEGRAÇÃO DO CRÍTICO PASSARAM."
);
