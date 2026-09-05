import fs from "node:fs";

const pvpPath =
  "src/durable/PvpCoordinator.js";

let pvp =
  fs.readFileSync(
    pvpPath,
    "utf8"
  );

const oldCall =
`  return executeOffensiveAction(
    attacker,
    defender,
    action
  );`;

const newCall =
`  return executeOffensiveAction(
    attacker,
    defender,
    action,
    currentTurn
  );`;

if (
  pvp.includes(
    newCall
  )
) {
  console.log(
    "↪ Ataque normal já propaga currentTurn."
  );
}
else if (
  pvp.includes(
    oldCall
  )
) {
  pvp =
    pvp.replace(
      oldCall,
      newCall
    );

  fs.writeFileSync(
    pvpPath,
    pvp
  );

  console.log(
    "✅ Ataque normal agora propaga currentTurn para o motor de combos."
  );
}
else {
  throw new Error(
    "Não encontrei o caminho padrão de executeOffensiveAction para corrigir."
  );
}


const integratorPath =
  "integrar_combos_elementais.mjs";

if (
  fs.existsSync(
    integratorPath
  )
) {
  let integrator =
    fs.readFileSync(
      integratorPath,
      "utf8"
    );

  const marker =
    "Propaga turno para ataque normal padrão";

  if (
    integrator.includes(
      marker
    )
  ) {
    console.log(
      "↪ Integrador de combos já protege o ataque normal padrão."
    );
  }
  else {
    const insertionPoint =
`pvp = replaceAllRequired(
  pvp,
\`executeOffensiveAction(\n      attacker,\n      defender,\n      action\n    )\`,
\`executeOffensiveAction(\n      attacker,\n      defender,\n      action,\n      currentTurn\n    )\`,
  "Propaga turno para ataques ofensivos"
);`;

    const addition =
`${insertionPoint}


pvp = replaceOnce(
  pvp,
\`  return executeOffensiveAction(\n    attacker,\n    defender,\n    action\n  );\`,
\`  return executeOffensiveAction(\n    attacker,\n    defender,\n    action,\n    currentTurn\n  );\`,
  "${marker}"
);`;

    if (
      integrator.includes(
        insertionPoint
      )
    ) {
      integrator =
        integrator.replace(
          insertionPoint,
          addition
        );

      fs.writeFileSync(
        integratorPath,
        integrator
      );

      console.log(
        "✅ Integrador de combos agora também protege o ataque normal padrão."
      );
    }
    else {
      console.log(
        "⚠️ Integrador já divergiu do formato antigo; produção foi corrigida, mas revise o integrador manualmente."
      );
    }
  }
}

console.log(
  "\n💧 Correção de persistência do Molhado aplicada."
);