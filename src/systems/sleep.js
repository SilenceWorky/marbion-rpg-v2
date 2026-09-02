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


export const SLEEP_DEFAULT_DURATION =
  2;


function normalizeType(
  value
) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}


function findSleepIndex(
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
      ) === "sono" &&
      effect?.effectCategory ===
        "sleep"
  );
}


export function applySleepEffect(
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
          skill?.controlDuration ??
          skill?.sleepDuration,
          SLEEP_DEFAULT_DURATION
        )
      )
    );


  const wakeOnDirectDamage =
    skill?.sleepWakeOnDirectDamage !==
      false;


  const existingIndex =
    findSleepIndex(
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
    type: "sono",
    subtype: "sono",
    effectCategory: "sleep",
    source:
      skill?.nome ||
      "Sono",
    appliedAtTurn:
      Number(currentTurn) || 0,
    remainingBlocks:
      duration,
    wakeOnDirectDamage
  };


  target.effects.push(
    effect
  );


  return {
    kind: "sleep",
    ok: true,
    type: "sono",
    subtype: "sono",
    user: target.user,
    skill: effect.source,
    duration,
    remainingBlocks:
      duration,
    wakeOnDirectDamage,
    refreshed
  };
}


export function consumeSleepBlock(
  target
) {
  const index =
    findSleepIndex(
      target
    );


  if (index < 0) {
    return {
      active: false,
      blocked: false,
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


  const snapshot = {
    ...effect,
    remainingBlocks:
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
    effect.remainingBlocks =
      after;
  }


  return {
    active: true,
    blocked: true,
    removed,
    remainingBefore:
      before,
    remainingBlocks:
      after,
    effect:
      snapshot
  };
}


export function wakeSleepOnDirectDamage(
  target,
  damage
) {
  const safeDamage =
    Math.max(
      0,
      getNumber(
        damage
      )
    );


  if (safeDamage <= 0) {
    return {
      woke: false,
      removed: false,
      effect: null
    };
  }


  const index =
    findSleepIndex(
      target
    );


  if (index < 0) {
    return {
      woke: false,
      removed: false,
      effect: null
    };
  }


  const effect =
    target.effects[index];


  if (
    effect.wakeOnDirectDamage ===
      false
  ) {
    return {
      woke: false,
      removed: false,
      effect: {
        ...effect
      }
    };
  }


  const snapshot = {
    ...effect
  };


  target.effects.splice(
    index,
    1
  );


  return {
    woke: true,
    removed: true,
    damage:
      safeDamage,
    effect:
      snapshot
  };
}
