import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";


const PARALYSIS_SKILL =
  "Eletricidade:Raio_Instantaneo";

const FIRE_SKILL =
  "Fogo:Chama_Devastadora";


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
  {
    speed,
    skillId,
    element
  }
) {
  return {
    user,

    race:
      "Terrariano",

    elements: [
      element
    ],

    level: 1,
    xp: 0,

    hp: 1000,
    maxHp: 1000,

    mentalidade: 100,
    maxMentalidade: 100,

    strength: 10,
    magicStrength: 10,
    speed,
    evasion: 0,
    accuracy: 100,
    defense: 10,

    skills: [
      skillId
    ],

    skillMeta: {
      [skillId]: {
        source:
          "admin",

        temporary:
          false
      }
    },

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
    speed,
    skillId
  }
) {
  return {
    user,

    hp: 1000,
    maxHp: 1000,

    mentalidade: 100,
    maxMentalidade: 100,

    strength: 10,
    magicStrength: 10,
    speed,
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
    action: null
  };
}


async function createScenario({
  p1Speed,
  p2Speed
}) {
  const kv =
    new FakeKV();


  await kv.put(
    "p1",
    JSON.stringify(
      makeProfile(
        "p1",
        {
          speed:
            p1Speed,

          skillId:
            PARALYSIS_SKILL,

          element:
            "Eletricidade"
        }
      )
    )
  );


  await kv.put(
    "p2",
    JSON.stringify(
      makeProfile(
        "p2",
        {
          speed:
            p2Speed,

          skillId:
            FIRE_SKILL,

          element:
            "Fogo"
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

          player1:
            makePlayer(
              "p1",
              {
                speed:
                  p1Speed,

                skillId:
                  PARALYSIS_SKILL
              }
            ),

          player2:
            makePlayer(
              "p2",
              {
                speed:
                  p2Speed,

                skillId:
                  FIRE_SKILL
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


  return {
    kv,
    storage,
    coordinator
  };
}


function executionFor(
  result,
  user
) {
  if (
    result.firstExecution
      ?.attacker === user
  ) {
    return result.firstExecution;
  }


  if (
    result.secondExecution
      ?.attacker === user
  ) {
    return result.secondExecution;
  }


  return null;
}


const originalRandom =
  Math.random;


/*
 * Raio Instantâneo possui
 * precisão 100, mas também
 * fixamos o RNG para deixar
 * todos os ataques determinísticos.
 */
Math.random =
  () => 0;


try {
  /*
   * ==================================
   * CENÁRIO A
   *
   * O usuário da Paralisia é mais
   * rápido.
   *
   * Resultado esperado:
   *
   * Raio Instantâneo executa primeiro
   * → Paralisia entra
   * → chega a vez do alvo
   * → a ação dele é bloqueada
   * no MESMO turno.
   * ==================================
   */
  {
    const {
      storage,
      coordinator
    } =
      await createScenario({
        p1Speed: 100,
        p2Speed: 1
      });


    await coordinator.chooseAction(
      "p1",
      1
    );


    const result =
      await coordinator.chooseAction(
        "p2",
        1
      );


    const battle =
      storage.data.pvp
        .battles[0];


    const p1Execution =
      executionFor(
        result,
        "p1"
      );


    const p2Execution =
      executionFor(
        result,
        "p2"
      );


    console.log(
      "\n=============================="
    );

    console.log(
      "CENÁRIO A — PARALISIA NO MESMO TURNO"
    );

    console.log(
      "=============================="
    );


    console.log(
      "P1:",
      p1Execution
    );

    console.log(
      "P2:",
      p2Execution
    );

    console.log(
      "Mentalidade P1:",
      battle.player1.mentalidade
    );

    console.log(
      "Mentalidade P2:",
      battle.player2.mentalidade
    );

    console.log(
      "Efeitos P2:",
      battle.player2.effects
    );


    assert.ok(
      p1Execution,
      "Execução do Raio Instantâneo não encontrada."
    );


    assert.equal(
      p1Execution.kind,
      "paralysis"
    );

    assert.equal(
      p1Execution.skill,
      "Raio Instantâneo"
    );

    assert.equal(
      p1Execution.hit,
      true
    );

    assert.equal(
      p1Execution.controlApplied,
      true
    );

    assert.equal(
      p1Execution.control.type,
      "paralisia"
    );

    assert.equal(
      p1Execution.control.remainingBlocks,
      1
    );


    assert.ok(
      p2Execution,
      "Execução bloqueada de P2 não encontrada."
    );

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

    assert.equal(
      p2Execution.control.remainingBlocks,
      0
    );


    /*
     * Raio Instantâneo custa 18.
     */
    assert.equal(
      battle.player1.mentalidade,
      82
    );


    /*
     * Chama Devastadora custa 20,
     * mas foi bloqueada antes
     * de executar.
     */
    assert.equal(
      battle.player2.mentalidade,
      100
    );


    /*
     * O único bloqueio foi consumido
     * no mesmo turno.
     */
    assert.equal(
      battle.player2.effects.some(
        effect =>
          effect.effectCategory ===
          "control"
      ),
      false
    );


    assert.equal(
      battle.turn,
      2
    );


    console.log(
      "✅ Raio Instantâneo aplicou Paralisia."
    );

    console.log(
      "✅ Alvo perdeu a ação no mesmo turno."
    );

    console.log(
      "✅ Mentalidade da ação bloqueada foi preservada."
    );
  }


  /*
   * ==================================
   * CENÁRIO B
   *
   * O alvo é mais rápido.
   *
   * Turno 1:
   * P2 age primeiro.
   * P1 paralisa depois.
   *
   * Como P2 já agiu, o Controle
   * precisa continuar ativo.
   *
   * Turno 2:
   * P2 seria novamente o primeiro,
   * mas a Paralisia bloqueia sua
   * ação nesse momento.
   * ==================================
   */
  {
    const {
      storage,
      coordinator
    } =
      await createScenario({
        p1Speed: 1,
        p2Speed: 100
      });


    /*
     * T1:
     * P1 escolhe Raio Instantâneo.
     */
    await coordinator.chooseAction(
      "p1",
      1
    );


    /*
     * P2 usa Soco no T1.
     * Ele age antes de P1.
     */
    const turn1 =
      await coordinator.chooseAction(
        "p2",
        4
      );


    const battleAfterTurn1 =
      storage.data.pvp
        .battles[0];


    const p1Turn1 =
      executionFor(
        turn1,
        "p1"
      );

    const p2Turn1 =
      executionFor(
        turn1,
        "p2"
      );


    console.log(
      "\n=============================="
    );

    console.log(
      "CENÁRIO B — PARALISIA NO TURNO SEGUINTE"
    );

    console.log(
      "=============================="
    );


    console.log(
      "T1 P2:",
      p2Turn1
    );

    console.log(
      "T1 P1:",
      p1Turn1
    );

    console.log(
      "Efeitos P2 após T1:",
      battleAfterTurn1.player2.effects
    );


    assert.equal(
      p2Turn1.kind,
      "damage"
    );

    assert.equal(
      p2Turn1.skill,
      "Soco"
    );

    assert.equal(
      p1Turn1.kind,
      "paralysis"
    );

    assert.equal(
      p1Turn1.controlApplied,
      true
    );


    const activeControl =
      battleAfterTurn1.player2.effects.find(
        effect =>
          effect.effectCategory ===
          "control" &&
          effect.type ===
          "paralisia"
      );


    assert.ok(
      activeControl,
      "Paralisia deveria continuar ativa após o T1."
    );

    assert.equal(
      activeControl.remainingBlocks,
      1
    );

    assert.equal(
      battleAfterTurn1.turn,
      2
    );


    /*
     * T2:
     * P2 tenta Chama Devastadora.
     * Como é mais rápido, chegaria
     * primeiro — mas deve ser
     * bloqueado pela Paralisia.
     */
    await coordinator.chooseAction(
      "p2",
      1
    );


    /*
     * P1 usa Soco para não reaplicar
     * Paralisia neste turno.
     */
    const turn2 =
      await coordinator.chooseAction(
        "p1",
        4
      );


    const battleAfterTurn2 =
      storage.data.pvp
        .battles[0];


    const p2Turn2 =
      executionFor(
        turn2,
        "p2"
      );

    const p1Turn2 =
      executionFor(
        turn2,
        "p1"
      );


    console.log(
      "T2 P2:",
      p2Turn2
    );

    console.log(
      "T2 P1:",
      p1Turn2
    );

    console.log(
      "Efeitos P2 após T2:",
      battleAfterTurn2.player2.effects
    );


    assert.equal(
      p2Turn2.kind,
      "control_blocked"
    );

    assert.equal(
      p2Turn2.control.type,
      "paralisia"
    );

    assert.equal(
      p2Turn2.control.remainingBlocks,
      0
    );


    assert.equal(
      p1Turn2.kind,
      "damage"
    );

    assert.equal(
      p1Turn2.skill,
      "Soco"
    );


    /*
     * P2 não gastou Mentalidade
     * em nenhum dos dois turnos:
     * Soco no T1 custa 0 e
     * Chama Devastadora foi
     * bloqueada no T2.
     */
    assert.equal(
      battleAfterTurn2.player2.mentalidade,
      100
    );


    assert.equal(
      battleAfterTurn2.player2.effects.some(
        effect =>
          effect.effectCategory ===
          "control"
      ),
      false
    );

    assert.equal(
      battleAfterTurn2.turn,
      3
    );


    console.log(
      "✅ Alvo agiu normalmente antes de ser paralisado."
    );

    console.log(
      "✅ Paralisia permaneceu guardada após o T1."
    );

    console.log(
      "✅ A ação do alvo foi bloqueada no T2."
    );

    console.log(
      "✅ Controle desapareceu após cumprir o bloqueio."
    );
  }


  console.log(
    "\n⚡ TODOS OS TESTES PvP DE PARALISIA PASSARAM."
  );
}

finally {
  Math.random =
    originalRandom;
}
