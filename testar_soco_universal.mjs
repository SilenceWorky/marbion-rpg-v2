import fs from "node:fs";

import {
  BASIC_PUNCH_SKILL
} from "./src/systems/skills.js";

import {
  getSkillCooldownStatus,
  startSkillCooldown
} from "./src/systems/cooldown.js";


function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      `❌ ${message}`
    );
  }

  console.log(
    `✅ ${message}`
  );
}


console.log(
  "=== SOCO UNIVERSAL PVP ==="
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


assert(
  coordinator.includes(
    "slot === 5"
  ),
  "existe um quinto slot virtual exclusivo para o Soco"
);

assert(
  coordinator.includes(
    'rawSlot === "soco"'
  ),
  "!ataque soco é reconhecido pelo coordenador"
);

assert(
  coordinator.includes(
    "? 5"
  ),
  "Soco é normalizado internamente para o slot virtual 5"
);

assert(
  coordinator.includes(
    "skill:\n        BASIC_PUNCH_SKILL"
  ),
  "slot virtual 5 sempre resolve para BASIC_PUNCH_SKILL"
);

assert(
  attackRoute.includes(
    "!ataque 1-4 | !ataque soco"
  ),
  "rota de ataque documenta o comando !ataque soco"
);


assert(
  BASIC_PUNCH_SKILL.nome ===
    "Soco",
  "habilidade universal continua sendo Soco"
);

assert(
  Number(
    BASIC_PUNCH_SKILL.custoMentalidade
  ) === 0,
  "Soco custa 0 de Mentalidade"
);

assert(
  Number(
    BASIC_PUNCH_SKILL.cooldown
  ) === 0,
  "Soco possui cooldown 0"
);


const player = {
  skillCooldowns: {
    "teste:skill1": {
      availableAtTurn: 999
    },
    "teste:skill2": {
      availableAtTurn: 999
    },
    "teste:skill3": {
      availableAtTurn: 999
    },
    "teste:skill4": {
      availableAtTurn: 999
    }
  }
};

const punchAction = {
  skillId: null,
  skill: BASIC_PUNCH_SKILL,
  fallback: true,
  punch: true
};


const cooldownStatus =
  getSkillCooldownStatus(
    player,
    punchAction,
    10
  );

assert(
  cooldownStatus.ready === true &&
  cooldownStatus.turnsRemaining === 0,
  "Soco permanece disponível mesmo quando outras habilidades estão em cooldown"
);


const cooldownStart =
  startSkillCooldown(
    player,
    punchAction,
    10
  );

assert(
  cooldownStart.started === false,
  "usar Soco não inicia cooldown"
);


console.log(
  "\n🥊 TODOS OS TESTES DO SOCO UNIVERSAL PASSARAM."
);
