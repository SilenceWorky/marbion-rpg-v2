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


export function ensurePlayerSkillCooldowns(
  player
) {
  if (
    !player.skillCooldowns ||
    typeof player.skillCooldowns !== "object" ||
    Array.isArray(player.skillCooldowns)
  ) {
    player.skillCooldowns = {};
  }

  return player.skillCooldowns;
}


export function getSkillCooldownTurns(
  skill
) {
  return Math.max(
    0,
    Math.floor(
      getNumber(
        skill?.cooldown,
        0
      )
    )
  );
}


export function getSkillCooldownKey(
  action
) {
  const skillId =
    String(
      action?.skillId ?? ""
    ).trim();

  return skillId || null;
}


export function getSkillCooldownStatus(
  player,
  action,
  currentTurn
) {
  const cooldowns =
    ensurePlayerSkillCooldowns(
      player
    );

  const skillId =
    getSkillCooldownKey(
      action
    );

  const cooldown =
    getSkillCooldownTurns(
      action?.skill
    );

  const turn =
    Math.max(
      1,
      Math.floor(
        getNumber(
          currentTurn,
          1
        )
      )
    );


  /*
   * Soco virtual, Meditação e qualquer
   * habilidade com cooldown 0 não usam
   * este motor.
   */
  if (
    !skillId ||
    cooldown <= 0
  ) {
    return {
      ready: true,
      skillId,
      cooldown,
      currentTurn: turn,
      availableAtTurn: turn,
      turnsRemaining: 0,
      record: null
    };
  }


  const record =
    cooldowns[
      skillId
    ] || null;


  if (!record) {
    return {
      ready: true,
      skillId,
      cooldown,
      currentTurn: turn,
      availableAtTurn: turn,
      turnsRemaining: 0,
      record: null
    };
  }


  const availableAtTurn =
    Math.max(
      1,
      Math.floor(
        getNumber(
          record.availableAtTurn,
          turn
        )
      )
    );


  if (
    turn >=
    availableAtTurn
  ) {
    delete cooldowns[
      skillId
    ];

    return {
      ready: true,
      skillId,
      cooldown,
      currentTurn: turn,
      availableAtTurn,
      turnsRemaining: 0,
      record: null,
      expired: true
    };
  }


  return {
    ready: false,
    skillId,
    cooldown,
    currentTurn: turn,
    availableAtTurn,
    turnsRemaining:
      availableAtTurn -
      turn,
    record
  };
}


export function startSkillCooldown(
  player,
  action,
  executedTurn
) {
  const cooldowns =
    ensurePlayerSkillCooldowns(
      player
    );

  const skillId =
    getSkillCooldownKey(
      action
    );

  const cooldown =
    getSkillCooldownTurns(
      action?.skill
    );

  const turn =
    Math.max(
      1,
      Math.floor(
        getNumber(
          executedTurn,
          1
        )
      )
    );


  if (
    !skillId ||
    cooldown <= 0
  ) {
    return {
      started: false,
      skillId,
      cooldown,
      executedTurn: turn,
      availableAtTurn: turn
    };
  }


  const record = {
    skillId,

    skillName:
      action?.skill?.nome ??
      skillId,

    cooldown,

    startedAtTurn:
      turn,

    /*
     * Regra do Marbion:
     * cooldown 3 usado no T1 bloqueia
     * T2, T3 e T4; volta no T5.
     */
    availableAtTurn:
      turn +
      cooldown +
      1
  };


  cooldowns[
    skillId
  ] =
    record;


  return {
    started: true,
    ...record
  };
}
