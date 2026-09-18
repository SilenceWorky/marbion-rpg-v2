import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  getEligibleScrollRewardSkills,
  rollScrollRewardSkill
} from "./src/systems/scroll-reward-selector.js";


const skillsData = {
  Fogo: {
    Brasa_Comum: {
      nome: "Brasa Comum",
      raridade: "Comum",
      elemento: "Fogo"
    },

    Chama_Comum: {
      nome: "Chama Comum",
      raridade: "Comum",
      elemento: "Fogo"
    },

    Chama_Rara: {
      nome: "Chama Rara",
      raridade: "Raro",
      elemento: "Fogo"
    }
  },

  Luz: {
    Clarão_Comum: {
      nome: "Clarão Comum",
      raridade: "Comum",
      elemento: "Luz"
    }
  },

  Agua: {
    Onda_Comum: {
      nome: "Onda Comum",
      raridade: "Comum",
      elemento: "Água"
    },

    Onda_Super_Rara: {
      nome: "Onda Super Rara",
      raridade: "Super Raro",
      elemento: "Água"
    }
  },

  Universais: {
    Passo_Comum: {
      nome: "Passo Comum",
      raridade: "Comum",
      elemento: "Universal"
    }
  },

  Especial: {
    Destino_Unico: {
      nome: "Destino Único",
      raridade: "Único",
      elemento: "Fogo"
    }
  }
};


const fireProfile =
  createBaseProfile(
    "fogo"
  );

fireProfile.elements = [
  "Fogo"
];

fireProfile.skills = [
  "Fogo:Brasa_Comum"
];


const eligible =
  getEligibleScrollRewardSkills(
    fireProfile,
    skillsData,
    "R1"
  );

assert.equal(
  eligible.ok,
  true
);

assert.equal(
  eligible.skillRarity,
  "Comum"
);

assert.deepEqual(
  eligible.candidates.map(
    skill =>
      skill.id
  ),
  [
    "Fogo:Chama_Comum",
    "Luz:Clarão_Comum",
    "Universais:Passo_Comum"
  ],
  "deve excluir habilidade já possuída e elemento incompatível, mantendo afinidade e Universal"
);


const first =
  rollScrollRewardSkill(
    fireProfile,
    skillsData,
    "R1",
    () => 0
  );

assert.equal(
  first.ok,
  true
);

assert.equal(
  first.skill.id,
  "Fogo:Chama_Comum"
);


const last =
  rollScrollRewardSkill(
    fireProfile,
    skillsData,
    "R1",
    () => 0.999999
  );

assert.equal(
  last.ok,
  true
);

assert.equal(
  last.skill.id,
  "Universais:Passo_Comum"
);


const rare =
  rollScrollRewardSkill(
    fireProfile,
    skillsData,
    "R2",
    () => 0.5
  );

assert.equal(
  rare.ok,
  true
);

assert.equal(
  rare.skill.id,
  "Fogo:Chama_Rara"
);

assert.equal(
  rare.skill.raridade,
  "Raro"
);


const neutralProfile =
  createBaseProfile(
    "neutro"
  );

neutralProfile.elements = [
  "Neutro"
];

const neutral =
  rollScrollRewardSkill(
    neutralProfile,
    skillsData,
    "R3",
    () => 0
  );

assert.equal(
  neutral.ok,
  true
);

assert.equal(
  neutral.skill.id,
  "Agua:Onda_Super_Rara",
  "Neutro pode receber habilidade de qualquer elemento por pergaminho"
);


const exhausted =
  rollScrollRewardSkill(
    fireProfile,
    skillsData,
    "R4",
    () => 0
  );

assert.equal(
  exhausted.ok,
  false
);

assert.equal(
  exhausted.error,
  "SCROLL_REWARD_POOL_EXHAUSTED"
);


const invalid =
  rollScrollRewardSkill(
    fireProfile,
    skillsData,
    "R6",
    () => 0
  );

assert.equal(
  invalid.ok,
  false
);

assert.equal(
  invalid.error,
  "INVALID_SCROLL_TIER"
);


const uniqueEligible =
  getEligibleScrollRewardSkills(
    fireProfile,
    skillsData,
    "R5"
  );

assert.equal(
  uniqueEligible.ok,
  true
);

assert.equal(
  uniqueEligible.candidates.some(
    skill =>
      skill.raridade ===
      "Único"
  ),
  false,
  "Único nunca entra na escala normal R1–R5"
);


console.log(
  "✅ Sorteio de habilidade compatível para Pergaminhos R1–R5 validado."
);
