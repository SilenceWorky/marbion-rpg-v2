import fs from "node:fs";

const coordinatorPath =
  "src/durable/PvpCoordinator.js";

const attackPath =
  "src/routes/attack.js";


function replaceExactOrIntegrated(
  text,
  oldText,
  newText,
  integratedMarker,
  label
) {
  if (
    text.includes(
      integratedMarker
    )
  ) {
    console.log(
      `↪ ${label}: já integrado.`
    );

    return {
      text,
      changed: false
    };
  }


  const occurrences =
    text.split(
      oldText
    ).length - 1;


  if (
    occurrences !== 1
  ) {
    throw new Error(
      `${label}: esperado exatamente 1 trecho para substituir, encontrado ${occurrences}.`
    );
  }


  return {
    text:
      text.replace(
        oldText,
        newText
      ),

    changed: true
  };
}


let coordinator =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

let coordinatorChanged =
  false;


{
  const result =
    replaceExactOrIntegrated(
      coordinator,

`      hitChance:
        result.hitChance,

      rawDamage:
        0,`,

`      hitChance:
        result.hitChance,

      critical:
        false,

      criticalChance:
        result.criticalChance,

      criticalMultiplier:
        result.criticalMultiplier,

      baseDamage:
        0,

      rawDamage:
        0,`,

`      criticalChance:
        result.criticalChance,`,

      "executeOffensiveAction / erro"
    );

  coordinator =
    result.text;

  coordinatorChanged ||= 
    result.changed;
}


{
  const result =
    replaceExactOrIntegrated(
      coordinator,

`    hitChance:
      result.hitChance,

    rawDamage,`,

`    hitChance:
      result.hitChance,

    critical:
      result.critical === true,

    criticalChance:
      result.criticalChance,

    criticalMultiplier:
      result.criticalMultiplier,

    baseDamage:
      Math.max(
        0,
        Number(
          result.baseDamage
        ) || 0
      ),

    rawDamage,`,

`    critical:
      result.critical === true,`,

      "executeOffensiveAction / acerto"
    );

  coordinator =
    result.text;

  coordinatorChanged ||= 
    result.changed;
}


{
  const result =
    replaceExactOrIntegrated(
      coordinator,

`      hitChance:
        offensive.hitChance,

      rawDamage:
        0,`,

`      hitChance:
        offensive.hitChance,

      critical:
        false,

      criticalChance:
        offensive.criticalChance,

      criticalMultiplier:
        offensive.criticalMultiplier,

      baseDamage:
        0,

      rawDamage:
        0,`,

`      criticalChance:
        offensive.criticalChance,`,

      "executeDebuffAction / erro"
    );

  coordinator =
    result.text;

  coordinatorChanged ||= 
    result.changed;
}


{
  const result =
    replaceExactOrIntegrated(
      coordinator,

`    hitChance:
      offensive.hitChance,

    rawDamage,`,

`    hitChance:
      offensive.hitChance,

    critical:
      offensive.critical === true,

    criticalChance:
      offensive.criticalChance,

    criticalMultiplier:
      offensive.criticalMultiplier,

    baseDamage:
      Math.max(
        0,
        Number(
          offensive.baseDamage
        ) || 0
      ),

    rawDamage,`,

`    critical:
      offensive.critical === true,`,

      "executeDebuffAction / acerto"
    );

  coordinator =
    result.text;

  coordinatorChanged ||= 
    result.changed;
}


if (
  coordinatorChanged
) {
  fs.writeFileSync(
    coordinatorPath,
    coordinator,
    "utf8"
  );

  console.log(
    "✅ PvpCoordinator.js agora propaga os dados de crítico."
  );
}
else {
  console.log(
    "✅ PvpCoordinator.js já estava integrado ao crítico."
  );
}


let attack =
  fs.readFileSync(
    attackPath,
    "utf8"
  );

let attackChanged =
  false;


const helperMarker =
  "function formatSkillLabel(";


if (
  !attack.includes(
    helperMarker
  )
) {
  const oldHeader =
`    function formatExecution(
    execution,
    hpData
    ) {`;

  const newHeader =
`    function formatSkillLabel(
      execution
    ) {
      const skillName =
        String(
          execution?.skill ??
          "habilidade"
        );


      if (
        execution?.critical === true
      ) {
        return (
          skillName +
          " 💥 CRÍTICO!"
        );
      }


      return skillName;
    }


    function formatExecution(
    execution,
    hpData
    ) {`;

  const occurrences =
    attack.split(
      oldHeader
    ).length - 1;


  if (
    occurrences !== 1
  ) {
    throw new Error(
      `attack.js: cabeçalho de formatExecution esperado 1 vez, encontrado ${occurrences}.`
    );
  }


  attack =
    attack.replace(
      oldHeader,
      newHeader
    );

  attackChanged =
    true;
}


const oldSkillInterpolation =
  "${execution.skill}";

const newSkillInterpolation =
  "${formatSkillLabel(execution)}";


const skillOccurrences =
  attack.split(
    oldSkillInterpolation
  ).length - 1;


if (
  skillOccurrences > 0
) {
  attack =
    attack.split(
      oldSkillInterpolation
    ).join(
      newSkillInterpolation
    );

  attackChanged =
    true;

  console.log(
    `✅ ${skillOccurrences} mensagens de execução passaram a exibir 💥 CRÍTICO!.`
  );
}
else if (
  attack.includes(
    newSkillInterpolation
  )
) {
  console.log(
    "↪ Mensagens de crítico já estavam integradas."
  );
}
else {
  throw new Error(
    "attack.js: não encontrei interpolações de execution.skill para atualizar."
  );
}


if (
  attackChanged
) {
  fs.writeFileSync(
    attackPath,
    attack,
    "utf8"
  );

  console.log(
    "✅ attack.js agora sinaliza críticos no chat."
  );
}
else {
  console.log(
    "✅ attack.js já estava integrado ao crítico."
  );
}


console.log(
  "\n💥 INTEGRAÇÃO DO CRÍTICO AO PvP APLICADA."
);
