import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";


class FakeStorage {
  constructor(data) {
    this.data = {
      pvp: data
    };
  }


  async get(key) {
    return (
      this.data[key] ??
      null
    );
  }


  async put(
    key,
    value
  ) {
    this.data[key] =
      value;
  }
}


class FakeKV {
  constructor() {
    this.data =
      new Map();
  }


  async get(key) {
    return (
      this.data.get(
        key
      ) ??
      null
    );
  }


  async put(
    key,
    value
  ) {
    this.data.set(
      key,
      value
    );
  }


  async delete(key) {
    this.data.delete(
      key
    );
  }
}


function makeProfile(
  user,
  skillId = null
) {
  return {
    user,

    race:
      "Terrariano",

    elements: [
      "Veneno"
    ],

    level: 1,
    xp: 0,

    hp: 100,
    maxHp: 100,

    mentalidade: 100,
    maxMentalidade: 100,

    strength: 10,
    magicStrength: 10,

    speed:
      user === "p1"
        ? 100
        : 1,

    evasion: 0,
    accuracy: 100,
    defense: 10,

    skills:
      skillId
        ? [skillId]
        : [],

    skillMeta:
      skillId
        ? {
            [skillId]: {
              source:
                "admin",

              temporary:
                false
            }
          }
        : {},

    equippedSkills: [
      skillId,
      null,
      null,
      null
    ],

    skillCooldowns: {},

    inventory: [],
    statusEffects: {}
  };
}


function makePlayer(
  user,
  {
    skillId = null,
    hp = 100,
    mentalidade = 100,
    effects = []
  } = {}
) {
  return {
    user,

    hp,
    maxHp: 100,

    mentalidade,
    maxMentalidade: 100,

    strength: 10,
    magicStrength: 10,

    speed:
      user === "p1"
        ? 100
        : 1,

    evasion: 0,
    accuracy: 100,
    defense: 10,

    loadout: [
      skillId,
      null,
      null,
      null
    ],

    effects,

    action:
      null
  };
}


async function createTest(
  player1,
  player2
) {
  const kv =
    new FakeKV();


  await kv.put(
    "p1",
    JSON.stringify(
      makeProfile(
        "p1",
        player1.skillId
      )
    )
  );


  await kv.put(
    "p2",
    JSON.stringify(
      makeProfile(
        "p2",
        player2.skillId
      )
    )
  );


  const storage =
    new FakeStorage({
      challenges: [],

      battles: [
        {
          id:
            crypto.randomUUID(),

          status:
            "ACTIVE",

          state:
            "WAITING_ACTIONS",

          turn: 1,

          player1:
            makePlayer(
              "p1",
              player1
            ),

          player2:
            makePlayer(
              "p2",
              player2
            ),

          createdAt:
            Date.now()
        }
      ]
    });


  const coordinator =
    new PvpCoordinator(
      {
        storage
      },
      {
        MARBION_USERS_V2:
          kv
      }
    );


  /*
   * Impede o teste local
   * de depender do ranking.
   */
  coordinator
    .applyRankedBattleResult =
    async (
      winner,
      loser
    ) => ({
      ok: true,
      change: 0,

      winner: {
        user: winner,
        before: 1000,
        after: 1000,
        rank: "Teste",
        streak: 1
      },

      loser: {
        user: loser,
        before: 1000,
        after: 1000,
        rank: "Teste"
      }
    });


  return {
    coordinator,
    storage
  };
}


const originalRandom =
  Math.random;


/*
 * Força acertos e deixa
 * os testes determinísticos.
 */
Math.random =
  () => 0;


/*
 * ==================================
 * TESTE 1
 *
 * NUVEM TÓXICA REAL
 *
 * dano direto
 * + Debuff
 * + Veneno
 * + primeiro tick no T2
 * ==================================
 */
{
  const skillId =
    "Veneno:Nuvem_Toxica";


  const {
    coordinator,
    storage
  } =
    await createTest(
      {
        skillId,
        hp: 100,
        mentalidade: 100
      },

      {
        skillId: null,
        hp: 100,

        /*
         * P2 vai meditar,
         * evitando causar dano.
         */
        mentalidade: 0
      }
    );


  await coordinator.chooseAction(
    "p1",
    1
  );


  const result =
    await coordinator.chooseAction(
      "p2",
      "meditar"
    );


  const battle =
    storage.data.pvp
      .battles[0];


  const poisonExecution =
    result.firstExecution
      ?.kind === "poison"
      ? result.firstExecution
      : result.secondExecution;


  console.log(
    "\n=============================="
  );

  console.log(
    "TESTE 1 — VENENO INTEGRADO"
  );

  console.log(
    "=============================="
  );


  console.log(
    "Habilidade:",
    poisonExecution?.skill
  );


  console.log(
    "Acertou:",
    poisonExecution?.hit
  );


  console.log(
    "Dano direto:",
    poisonExecution?.damage
  );


  console.log(
    "Debuff:",
    poisonExecution?.debuffApplied
  );


  console.log(
    "Veneno aplicado:",
    poisonExecution?.poisonApplied
  );


  console.log(
    "Dano por tick:",
    poisonExecution
      ?.poison
      ?.damagePerTurn
  );


  console.log(
    "Ticks retornados:",
    result.poisonTicks
  );


  console.log(
    "Turno atual:",
    battle.turn
  );


  console.log(
    "HP P2:",
    battle.player2.hp
  );


  console.log(
    "Efeitos P2:",
    battle.player2.effects
  );


  console.log(
    "\nESPERADO:"
  );

  console.log(
    "Acertou = true"
  );

  console.log(
    "Veneno aplicado = true"
  );

  console.log(
    "Dano/tick = 8"
  );

  console.log(
    "poisonTicks = 1"
  );

  console.log(
    "Turno atual = 2"
  );

  console.log(
    "P2 continua vivo"
  );
}


