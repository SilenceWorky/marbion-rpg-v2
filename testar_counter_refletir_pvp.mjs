import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getReflectableElements,
  matchReaction,
  splitReactionDamage,
  PHYSICAL_COUNTER_TYPE,
  ELEMENTAL_REFLECT_TYPE,
  ELEMENTAL_REFLECT_MENTALIDADE_COST,
  REACTION_DAMAGE_TAKEN_MULTIPLIER,
  REACTION_RETURN_DAMAGE_MULTIPLIER
} from "./src/systems/reactions.js";


const physicalCounter = {
  nome: "Contra-ataque",
  tipo: "Fisica",
  elemento: "Universal",
  dano: 0,
  reactionType:
    PHYSICAL_COUNTER_TYPE
};

const elementalReflect = {
  nome: "Refletir",
  tipo: "Elemental",
  elemento: "Universal",
  dano: 0,
  reactionType:
    ELEMENTAL_REFLECT_TYPE
};

const heavyAttack = {
  nome: "Ataque Pesado",
  tipo: "Fisica",
  elemento: "Universal",
  dano: 40
};

const fireAttack = {
  nome: "Chama",
  tipo: "Elemental",
  elemento: "Fogo",
  dano: 40
};

const waterAttack = {
  nome: "Jato",
  tipo: "Elemental",
  elemento: "Água",
  dano: 40
};


assert.equal(
  REACTION_DAMAGE_TAKEN_MULTIPLIER,
  0.5
);

assert.equal(
  REACTION_RETURN_DAMAGE_MULTIPLIER,
  0.5
);

assert.equal(
  ELEMENTAL_REFLECT_MENTALIDADE_COST,
  10
);


const physicalMatch =
  matchReaction(
    physicalCounter,
    heavyAttack,
    {
      reflectElements: []
    }
  );

assert.equal(
  physicalMatch.matched,
  true,
  "Contra-ataque físico deve reagir a ataque Físico direto."
);


assert.equal(
  matchReaction(
    physicalCounter,
    fireAttack,
    {
      reflectElements: [
        "Fogo"
      ]
    }
  ).matched,
  false,
  "Contra-ataque físico não deve reagir a ataque Elemental."
);


assert.equal(
  matchReaction(
    elementalReflect,
    fireAttack,
    {
      reflectElements: [
        "Fogo"
      ]
    }
  ).matched,
  true,
  "Refletir deve reagir a um Elemental pertencente ao personagem."
);


assert.equal(
  matchReaction(
    elementalReflect,
    waterAttack,
    {
      reflectElements: [
        "Fogo"
      ]
    }
  ).matched,
  false,
  "Refletir não deve reagir a um elemento que o personagem não possui."
);


const illusionElements =
  getReflectableElements({
    elements: [
      "Psíquico",
      "Luz"
    ]
  });

assert.ok(
  illusionElements.includes(
    "Ilusão"
  ),
  "Psíquico + Luz deve permitir refletir a fusão Ilusão."
);


assert.equal(
  matchReaction(
    elementalReflect,
    {
      nome: "Véu Ilusório",
      tipo: "Elemental",
      elemento: "Ilusão",
      dano: 30
    },
    {
      reflectElements:
        illusionElements
    }
  ).matched,
  true,
  "Uma fusão realmente desbloqueada deve poder ser refletida."
);


assert.equal(
  matchReaction(
    elementalReflect,
    elementalReflect,
    {
      reflectElements: [
        "Universal"
      ]
    }
  ).matched,
  false,
  "Refletir não pode disparar contra outro Refletir."
);


assert.deepEqual(
  splitReactionDamage(40),
  {
    rawDamage: 40,
    taken: 20,
    returned: 20
  }
);

assert.deepEqual(
  splitReactionDamage(35),
  {
    rawDamage: 35,
    taken: 18,
    returned: 17
  },
  "Dano ímpar deve ser dividido sem criar dano extra."
);


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
    "getReflectableElements"
  ),
  "PvP precisa capturar os elementos refletíveis no snapshot."
);

assert.ok(
  coordinator.includes(
    "__directDamageMultiplier"
  ),
  "PvP precisa reduzir o dano direto quando a reação combina."
);

assert.ok(
  coordinator.includes(
    "splitReactionDamage"
  ),
  "PvP precisa devolver 50% do dano ao atacante."
);

assert.ok(
  coordinator.includes(
    "reactionMatch.matched"
  ),
  "PvP precisa verificar compatibilidade antes de ativar a postura."
);

assert.ok(
  attackRoute.includes(
    "reaction_stance"
  ),
  "A rota de ataque precisa formatar a postura de reação."
);

assert.ok(
  attackRoute.includes(
    "formatReaction"
  ),
  "A rota de ataque precisa informar redução e devolução de dano."
);


assert.ok(
  coordinator.includes(
    "reactionAttempt"
  ),
  "PvP precisa expor quando uma postura foi preparada mas não ativou."
);

assert.ok(
  attackRoute.includes(
    "ELEMENT_NOT_OWNED"
  ),
  "A rota precisa explicar quando Refletir falha por elemento incompatível."
);

assert.ok(
  attackRoute.includes(
    "foi recebido normalmente"
  ),
  "A mensagem deve deixar explícito que o golpe incompatível não foi refletido."
);


console.log(
  "✅ Contra-ataque reage somente a dano Físico direto."
);
console.log(
  "✅ Refletir exige ataque Elemental do mesmo elemento do personagem."
);
console.log(
  "✅ Fusões desbloqueadas, como Ilusão, contam para Refletir."
);
console.log(
  "✅ Counter/Refletir dividem 50% recebido + 50% devolvido."
);
console.log(
  "✅ Refletir custa 10 de Mentalidade e Counter físico custa 0 pelo catálogo."
);
console.log(
  "✅ Integração do PvP contém snapshot, redução e devolução de dano."
);
console.log(
  "✅ Falhas de Counter/Refletir agora informam o motivo no chat."
);

console.log(
  "\n⚔️🪞 TODOS OS TESTES DE COUNTER E REFLETIR PASSARAM."
);
