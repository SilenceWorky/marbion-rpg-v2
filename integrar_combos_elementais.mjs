import fs from "node:fs";


function replaceOnce(
  text,
  search,
  replacement,
  label
) {
  if (
    text.includes(
      replacement
    )
  ) {
    console.log(
      `↪ ${label}: já integrado.`
    );
    return text;
  }

  const index =
    text.indexOf(
      search
    );

  if (
    index === -1
  ) {
    throw new Error(
      `Não encontrei o ponto de integração: ${label}`
    );
  }

  console.log(
    `✅ ${label}`
  );

  return (
    text.slice(0, index) +
    replacement +
    text.slice(
      index + search.length
    )
  );
}


function replaceAllRequired(
  text,
  search,
  replacement,
  label
) {
  if (
    text.includes(
      replacement
    ) &&
    !text.includes(
      search
    )
  ) {
    console.log(
      `↪ ${label}: já integrado.`
    );
    return text;
  }

  const count =
    text.split(search).length - 1;

  if (count <= 0) {
    throw new Error(
      `Não encontrei o ponto de integração: ${label}`
    );
  }

  console.log(
    `✅ ${label}: ${count} ocorrência(s).`
  );

  return text.split(search).join(
    replacement
  );
}


const pvpPath =
  "src/durable/PvpCoordinator.js";

let pvp =
  fs.readFileSync(
    pvpPath,
    "utf8"
  );


pvp = replaceOnce(
  pvp,
`import {
  resolveOffensiveSkill
} from "../systems/combat.js";
`,
`import {
  resolveOffensiveSkill
} from "../systems/combat.js";

import {
  resolveElementalCombo
} from "../systems/elemental-combos.js";
`,
  "Importa motor de combos elementais"
);


pvp = replaceOnce(
  pvp,
`function executeOffensiveAction(
  attacker,
  defender,
  action
) {`,
`function executeOffensiveAction(
  attacker,
  defender,
  action,
  currentTurn
) {`,
  "Ataque ofensivo recebe turno atual"
);


pvp = replaceAllRequired(
  pvp,
`executeOffensiveAction(
      attacker,
      defender,
      action
    )`,
`executeOffensiveAction(
      attacker,
      defender,
      action,
      currentTurn
    )`,
  "Propaga turno para ataques ofensivos"
);


pvp = replaceOnce(
  pvp,
`  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          result.damage
        ) || 0
      )
    );


  const incomingMultiplier =`,
`  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          result.damage
        ) || 0
      )
    );


  const combo =
    resolveElementalCombo(
      defender,
      action.skill,
      currentTurn,
      rawDamage
    );


  const effectiveRawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          combo?.directDamageAfterCombo
        ) ||
        rawDamage
      )
    );


  const incomingMultiplier =`,
  "Ataque normal resolve combo antes de Counter/Refletir"
);


pvp = replaceOnce(
  pvp,
`        rawDamage *
        incomingMultiplier`,
`        effectiveRawDamage *
        incomingMultiplier`,
  "Ataque normal aplica reação defensiva ao dano com combo"
);


pvp = replaceOnce(
  pvp,
`    rawDamage,

    damage,

    defenderHp:`,
`    rawDamageBeforeCombo:
      rawDamage,

    rawDamage:
      effectiveRawDamage,

    combo,

    damage,

    defenderHp:`,
  "Ataque normal propaga dados do combo"
);


pvp = replaceOnce(
  pvp,
`  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          offensive.damage
        ) || 0
      )
    );


  const incomingMultiplier =`,
`  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          offensive.damage
        ) || 0
      )
    );


  const combo =
    resolveElementalCombo(
      defender,
      action.skill,
      currentTurn,
      rawDamage
    );


  const effectiveRawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          combo?.directDamageAfterCombo
        ) ||
        rawDamage
      )
    );


  const incomingMultiplier =`,
  "Debuff resolve combo antes de Counter/Refletir"
);


/*
 * Neste ponto restou a SEGUNDA ocorrência da
 * multiplicação rawDamage * incomingMultiplier,
 * pertencente ao caminho de Debuff.
 */
pvp = replaceAllRequired(
  pvp,
`        rawDamage *
        incomingMultiplier`,
`        effectiveRawDamage *
        incomingMultiplier`,
  "Debuff aplica reação defensiva ao dano com combo"
);


pvp = replaceOnce(
  pvp,
`    rawDamage,

    damage,

    defenderHp:
      defender.hp,

    sleepWake,

    debuffApplied:`,
`    rawDamageBeforeCombo:
      rawDamage,

    rawDamage:
      effectiveRawDamage,

    combo,

    damage,

    defenderHp:
      defender.hp,

    sleepWake,

    debuffApplied:`,
  "Debuff propaga dados do combo"
);


fs.writeFileSync(
  pvpPath,
  pvp
);


const attackPath =
  "src/routes/attack.js";

let attack =
  fs.readFileSync(
    attackPath,
    "utf8"
  );


attack = replaceOnce(
  attack,
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
    }`,
`    function formatSkillLabel(
      execution
    ) {
      const skillName =
        String(
          execution?.skill ??
          "habilidade"
        );


      let label =
        skillName;


      if (
        execution?.critical === true
      ) {
        label +=
          " 💥 CRÍTICO!";
      }


      const comboType =
        String(
          execution?.combo?.type ??
          ""
        )
          .trim()
          .toLowerCase();


      if (
        comboType === "molhado"
      ) {
        label +=
          " 💧 MOLHADO!";
      }

      else if (
        comboType === "eletrocussao"
      ) {
        label +=
          " ⚡ ELETROCUSSÃO! (+" +
          (execution.combo.bonusDamage || 0) +
          ")";
      }

      else if (
        comboType === "evaporacao"
      ) {
        label +=
          " ♨️ EVAPORAÇÃO!";
      }


      return label;
    }`,
  "Chat exibe Molhado, Eletrocussão e Evaporação"
);


fs.writeFileSync(
  attackPath,
  attack
);


console.log(
  "\n💧⚡ Integração de combos elementais aplicada ao PvP e ao chat."
);
