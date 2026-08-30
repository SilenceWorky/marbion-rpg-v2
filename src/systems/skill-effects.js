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

const BUFFABLE_STATS = new Set([
  "strength",
  "magicStrength",
  "speed",
  "evasion",
  "accuracy",
  "defense"
]);


export function calculateBuffAmount(
  skill
) {
  const cost =
    Math.max(
      0,
      getNumber(
        skill?.custoMentalidade
      )
    );


  return Math.min(
    10,
    Math.max(
      1,
      Math.round(
        cost / 5
      )
    )
  );
}


export function executeBuffSkill(
  user,
  skill,
  currentTurn
) {
  const stat =
    String(
      skill?.escala ?? ""
    ).trim();


  if (
    !BUFFABLE_STATS.has(
      stat
    )
  ) {
    return {
      kind: "buff",
      ok: false,
      error:
        "INVALID_BUFF_STAT",

      user:
        user.user,

      skill:
        skill.nome,

      stat
    };
  }


  if (
    !Array.isArray(
      user.effects
    )
  ) {
    user.effects = [];
  }


  const amount =
    calculateBuffAmount(
      skill
    );


  const before =
    getNumber(
      user[stat]
    );


  user[stat] =
    before +
    amount;


  const duration =
    2;


  const effect = {
    type: "buff",

    source:
      skill.nome,

    stat,

    amount,

    appliedAtTurn:
      currentTurn,

    expiresAtTurn:
      currentTurn +
      duration
  };


  user.effects.push(
    effect
  );


  return {
    kind: "buff",
    ok: true,

    user:
      user.user,

    skill:
      skill.nome,

    stat,

    amount,

    before,

    after:
      user[stat],

    duration,

    expiresAtTurn:
      effect.expiresAtTurn
  };
}

const DEBUFFABLE_STATS =
  new Set([
    "strength",
    "magicStrength",
    "speed",
    "evasion",
    "accuracy",
    "defense"
  ]);


export function calculateDebuffAmount(
  skill
) {
  const cost =
    Math.max(
      0,
      getNumber(
        skill?.custoMentalidade
      )
    );


  /*
   * Mesma escala inicial do Buff:
   *
   * cada 5 de Mentalidade
   * = -1 no atributo.
   *
   * mínimo: 1
   * máximo: 10
   */
  return Math.min(
    10,
    Math.max(
      1,
      Math.round(
        cost / 5
      )
    )
  );
}


export function applyDebuffSkill(
  target,
  skill,
  currentTurn
) {
  const stat =
    String(
      skill?.debuffStat ?? ""
    ).trim();


  if (
    !DEBUFFABLE_STATS.has(
      stat
    )
  ) {
    return {
      kind: "debuff",

      ok: false,

      error:
        "INVALID_DEBUFF_STAT",

      user:
        target.user,

      skill:
        skill.nome,

      stat
    };
  }


  if (
    !Array.isArray(
      target.effects
    )
  ) {
    target.effects = [];
  }


  const requestedAmount =
    calculateDebuffAmount(
      skill
    );


  const before =
    Math.max(
      0,
      getNumber(
        target[stat]
      )
    );


  /*
   * O atributo não pode ficar negativo.
   *
   * Guardamos quanto realmente
   * conseguimos retirar.
   */
  const after =
    Math.max(
      0,
      before -
      requestedAmount
    );


  const appliedAmount =
    before -
    after;

  /*
  * O atributo já está em 0.
  *
  * Não registra um Debuff inútil
  * de valor zero.
  */
  if (
    appliedAmount <= 0
  ) {
    return {
      kind:
        "debuff",

      ok: false,

      error:
        "DEBUFF_NO_EFFECT",

      user:
        target.user,

      skill:
        skill.nome,

      stat,

      amount: 0,

      requestedAmount,

      before,

      after
    };
  }

  target[stat] =
    after;


  const duration =
    2;


  const effect = {
    type:
      "debuff",

    source:
      skill.nome,

    stat,

    amount:
      appliedAmount,

    appliedAtTurn:
      currentTurn,

    expiresAtTurn:
      currentTurn +
      duration
  };


  target.effects.push(
    effect
  );


  return {
    kind:
      "debuff",

    ok: true,

    user:
      target.user,

    skill:
      skill.nome,

    stat,

    amount:
      appliedAmount,

    requestedAmount,

    before,

    after,

    duration,

    expiresAtTurn:
      effect.expiresAtTurn
  };
}