/*
 * ==================================
 * TESTE 2
 *
 * VENENO MATA NO INÍCIO
 * DO PRÓXIMO TURNO
 * ==================================
 */
{
  const poison = {
    type:
      "veneno",

    source:
      "Veneno de Teste",

    damagePerTurn:
      8,

    remainingTicks:
      1,

    appliedAtTurn:
      0,

    nextTickTurn:
      2
  };


  const {
    coordinator,
    storage
  } =
    await createTest(
      {
        skillId: null,
        hp: 100,
        mentalidade: 0
      },

      {
        skillId: null,
        hp: 5,
        mentalidade: 0,

        effects: [
          poison
        ]
      }
    );


  /*
   * Ambos meditam.
   *
   * Ninguém causa dano
   * durante o Turno 1.
   */
  await coordinator.chooseAction(
    "p1",
    "meditar"
  );


  const result =
    await coordinator.chooseAction(
      "p2",
      "meditar"
    );


  const battle =
    storage.data.pvp
      .battles[0];


  console.log(
    "\n=============================="
  );

  console.log(
    "TESTE 2 — MORTE POR VENENO"
  );

  console.log(
    "=============================="
  );


  console.log(
    "Poison ticks:",
    result.poisonTicks
  );


  console.log(
    "HP P2:",
    battle.player2.hp
  );


  console.log(
    "Batalha terminou:",
    result.battleOver
  );


  console.log(
    "Vencedor:",
    result.winner
  );


  console.log(
    "Perdedor:",
    result.loser
  );


  console.log(
    "Próximo turno:",
    result.nextTurn
  );


  console.log(
    "\nESPERADO:"
  );

  console.log(
    "HP P2 = 0"
  );

  console.log(
    "battleOver = true"
  );

  console.log(
    "winner = p1"
  );

  console.log(
    "loser = p2"
  );

  console.log(
    "nextTurn = null"
  );
}


/*
 * ==================================
 * TESTE 3
 *
 * OS DOIS MORREM PELO VENENO
 * ==================================
 */
{
  const poison1 = {
    type:
      "veneno",

    source:
      "Veneno P1",

    damagePerTurn:
      8,

    remainingTicks:
      1,

    appliedAtTurn:
      0,

    nextTickTurn:
      2
  };


  const poison2 = {
    type:
      "veneno",

    source:
      "Veneno P2",

    damagePerTurn:
      8,

    remainingTicks:
      1,

    appliedAtTurn:
      0,

    nextTickTurn:
      2
  };


  const {
    coordinator,
    storage
  } =
    await createTest(
      {
        skillId: null,
        hp: 5,
        mentalidade: 0,

        effects: [
          poison1
        ]
      },

      {
        skillId: null,
        hp: 5,
        mentalidade: 0,

        effects: [
          poison2
        ]
      }
    );


  await coordinator.chooseAction(
    "p1",
    "meditar"
  );


  const result =
    await coordinator.chooseAction(
      "p2",
      "meditar"
    );


  const battle =
    storage.data.pvp
      .battles[0];


  console.log(
    "\n=============================="
  );

  console.log(
    "TESTE 3 — EMPATE POR VENENO"
  );

  console.log(
    "=============================="
  );


  console.log(
    "HP P1:",
    battle.player1.hp
  );


  console.log(
    "HP P2:",
    battle.player2.hp
  );


  console.log(
    "Ticks:",
    result.poisonTicks
  );


  console.log(
    "Batalha terminou:",
    result.battleOver
  );


  console.log(
    "Empate:",
    result.draw
  );


  console.log(
    "Vencedor:",
    result.winner
  );


  console.log(
    "Próximo turno:",
    result.nextTurn
  );


  console.log(
    "\nESPERADO:"
  );

  console.log(
    "HP P1 = 0"
  );

  console.log(
    "HP P2 = 0"
  );

  console.log(
    "battleOver = true"
  );

  console.log(
    "draw = true"
  );

  console.log(
    "winner = null"
  );

  console.log(
    "nextTurn = null"
  );
}


Math.random =
  originalRandom;