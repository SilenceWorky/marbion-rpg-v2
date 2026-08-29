import {
  getProfile
} from "../core/database.js";

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

        speed:
            challengerProfile.speed,

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

    speed:
        targetProfile.speed,

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
    if (
        !Array.isArray(
        player.loadout
        )
    ) {
        const profile =
        await getProfile(
            this.env,
            player.user
        );


        if (!profile) {
        return {
            ok: false,
            error: "PLAYER_NOT_FOUND"
        };
        }


        player.loadout =
        snapshotLoadout(
            profile
        );
    }


    if (
        !Array.isArray(
        opponent.loadout
        )
    ) {
        const profile =
        await getProfile(
            this.env,
            opponent.user
        );


        if (!profile) {
        return {
            ok: false,
            error: "PLAYER_NOT_FOUND"
        };
        }


        opponent.loadout =
        snapshotLoadout(
            profile
        );
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


    /*
    * Por enquanto NÃO causamos dano.
    *
    * Só confirmamos:
    * - escolha secreta;
    * - revelação;
    * - prioridade;
    * - velocidade;
    * - ordem correta.
    */


    const result = {
        ok: true,

        waiting:
        false,

        turn:
        battle.turn,

        player1: {
        user:
            battle.player1.user,

        slot:
            battle.player1.action.slot,

        skill:
            player1Action.skill.nome,

        priority:
            priority1,

        speed:
            battle.player1.speed
        },

        player2: {
        user:
            battle.player2.user,

        slot:
            battle.player2.action.slot,

        skill:
            player2Action.skill.nome,

        priority:
            priority2,

        speed:
            battle.player2.speed
        },

        first: {
        user:
            first.player.user,

        skill:
            first.action.skill.nome
        },

        second: {
        user:
            second.player.user,

        skill:
            second.action.skill.nome
        }
    };


    /*
    * Como ainda não existe dano,
    * já avançamos para o turno seguinte.
    */

    battle.player1.action =
        null;

    battle.player2.action =
        null;

    battle.turn += 1;

    battle.state =
        "WAITING_ACTIONS";


    await this.saveData(
        data
    );


    return result;
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