export function expireBattleEffects(
  user,
  currentTurn
) {
  if (
    !Array.isArray(
      user.effects
    )
  ) {
    user.effects = [];

    return {
      expired: []
    };
  }


  const expired = [];
  const active = [];


  for (
    const effect
    of user.effects
  ) {
    const expiresAtTurn =
      Number(
        effect?.expiresAtTurn
      );


    const shouldExpire =
      Number.isFinite(
        expiresAtTurn
      ) &&
      expiresAtTurn <=
        currentTurn;


    /*
     * O efeito ainda está ativo.
     */
    if (!shouldExpire) {
      active.push(
        effect
      );

      continue;
    }


    /*
     * ==============================
     * BUFF
     * ==============================
     *
     * O Buff adicionou atributo.
     * Ao terminar, retiramos
     * exatamente o mesmo valor.
     */
    if (
      effect.type === "buff" &&
      effect.stat &&
      Number.isFinite(
        Number(
          effect.amount
        )
      )
    ) {
      const amount =
        Number(
          effect.amount
        );


      const current =
        getNumber(
          user[
            effect.stat
          ]
        );


      user[
        effect.stat
      ] =
        current -
        amount;
    }


    /*
     * ==============================
     * DEBUFF
     * ==============================
     *
     * O Debuff retirou atributo.
     * Ao terminar, devolvemos
     * exatamente o mesmo valor.
     */
    else if (
      effect.type === "debuff" &&
      effect.stat &&
      Number.isFinite(
        Number(
          effect.amount
        )
      )
    ) {
      const amount =
        Number(
          effect.amount
        );


      const current =
        getNumber(
          user[
            effect.stat
          ]
        );


      user[
        effect.stat
      ] =
        current +
        amount;
    }


    expired.push(
      effect
    );
  }


  user.effects =
    active;


  return {
    expired
  };
}

export const MEDITATION_RECOVERY =
  25;


export const MEDITATION_COOLDOWN_TURNS =
  3;

export const MEDITATION_SKILL = {
  id: "Especial:Meditação",

  group: "Especial",

  key: "Meditacao",

  nome: "Meditação",

  tipo: "Meditacao",

  elemento: "Universal",

  custoMentalidade: 0,

  cooldown: 0,

  prioridade: -1
};


/*
 * Função genérica de recuperação
 * de Mentalidade.
 *
 * No futuro pode ser reutilizada por:
 * - Meditação
 * - Poções
 * - Livros
 * - Comidas
 * - Habilidades de suporte
 * - Equipamentos
 */
export function restoreMentalidade(
  user,
  amount,
  source = "Recuperação"
) {
  const maxMentalidade =
    Math.max(
      1,
      Number(
        user?.maxMentalidade
      ) || 1
    );


  const before =
    Math.max(
      0,
      Math.min(
        maxMentalidade,
        Number(
          user?.mentalidade
        ) || 0
      )
    );


  const requestedRecovery =
    Math.max(
      0,
      Number(amount) || 0
    );


  user.mentalidade =
    Math.min(
      maxMentalidade,
      before +
      requestedRecovery
    );


  const recovered =
    user.mentalidade -
    before;


  return {
    kind:
      "mentalidade",

    user:
      user.user,

    source,

    recovered,

    requestedRecovery,

    before,

    after:
      user.mentalidade,

    maxMentalidade
  };
}


/*
 * Ação especial de Meditação.
 */
export function executeMeditation(
  user,
  currentTurn
) {
  const result =
    restoreMentalidade(
      user,
      MEDITATION_RECOVERY,
      "Meditação"
    );


  /*
   * Meditou no turno 1:
   *
   * bloqueado:
   * turno 2
   * turno 3
   * turno 4
   *
   * disponível novamente:
   * turno 5
   */
  user.meditationAvailableAtTurn =
    Number(currentTurn) +
    MEDITATION_COOLDOWN_TURNS +
    1;


  return {
    ...result,

    kind:
      "meditate",

    skill:
      "Meditação",

    cooldownTurns:
      MEDITATION_COOLDOWN_TURNS,

    availableAtTurn:
      user.meditationAvailableAtTurn
  };
}