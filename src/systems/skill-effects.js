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

export const POISON_DURATION =
  3;


/*
 * Dano periódico do Veneno.
 *
 * Inicialmente:
 * 35% do custo de Mentalidade,
 * mínimo de 2 de dano por turno.
 */
export function calculatePoisonDamage(
  skill
) {
  const cost =
    Math.max(
      0,
      getNumber(
        skill?.custoMentalidade
      )
    );


  return Math.max(
    2,
    Math.round(
      cost * 0.35
    )
  );
}


/*
 * Aplica Envenenado.
 *
 * Regras:
 *
 * - dura 3 ticks;
 * - começa a causar dano
 *   no próximo turno;
 * - não acumula infinitamente;
 * - reaplicar renova a duração;
 * - mantém o maior dano entre
 *   o Veneno antigo e o novo.
 */
export function applyPoisonEffect(
  target,
  skill,
  currentTurn
) {
  if (
    !Array.isArray(
      target.effects
    )
  ) {
    target.effects = [];
  }


  const damagePerTurn =
    calculatePoisonDamage(
      skill
    );


  const existing =
    target.effects.find(
      effect =>
        effect?.type ===
        "veneno"
    );


  /*
   * Já está envenenado.
   *
   * Renova os 3 ticks e
   * mantém o Veneno mais forte.
   */
  if (existing) {
    existing.source =
      skill.nome;

    existing.damagePerTurn =
      Math.max(
        getNumber(
          existing.damagePerTurn
        ),
        damagePerTurn
      );

    existing.remainingTicks =
      POISON_DURATION;

    existing.nextTickTurn =
      Number(currentTurn) +
      1;


    return {
      kind:
        "poison",

      ok: true,

      refreshed: true,

      user:
        target.user,

      skill:
        skill.nome,

      damagePerTurn:
        existing.damagePerTurn,

      duration:
        POISON_DURATION,

      nextTickTurn:
        existing.nextTickTurn
    };
  }


  const effect = {
    type:
      "veneno",

    source:
      skill.nome,

    damagePerTurn,

    remainingTicks:
      POISON_DURATION,

    appliedAtTurn:
      Number(
        currentTurn
      ),

    nextTickTurn:
      Number(
        currentTurn
      ) + 1
  };


  target.effects.push(
    effect
  );


  return {
    kind:
      "poison",

    ok: true,

    refreshed: false,

    user:
      target.user,

    skill:
      skill.nome,

    damagePerTurn,

    duration:
      POISON_DURATION,

    nextTickTurn:
      effect.nextTickTurn
  };
}


/*
 * Processa todos os Venenos
 * no início de um turno.
 */
export function processPoisonEffects(
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
      ticks: [],
      killed: false
    };
  }


  const active = [];
  const ticks = [];


  for (
    const effect
    of user.effects
  ) {
    /*
     * Outros efeitos continuam
     * normalmente.
     */
    if (
      effect?.type !==
      "veneno"
    ) {
      active.push(
        effect
      );

      continue;
    }


    const remainingTicks =
      Math.max(
        0,
        Math.floor(
          getNumber(
            effect.remainingTicks
          )
        )
      );


    const nextTickTurn =
      Math.max(
        1,
        Math.floor(
          getNumber(
            effect.nextTickTurn,
            Number(currentTurn)
          )
        )
      );


    /*
     * Ainda não chegou o turno
     * do próximo dano.
     */
    if (
      Number(currentTurn) <
      nextTickTurn
    ) {
      active.push(
        effect
      );

      continue;
    }


    if (
      remainingTicks <= 0
    ) {
      continue;
    }


    const hpBefore =
      Math.max(
        0,
        getNumber(
          user.hp
        )
      );


    const requestedDamage =
      Math.max(
        0,
        getNumber(
          effect.damagePerTurn
        )
      );


    const hpAfter =
      Math.max(
        0,
        hpBefore -
        requestedDamage
      );


    const damage =
      hpBefore -
      hpAfter;


    user.hp =
      hpAfter;


    const newRemainingTicks =
      remainingTicks -
      1;


    ticks.push({
      type:
        "veneno",

      source:
        effect.source,

      damage,

      hpBefore,

      hpAfter,

      remainingTicks:
        newRemainingTicks
    });


    /*
     * Se ainda houver ticks,
     * mantém o Veneno.
     */
    if (
      newRemainingTicks > 0
    ) {
      effect.remainingTicks =
        newRemainingTicks;

      effect.nextTickTurn =
        Number(currentTurn) +
        1;

      active.push(
        effect
      );
    }
  }


  user.effects =
    active;


  return {
    ticks,

    killed:
      Number(
        user.hp
      ) <= 0
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