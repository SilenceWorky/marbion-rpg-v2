import {
  applyRankedResult
} from "../systems/pvp-ranking.js";

import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  consumeSkillUse
} from "../systems/skill-usage.js";

import {
  fetchJson
} from "../core/content.js";

import {
  SKILLS_URL
} from "../config/urls.js";

import {
  BASIC_PUNCH_SKILL,
  ensureSkillLoadout,
  flattenSkills
} from "../systems/skills.js";

import {
  resolveOffensiveSkill
} from "../systems/combat.js";

import {
  executeHealingSkill,
  executeBuffSkill,
  applyDebuffSkill,
  applyPoisonEffect,
  applyBurnEffect,
  processDamageOverTimeEffects,
  applyControlEffect,
  applyParalysisEffect,
  applyFreezeEffect,
  consumeControlBlock,
  expireBattleEffects,
  executeMeditation,
  MEDITATION_SKILL
} from "../systems/skill-effects.js";

const CHALLENGE_TIMEOUT =
  2 * 60 * 1000;


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function snapshotLoadout(
  profile
) {
  ensureSkillLoadout(
    profile
  );

  return [
    ...profile.equippedSkills
  ];
}


function resolveSkillFromSlot(
  loadout,
  slot,
  skillsData
) {


  /*
  * Slot 0 não existe para o jogador.
  *
  * É usado internamente apenas
  * para representar Meditação.
  */
  if (
    slot === 0
  ) {
    return {
      skillId: null,

      skill:
        MEDITATION_SKILL,

      fallback: false,

      meditation: true
    };
  }

  const index =
    slot - 1;

  const skillId =
    loadout[index] ||
    null;


  /*
   * Slot vazio sempre significa Soco.
   */
  if (!skillId) {
    return {
      skillId: null,
      skill:
        BASIC_PUNCH_SKILL,
      fallback: true
    };
  }


  const catalog =
    flattenSkills(
      skillsData
    );


  const skill =
    catalog.find(
      entry =>
        entry.id === skillId
    );


  if (!skill) {
    return null;
  }


  return {
    skillId,
    skill,
    fallback: false
  };
}


function getSkillPriority(
  skill
) {
  return Number(
    skill?.prioridade
  ) || 0;
}

function getSkillMentalidadeCost(
  skill
) {
  return Math.max(
    0,
    Number(
      skill?.custoMentalidade
    ) || 0
  );
}


function canPaySkillCost(
  player,
  skill
) {
  const cost =
    getSkillMentalidadeCost(
      skill
    );

  const current =
    Math.max(
      0,
      Number(
        player?.mentalidade
      ) || 0
    );


  return {
    ok:
      current >= cost,

    cost,
    current
  };
}


function spendSkillMentalidade(
  player,
  skill
) {
  const payment =
    canPaySkillCost(
      player,
      skill
    );


  if (!payment.ok) {
    return {
      ok: false,
      error:
        "INSUFFICIENT_MENTALIDADE",

      ...payment
    };
  }


  player.mentalidade =
    payment.current -
    payment.cost;


  return {
    ok: true,

    cost:
      payment.cost,

    before:
      payment.current,

    after:
      player.mentalidade
  };
}

function executeOffensiveAction(
  attacker,
  defender,
  action
) {
  const result =
    resolveOffensiveSkill(
      attacker,
      defender,
      action.skill
    );


  if (!result.hit) {
    return {
      kind: "damage",

      attacker:
        attacker.user,

      defender:
        defender.user,

      skill:
        action.skill.nome,

      hit:
        false,

      hitChance:
        result.hitChance,

      damage:
        0,

      defenderHp:
        defender.hp
    };
  }


  defender.hp =
    Math.max(
      0,
      defender.hp -
      result.damage
    );


  return {
    kind: "damage",

    attacker:
      attacker.user,

    defender:
      defender.user,

    skill:
      action.skill.nome,

    hit:
      true,

    hitChance:
      result.hitChance,

    damage:
      result.damage,

    defenderHp:
      defender.hp
  };
}


function executeDebuffAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  /*
   * Primeiro resolve a parte ofensiva.
   *
   * O Debuff precisa acertar
   * o adversário.
   */
  const offensive =
    resolveOffensiveSkill(
      attacker,
      defender,
      action.skill
    );


  /*
   * ERROU:
   * não causa dano
   * e não aplica Debuff.
   */
  if (!offensive.hit) {
    return {
      kind:
        "debuff",

      attacker:
        attacker.user,

      defender:
        defender.user,

      skill:
        action.skill.nome,

      hit:
        false,

      hitChance:
        offensive.hitChance,

      damage:
        0,

      debuffApplied:
        false,

      defenderHp:
        defender.hp
    };
  }


  /*
   * ACERTOU:
   * primeiro aplica o dano.
   */
  defender.hp =
    Math.max(
      0,
      defender.hp -
      offensive.damage
    );


  /*
   * Depois aplica o Debuff.
   */
  const debuff =
    applyDebuffSkill(
      defender,
      action.skill,
      currentTurn
    );


  return {
    kind:
      "debuff",

    attacker:
      attacker.user,

    defender:
      defender.user,

    skill:
      action.skill.nome,

    hit:
      true,

    hitChance:
      offensive.hitChance,

    damage:
      offensive.damage,

    defenderHp:
      defender.hp,

    debuffApplied:
      debuff.ok,

    debuff
  };
}

function executePoisonAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  /*
   * Veneno reutiliza toda a execução
   * ofensiva do Debuff:
   *
   * - teste de acerto
   * - dano direto
   * - redução de atributo
   */
  const base =
    executeDebuffAction(
      attacker,
      defender,
      action,
      currentTurn
    );


  /*
   * Se o golpe errou,
   * não existe envenenamento.
   */
  if (!base.hit) {
    return {
      ...base,

      kind:
        "poison",

      poisonApplied:
        false,

      poison:
        null
    };
  }


  /*
   * Se o dano direto já derrubou
   * o adversário, também não precisamos
   * adicionar um efeito periódico.
   */
  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,

      kind:
        "poison",

      poisonApplied:
        false,

      poison:
        null
    };
  }


  /*
   * O golpe acertou.
   *
   * O Debuff pode ou não ter sido
   * aplicado — por exemplo, se o
   * atributo já estava em 0.
   *
   * Isso NÃO impede o Veneno.
   */
  const poison =
    applyPoisonEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,

    kind:
      "poison",

    poisonApplied:
      poison.ok,

    poison
  };
}

function executeBurnAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  /*
   * Queimadura é diferente do Veneno.
   *
   * Ela funciona como:
   *
   * dano direto normal
   * +
   * efeito periódico de Queimadura
   *
   * Não aplica Debuff de atributo
   * automaticamente.
   */
  const base =
    executeOffensiveAction(
      attacker,
      defender,
      action
    );


  /*
   * Errou:
   * não queima.
   */
  if (!base.hit) {
    return {
      ...base,

      kind:
        "burn",

      burnApplied:
        false,

      burn:
        null
    };
  }


  /*
   * O dano direto já derrotou
   * o adversário.
   *
   * Não adiciona um DoT inútil.
   */
  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,

      kind:
        "burn",

      burnApplied:
        false,

      burn:
        null
    };
  }


  const burn =
    applyBurnEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,

    kind:
      "burn",

    burnApplied:
      burn.ok,

    burn
  };
}

function executeBattleAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  const skillType =
    String(
      action?.skill?.tipo ?? ""
    )
      .trim()
      .toLowerCase();

  const dotType =
    String(
      action?.skill?.dotType ?? ""
    )
      .trim()
      .toLowerCase();

  const controlType =
    String(
      action?.skill?.controlType ?? ""
    )
      .trim()
      .toLowerCase();

  /*
   * CURA
   */
  if (
    skillType === "cura"
  ) {
    return executeHealingSkill(
      attacker,
      action.skill
    );
  }


  /*
   * BUFF
   *
   * Age sobre o próprio usuário.
   */
  if (
    skillType === "buff"
  ) {
    return executeBuffSkill(
      attacker,
      action.skill,
      currentTurn
    );
  }

  /*
  * DEBUFF / VENENO
  *
  * Por enquanto habilidades do tipo
  * Veneno utilizam a infraestrutura
  * de Debuff.
  *
  * Depois adicionaremos a camada
  * própria de dano por turno.
  */
  /*
  * DEBUFF
  */
  if (
    skillType === "debuff"
  ) {
    return executeDebuffAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }


  /*
  * VENENO
  *
  * Dano direto
  * + Debuff
  * + Envenenamento.
  */
  if (
    skillType === "veneno"
  ) {
    return executePoisonAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

  /*
   * QUEIMADURA
   *
   * A habilidade continua podendo ser
   * tipo Elemental, Física etc.
   *
   * O campo dotType informa que,
   * além do ataque normal, ela
   * aplica Queimadura.
   */
  if (
    dotType ===
    "queimadura"
  ) {
    return executeBurnAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

  /*
   * ==============================
   * PARALISIA
   * ==============================
   *
   * A habilidade mantém seu tipo
   * principal como Elemental.
   *
   * controlType adiciona o efeito
   * de Controle.
   */
  if (
    controlType ===
    "paralisia"
  ) {
    return executeParalysisAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

  /*
   * ==============================
   * CONGELAMENTO
   * ==============================
   */
  if (
    controlType ===
    "congelamento"
  ) {
    return executeFreezeAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

  /*
  * MEDITAÇÃO
  */
  if (
    skillType === "meditacao"
  ) {
    return executeMeditation(
      attacker,
      currentTurn
    );
  }


  /*
   * Ataques normais.
   */
  return executeOffensiveAction(
    attacker,
    defender,
    action
  );
}

function executeParalysisAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  /*
   * Paralisia funciona como:
   *
   * dano direto
   * +
   * Controle
   */
  const base =
    executeOffensiveAction(
      attacker,
      defender,
      action
    );


  /*
   * Errou:
   * não paralisa.
   */
  if (!base.hit) {
    return {
      ...base,

      kind:
        "paralysis",

      controlApplied:
        false,

      control:
        null
    };
  }


  /*
   * O dano direto já derrubou
   * o adversário.
   *
   * Não cria Controle inútil.
   */
  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,

      kind:
        "paralysis",

      controlApplied:
        false,

      control:
        null
    };
  }


  const control =
    applyParalysisEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,

    kind:
      "paralysis",

    controlApplied:
      control.ok,

    control
  };
}

function executeFreezeAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  /*
   * Congelamento funciona como:
   *
   * dano direto
   * +
   * Controle.
   */
  const base =
    executeOffensiveAction(
      attacker,
      defender,
      action
    );


  /*
   * Errou:
   * não congela.
   */
  if (!base.hit) {
    return {
      ...base,

      kind:
        "freeze",

      controlApplied:
        false,

      control:
        null
    };
  }


  /*
   * O dano direto já derrubou
   * o adversário.
   *
   * Não cria Controle inútil.
   */
  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,

      kind:
        "freeze",

      controlApplied:
        false,

      control:
        null
    };
  }


  const control =
    applyFreezeEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,

    kind:
      "freeze",

    controlApplied:
      control.ok,

    control
  };
}

function createControlBlockedExecution(
  player,
  action,
  controlResult
) {
  return {
    kind:
      "control_blocked",

    attacker:
      player.user,

    skill:
      action?.skill?.nome ??
      "Ação",

    blocked:
      true,

    control:
      controlResult?.control ??
      null
  };
}

export class PvpCoordinator {
  constructor(
    state,
    env
  ) {
    this.state =
      state;

    this.env =
      env;
  }


  async getData() {
    const data =
      await this.state.storage.get(
        "pvp"
      );

    return data || {
      challenges: [],
      battles: []
    };
  }


  async saveData(data) {
    await this.state.storage.put(
      "pvp",
      data
    );
  }


  cleanExpiredChallenges(
    data
  ) {
    const now =
      Date.now();

    data.challenges =
      data.challenges.filter(
        challenge =>
          challenge.expiresAt >
          now
      );

    return data;
  }


  findBattleByUser(
    data,
    user
  ) {
    return data.battles.find(
      battle =>
        battle.status === "ACTIVE" &&
        (
          battle.player1.user === user ||
          battle.player2.user === user
        )
    );
  }


  findChallengeByUser(
    data,
    user
  ) {
    return data.challenges.find(
      challenge =>
        challenge.challenger === user ||
        challenge.target === user
    );
  }

    async ensurePlayerSnapshot(
        player
    ) {
    const requiredStats = [
        "strength",
        "magicStrength",
        "speed",
        "evasion",
        "accuracy",
        "defense"
    ];


    const needsProfile =
        !Array.isArray(
        player.loadout
        ) ||
        requiredStats.some(
        stat =>
            !Number.isFinite(
            Number(
                player[stat]
            )
            )
        );


    if (!needsProfile) {
        return true;
    }


    const profile =
        await getProfile(
        this.env,
        player.user
        );


    if (!profile) {
        return false;
    }


    if (
        !Array.isArray(
        player.loadout
        )
    ) {
        player.loadout =
        snapshotLoadout(
            profile
        );
    }


    for (
        const stat
        of requiredStats
    ) {
        if (
        !Number.isFinite(
            Number(
            player[stat]
            )
        )
        ) {
        player[stat] =
            Number(
            profile[stat]
            ) || 0;
        }
    }


    return true;
    }


    async consumeExecutedSkill(
    player,
    action
    ) {
    /*
    * Soco é virtual.
    */
    if (
        !action?.skillId
    ) {
        return {
        consumed: false,
        removed: false
        };
    }


    const profile =
        await getProfile(
        this.env,
        player.user
        );


    if (!profile) {
        return {
        consumed: false,
        removed: false
        };
    }


    const result =
        consumeSkillUse(
        profile,
        action.skillId
        );


    if (
        result.ok &&
        result.consumed
    ) {
        await saveProfile(
        this.env,
        player.user,
        profile
        );
    }


    /*
    * Se era uma habilidade temporária
    * do Neutro e acabou, o slot dentro
    * da batalha também vira Soco.
    */
    if (
        result.ok &&
        result.removed
    ) {
        player.loadout =
        player.loadout.map(
            skillId =>
            skillId ===
            action.skillId
                ? null
                : skillId
        );
    }


    return result;
    }

