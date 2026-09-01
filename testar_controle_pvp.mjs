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


const TEMP_SKILL =
  "Fogo:Chama_Devastadora";


function makeProfile(
  user,
  {
    temporarySkill =
      false
  } = {}
) {
  const skills =
    temporarySkill
      ? [TEMP_SKILL]
      : [];


  return {
    user,

    race:
      "Terrariano",

    elements:
      temporarySkill
        ? ["Neutro"]
        : ["Fogo"],

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

    skills,

    skillMeta:
      temporarySkill
        ? {
            [TEMP_SKILL]: {
              source:
                "scroll",

              temporary:
                true,

              usesRemaining:
                1
            }
          }
        : {},

    equippedSkills: [
      temporarySkill
        ? TEMP_SKILL
        : null,

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
    temporarySkill =
      false,

    effects = []
  } = {}
) {
  return {
    user,

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

    loadout: [
      temporarySkill
        ? TEMP_SKILL
        : null,

      null,
      null,
      null
    ],

    effects,

    action:
      null
  };
}


const controlEffect = {
  type:
    "paralisia",

  effectCategory:
    "control",

  source:
    "Choque de Teste",

  remainingBlocks:
    1,

  appliedAtTurn:
    0
};


const kv =
  new FakeKV();


/*
 * P1:
 * jogador normal.
 */
await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1"
    )
  )
);


/*
 * P2:
 * Neutro com Chama Devastadora
 * temporária de apenas 1 uso.
 */
await kv.put(
  "p2",
  JSON.stringify(
    makeProfile(
      "p2",
      {
        temporarySkill:
          true
      }
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

        /*
         * P1 é mais rápido.
         *
         * Usa Soco.
         */
        player1:
          makePlayer(
            "p1"
          ),

        /*
         * P2 possui Controle ativo
         * antes de tentar agir.
         */
        player2:
          makePlayer(
            "p2",
            {
              temporarySkill:
                true,

              effects: [
                {
                  ...controlEffect
                }
              ]
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


const originalRandom =
  Math.random;


/*
 * Garante acerto do Soco de P1.
 */
Math.random =
  () => 0;


try {
  /*
   * P1 escolhe um slot vazio:
   * Soco.
   */
  await coordinator.chooseAction(
    "p1",
    4
  );


  /*
   * P2 tenta usar a habilidade
   * temporária.
   */
  const result =
    await coordinator.chooseAction(
      "p2",
      1
    );


  const battle =
    storage.data.pvp
      .battles[0];


  const p2Execution =
    result.firstExecution
      ?.attacker === "p2"
      ? result.firstExecution
      : result.secondExecution;


  console.log(
    "\n=============================="
  );

  console.log(
    "TESTE — CONTROLE INTEGRADO PvP"
  );

  console.log(
    "=============================="
  );


  console.log(
    "Execução de P2:",
    p2Execution
  );


  console.log(
    "Mentalidade P2:",
    battle.player2.mentalidade
  );


  console.log(
    "Efeitos P2:",
    battle.player2.effects
  );


  /*
   * Perfil persistente depois
   * da tentativa bloqueada.
   */
  const savedProfile =
    JSON.parse(
      await kv.get(
        "p2"
      )
    );


  console.log(
    "Skills persistentes P2:",
    savedProfile.skills
  );


  console.log(
    "Metadata temporária:",
    savedProfile
      .skillMeta[
        TEMP_SKILL
      ]
  );


  /*
   * ==============================
   * VALIDAÇÕES
   * ==============================
   */


  /*
   * A ação realmente foi bloqueada.
   */
  assert.equal(
    p2Execution.kind,
    "control_blocked"
  );


  assert.equal(
    p2Execution.blocked,
    true
  );


  assert.equal(
    p2Execution.control.type,
    "paralisia"
  );


  /*
   * O Controle possuía 1 bloqueio.
   * Depois de impedir a ação,
   * deve desaparecer.
   */
  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.effectCategory ===
        "control"
    ),
    false
  );


  /*
   * Chama Devastadora custa 20.
   *
   * Como não executou:
   *
   * 100 deve continuar 100.
   */
  assert.equal(
    battle.player2.mentalidade,
    100
  );


  /*
   * A habilidade temporária
   * NÃO pode ter sido consumida.
   */
  assert.equal(
    savedProfile.skills.includes(
      TEMP_SKILL
    ),
    true
  );


  assert.equal(
    savedProfile
      .skillMeta[
        TEMP_SKILL
      ]
      .temporary,
    true
  );


  assert.equal(
    savedProfile
      .skillMeta[
        TEMP_SKILL
      ]
      .usesRemaining,
    1
  );


  /*
   * Também continua no slot
   * persistente do personagem.
   */
  assert.equal(
    savedProfile.equippedSkills[0],
    TEMP_SKILL
  );


  console.log(
    "\n✅ AÇÃO BLOQUEADA."
  );

  console.log(
    "✅ MENTALIDADE NÃO FOI GASTA."
  );

  console.log(
    "✅ HABILIDADE TEMPORÁRIA NÃO FOI CONSUMIDA."
  );

  console.log(
    "✅ CONTROLE FOI CONSUMIDO APÓS BLOQUEAR A AÇÃO."
  );


  console.log(
    "\n🧠 TESTE PvP DO MOTOR DE CONTROLE PASSOU."
  );
}

finally {
  Math.random =
    originalRandom;
}