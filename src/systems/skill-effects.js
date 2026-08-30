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
 * Calcula cura.
 *
 * base:
 * custo de Mentalidade da habilidade
 *
 * escala:
 * atributo indicado em skill.escala
 *
 * Cada ponto do atributo acrescenta 4%.
 */
export function calculateHealing(
  user,
  skill
) {
  const cost =
    Math.max(
      0,
      getNumber(
        skill?.custoMentalidade
      )
    );


  const scalingStat =
    Math.max(
      0,
      getNumber(
        user?.[
          skill?.escala
        ]
      )
    );


  /*
   * Cura mínima razoável mesmo
   * para habilidades baratas.
   */
  const baseHealing =
    Math.max(
      15,
      cost * 1.2
    );


  const multiplier =
    1 +
    scalingStat * 0.04;


  return Math.max(
    1,
    Math.round(
      baseHealing *
      multiplier
    )
  );
}


export function executeHealingSkill(
  user,
  skill
) {
  const before =
    Math.max(
      0,
      Number(user.hp) || 0
    );


  const maxHp =
    Math.max(
      1,
      Number(user.maxHp) || 1
    );


  const calculated =
    calculateHealing(
      user,
      skill
    );


  user.hp =
    Math.min(
      maxHp,
      before +
      calculated
    );


  const healed =
    user.hp -
    before;


  return {
    kind: "heal",

    user:
      user.user,

    skill:
      skill.nome,

    healing:
      healed,

    calculatedHealing:
      calculated,

    hpBefore:
      before,

    hpAfter:
      user.hp,

    maxHp
  };
}