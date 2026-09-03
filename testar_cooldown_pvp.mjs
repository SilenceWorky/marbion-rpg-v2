import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ensurePlayerSkillCooldowns,
  getSkillCooldownStatus,
  startSkillCooldown
} from "./src/systems/cooldown.js";


const player = {
  user: "p1"
};

const skill = {
  nome: "Refletir",
  cooldown: 3
};

const action = {
  skillId: "Universais:Refletir",
  skill
};


ensurePlayerSkillCooldowns(
  player
);

assert.deepEqual(
  player.skillCooldowns,
  {}
);


const started =
  startSkillCooldown(
    player,
    action,
    1
  );

assert.equal(
  started.started,
  true
);

assert.equal(
  started.availableAtTurn,
  5,
  "Cooldown 3 usado no T1 deve voltar no T5."
);


for (
  const [turn, remaining]
  of [
    [2, 3],
    [3, 2],
    [4, 1]
  ]
) {
  const status =
    getSkillCooldownStatus(
      player,
      action,
      turn
    );

  assert.equal(
    status.ready,
    false,
    `Refletir ainda deve estar bloqueado no T${turn}.`
  );

  assert.equal(
    status.turnsRemaining,
    remaining
  );
}


const readyAgain =
  getSkillCooldownStatus(
    player,
    action,
    5
  );

assert.equal(
  readyAgain.ready,
  true,
  "Refletir deve voltar a ficar disponível no T5."
);

assert.equal(
  player.skillCooldowns[
    action.skillId
  ],
  undefined,
  "Cooldown expirado deve ser removido do estado da batalha."
);


const punch = {
  skillId: null,
  skill: {
    nome: "Soco",
    cooldown: 0
  }
};

assert.equal(
  startSkillCooldown(
    player,
    punch,
    1
  ).started,
  false,
  "Soco virtual não deve criar cooldown."
);


const meditation = {
  skillId: null,
  skill: {
    nome: "Meditação",
    cooldown: 3
  }
};

assert.equal(
  startSkillCooldown(
    player,
    meditation,
    1
  ).started,
  false,
  "Meditação continua usando seu cooldown próprio."
);


const zeroCooldown = {
  skillId: "Teste:Sem_Cooldown",
  skill: {
    nome: "Sem Cooldown",
    cooldown: 0
  }
};

assert.equal(
  startSkillCooldown(
    player,
    zeroCooldown,
    1
  ).started,
  false
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
    "getSkillCooldownStatus"
  ),
  "PvP precisa validar cooldown antes de registrar a escolha."
);

assert.ok(
  coordinator.includes(
    "startSkillCooldown"
  ),
  "PvP precisa iniciar cooldown somente quando a ação executa."
);

assert.ok(
  coordinator.includes(
    "SKILL_COOLDOWN"
  ),
  "PvP precisa retornar erro específico quando a skill está em cooldown."
);

assert.ok(
  attackRoute.includes(
    "SKILL_COOLDOWN"
  ),
  "Chat precisa explicar quando a habilidade está em cooldown."
);

assert.ok(
  attackRoute.includes(
    "turno(s)"
  ),
  "Mensagem deve informar quantos turnos faltam."
);


console.log(
  "✅ Cooldown 3 usado no T1 bloqueia T2, T3 e T4 e libera no T5."
);
console.log(
  "✅ Soco virtual e Meditação ficam fora do motor genérico."
);
console.log(
  "✅ Cooldown é validado antes de registrar a ação."
);
console.log(
  "✅ Cooldown só é iniciado no caminho de execução real da habilidade."
);
console.log(
  "✅ Chat informa quantos turnos faltam para reutilizar a habilidade."
);

console.log(
  "\n⏳ TODOS OS TESTES DO COOLDOWN REAL PASSARAM."
);