    async applyRankedBattleResult(
    winnerUser,
    loserUser
    ) {
    const [
        winnerProfile,
        loserProfile
    ] =
        await Promise.all([
        getProfile(
            this.env,
            winnerUser
        ),

        getProfile(
            this.env,
            loserUser
        )
        ]);


    if (
        !winnerProfile ||
        !loserProfile
    ) {
        return {
        ok: false,
        error:
            "RANKED_PROFILE_NOT_FOUND"
        };
    }


    const result =
        applyRankedResult(
        winnerProfile,
        loserProfile
        );


    const now =
        Date.now();


    winnerProfile.lastCombat =
        now;

    loserProfile.lastCombat =
        now;


    await Promise.all([
        saveProfile(
        this.env,
        winnerUser,
        winnerProfile
        ),

        saveProfile(
        this.env,
        loserUser,
        loserProfile
        )
    ]);


    return {
        ok: true,
        ...result
    };
    }

  async createChallenge(
    challenger,
    target
  ) {
    challenger =
      normalizeUser(
        challenger
      );

    target =
      normalizeUser(
        target
      );


    if (
      !challenger ||
      !target
    ) {
      return {
        ok: false,
        error: "INVALID_USER"
      };
    }


    if (
      challenger === target
    ) {
      return {
        ok: false,
        error: "SELF_CHALLENGE"
      };
    }


    const challengerProfile =
      await getProfile(
        this.env,
        challenger
      );

    const targetProfile =
      await getProfile(
        this.env,
        target
      );


    if (
      !challengerProfile?.race
    ) {
      return {
        ok: false,
        error: "CHALLENGER_NOT_FOUND"
      };
    }


    if (
      !targetProfile?.race
    ) {
      return {
        ok: false,
        error: "TARGET_NOT_FOUND"
      };
    }


    let data =
      await this.getData();


    data =
      this.cleanExpiredChallenges(
        data
      );


    if (
      this.findBattleByUser(
        data,
        challenger
      )
    ) {
      return {
        ok: false,
        error: "CHALLENGER_IN_BATTLE"
      };
    }


    if (
      this.findBattleByUser(
        data,
        target
      )
    ) {
      return {
        ok: false,
        error: "TARGET_IN_BATTLE"
      };
    }


    if (
      this.findChallengeByUser(
        data,
        challenger
      )
    ) {
      return {
        ok: false,
        error:
          "CHALLENGER_HAS_CHALLENGE"
      };
    }


    if (
      this.findChallengeByUser(
        data,
        target
      )
    ) {
      return {
        ok: false,
        error:
          "TARGET_HAS_CHALLENGE"
      };
    }


    const now =
      Date.now();


    data.challenges.push({
      challenger,
      target,

      createdAt:
        now,

      expiresAt:
        now +
        CHALLENGE_TIMEOUT
    });


    await this.saveData(
      data
    );


    return {
      ok: true,
      challenger,
      target,
      expiresInSeconds:
        CHALLENGE_TIMEOUT / 1000
    };
  }


  async acceptChallenge(
    user
  ) {
    user =
      normalizeUser(
        user
      );


    if (!user) {
      return {
        ok: false,
        error: "INVALID_USER"
      };
    }


    let data =
      await this.getData();


    data =
      this.cleanExpiredChallenges(
        data
      );


    const challengeIndex =
      data.challenges.findIndex(
        challenge =>
          challenge.target === user
      );


    if (
      challengeIndex === -1
    ) {
      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "NO_CHALLENGE"
      };
    }


    const challenge =
      data.challenges[
        challengeIndex
      ];


    const challengerProfile =
      await getProfile(
        this.env,
        challenge.challenger
      );

    const targetProfile =
      await getProfile(
        this.env,
        challenge.target
      );


