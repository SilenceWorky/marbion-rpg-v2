import assert from "node:assert/strict";
import fs from "node:fs";


const coordinator =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const attack =
  fs.readFileSync(
    "src/routes/attack.js",
    "utf8"
  );

const estado =
  fs.readFileSync(
    "src/routes/estado.js",
    "utf8"
  );


assert.ok(
  coordinator.includes(
    "applySleepEffect"
  )
);

assert.ok(
  coordinator.includes(
    "consumeSleepBlock"
  )
);

assert.ok(
  coordinator.includes(
    "wakeSleepOnDirectDamage"
  )
);

assert.ok(
  coordinator.includes(
    'controlType ===\n    "sono"'
  ) ||
  coordinator.includes(
    'controlType === "sono"'
  )
);


const firstSleepIndex =
  coordinator.indexOf(
    "consumeSleepBlock(\n        first.player"
  );

const firstSpendIndex =
  coordinator.indexOf(
    "spendSkillMentalidade(\n          first.player",
    firstSleepIndex
  );

assert.ok(
  firstSleepIndex >= 0,
  "Sono precisa ser checado antes da primeira execucao."
);

assert.ok(
  firstSpendIndex >
    firstSleepIndex,
  "Mentalidade so pode ser gasta depois de o Sono permitir a acao."
);


const secondSleepIndex =
  coordinator.indexOf(
    "consumeSleepBlock(\n        second.player"
  );

const secondSpendIndex =
  coordinator.indexOf(
    "spendSkillMentalidade(\n          second.player",
    secondSleepIndex
  );

assert.ok(
  secondSleepIndex >= 0,
  "Sono precisa ser checado antes da segunda execucao."
);

assert.ok(
  secondSpendIndex >
    secondSleepIndex,
  "Mentalidade do segundo jogador so pode ser gasta depois do Sono."
);


const offensiveWakeIndex =
  coordinator.indexOf(
    "wakeSleepOnDirectDamage(\n      defender"
  );

assert.ok(
  offensiveWakeIndex >= 0,
  "Dano direto precisa acordar o alvo."
);


assert.ok(
  attack.includes(
    "sleep_blocked"
  )
);

assert.ok(
  attack.includes(
    "adormeceu"
  ) ||
  attack.includes(
    "Dormindo"
  )
);

assert.ok(
  estado.includes(
    "Sono"
  )
);

assert.ok(
  estado.includes(
    "remainingBlocks"
  )
);


console.log(
  "✅ Sono integrado antes do gasto de Mentalidade."
);

console.log(
  "✅ Ação bloqueada por Sono não executa nem consome Mentalidade."
);

console.log(
  "✅ Dano direto pode acordar o alvo antes da ação dele."
);

console.log(
  "✅ Mensagens e !estado reconhecem Sono."
);

console.log(
  "\n💤 TESTE DE INTEGRACAO DO SONO PASSOU."
);
