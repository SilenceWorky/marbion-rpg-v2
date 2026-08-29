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


    const normalizedSlot =
        Number(slot);


    if (!user) {
        return {
        ok: false,
        error: "INVALID_USER"
        };
    }


    if (
        !Number.isInteger(
        normalizedSlot
        ) ||
        normalizedSlot < 1 ||
        normalizedSlot > 4
    ) {
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

    const firstExecution =
    executeOffensiveAction(
        first.player,
        second.player,
        first.action
    );


    /*
    * A habilidade foi EXECUTADA.
    *
    * Se for temporária do Neutro,
    * o uso é consumido mesmo que erre.
    */
    await this.consumeExecutedSkill(
    first.player,
    first.action
    );


    let secondExecution =
    null;

    let battleOver =
    false;

    let winner =
    null;

    let loser =
    null;


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

    secondExecution =
        executeOffensiveAction(
        second.player,
        first.player,
        second.action
        );


    await this.consumeExecutedSkill(
        second.player,
        second.action
    );


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
    battle.status =
        "FINISHED";

    battle.state =
        "FINISHED";

    battle.winner =
        winner;

    battle.loser =
        loser;

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

    battle.state =
        "WAITING_ACTIONS";
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

    battleOver,

    winner,

    loser,

    nextTurn:
        battleOver
        ? null
        : battle.turn
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