import fs from "node:fs";

const coordinatorPath =
  "src/durable/PvpCoordinator.js";

const attackRoutePath =
  "src/routes/attack.js";


function replaceExactlyOnce(
  content,
  before,
  after,
  label
) {
  const pieces =
    content.split(before);

  const occurrences =
    pieces.length - 1;


  if (occurrences !== 1) {
    throw new Error(
      `${label}: esperado 1 trecho para substituir, encontrado ${occurrences}.`
    );
  }


  return content.replace(
    before,
    after
  );
}


let coordinator =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

let attackRoute =
  fs.readFileSync(
    attackRoutePath,
    "utf8"
  );


if (
  coordinator.includes(
    "slot === 5"
  ) &&
  coordinator.includes(
    'rawSlot === "soco"'
  )
) {
  console.log(
    "ℹ️ Soco universal já parece estar integrado no PvpCoordinator."
  );
}

else {
  coordinator =
    replaceExactlyOnce(
      coordinator,
      `  const index =\n    slot - 1;`,
      `  /*\n   * Slot 5 é virtual e exclusivo do Soco.\n   *\n   * Ele NÃO pertence ao loadout 1-4,\n   * não pode ser trocado e fica sempre\n   * disponível como ação universal.\n   */\n  if (\n    slot === 5\n  ) {\n    return {\n      skillId: null,\n\n      skill:\n        BASIC_PUNCH_SKILL,\n\n      fallback: true,\n\n      punch: true\n    };\n  }\n\n\n  const index =\n    slot - 1;`,
      "PvpCoordinator: resolução do slot virtual de Soco"
    );


  coordinator =
    replaceExactlyOnce(
      coordinator,
      `    const normalizedSlot =\n      isMeditation\n        ? 0\n        : Number(slot);`,
      `    const isPunch =\n      rawSlot === "soco";\n\n\n    const normalizedSlot =\n      isMeditation\n        ? 0\n        : isPunch\n          ? 5\n          : Number(slot);`,
      "PvpCoordinator: normalização de !ataque soco"
    );


  coordinator =
    replaceExactlyOnce(
      coordinator,
      `      !isMeditation &&\n      (`,
      `      !isMeditation &&\n      !isPunch &&\n      (`,
      "PvpCoordinator: validação do Soco fora dos slots 1-4"
    );


  fs.writeFileSync(
    coordinatorPath,
    coordinator,
    "utf8"
  );
}


attackRoute =
  attackRoute.replace(
    "`@${user}, uso: !ataque 1-4`",
    "`@${user}, uso: !ataque 1-4 | !ataque soco`"
  );

attackRoute =
  attackRoute.replace(
    "`@${user}, escolha uma habilidade de 1 a 4.`",
    "`@${user}, escolha uma habilidade de 1 a 4 ou use !ataque soco.`"
  );


fs.writeFileSync(
  attackRoutePath,
  attackRoute,
  "utf8"
);


const finalCoordinator =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

const finalAttackRoute =
  fs.readFileSync(
    attackRoutePath,
    "utf8"
  );


const checks = [
  [
    finalCoordinator.includes(
      "slot === 5"
    ),
    "slot 5 virtual existe"
  ],

  [
    finalCoordinator.includes(
      'rawSlot === "soco"'
    ),
    "!ataque soco é reconhecido"
  ],

  [
    finalCoordinator.includes(
      "!isPunch &&"
    ),
    "validação permite Soco fora dos slots 1-4"
  ],

  [
    finalCoordinator.includes(
      "skill:\n        BASIC_PUNCH_SKILL"
    ),
    "slot 5 resolve para BASIC_PUNCH_SKILL"
  ],

  [
    finalAttackRoute.includes(
      "!ataque 1-4 | !ataque soco"
    ),
    "mensagem de uso foi atualizada"
  ]
];


for (
  const [ok, label]
  of checks
) {
  if (!ok) {
    throw new Error(
      `Falha de integração: ${label}.`
    );
  }

  console.log(
    `✅ ${label}`
  );
}


console.log(
  "\n🥊 SOCO UNIVERSAL INTEGRADO LOCALMENTE."
);
