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


export const CONFUSION_DEFAULT_DURATION =
  2;

export const CONFUSION_DEFAULT_CHANCE =
  0.5;

export const CONFUSION_DEFAULT_SELF_DAMAGE =
  10;


function normalizeType(
  value
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}


function findConfusionIndex(
  target
) {
  if (
    !Array.isArray(
      target?.effects
    )
  ) {
    return -1;
  }


  return target.effects.findIndex(
    effect =>
      normalizeType(
        effect?.type
      ) === "confusao" &&
      effect?.effectCategory ===
        "disruption"
  );
}


export function applyConfusionEffect(
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


  const duration =
    Math.max(
      1,
      Math.floor(
        getNumber(
          skill?.debuffDuration ??
          skill?.confusionDuration,
          CONFUSION_DEFAULT_DURATION
        )
      )
    );


  const chance =
    Math.min(
      1,
      Math.max(
        0,
        getNumber(
          skill?.confusionChance,
          CONFUSION_DEFAULT_CHANCE
        )
      )
    );


  const selfDamage =
    Math.max(
      1,
      Math.round(
        getNumber(
          skill?.confusionSelfDamage,
          CONFUSION_DEFAULT_SELF_DAMAGE
        )
      )
    );


  const existingIndex =
    findConfusionIndex(
      target
    );


  const refreshed =
    existingIndex >= 0;


  if (refreshed) {
    target.effects.splice(
      existingIndex,
      1
    );
  }


  const effect = {
    type: "confusao",
    subtype: "confusao",
    effectCategory:
      "disruption",
    source:
      skill?.nome ||
      "Confusão",
    appliedAtTurn:
      Number(currentTurn) || 0,
    remainingActions:
      duration,
    chance,
    selfDamage
  };


  target.effects.push(
    effect
  );


  return {
    kind: "confusion",
    ok: true,
    type: "confusao",
    subtype: "confusao",
    user: target.user,
    skill: effect.source,
    duration,
    chance,
    selfDamage,
    refreshed,
    remainingActions:
      duration
  };
}


export function consumeConfusionAction(
  target,
  random = Math.random
) {
  const index =
    findConfusionIndex(
      target
    );


  if (index < 0) {
    return {
      active: false,
      selfHit: false,
      damage: 0,
      removed: false,
      effect: null
    };
  }


  const effect =
    target.effects[index];


  const before =
    Math.max(
      1,
      Math.floor(
        getNumber(
          effect.remainingActions,
          1
        )
      )
    );


  const after =
    Math.max(
      0,
      before - 1
    );


  const chance =
    Math.min(
      1,
      Math.max(
        0,
        getNumber(
          effect.chance,
          CONFUSION_DEFAULT_CHANCE
        )
      )
    );


  const rollValue =
    typeof random ===
      "function"
      ? getNumber(
          random(),
          1
        )
      : 1;


  const selfHit =
    rollValue < chance;


  const requestedDamage =
    Math.max(
      1,
      Math.round(
        getNumber(
          effect.selfDamage,
          CONFUSION_DEFAULT_SELF_DAMAGE
        )
      )
    );


  const hpBefore =
    Math.max(
      0,
      getNumber(
        target.hp
      )
    );


  const damage =
    selfHit
      ? Math.min(
          hpBefore,
          requestedDamage
        )
      : 0;


  if (selfHit) {
    target.hp =
      Math.max(
        0,
        hpBefore -
        damage
      );
  }


  const effectSnapshot = {
    ...effect,
    remainingActions:
      after
  };


  let removed =
    false;


  if (after <= 0) {
    target.effects.splice(
      index,
      1
    );

    removed =
      true;
  }
  else {
    effect.remainingActions =
      after;
  }


  return {
    active: true,
    selfHit,
    damage,
    hpBefore,
    hpAfter:
      Math.max(
        0,
        getNumber(
          target.hp
        )
      ),
    chance,
    roll:
      rollValue,
    remainingBefore:
      before,
    remainingActions:
      after,
    removed,
    effect:
      effectSnapshot
  };
}
