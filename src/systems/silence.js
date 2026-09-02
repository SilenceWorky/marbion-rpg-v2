export const SILENCE_DEFAULT_DURATION =
  2;


function normalizeText(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}


export function isSkillAllowedWhileSilenced(
  skill
) {
  const type =
    normalizeText(
      skill?.tipo
    );


  /*
   * Silêncio impede canalizações
   * mágicas/elementais, mas mantém:
   *
   * - habilidades Físicas;
   * - Soco, que é Físico;
   * - Meditação.
   */
  return (
    type === "fisica" ||
    type === "meditacao" ||
    type === "meditação"
  );
}


export function getActiveSilenceEffect(
  user,
  currentTurn = null
) {
  if (
    !Array.isArray(
      user?.effects
    )
  ) {
    return null;
  }


  const turn =
    Number(
      currentTurn
    );


  return (
    user.effects.find(
      effect => {
        if (
          effect?.effectCategory !==
            "restriction" ||
          normalizeText(
            effect?.type
          ) !== "silencio"
        ) {
          return false;
        }


        if (
          !Number.isFinite(
            turn
          )
        ) {
          return true;
        }


        const expiresAtTurn =
          Number(
            effect?.expiresAtTurn
          );


        return (
          !Number.isFinite(
            expiresAtTurn
          ) ||
          expiresAtTurn > turn
        );
      }
    ) ||
    null
  );
}


export function checkSilenceRestriction(
  user,
  skill,
  currentTurn
) {
  const effect =
    getActiveSilenceEffect(
      user,
      currentTurn
    );


  if (!effect) {
    return {
      blocked: false,
      effect: null
    };
  }


  if (
    isSkillAllowedWhileSilenced(
      skill
    )
  ) {
    return {
      blocked: false,
      effect
    };
  }


  return {
    blocked: true,
    effect,
    skill:
      skill?.nome ??
      "Habilidade"
  };
}


export function applySilenceEffect(
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


  const duration =
    Math.max(
      1,
      Math.floor(
        Number(
          skill?.restrictionDuration
        ) ||
        SILENCE_DEFAULT_DURATION
      )
    );


  const appliedAtTurn =
    Number(
      currentTurn
    );


  /*
   * Se o alvo já agiu no turno da
   * aplicação, esse turno não pode
   * contar como um dos turnos úteis
   * do Silêncio.
   *
   * Assim, duração 2 significa:
   *
   * antes da ação do alvo:
   * T1 + T2, expira no T3;
   *
   * depois da ação do alvo:
   * T2 + T3, expira no T4.
   */
  const expiresAtTurn =
    appliedAtTurn +
    duration +
    (
      targetAlreadyActed
        ? 1
        : 0
    );


  const existing =
    target.effects.find(
      effect =>
        effect?.effectCategory ===
          "restriction" &&
        normalizeText(
          effect?.type
        ) ===
          "silencio"
    );


  if (existing) {
    existing.source =
      skill.nome;

    existing.appliedAtTurn =
      appliedAtTurn;

    existing.expiresAtTurn =
      Math.max(
        Number(
          existing.expiresAtTurn
        ) || 0,
        expiresAtTurn
      );


    return {
      kind: "silence",
      ok: true,
      refreshed: true,
      type: "silencio",
      user:
        target.user,
      skill:
        skill.nome,
      duration,
      expiresAtTurn:
        existing.expiresAtTurn
    };
  }


  const effect = {
    type:
      "silencio",

    effectCategory:
      "restriction",

    restriction:
      "physical_only",

    source:
      skill.nome,

    appliedAtTurn,

    expiresAtTurn
  };


  target.effects.push(
    effect
  );


  return {
    kind: "silence",
    ok: true,
    refreshed: false,
    type: "silencio",
    user:
      target.user,
    skill:
      skill.nome,
    duration,
    expiresAtTurn
  };
}
