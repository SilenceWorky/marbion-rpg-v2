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

/*
 * ==============================
 * DANO PERIÓDICO GENÉRICO
 * ==============================
 *
 * Base compartilhada por:
 *
 * ☠️ Veneno
 * 🔥 Queimadura
 * 🩸 Sangramento
 * ☢️ Radiação
 * e futuros DoTs.
 */


/*
 * ==============================
 * CEGUEIRA
 * ==============================
 *
 * Debuff especial de Precisao.
 *
 * Regras padrao:
 * - reduz 20 de Precisao;
 * - dura 2 turnos;
 * - nao acumula consigo mesma;
 * - reaplicacao renova a duracao.
 */
export const BLINDNESS_DEFAULT_AMOUNT =
  20;

export const BLINDNESS_DEFAULT_DURATION =
  2;


export function applyBlindnessEffect(
  target,
  skill,
  currentTurn,
  {
    targetAlreadyActed = false
  } = {}
) {
  if (
    !Array.isArray(
      target.effects
    )
  ) {
    target.effects = [];
  }


  const requestedAmount =
    Math.max(
      1,
      Math.round(
        getNumber(
          skill?.debuffAmount,
          BLINDNESS_DEFAULT_AMOUNT
        )
      )
    );


  const duration =
    Math.max(
      1,
      Math.floor(
        getNumber(
          skill?.debuffDuration,
          BLINDNESS_DEFAULT_DURATION
        )
      )
    );


  const existingIndex =
    target.effects.findIndex(
      effect =>
        effect?.type ===
          "debuff" &&
        String(
          effect?.subtype ?? ""
        )
          .trim()
          .toLowerCase() ===
          "cegueira" &&
        effect?.stat ===
          "accuracy"
    );


  let refreshed =
    false;


  if (
    existingIndex >= 0
  ) {
    const existing =
      target.effects[
        existingIndex
      ];


    target.accuracy =
      Math.max(
        0,
        getNumber(
          target.accuracy
        ) +
        Math.max(
          0,
          getNumber(
            existing.amount
          )
        )
      );


    target.effects.splice(
      existingIndex,
      1
    );


    refreshed =
      true;
  }


  const before =
    Math.max(
      0,
      getNumber(
        target.accuracy
      )
    );


  const after =
    Math.max(
      0,
      before -
      requestedAmount
    );


  const appliedAmount =
    before -
    after;


  if (
    appliedAmount <= 0
  ) {
    return {
      kind:
        "blindness",

      ok: false,

      error:
        "BLINDNESS_NO_EFFECT",

      type:
        "cegueira",

      subtype:
        "cegueira",

      user:
        target.user,

      skill:
        skill?.nome,

      stat:
        "accuracy",

      amount: 0,

      requestedAmount,
      before,
      after,
      duration,
      refreshed
    };
  }


  target.accuracy =
    after;


  const expiryOffset =
    targetAlreadyActed
      ? 1
      : 0;


  const effect = {
    type:
      "debuff",

    subtype:
      "cegueira",

    effectCategory:
      "debuff",

    source:
      skill.nome,

    stat:
      "accuracy",

    amount:
      appliedAmount,

    requestedAmount,

    appliedAtTurn:
      Number(currentTurn),

    expiresAtTurn:
      Number(currentTurn) +
      duration +
      expiryOffset
  };


  target.effects.push(
    effect
  );


  return {
    kind:
      "blindness",

    ok: true,

    type:
      "cegueira",

    subtype:
      "cegueira",

    user:
      target.user,

    skill:
      skill.nome,

    stat:
      "accuracy",

    amount:
      appliedAmount,

    requestedAmount,
    before,
    after,
    duration,
    refreshed,

    expiresAtTurn:
      effect.expiresAtTurn
  };
}


