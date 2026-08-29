function clamp(
  value,
  min,
  max
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


function getNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


/*
 * Retorna o atributo que
 * escala a habilidade.
 *
 * Exemplos:
 *
 * strength
 * magicStrength
 * speed
 * defense
 * accuracy
 */
export function getSkillScalingStat(
  attacker,
  skill
) {
  const scale =
    String(
      skill?.escala ?? ""
    ).trim();


  if (!scale) {
    return 0;
  }


  return Math.max(
    0,
    getNumber(
      attacker?.[scale]
    )
  );
}


/*
 * PRECISÃO FINAL
 *
 * A precisão própria da habilidade
 * continua sendo a base.
 *
 * accuracy acima de 90 melhora.
 * accuracy abaixo de 90 piora.
 *
 * evasão do alvo reduz a chance.
 */
export function calculateHitChance(
  attacker,
  defender,
  skill
) {
  const skillAccuracy =
    getNumber(
      skill?.precisao,
      100
    );


  const attackerAccuracy =
    getNumber(
      attacker?.accuracy,
      90
    );


  const defenderEvasion =
    Math.max(
      0,
      getNumber(
        defender?.evasion
      )
    );


  const accuracyBonus =
    attackerAccuracy - 90;


  const finalChance =
    skillAccuracy +
    accuracyBonus -
    defenderEvasion;


  return clamp(
    Math.round(
      finalChance
    ),
    5,
    100
  );
}


/*
 * Sorteia se a habilidade acertou.
 */
export function rollHit(
  hitChance
) {
  const roll =
    Math.random() * 100;

  return roll <
    hitChance;
}


/*
 * DANO
 *
 * dano da habilidade
 * +
 * atributo de escala
 * -
 * defesa do alvo
 *
 * Cada ponto do atributo de escala
 * aumenta o dano em 3%.
 *
 * Defesa possui retorno decrescente:
 * quanto maior, mais difícil fica
 * obter reduções absurdas.
 */
export function calculateDamage(
  attacker,
  defender,
  skill
) {
  const baseDamage =
    Math.max(
      0,
      getNumber(
        skill?.dano
      )
    );


  if (
    baseDamage <= 0
  ) {
    return 0;
  }


  const scalingStat =
    getSkillScalingStat(
      attacker,
      skill
    );


  const defense =
    Math.max(
      0,
      getNumber(
        defender?.defense
      )
    );


  const scalingMultiplier =
    1 +
    scalingStat * 0.03;


  const defenseMultiplier =
    100 /
    (
      100 +
      defense * 4
    );


  const damage =
    Math.round(
      baseDamage *
      scalingMultiplier *
      defenseMultiplier
    );


  return Math.max(
    1,
    damage
  );
}


/*
 * Resolve apenas uma habilidade
 * ofensiva.
 *
 * Ainda NÃO altera HP.
 * Isso fica a cargo do PvP.
 */
export function resolveOffensiveSkill(
  attacker,
  defender,
  skill
) {
  const hitChance =
    calculateHitChance(
      attacker,
      defender,
      skill
    );


  const hit =
    rollHit(
      hitChance
    );


  if (!hit) {
    return {
      hit: false,
      hitChance,
      damage: 0
    };
  }


  const damage =
    calculateDamage(
      attacker,
      defender,
      skill
    );


  return {
    hit: true,
    hitChance,
    damage
  };
}