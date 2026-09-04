import {
  applyElementalDamage,
  getElementalMatchup
} from "./elemental-damage.js";


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


export const BASE_CRITICAL_CHANCE =
  5;

export const BASE_CRITICAL_MULTIPLIER =
  1.5;


export function getSkillCriticalChance(
  skill
) {
  const configured =
    Number(
      skill?.critChance
    );


  if (
    Number.isFinite(
      configured
    )
  ) {
    return clamp(
      configured,
      0,
      100
    );
  }


  return BASE_CRITICAL_CHANCE;
}


export function getSkillCriticalMultiplier(
  skill
) {
  const configured =
    Number(
      skill?.critMultiplier
    );


  if (
    Number.isFinite(
      configured
    ) &&
    configured >= 1
  ) {
    return configured;
  }


  return BASE_CRITICAL_MULTIPLIER;
}


export function rollCritical(
  criticalChance
) {
  const chance =
    clamp(
      getNumber(
        criticalChance,
        0
      ),
      0,
      100
    );


  if (
    chance <= 0
  ) {
    return false;
  }


  if (
    chance >= 100
  ) {
    return true;
  }


  const roll =
    Math.random() * 100;


  /*
   * Usamos a faixa SUPERIOR do sorteio.
   *
   * Exemplo com 5%:
   * 95 <= roll < 100.
   *
   * Isso continua sendo exatamente 5%,
   * mas preserva testes antigos que usam
   * Math.random = () => 0 para garantir
   * acertos normais sem transformar todos
   * os golpes em críticos.
   */
  return roll >=
    100 - chance;
}


export function applyCriticalDamage(
  damage,
  multiplier =
    BASE_CRITICAL_MULTIPLIER
) {
  const normalizedDamage =
    Math.max(
      0,
      getNumber(
        damage,
        0
      )
    );


  if (
    normalizedDamage <= 0
  ) {
    return 0;
  }


  const normalizedMultiplier =
    Math.max(
      1,
      getNumber(
        multiplier,
        BASE_CRITICAL_MULTIPLIER
      )
    );


  return Math.max(
    1,
    Math.round(
      normalizedDamage *
      normalizedMultiplier
    )
  );
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
 * DANO BASE DE COMBATE
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
 *
 * Ordem canônica:
 * 1. teste de acerto
 * 2. dano da habilidade + escala + Defesa
 * 3. multiplicador elemental
 * 4. teste crítico
 * 5. multiplicador crítico no dano direto
 *
 * Imunidade elemental transforma o ataque
 * em uma execução sem efeito: dano 0 e
 * hit=false, mas a habilidade foi executada
 * normalmente para custo/cooldown.
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


  const criticalChance =
    getSkillCriticalChance(
      skill
    );


  const criticalMultiplier =
    getSkillCriticalMultiplier(
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
      blockedByImmunity: false,
      elementalImmune: false,
      elementalMultiplier: 1,
      elementalEffectiveness: "neutral",
      elementalRelations: [],
      attackElement:
        skill?.elemento ?? null,
      defenderElements:
        Array.isArray(defender?.elements)
          ? [...defender.elements]
          : [],
      critical: false,
      criticalChance,
      criticalMultiplier,
      damageBeforeElemental: 0,
      baseDamage: 0,
      damage: 0
    };
  }


  const damageBeforeElemental =
    calculateDamage(
      attacker,
      defender,
      skill
    );


  const elemental =
    getElementalMatchup(
      skill?.elemento,
      defender?.elements
    );


  if (
    elemental.immune
  ) {
    return {
      hit: false,
      hitChance,
      blockedByImmunity: true,
      elementalImmune: true,
      elementalMultiplier: 0,
      elementalEffectiveness:
        "immune",
      elementalRelations:
        elemental.relations,
      attackElement:
        skill?.elemento ?? null,
      defenderElements:
        elemental.defenderElements,
      critical: false,
      criticalChance,
      criticalMultiplier,
      damageBeforeElemental,
      baseDamage: 0,
      damage: 0
    };
  }


  const baseDamage =
    applyElementalDamage(
      damageBeforeElemental,
      elemental.multiplier
    );


  const critical =
    baseDamage > 0 &&
    rollCritical(
      criticalChance
    );


  const damage =
    critical
      ? applyCriticalDamage(
          baseDamage,
          criticalMultiplier
        )
      : baseDamage;


  return {
    hit: true,
    hitChance,
    blockedByImmunity: false,
    elementalImmune: false,
    elementalMultiplier:
      elemental.multiplier,
    elementalEffectiveness:
      elemental.effectiveness,
    elementalRelations:
      elemental.relations,
    attackElement:
      skill?.elemento ?? null,
    defenderElements:
      elemental.defenderElements,
    critical,
    criticalChance,
    criticalMultiplier,
    damageBeforeElemental,
    baseDamage,
    damage
  };
}