export function applyDamageOverTimeEffect(
  target,
  skill,
  currentTurn,
  {
    effectType,
    resultKind,
    duration,
    damagePerTurn
  }
) {
  if (
    !Array.isArray(
      target.effects
    )
  ) {
    target.effects = [];
  }


  const normalizedType =
    String(
      effectType ?? ""
    )
      .trim()
      .toLowerCase();


  const normalizedKind =
    String(
      resultKind ??
      normalizedType
    )
      .trim()
      .toLowerCase();


  const safeDuration =
    Math.max(
      1,
      Math.floor(
        getNumber(
          duration,
          1
        )
      )
    );


  const safeDamage =
    Math.max(
      0,
      Math.round(
        getNumber(
          damagePerTurn
        )
      )
    );


  if (
    !normalizedType ||
    safeDamage <= 0
  ) {
    return {
      kind:
        normalizedKind ||
        "dot",

      ok: false,

      error:
        "INVALID_DOT_CONFIG",

      user:
        target.user,

      skill:
        skill?.nome
    };
  }


  /*
   * Cada tipo de DoT possui
   * apenas uma instância ativa.
   *
   * Veneno não acumula com Veneno.
   * Queimadura não acumula com
   * Queimadura.
   *
   * Mas Veneno + Queimadura podem
   * coexistir futuramente.
   */
  const existing =
    target.effects.find(
      effect =>
        String(
          effect?.type ?? ""
        )
          .trim()
          .toLowerCase() ===
        normalizedType
    );


  if (existing) {
    existing.source =
      skill.nome;


    /*
     * Reaplicação mantém
     * o dano mais forte.
     */
    existing.damagePerTurn =
      Math.max(
        getNumber(
          existing.damagePerTurn
        ),
        safeDamage
      );


    /*
     * Renova completamente
     * a duração.
     */
    existing.remainingTicks =
      safeDuration;


    /*
     * Nunca causa dano
     * imediatamente.
     *
     * O primeiro tick é
     * no próximo turno.
     */
    existing.nextTickTurn =
      Number(currentTurn) +
      1;


    return {
      kind:
        normalizedKind,

      ok: true,

      refreshed: true,

      type:
        normalizedType,

      user:
        target.user,

      skill:
        skill.nome,

      damagePerTurn:
        existing.damagePerTurn,

      duration:
        safeDuration,

      nextTickTurn:
        existing.nextTickTurn
    };
  }


  const effect = {
    type:
      normalizedType,

    source:
      skill.nome,

    damagePerTurn:
      safeDamage,

    remainingTicks:
      safeDuration,

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
      normalizedKind,

    ok: true,

    refreshed: false,

    type:
      normalizedType,

    user:
      target.user,

    skill:
      skill.nome,

    damagePerTurn:
      safeDamage,

    duration:
      safeDuration,

    nextTickTurn:
      effect.nextTickTurn
  };
}


/*
 * Processador genérico de DoT.
 *
 * effectTypes define quais efeitos
 * serão processados nesta chamada.
 */
export function processDamageOverTimeEffects(
  user,
  currentTurn,
  effectTypes
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


  const requestedTypes =
    Array.isArray(
      effectTypes
    )
      ? effectTypes
      : [
          effectTypes
        ];


  const acceptedTypes =
    new Set(
      requestedTypes
        .map(
          type =>
            String(
              type ?? ""
            )
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    );


  const active = [];
  const ticks = [];

  let killedBy =
    null;

  for (
    const effect
    of user.effects
  ) {
    const effectType =
      String(
        effect?.type ?? ""
      )
        .trim()
        .toLowerCase();

    /*
     * Outro DoT já derrubou
     * este jogador nesta mesma
     * abertura de turno.
     *
     * Não produzimos ticks falsos
     * de 0 de dano depois da derrota.
     */
    if (killedBy) {
      active.push(
        effect
      );

      continue;
    }

    /*
     * Não pertence aos DoTs
     * solicitados nesta chamada.
     *
     * Buff, Debuff e outros efeitos
     * continuam intactos.
     */
    if (
      !acceptedTypes.has(
        effectType
      )
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
            Number(
              currentTurn
            )
          )
        )
      );


    /*
     * Ainda não chegou
     * a hora do dano.
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


    /*
     * Guarda somente o dano
     * que realmente entrou.
     *
     * Exemplo:
     *
     * 5 HP
     * tick de 8
     *
     * damage = 5
     * hp = 0
     */
    const damage =
      hpBefore -
      hpAfter;


    user.hp =
      hpAfter;

    /*
     * Este foi exatamente o efeito
     * que levou o HP de um valor
     * positivo até 0.
     */
    const lethal =
      hpBefore > 0 &&
      hpAfter <= 0;      

    const newRemainingTicks =
      remainingTicks -
      1;


    ticks.push({
      type:
        effectType,

      source:
        effect.source,

      damage,

      hpBefore,

      hpAfter,

      remainingTicks:
        newRemainingTicks,

      lethal
    });

    /*
     * Registra a causa exata
     * da derrota.
     */
    if (lethal) {
      killedBy = {
        type:
          effectType,

        source:
          effect.source
      };


      /*
       * Não precisamos manter
       * o próprio efeito letal ativo.
       *
       * Os efeitos seguintes serão
       * preservados, mas não executados.
       */
      continue;
    }


    /*
     * Continua ativo somente
     * se ainda possuir ticks.
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
      ) <= 0,

    killedBy
  };
}


/*
 * ==============================
 * VENENO
 * ==============================
 *
 * Veneno agora é apenas uma
 * implementação do motor genérico.
 *
 * Mantemos as funções antigas
 * para não quebrar o PvP atual.
 */


export const POISON_DURATION =
  3;


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


export function applyPoisonEffect(
  target,
  skill,
  currentTurn
) {
  return applyDamageOverTimeEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "veneno",

      resultKind:
        "poison",

      duration:
        POISON_DURATION,

      damagePerTurn:
        calculatePoisonDamage(
          skill
        )
    }
  );
}


