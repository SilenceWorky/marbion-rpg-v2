import assert from "node:assert/strict";

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


const SKILL_ID =
  "Fogo:Chama_Devastadora";


function makeProfile(
  user,
  skillId = null
) {
  return {
    user,

    race:
      "Terrariano",

    elements: [
      "Fogo"
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
    mentalidade = 100
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

    effects: [],

    action:
      null
  };
}


const kv =
  new FakeKV();


await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1",
      SKILL_ID
    )
  )
);


await kv.put(
  "p2",
  JSON.stringify(
    makeProfile(
      "p2",
      null
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
            {
              skillId:
                SKILL_ID,

              hp: 100,

              mentalidade:
                100
            }
          ),

        player2:
          makePlayer(
            "p2",
            {
              skillId:
                null,

              hp: 100,

              /*
               * P2 apenas medita.
               */
              mentalidade:
                0
            }
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
 * Não queremos que ranking
 * interfira neste teste.
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
      user:
        winner,

      before: 1000,
      after: 1000,
      rank: "Teste",
      streak: 1
    },

    loser: {
      user:
        loser,

      before: 1000,
      after: 1000,
      rank: "Teste"
    }
  });


const originalRandom =
  Math.random;


/*
 * Força o ataque a acertar.
 */
Math.random =
  () => 0;


try {
  /*
   * P1 usa Chama Devastadora.
   */
  await coordinator.chooseAction(
    "p1",
    1
  );


  /*
   * P2 medita.
   *
   * Ao resolver o turno,
   * T2 começa e a Queimadura
   * já deve causar o primeiro tick.
   */
  const result =
    await coordinator.chooseAction(
      "p2",
      "meditar"
    );


  const battle =
    storage.data.pvp
      .battles[0];


  const burnExecution =
    result.firstExecution
      ?.kind === "burn"
      ? result.firstExecution
      : result.secondExecution;


  console.log(
    "\n=============================="
  );

  console.log(
    "TESTE — CHAMA DEVASTADORA PvP"
  );

  console.log(
    "=============================="
  );


  console.log(
    "Habilidade:",
    burnExecution?.skill
  );

  console.log(
    "Tipo da execução:",
    burnExecution?.kind
  );

  console.log(
    "Acertou:",
    burnExecution?.hit
  );

  console.log(
    "Dano direto:",
    burnExecution?.damage
  );

  console.log(
    "Queimadura aplicada:",
    burnExecution?.burnApplied
  );

  console.log(
    "Dano por tick:",
    burnExecution
      ?.burn
      ?.damagePerTurn
  );

  console.log(
    "Duração:",
    burnExecution
      ?.burn
      ?.duration
  );

  console.log(
    "DoTs retornados:",
    result.dotTicks
  );

  console.log(
    "Burn ticks:",
    result.burnTicks
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


  /*
   * ==============================
   * VALIDAÇÕES
   * ==============================
   */

  assert.ok(
    burnExecution,
    "A execução de Queimadura não foi encontrada."
  );


  assert.equal(
    burnExecution.skill,
    "Chama Devastadora"
  );


  assert.equal(
    burnExecution.kind,
    "burn"
  );


  assert.equal(
    burnExecution.hit,
    true
  );


  assert.equal(
    burnExecution.burnApplied,
    true
  );


  /*
   * custoMentalidade = 20
   *
   * 20 × 0.45 = 9
   */
  assert.equal(
    burnExecution
      .burn
      .damagePerTurn,
    9
  );


  assert.equal(
    burnExecution
      .burn
      .duration,
    2
  );


  /*
   * Primeiro tick deve acontecer
   * automaticamente na abertura
   * do Turno 2.
   */
  assert.equal(
    result.burnTicks.length,
    1
  );


  assert.equal(
    result.burnTicks[0].type,
    "queimadura"
  );


  assert.equal(
    result.burnTicks[0].source,
    "Chama Devastadora"
  );


  assert.equal(
    result.burnTicks[0].damage,
    9
  );


  assert.equal(
    result.burnTicks[0].remainingTicks,
    1
  );


  assert.equal(
    result.dotTicks.length,
    1
  );


  assert.equal(
    battle.turn,
    2
  );


  const activeBurn =
    battle.player2.effects.find(
      effect =>
        effect.type ===
        "queimadura"
    );


  assert.ok(
    activeBurn,
    "Queimadura deveria continuar ativa após o primeiro tick."
  );


  assert.equal(
    activeBurn.damagePerTurn,
    9
  );


  assert.equal(
    activeBurn.remainingTicks,
    1
  );


  console.log(
    "\n🔥 TESTE PvP DA CHAMA DEVASTADORA PASSOU."
  );
}

finally {
  Math.random =
    originalRandom;
}