    if (
      !challengerProfile?.race ||
      !targetProfile?.race
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "PLAYER_NOT_FOUND"
      };
    }


    if (
      this.findBattleByUser(
        data,
        challenge.challenger
      ) ||
      this.findBattleByUser(
        data,
        challenge.target
      )
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "PLAYER_IN_BATTLE"
      };
    }


    const battle = {
      id:
        crypto.randomUUID(),

      status:
        "ACTIVE",

      turn:
        1,

      state:
        "WAITING_ACTIONS",

     player1: {
        user:
            challenge.challenger,

        hp:
            challengerProfile.maxHp,

        maxHp:
            challengerProfile.maxHp,

        mentalidade:
            challengerProfile.maxMentalidade,

        maxMentalidade:
            challengerProfile.maxMentalidade,

        strength:
            challengerProfile.strength,

        magicStrength:
            challengerProfile.magicStrength,

        speed:
            challengerProfile.speed,

        evasion:
            challengerProfile.evasion,

        accuracy:
            challengerProfile.accuracy,

        defense:
            challengerProfile.defense,

        loadout:
            snapshotLoadout(
            challengerProfile
            ),

        action:
            null
        },

    player2: {
    user:
        challenge.target,

    hp:
        targetProfile.maxHp,

    maxHp:
        targetProfile.maxHp,

    mentalidade:
        targetProfile.maxMentalidade,

    maxMentalidade:
        targetProfile.maxMentalidade,

    strength:
        targetProfile.strength,

    magicStrength:
        targetProfile.magicStrength,

    speed:
        targetProfile.speed,

    evasion:
        targetProfile.evasion,

    accuracy:
        targetProfile.accuracy,

    defense:
        targetProfile.defense,

    loadout:
        snapshotLoadout(
        targetProfile
        ),

    action:
        null
    },

      createdAt:
        Date.now()
    };


    data.challenges.splice(
      challengeIndex,
      1
    );


    data.battles.push(
      battle
    );


    await this.saveData(
      data
    );


    return {
      ok: true,
      battle
    };
  }

    async chooseAction(
    user,
    slot
    ) {
    user =
        normalizeUser(
        user
        );


    const rawSlot =
      String(
        slot ?? ""
      )
        .trim()
        .toLowerCase();


    const isMeditation =
      rawSlot === "meditar" ||
      rawSlot === "meditacao" ||
      rawSlot === "meditação";


    const normalizedSlot =
      isMeditation
        ? 0
        : Number(slot);


    if (!user) {
        return {
        ok: false,
        error: "INVALID_USER"
        };
    }


    if (
      !isMeditation &&
      (
        !Number.isInteger(
          normalizedSlot
        ) ||
        normalizedSlot < 1 ||
        normalizedSlot > 4
      )
    )
     {
        return {
        ok: false,
        error: "INVALID_SLOT"
        };
    }


    let data =
        await this.getData();


    data =
        this.cleanExpiredChallenges(
        data
        );


    const battle =
        this.findBattleByUser(
        data,
        user
        );


    if (!battle) {
        return {
        ok: false,
        error: "NOT_IN_BATTLE"
        };
    }


    const player =
        battle.player1.user === user
        ? battle.player1
        : battle.player2;


    const opponent =
        battle.player1.user === user
        ? battle.player2
        : battle.player1;


    /*
    * Compatibilidade com batalhas
    * criadas antes desta atualização.
    */
    const playerReady =
    await this.ensurePlayerSnapshot(
        player
    );

    const opponentReady =
    await this.ensurePlayerSnapshot(
        opponent
    );


    if (
    !playerReady ||
    !opponentReady
    ) {
    return {
        ok: false,
        error: "PLAYER_NOT_FOUND"
    };
    }


    /*
    * Um jogador só pode escolher
    * uma ação por turno.
    */
    if (
      player.action !== null
    ) {
      return {
        ok: false,
        error:
          "ACTION_ALREADY_SELECTED",

        slot:
          player.action.slot
      };
    }


    /*
    * Verifica o custo sem revelar
    * a habilidade para o adversário.
    */
    const validationSkillsData =
      await fetchJson(
        SKILLS_URL
      );


    const selectedAction =
      resolveSkillFromSlot(
        player.loadout,
        normalizedSlot,
        validationSkillsData
      );


    if (!selectedAction) {
      return {
        ok: false,
        error:
          "SKILL_NOT_FOUND"
      };
    }


    const mentalidadeCheck =
      canPaySkillCost(
        player,
        selectedAction.skill
      );


    if (
      !mentalidadeCheck.ok
    ) {
      return {
        ok: false,

        error:
          "INSUFFICIENT_MENTALIDADE",

        slot:
          normalizedSlot,

        currentMentalidade:
          mentalidadeCheck.current,

        requiredMentalidade:
          mentalidadeCheck.cost
      };
    }


    if (
      isMeditation
    ) {
      const currentMentalidade =
        Math.max(
          0,
          Number(
            player.mentalidade
          ) || 0
        );


      const maxMentalidade =
        Math.max(
          1,
          Number(
            player.maxMentalidade
          ) || 1
        );


      /*
      * Não deixa desperdiçar um turno
      * meditando com a barra cheia.
      */
      if (
        currentMentalidade >=
        maxMentalidade
      ) {
        return {
          ok: false,
          error:
            "MENTALIDADE_FULL",

          currentMentalidade,
          maxMentalidade
        };
      }


      const availableAtTurn =
        Math.max(
          1,
          Number(
            player
              .meditationAvailableAtTurn
          ) || 1
        );


      if (
        battle.turn <
        availableAtTurn
      ) {
        return {
          ok: false,

          error:
            "MEDITATION_COOLDOWN",

          availableAtTurn,

          currentTurn:
            battle.turn,

          turnsRemaining:
            availableAtTurn -
            battle.turn
        };
      }
    }

    /*
    * Guarda SOMENTE o número do slot.
    *
    * A habilidade ainda não é revelada.
    */
    player.action = {
        slot:
        normalizedSlot,

        selectedAt:
        Date.now()
    };


    /*
    * O adversário ainda não escolheu.
    */
    if (
        opponent.action === null
    ) {
        await this.saveData(
        data
        );


        return {
        ok: true,

        waiting:
            true,

        meditating:
          isMeditation,

        user,

        opponent:
            opponent.user,

        slot:
            normalizedSlot,

        turn:
            battle.turn
        };
    }


    /*
    * ==============================
    * OS DOIS ESCOLHERAM
    * ==============================
    */

    battle.state =
        "RESOLVING";


    const skillsData =
        await fetchJson(
        SKILLS_URL
        );


    const player1Action =
        resolveSkillFromSlot(
        battle.player1.loadout,
        battle.player1.action.slot,
        skillsData
        );


    const player2Action =
        resolveSkillFromSlot(
        battle.player2.loadout,
        battle.player2.action.slot,
        skillsData
        );


    if (
    !player1Action ||
    !player2Action
    ) {
    battle.player1.action =
        null;

    battle.player2.action =
        null;

    battle.state =
        "WAITING_ACTIONS";


    await this.saveData(
        data
    );


    return {
        ok: false,
        error:
        "SKILL_NOT_FOUND"
    };
    }


    const priority1 =
        getSkillPriority(
        player1Action.skill
        );

    const priority2 =
        getSkillPriority(
        player2Action.skill
        );


    let first;
    let second;


    /*
    * PRIMEIRO:
    * prioridade da habilidade.
    */
    if (
        priority1 >
        priority2
    ) {
        first = {
        player:
            battle.player1,
        action:
            player1Action
        };

        second = {
        player:
            battle.player2,
        action:
            player2Action
        };
    }

    else if (
        priority2 >
        priority1
    ) {
        first = {
        player:
            battle.player2,
        action:
            player2Action
        };

        second = {
        player:
            battle.player1,
        action:
            player1Action
        };
    }

    /*
    * SEGUNDO:
    * velocidade.
    */
    else if (
        battle.player1.speed >
        battle.player2.speed
    ) {
        first = {
        player:
            battle.player1,
        action:
            player1Action
        };

        second = {
        player:
            battle.player2,
        action:
            player2Action
        };
    }

    else if (
        battle.player2.speed >
        battle.player1.speed
    ) {
        first = {
        player:
            battle.player2,
        action:
            player2Action
        };

        second = {
        player:
            battle.player1,
        action:
            player1Action
        };
    }

    /*
    * TERCEIRO:
    * empate total = 50/50.
    */
    else {
        const player1First =
        Math.random() < 0.5;


        first =
        player1First
            ? {
                player:
                battle.player1,
                action:
                player1Action
            }
            : {
                player:
                battle.player2,
                action:
                player2Action
            };


        second =
        player1First
            ? {
                player:
                battle.player2,
                action:
                player2Action
            }
            : {
                player:
                battle.player1,
                action:
                player1Action
            };
    }


    const currentTurn =
    battle.turn;

    const player1Slot =
    battle.player1.action.slot;

    const player2Slot =
    battle.player2.action.slot;


    /*
    * ==============================
    * PRIMEIRO ATAQUE
    * ==============================
    */

        /*
     * ==============================
     * CONTROLE DO PRIMEIRO JOGADOR
     * ==============================
     *
     * Antes de gastar Mentalidade
     * ou executar a habilidade,
     * verificamos se existe Controle.
     */
    const firstControl =
      consumeControlBlock(
        first.player
      );


    let firstExecution;


    if (
      firstControl.blocked
    ) {
      /*
       * A ação foi impedida.
       *
       * Não gasta Mentalidade.
       * Não consome habilidade
       * temporária do Neutro.
       */
      firstExecution =
        createControlBlockedExecution(
          first.player,
          first.action,
          firstControl
        );
    }


    else {
      spendSkillMentalidade(
        first.player,
        first.action.skill
      );


      firstExecution =
        executeBattleAction(
          first.player,
          second.player,
          first.action,
          battle.turn
        );


      /*
       * Só consumimos a habilidade
       * porque ela realmente executou.
       */
      await this.consumeExecutedSkill(
        first.player,
        first.action
      );
    }


    let secondExecution =
    null;

    let battleOver =
    false;

    let winner =
    null;

    let loser =
    null;

    let rankedResult =
    null;

    let dotTicks =
      [];

    let poisonTicks =
      [];

    let burnTicks =
      [];

    let dotDefeats = {
      player1: null,
      player2: null
    };

    let draw =
      false;

    /*
    * Se o primeiro ataque matou,
    * o segundo jogador não executa.
    */
    if (
    second.player.hp <= 0
    ) {
    battleOver =
        true;

    winner =
        first.player.user;

    loser =
        second.player.user;
    }

    else {
    /*
    * ==============================
    * SEGUNDO ATAQUE
    * ==============================
    */

        /*
     * ==============================
     * CONTROLE DO SEGUNDO JOGADOR
     * ==============================
     *
     * Esta verificação acontece
     * somente quando chega a vez
     * real dele agir.
     *
     * Isso permite que o primeiro
     * jogador aplique Controle
     * durante o mesmo turno.
     */
    const secondControl =
      consumeControlBlock(
        second.player
      );


    if (
      secondControl.blocked
    ) {
      secondExecution =
        createControlBlockedExecution(
          second.player,
          second.action,
          secondControl
        );
    }


    else {
      spendSkillMentalidade(
        second.player,
        second.action.skill
      );


      secondExecution =
        executeBattleAction(
          second.player,
          first.player,
          second.action,
          battle.turn
        );


      await this.consumeExecutedSkill(
        second.player,
        second.action
      );
    }


    if (
        first.player.hp <= 0
    ) {
        battleOver =
        true;

        winner =
        second.player.user;

        loser =
        first.player.user;
    }
    }


    /*
    * As escolhas deste turno
    * sempre são apagadas.
    */
    battle.player1.action =
    null;

    battle.player2.action =
    null;


    /*
    * ==============================
    * FIM DA BATALHA
    * ==============================
    */
    if (battleOver) {
    /*
    * Resultado ranqueado.
    *
    * Isso altera somente o
    * XP de Combate/PvP.
    */
    rankedResult =
        await this.applyRankedBattleResult(
        winner,
        loser
        );


    battle.status =
        "FINISHED";

    battle.state =
        "FINISHED";

    battle.winner =
        winner;

    battle.loser =
        loser;

    battle.rankedResult =
        rankedResult;

    battle.finishedAt =
        Date.now();
    }

    /*
    * ==============================
    * PRÓXIMO TURNO
    * ==============================
    */
    else {
      battle.turn += 1;


      /*
       * ==============================
       * DANO PERIÓDICO
       * ==============================
       *
       * Todos os DoTs são processados
       * juntos no início do turno.
       *
       * Hoje:
       * ☠️ Veneno
       * 🔥 Queimadura
       */
      const player1Dots =
        processDamageOverTimeEffects(
          battle.player1,
          battle.turn,
          [
            "veneno",
            "queimadura"
          ]
        );


      const player2Dots =
        processDamageOverTimeEffects(
          battle.player2,
          battle.turn,
          [
            "veneno",
            "queimadura"
          ]
        );

      /*
       * Registra exatamente qual DoT
       * foi responsável por levar
       * cada jogador a 0 HP.
       */
      dotDefeats = {
        player1:
          player1Dots.killedBy
            ? {
                user:
                  battle.player1.user,

                ...player1Dots.killedBy
              }
            : null,

        player2:
          player2Dots.killedBy
            ? {
                user:
                  battle.player2.user,

                ...player2Dots.killedBy
              }
            : null
      };

      dotTicks = [
        ...player1Dots.ticks.map(
          tick => ({
            ...tick,

            user:
              battle.player1.user,

            maxHp:
              battle.player1.maxHp
          })
        ),

        ...player2Dots.ticks.map(
          tick => ({
            ...tick,

            user:
              battle.player2.user,

            maxHp:
              battle.player2.maxHp
          })
        )
      ];


      /*
       * Mantemos listas separadas
       * também por compatibilidade
       * com o código atual.
       */
      poisonTicks =
        dotTicks.filter(
          tick =>
            tick.type ===
            "veneno"
        );


      burnTicks =
        dotTicks.filter(
          tick =>
            tick.type ===
            "queimadura"
        );


      /*
      * Buffs e Debuffs também
      * expiraram ao iniciar
      * o novo turno.
      */
      expireBattleEffects(
        battle.player1,
        battle.turn
      );


      expireBattleEffects(
        battle.player2,
        battle.turn
      );


      const player1Dead =
        Number(
          battle.player1.hp
        ) <= 0;


      const player2Dead =
        Number(
          battle.player2.hp
        ) <= 0;


      /*
      * ==============================
      * DERROTA POR DANO PERIÓDICO
      * ==============================
      */
      if (
        player1Dead ||
        player2Dead
      ) {
        battleOver =
          true;


        /*
        * Os dois morreram no mesmo
        * início de turno.
        *
        * Não existe vencedor.
        */
        if (
          player1Dead &&
          player2Dead
        ) {
          draw =
            true;

          winner =
            null;

          loser =
            null;

          rankedResult =
            null;


          battle.status =
            "FINISHED";

          battle.state =
            "FINISHED";

          battle.draw =
            true;

          battle.finishedAt =
            Date.now();
        }


        /*
        * Apenas Player 1 caiu.
        */
        else if (
          player1Dead
        ) {
          winner =
            battle.player2.user;

          loser =
            battle.player1.user;


          rankedResult =
            await this.applyRankedBattleResult(
              winner,
              loser
            );


          battle.status =
            "FINISHED";

          battle.state =
            "FINISHED";

          battle.winner =
            winner;

          battle.loser =
            loser;

          battle.rankedResult =
            rankedResult;

          battle.finishedAt =
            Date.now();
        }


        /*
        * Apenas Player 2 caiu.
        */
        else {
          winner =
            battle.player1.user;

          loser =
            battle.player2.user;


          rankedResult =
            await this.applyRankedBattleResult(
              winner,
              loser
            );


          battle.status =
            "FINISHED";

          battle.state =
            "FINISHED";

          battle.winner =
            winner;

          battle.loser =
            loser;

          battle.rankedResult =
            rankedResult;

          battle.finishedAt =
            Date.now();
        }
      }


      /*
      * Ninguém foi derrotado por dano periódico.
      *
      * O novo turno abre normalmente.
      */
      else {
        battle.state =
          "WAITING_ACTIONS";
      }
    }

    await this.saveData(
    data
    );


    return {
    ok: true,

    waiting: false,

    turn:
        currentTurn,

    player1: {
        user:
        battle.player1.user,

        slot:
        player1Slot,

        skill:
        player1Action.skill.nome
    },

    player2: {
        user:
        battle.player2.user,

        slot:
        player2Slot,

        skill:
        player2Action.skill.nome
    },

    firstExecution,

    secondExecution,

    hp: {
        player1: {
        user:
            battle.player1.user,

        current:
            battle.player1.hp,

        max:
            battle.player1.maxHp
        },

        player2: {
        user:
            battle.player2.user,

        current:
            battle.player2.hp,

        max:
            battle.player2.maxHp
        }
    },
        
    mentalidade: {
      player1: {
        user:
          battle.player1.user,

        current:
          battle.player1.mentalidade,

        max:
          battle.player1.maxMentalidade
      },

      player2: {
        user:
          battle.player2.user,

        current:
          battle.player2.mentalidade,

        max:
          battle.player2.maxMentalidade
      }
    },

        battleOver,

        winner,

        loser,

        rankedResult,

        dotTicks,

        poisonTicks,

        burnTicks,

        dotDefeats,

        draw,

        nextTurn:
          battleOver
            ? null
            : battle.turn
    };
    }

  async getPlayerState(
    user
  ) {
    user =
      normalizeUser(
        user
      );


    if (!user) {
      return {
        ok: false,
        error: "INVALID_USER"
      };
    }


    const data =
      await this.getData();


    const battle =
      this.findBattleByUser(
        data,
        user
      );


    if (!battle) {
      return {
        ok: true,
        inBattle: false
      };
    }


    const player =
      battle.player1.user === user
        ? battle.player1
        : battle.player2;


    const opponent =
      battle.player1.user === user
        ? battle.player2
        : battle.player1;


    return {
      ok: true,

      inBattle: true,

      turn:
        battle.turn,

      opponent:
        opponent.user,

      hp:
        player.hp,

      maxHp:
        player.maxHp,

      mentalidade:
        player.mentalidade,

      maxMentalidade:
        player.maxMentalidade,

      effects:
        Array.isArray(
          player.effects
        )
          ? player.effects
          : []
    };
  }

  async fetch(
    request
  ) {
    const url =
      new URL(
        request.url
      );


    if (
      url.pathname ===
      "/challenge"
    ) {
      const result =
        await this.createChallenge(
          url.searchParams.get(
            "challenger"
          ),
          url.searchParams.get(
            "target"
          )
        );


      return Response.json(
        result
      );
    }


    if (
      url.pathname ===
      "/accept"
    ) {
      const result =
        await this.acceptChallenge(
          url.searchParams.get(
            "user"
          )
        );


      return Response.json(
        result
      );
    }

    if (
    url.pathname ===
    "/action"
    ) {
    const result =
        await this.chooseAction(
        url.searchParams.get(
            "user"
        ),
        url.searchParams.get(
            "slot"
        )
        );


    return Response.json(
        result
    );
    }

    if (
      url.pathname ===
      "/player-state"
    ) {
      const result =
        await this.getPlayerState(
          url.searchParams.get(
            "user"
          )
        );


      return Response.json(
        result
      );
    }

    if (
      url.pathname === "/ping"
    ) {
      return new Response(
        "PVP_COORDINATOR_OK"
      );
    }


    return new Response(
      "PVP Coordinator | Rota não encontrada",
      {
        status: 404
      }
    );
  }
}