export function processPoisonEffects(
  user,
  currentTurn
) {
  return processDamageOverTimeEffects(
    user,
    currentTurn,
    "veneno"
  );
}

/*
 * ==============================
 * QUEIMADURA
 * ==============================
 *
 * Queimadura usa o mesmo motor
 * genérico de dano periódico.
 *
 * Diferença para Veneno:
 *
 * - duração menor;
 * - dano por tick maior;
 * - efeito mais agressivo
 *   e de curta duração.
 */


export const BURN_DURATION =
  2;


/*
 * 45% do custo de Mentalidade.
 *
 * mínimo de 2 de dano por turno.
 */
export function calculateBurnDamage(
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
      cost * 0.45
    )
  );
}


export function applyBurnEffect(
  target,
  skill,
  currentTurn
) {
  return applyDamageOverTimeEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "queimadura",

      resultKind:
        "burn",

      duration:
        BURN_DURATION,

      damagePerTurn:
        calculateBurnDamage(
          skill
        )
    }
  );
}


export function processBurnEffects(
  user,
  currentTurn
) {
  return processDamageOverTimeEffects(
    user,
    currentTurn,
    "queimadura"
  );
}

/*
 * ==============================
 * SANGRAMENTO
 * ==============================
 *
 * Dano físico periódico.
 *
 * Por padrão:
 * - 3 ticks;
 * - primeiro tick no próximo turno;
 * - 30% do custo de Mentalidade por tick;
 * - mínimo de 2 de dano por tick.
 */
export const BLEED_DURATION =
  3;


export function calculateBleedDamage(
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
      cost * 0.30
    )
  );
}


export function applyBleedEffect(
  target,
  skill,
  currentTurn
) {
  return applyDamageOverTimeEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "sangramento",

      resultKind:
        "bleed",

      duration:
        BLEED_DURATION,

      damagePerTurn:
        calculateBleedDamage(
          skill
        )
    }
  );
}


/*
 * ==============================
 * CONTROLE GENÉRICO
 * ==============================
 *
 * Base compartilhada por:
 *
 * ⚡ Paralisia
 * ❄️ Congelamento
 * 😵 Atordoamento
 * e futuros controles.
 *
 * Diferente de Buff/Debuff,
 * Controle não depende apenas
 * de um turno de expiração.
 *
 * Ele bloqueia ações futuras.
 */


export function applyControlEffect(
  target,
  skill,
  currentTurn,
  {
    effectType,
    resultKind,
    duration = 1
  }
) {
  if (
    !Array.isArray(
      target.effects
    )
  ) {
    target.effects = [];
  }


  const normalizedType =
    String(
      effectType ?? ""
    )
      .trim()
      .toLowerCase();


  const normalizedKind =
    String(
      resultKind ??
      normalizedType
    )
      .trim()
      .toLowerCase();


  const safeDuration =
    Math.max(
      1,
      Math.floor(
        getNumber(
          duration,
          1
        )
      )
    );


  if (!normalizedType) {
    return {
      kind:
        normalizedKind ||
        "control",

      ok: false,

      error:
        "INVALID_CONTROL_CONFIG",

      user:
        target.user,

      skill:
        skill?.nome
    };
  }


  /*
   * O mesmo tipo de Controle
   * não cria cópias infinitas.
   *
   * Exemplo:
   * Paralisia reaplicada
   * apenas renova/reforça
   * a Paralisia existente.
   */
  const existing =
    target.effects.find(
      effect =>
        effect?.effectCategory ===
          "control" &&
        String(
          effect?.type ?? ""
        )
          .trim()
          .toLowerCase() ===
        normalizedType
    );


  if (existing) {
    existing.source =
      skill.nome;


    /*
     * Uma reaplicação nunca
     * reduz a duração restante.
     */
    existing.remainingBlocks =
      Math.max(
        Math.max(
          0,
          Math.floor(
            getNumber(
              existing.remainingBlocks
            )
          )
        ),

        safeDuration
      );


    existing.appliedAtTurn =
      Number(
        currentTurn
      );


    return {
      kind:
        normalizedKind,

      ok: true,

      refreshed: true,

      type:
        normalizedType,

      user:
        target.user,

      skill:
        skill.nome,

      remainingBlocks:
        existing.remainingBlocks
    };
  }


  const effect = {
    type:
      normalizedType,

    effectCategory:
      "control",

    source:
      skill.nome,

    remainingBlocks:
      safeDuration,

    appliedAtTurn:
      Number(
        currentTurn
      )
  };


  target.effects.push(
    effect
  );


  return {
    kind:
      normalizedKind,

    ok: true,

    refreshed: false,

    type:
      normalizedType,

    user:
      target.user,

    skill:
      skill.nome,

    remainingBlocks:
      safeDuration
  };
}


