from pathlib import Path

# skill-effects.js
path = Path("src/systems/skill-effects.js")
text = path.read_text(encoding="utf-8")

if "export function applyBlindnessEffect(" not in text:
    marker = "export function applyDamageOverTimeEffect("
    if marker not in text:
        raise SystemExit("applyDamageOverTimeEffect not found")

    block = r'''/*
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
  currentTurn
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
      duration
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


'''
    text = text.replace(marker, block + marker, 1)

path.write_text(text, encoding="utf-8")


# PvpCoordinator.js
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

if "  applyBlindnessEffect," not in text:
    marker = "  applyDebuffSkill,\n  applyPoisonEffect,"
    if marker not in text:
        raise SystemExit("applyDebuffSkill import marker not found")
    text = text.replace(
        marker,
        "  applyDebuffSkill,\n  applyBlindnessEffect,\n  applyPoisonEffect,",
        1,
    )

if "function executeBlindnessAction(" not in text:
    marker = "function executePoisonAction("
    if marker not in text:
        raise SystemExit("executePoisonAction not found")

    block = r'''function executeBlindnessAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  const base =
    executeOffensiveAction(
      attacker,
      defender,
      action
    );


  if (!base.hit) {
    return {
      ...base,

      kind:
        "blindness",

      blindnessApplied:
        false,

      blindness:
        null
    };
  }


  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,

      kind:
        "blindness",

      blindnessApplied:
        false,

      blindness:
        null
    };
  }


  const blindness =
    applyBlindnessEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,

    kind:
      "blindness",

    blindnessApplied:
      blindness.ok,

    blindness
  };
}


'''
    text = text.replace(marker, block + marker, 1)

if "const debuffType =" not in text:
    marker = r'''  const controlType =
    String(
      action?.skill?.controlType ?? ""
    )
      .trim()
      .toLowerCase();'''
    if marker not in text:
        raise SystemExit("controlType marker not found")

    replacement = r'''  const debuffType =
    String(
      action?.skill?.debuffType ?? ""
    )
      .trim()
      .toLowerCase();

  const controlType =
    String(
      action?.skill?.controlType ?? ""
    )
      .trim()
      .toLowerCase();'''
    text = text.replace(marker, replacement, 1)

if 'debuffType ===\n    "cegueira"' not in text:
    marker = "  /*\n  * DEBUFF / VENENO"
    if marker not in text:
        raise SystemExit("debuff/poison marker not found")

    block = r'''  /*
   * ==============================
   * CEGUEIRA
   * ==============================
   *
   * Dano direto + reducao temporaria
   * de Precisao.
   */
  if (
    debuffType ===
    "cegueira"
  ) {
    return executeBlindnessAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

'''
    text = text.replace(marker, block + marker, 1)

path.write_text(text, encoding="utf-8")


# attack.js
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")

if 'execution.kind ===\n      "blindness"' not in text:
    marker = r'''    if (
      execution.kind ===
      "poison"
    ) {'''
    if marker not in text:
        raise SystemExit("poison branch marker not found")

    block = r'''    if (
      execution.kind ===
      "blindness"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.blindnessApplied &&
        execution.blindness
      ) {
        text +=
          ` \u{1F311} @${execution.defender} ficou Cego: ` +
          `Precis\u00E3o -${execution.blindness.amount} ` +
          `por ${execution.blindness.duration} turnos.`;
      }


      return text;
    }

'''
    text = text.replace(marker, block + marker, 1)

path.write_text(text, encoding="utf-8")


# estado.js
path = Path("src/routes/estado.js")
text = path.read_text(encoding="utf-8")

if "  const subtype =" not in text:
    marker = "  const name =\n    effect.name ??"
    if marker not in text:
        raise SystemExit("name marker not found in estado.js")

    replacement = r'''  const subtype =
    String(
      effect.subtype ??
      effect.debuffType ??
      ""
    ).toLowerCase();


  const name =
    effect.name ??'''
    text = text.replace(marker, replacement, 1)

if 'subtype ===\n      "cegueira"' not in text:
    marker = r'''  /*
   * Buff/debuff de atributo.
   */'''
    if marker not in text:
        raise SystemExit("buff/debuff marker not found in estado.js")

    block = r'''  /*
   * ==============================
   * CEGUEIRA
   * ==============================
   */
  if (
    type === "debuff" &&
    subtype ===
      "cegueira" &&
    effect.stat ===
      "accuracy" &&
    Number.isFinite(
      Number(
        effect.amount
      )
    )
  ) {
    const amount =
      Math.abs(
        Number(
          effect.amount
        )
      );


    const remaining =
      Number.isFinite(
        Number(
          effect.expiresAtTurn
        )
      )
        ? Math.max(
            0,
            Number(
              effect.expiresAtTurn
            ) -
            Number(turn)
          )
        : 0;


    return (
      `\u{1F311} ${name || "Cegueira"} \u2014 ` +
      `Precis\u00E3o -${amount} (${remaining}T)`
    );
  }

'''
    text = text.replace(marker, block + marker, 1)

path.write_text(text, encoding="utf-8")
