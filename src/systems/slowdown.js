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


export const SLOW_DEFAULT_AMOUNT =
  20;

export const SLOW_DEFAULT_DURATION =
  2;


export function applySlowEffect(
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
          SLOW_DEFAULT_AMOUNT
        )
      )
    );


  const duration =
    Math.max(
      1,
      Math.floor(
        getNumber(
          skill?.debuffDuration,
          SLOW_DEFAULT_DURATION
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
          "lentidao" &&
        effect?.stat ===
          "speed"
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


    target.speed =
      Math.max(
        0,
        getNumber(
          target.speed
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
        target.speed
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
      kind: "slow",
      ok: false,
      error: "SLOW_NO_EFFECT",
      type: "lentidao",
      subtype: "lentidao",
      user: target.user,
      skill: skill?.nome,
      stat: "speed",
      amount: 0,
      requestedAmount,
      before,
      after,
      duration,
      refreshed
    };
  }


  target.speed =
    after;


  /*
   * A ordem do turno atual ja foi decidida
   * antes da execucao das habilidades.
   *
   * Portanto a Lentidao precisa afetar
   * dois turnos FUTUROS completos.
   * Aplicada no T1: afeta T2 e T3,
   * expirando na abertura do T4.
   */
  const effect = {
    type: "debuff",
    subtype: "lentidao",
    effectCategory: "debuff",
    source: skill.nome,
    stat: "speed",
    amount: appliedAmount,
    requestedAmount,
    appliedAtTurn:
      Number(currentTurn),
    expiresAtTurn:
      Number(currentTurn) +
      duration +
      1
  };


  target.effects.push(
    effect
  );


  return {
    kind: "slow",
    ok: true,
    type: "lentidao",
    subtype: "lentidao",
    user: target.user,
    skill: skill.nome,
    stat: "speed",
    amount: appliedAmount,
    requestedAmount,
    before,
    after,
    duration,
    refreshed,
    expiresAtTurn:
      effect.expiresAtTurn
  };
}