/*
 * Verifica e consome UM Controle
 * quando o personagem tenta agir.
 *
 * Se houver Controle ativo:
 *
 * - a ação é bloqueada;
 * - um bloqueio é consumido;
 * - ao chegar a zero,
 *   o efeito desaparece.
 */
export function consumeControlBlock(
  user
) {
  if (
    !Array.isArray(
      user.effects
    )
  ) {
    user.effects = [];

    return {
      blocked: false,
      control: null
    };
  }


  const index =
    user.effects.findIndex(
      effect =>
        effect?.effectCategory ===
          "control" &&
        Math.max(
          0,
          Math.floor(
            getNumber(
              effect?.remainingBlocks
            )
          )
        ) > 0
    );


  if (index < 0) {
    return {
      blocked: false,
      control: null
    };
  }


  const effect =
    user.effects[index];


  const before =
    Math.max(
      1,
      Math.floor(
        getNumber(
          effect.remainingBlocks,
          1
        )
      )
    );


  const after =
    Math.max(
      0,
      before - 1
    );


  effect.remainingBlocks =
    after;


  const control = {
    type:
      String(
        effect.type ?? ""
      )
        .trim()
        .toLowerCase(),

    source:
      effect.source,

    remainingBlocks:
      after
  };


  /*
   * O efeito cumpriu todos
   * os bloqueios previstos.
   */
  if (after <= 0) {
    user.effects.splice(
      index,
      1
    );
  }


  return {
    blocked: true,
    control
  };
}

/*
 * ==============================
 * PARALISIA
 * ==============================
 *
 * Primeira implementação real
 * do motor genérico de Controle.
 *
 * Por padrão:
 * bloqueia 1 ação.
 */


export const PARALYSIS_DURATION =
  1;


export function applyParalysisEffect(
  target,
  skill,
  currentTurn
) {
  const duration =
    Math.max(
      1,
      Math.floor(
        Number(
          skill?.controlDuration
        ) ||
        PARALYSIS_DURATION
      )
    );


  return applyControlEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "paralisia",

      resultKind:
        "paralysis",

      duration
    }
  );
}

/*
 * ==============================
 * CONGELAMENTO
 * ==============================
 *
 * Segunda implementação real
 * do motor genérico de Controle.
 *
 * Por padrão:
 * bloqueia 1 ação.
 */


export const FREEZE_DURATION =
  1;


export function applyFreezeEffect(
  target,
  skill,
  currentTurn
) {
  const duration =
    Math.max(
      1,
      Math.floor(
        Number(
          skill?.controlDuration
        ) ||
        FREEZE_DURATION
      )
    );


  return applyControlEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "congelamento",

      resultKind:
        "freeze",

      duration
    }
  );
}

/*
 * ==============================
 * ATORDOAMENTO
 * ==============================
 *
 * Terceira implementação real
 * do motor genérico de Controle.
 *
 * Por padrão:
 * bloqueia 1 ação.
 */

export const STUN_DURATION =
  1;


export function applyStunEffect(
  target,
  skill,
  currentTurn
) {
  const duration =
    Math.max(
      1,
      Math.floor(
        Number(
          skill?.controlDuration
        ) ||
        STUN_DURATION
      )
    );


  return applyControlEffect(
    target,
    skill,
    currentTurn,
    {
      effectType:
        "atordoamento",

      resultKind:
        "stun",

      duration
    }
  );
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