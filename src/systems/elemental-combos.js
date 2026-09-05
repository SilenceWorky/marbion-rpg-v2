function normalizeElement(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function ensureEffects(target) {
  if (!Array.isArray(target?.effects)) {
    target.effects = [];
  }

  return target.effects;
}


export const WET_EFFECT_TYPE =
  "molhado";

export const WET_DURATION =
  2;

export const ELECTROCUTION_BONUS_MULTIPLIER =
  0.25;


export function findWetEffect(
  target
) {
  if (!Array.isArray(target?.effects)) {
    return null;
  }

  return target.effects.find(
    effect =>
      String(
        effect?.type ?? ""
      )
        .trim()
        .toLowerCase() ===
        WET_EFFECT_TYPE &&
      effect?.effectCategory ===
        "elemental_state"
  ) || null;
}


export function hasWetEffect(
  target
) {
  return Boolean(
    findWetEffect(
      target
    )
  );
}


export function applyWetEffect(
  target,
  skill,
  currentTurn,
  duration = WET_DURATION
) {
  const effects =
    ensureEffects(
      target
    );

  const safeTurn =
    Number.isFinite(
      Number(currentTurn)
    )
      ? Number(currentTurn)
      : 0;

  const safeDuration =
    Math.max(
      1,
      Math.floor(
        Number(duration) ||
        WET_DURATION
      )
    );

  const existing =
    findWetEffect(
      target
    );


  if (existing) {
    existing.name =
      "💧 Molhado";

    existing.source =
      skill?.nome ||
      "Água";

    existing.appliedAtTurn =
      safeTurn;

    existing.expiresAtTurn =
      safeTurn +
      safeDuration;

    return {
      ok: true,
      type:
        WET_EFFECT_TYPE,
      refreshed: true,
      duration:
        safeDuration,
      expiresAtTurn:
        existing.expiresAtTurn,
      effect:
        existing
    };
  }


  const effect = {
    type:
      WET_EFFECT_TYPE,

    name:
      "💧 Molhado",

    effectCategory:
      "elemental_state",

    source:
      skill?.nome ||
      "Água",

    appliedAtTurn:
      safeTurn,

    expiresAtTurn:
      safeTurn +
      safeDuration
  };


  effects.push(
    effect
  );


  return {
    ok: true,
    type:
      WET_EFFECT_TYPE,
    refreshed: false,
    duration:
      safeDuration,
    expiresAtTurn:
      effect.expiresAtTurn,
    effect
  };
}


export function consumeWetEffect(
  target
) {
  if (!Array.isArray(target?.effects)) {
    return {
      consumed: false,
      effect: null
    };
  }


  const index =
    target.effects.findIndex(
      effect =>
        String(
          effect?.type ?? ""
        )
          .trim()
          .toLowerCase() ===
          WET_EFFECT_TYPE &&
        effect?.effectCategory ===
          "elemental_state"
    );


  if (index < 0) {
    return {
      consumed: false,
      effect: null
    };
  }


  const [effect] =
    target.effects.splice(
      index,
      1
    );


  return {
    consumed: true,
    effect
  };
}


export function calculateElectrocutionBonus(
  directDamage
) {
  const damage =
    Math.max(
      0,
      Math.floor(
        Number(directDamage) || 0
      )
    );


  if (damage <= 0) {
    return 0;
  }


  return Math.max(
    1,
    Math.round(
      damage *
      ELECTROCUTION_BONUS_MULTIPLIER
    )
  );
}


/*
 * Resolve a reação elemental APÓS o golpe
 * realmente ter acertado e APÓS o dano
 * elemental/crítico já ter sido calculado.
 *
 * V1:
 * - Água aplica/renova Molhado.
 * - Eletricidade em Molhado consome Molhado
 *   e adiciona +25% de dano direto.
 * - Fogo em Molhado consome Molhado sem
 *   bônus de dano nesta primeira versão.
 *
 * O bônus da Eletrocussão entra antes de
 * Counter/Refletir, então a reação defensiva
 * trabalha sobre o dano direto real.
 */
export function resolveElementalCombo(
  target,
  skill,
  currentTurn,
  directDamage
) {
  const element =
    normalizeElement(
      skill?.elemento
    );

  const safeDamage =
    Math.max(
      0,
      Math.floor(
        Number(directDamage) || 0
      )
    );


  if (
    !element ||
    element === "universal" ||
    element === "neutro"
  ) {
    return null;
  }


  if (
    element === "agua"
  ) {
    const wet =
      applyWetEffect(
        target,
        skill,
        currentTurn
      );

    return {
      type:
        "molhado",
      name:
        "Molhado",
      triggered: true,
      consumedWet: false,
      bonusDamage: 0,
      directDamageBeforeCombo:
        safeDamage,
      directDamageAfterCombo:
        safeDamage,
      wet
    };
  }


  if (
    element === "eletricidade" &&
    hasWetEffect(
      target
    ) &&
    safeDamage > 0
  ) {
    const consumed =
      consumeWetEffect(
        target
      );

    const bonusDamage =
      calculateElectrocutionBonus(
        safeDamage
      );

    return {
      type:
        "eletrocussao",
      name:
        "Eletrocussão",
      triggered: true,
      consumedWet:
        consumed.consumed,
      bonusDamage,
      directDamageBeforeCombo:
        safeDamage,
      directDamageAfterCombo:
        safeDamage +
        bonusDamage
    };
  }


  if (
    element === "fogo" &&
    hasWetEffect(
      target
    )
  ) {
    const consumed =
      consumeWetEffect(
        target
      );

    return {
      type:
        "evaporacao",
      name:
        "Evaporação",
      triggered: true,
      consumedWet:
        consumed.consumed,
      bonusDamage: 0,
      directDamageBeforeCombo:
        safeDamage,
      directDamageAfterCombo:
        safeDamage
    };
  }


  return null;
}
