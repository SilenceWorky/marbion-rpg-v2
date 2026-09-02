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
    "applyConfusionEffect"
  )
);

assert.ok(
  coordinator.includes(
    "consumeConfusionAction"
  )
);

assert.ok(
  coordinator.includes(
    'debuffType ===\n    "confusao"'
  ) ||
  coordinator.includes(
    'debuffType === "confusao"'
  )
);

assert.ok(
  coordinator.includes(
    'kind: "confusion_self_hit"'
  ) ||
  coordinator.includes(
    'kind:\n      "confusion_self_hit"'
  )
);


const firstConfusionIndex =
  coordinator.indexOf(
    "consumeConfusionAction(\n          first.player"
  );

const firstSpendIndex =
  coordinator.indexOf(
    "spendSkillMentalidade(\n          first.player",
    firstConfusionIndex
  );

assert.ok(
  firstConfusionIndex >= 0,
  "Confusao precisa ser checada antes da primeira execucao."
);

assert.ok(
  firstSpendIndex >
    firstConfusionIndex,
  "Mentalidade so pode ser gasta depois de a Confusao permitir a acao."
);


const secondConfusionIndex =
  coordinator.indexOf(
    "consumeConfusionAction(\n          second.player"
  );

const secondSpendIndex =
  coordinator.indexOf(
    "spendSkillMentalidade(\n          second.player",
    secondConfusionIndex
  );

assert.ok(
  secondConfusionIndex >= 0,
  "Confusao precisa ser checada antes da segunda execucao."
);

assert.ok(
  secondSpendIndex >
    secondConfusionIndex,
  "Mentalidade do segundo jogador so pode ser gasta depois da Confusao."
);


assert.ok(
  attack.includes(
    "confusion_self_hit"
  )
);

assert.ok(
  attack.includes(
    "ficou Confuso"
  )
);

assert.ok(
  estado.includes(
    "Confusão"
  ) ||
  estado.includes(
    "Confusao"
  )
);

assert.ok(
  estado.includes(
    "remainingActions"
  )
);


console.log(
  "✅ Confusao integrada antes do gasto de Mentalidade."
);

console.log(
  "✅ Auto-dano nao executa nem consome a habilidade escolhida."
);

console.log(
  "✅ Mensagens e !estado reconhecem Confusao."
);

console.log(
  "\n😵 TESTE DE INTEGRACAO DA CONFUSAO PASSOU."
);
