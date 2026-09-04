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


const pvpPath =
  "src/durable/PvpCoordinator.js";

let pvp =
  fs.readFileSync(
    pvpPath,
    "utf8"
  );


pvp = replaceOnce(
  pvp,
`    const needsProfile =
        !Array.isArray(
        player.loadout
        ) ||
        !Array.isArray(
        player.reflectElements
        ) ||`,
`    const needsProfile =
        !Array.isArray(
        player.loadout
        ) ||
        !Array.isArray(
        player.elements
        ) ||
        !Array.isArray(
        player.reflectElements
        ) ||`,
  "Snapshot exige elementos do jogador"
);


pvp = replaceOnce(
  pvp,
`    if (
        !Array.isArray(
        player.reflectElements
        )
    ) {
        player.reflectElements =
        getReflectableElements(
            profile
        );
    }
`,
`    if (
        !Array.isArray(
        player.elements
        )
    ) {
        player.elements =
        Array.isArray(
            profile.elements
        )
            ? [...profile.elements]
            : [];
    }


    if (
        !Array.isArray(
        player.reflectElements
        )
    ) {
        player.reflectElements =
        getReflectableElements(
            profile
        );
    }
`,
  "Snapshot recupera elementos do perfil"
);


pvp = replaceOnce(
  pvp,
`        defense:
            challengerProfile.defense,

        loadout:`,
`        defense:
            challengerProfile.defense,

        elements:
            Array.isArray(
            challengerProfile.elements
            )
            ? [...challengerProfile.elements]
            : [],

        loadout:`,
  "Player 1 recebe elementos no início do PvP"
);


pvp = replaceOnce(
  pvp,
`    defense:
        targetProfile.defense,

    loadout:`,
`    defense:
        targetProfile.defense,

    elements:
        Array.isArray(
        targetProfile.elements
        )
        ? [...targetProfile.elements]
        : [],

    loadout:`,
  "Player 2 recebe elementos no início do PvP"
);


pvp = replaceOnce(
  pvp,
`      hitChance:
        result.hitChance,

      critical:
        false,`,
`      hitChance:
        result.hitChance,

      blockedByImmunity:
        result.blockedByImmunity === true,

      elementalImmune:
        result.elementalImmune === true,

      elementalMultiplier:
        result.elementalMultiplier,

      elementalEffectiveness:
        result.elementalEffectiveness,

      attackElement:
        result.attackElement,

      defenderElements:
        result.defenderElements,

      damageBeforeElemental:
        result.damageBeforeElemental || 0,

      critical:
        false,`,
  "Ataque normal propaga imunidade no erro/bloqueio"
);


pvp = replaceOnce(
  pvp,
`    hitChance:
      result.hitChance,

    critical:
      result.critical === true,`,
`    hitChance:
      result.hitChance,

    blockedByImmunity:
      result.blockedByImmunity === true,

    elementalImmune:
      result.elementalImmune === true,

    elementalMultiplier:
      result.elementalMultiplier,

    elementalEffectiveness:
      result.elementalEffectiveness,

    attackElement:
      result.attackElement,

    defenderElements:
      result.defenderElements,

    damageBeforeElemental:
      result.damageBeforeElemental || 0,

    critical:
      result.critical === true,`,
  "Ataque normal propaga multiplicador elemental"
);


pvp = replaceOnce(
  pvp,
`      hitChance:
        offensive.hitChance,

      critical:
        false,`,
`      hitChance:
        offensive.hitChance,

      blockedByImmunity:
        offensive.blockedByImmunity === true,

      elementalImmune:
        offensive.elementalImmune === true,

      elementalMultiplier:
        offensive.elementalMultiplier,

      elementalEffectiveness:
        offensive.elementalEffectiveness,

      attackElement:
        offensive.attackElement,

      defenderElements:
        offensive.defenderElements,

      damageBeforeElemental:
        offensive.damageBeforeElemental || 0,

      critical:
        false,`,
  "Debuff propaga imunidade no erro/bloqueio"
);


pvp = replaceOnce(
  pvp,
`    hitChance:
      offensive.hitChance,

    critical:
      offensive.critical === true,`,
`    hitChance:
      offensive.hitChance,

    blockedByImmunity:
      offensive.blockedByImmunity === true,

    elementalImmune:
      offensive.elementalImmune === true,

    elementalMultiplier:
      offensive.elementalMultiplier,

    elementalEffectiveness:
      offensive.elementalEffectiveness,

    attackElement:
      offensive.attackElement,

    defenderElements:
      offensive.defenderElements,

    damageBeforeElemental:
      offensive.damageBeforeElemental || 0,

    critical:
      offensive.critical === true,`,
  "Debuff propaga multiplicador elemental"
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
`    if (!execution) {
        return "";
    }

    if (
      execution.kind ===
      "reaction_stance"
    ) {`,
`    if (!execution) {
        return "";
    }

    if (
      execution.blockedByImmunity === true ||
      execution.elementalImmune === true
    ) {
      const element =
        execution.attackElement ||
        "elemento do ataque";

      return (
        `⛔ @${execution.attacker} usou ${formatSkillLabel(execution)}, ` +
        `mas @${execution.defender} é imune a ${element}. Dano: 0.`
      );
    }

    if (
      execution.kind ===
      "reaction_stance"
    ) {`,
  "Chat identifica imunidade elemental"
);


fs.writeFileSync(
  attackPath,
  attack
);


console.log(
  "\n💥 Integração elemental aplicada em PvpCoordinator.js e attack.js."
);
