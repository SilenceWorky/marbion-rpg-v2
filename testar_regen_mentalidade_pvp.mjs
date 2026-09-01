import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

import {
  estadoRoute
} from "./src/routes/estado.js";

import {
  MENTALIDADE_REGEN_INTERVAL_MS
} from "./src/systems/mentalidade-regen.js";


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
    mentalidade = 20,
    maxMentalidade = 50,
    lastMentalidadeRegenAt
  }
) {
  return {
    version: 2,
    user,

    race: "Terrariano",
    elements: ["Fogo"],

    xp: 0,
    level: 1,

    hp: 100,
    maxHp: 100,

    mentalidade,
    maxMentalidade,
    lastMentalidadeRegenAt,

    strength: 5,
    magicStrength: 5,
    speed: 5,
    evasion: 5,
    accuracy: 90,
    defense: 0,

    statusPoints: 0,
    statusEffects: {},

    skills: [],
    skillMeta: {},
    equippedSkills: [
      null,
      null,
      null,
      null
    ],
    skillCooldowns: {},

    inventory: {},

    pvp: {
      wins: 0,
      losses: 0,
      duels: 0,
      accepted: 0,
      refused: 0,
      streak: 0,
      bestStreak: 0,
      rating: 1000,
      peakRating: 1000,
      rank: "Prata III",
      prodigyPosition: null,
      points: 0
    },

    rebuffBonus: {
      damageBonus: 0,
      xpBonus: 0,
      criticalBonus: 0
    }
  };
}


const originalDateNow =
  Date.now;


const now =
  10_000_000;


Date.now =
  () => now;


try {
  /*
   * ==============================
   * TESTE 1
   * REGENERA ANTES DO PvP
   * ==============================
   */
  {
    const kv =
      new FakeKV();

    await kv.put(
      "p1",
      JSON.stringify(
        makeProfile(
          "p1",
          {
            mentalidade: 20,
            lastMentalidadeRegenAt:
              now -
              2 *
              MENTALIDADE_REGEN_INTERVAL_MS
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
            mentalidade: 50,
            lastMentalidadeRegenAt:
              now
          }
        )
      )
    );


    const storage =
      new FakeStorage({
        challenges: [
          {
            challenger: "p1",
            target: "p2",
            createdAt:
              now - 1000,
            expiresAt:
              now + 60_000
          }
        ],

        battles: []
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


    const result =
      await coordinator.acceptChallenge(
        "p2"
      );


    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.battle.player1.mentalidade,
      22
    );

    assert.equal(
      result.battle.player1.maxMentalidade,
      50
    );


    const savedP1 =
      JSON.parse(
        await kv.get(
          "p1"
        )
      );


    assert.equal(
      savedP1.mentalidade,
      22
    );

    assert.equal(
      savedP1.lastMentalidadeRegenAt,
      now
    );


    console.log(
      "✅ TESTE 1 — Regeneração é aplicada antes do PvP e a luta começa com a Mentalidade real."
    );
  }


  /*
   * ==============================
   * TESTE 2
   * PERSISTE AO TERMINAR
   * ==============================
   */
  {
    const kv =
      new FakeKV();

    await kv.put(
      "p1",
      JSON.stringify(
        makeProfile(
          "p1",
          {
            mentalidade: 30,
            lastMentalidadeRegenAt:
              now
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
            mentalidade: 40,
            lastMentalidadeRegenAt:
              now
          }
        )
      )
    );


    const storage =
      new FakeStorage({
        challenges: [],
        battles: []
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


    const finishAt =
      now +
      123_456;


    await coordinator.persistBattleMentalidade(
      {
        player1: {
          user: "p1",
          mentalidade: 7,
          maxMentalidade: 50
        },

        player2: {
          user: "p2",
          mentalidade: 11,
          maxMentalidade: 50
        }
      },
      finishAt
    );


    const p1 =
      JSON.parse(
        await kv.get(
          "p1"
        )
      );

    const p2 =
      JSON.parse(
        await kv.get(
          "p2"
        )
      );


    assert.equal(
      p1.mentalidade,
      7
    );

    assert.equal(
      p2.mentalidade,
      11
    );

    assert.equal(
      p1.lastMentalidadeRegenAt,
      finishAt
    );

    assert.equal(
      p2.lastMentalidadeRegenAt,
      finishAt
    );


    console.log(
      "✅ TESTE 2 — Mentalidade restante é persistida quando o PvP termina."
    );
  }


  /*
   * ==============================
   * TESTE 3
   * !ESTADO FORA DO PvP
   * ==============================
   */
  {
    const kv =
      new FakeKV();

    await kv.put(
      "p1",
      JSON.stringify(
        makeProfile(
          "p1",
          {
            mentalidade: 20,
            lastMentalidadeRegenAt:
              now -
              MENTALIDADE_REGEN_INTERVAL_MS
          }
        )
      )
    );


    const env = {
      MARBION_USERS_V2:
        kv,

      PVP_COORDINATOR: {
        idFromName() {
          return "test";
        },

        get() {
          return {
            async fetch() {
              return Response.json({
                ok: true,
                inBattle: false
              });
            }
          };
        }
      }
    };


    const response =
      await estadoRoute(
        new Request(
          "https://marbion.test/estado?user=p1"
        ),
        env
      );


    const text =
      await response.text();


    assert.ok(
      text.includes(
        "Mentalidade: 21/50"
      )
    );


    const saved =
      JSON.parse(
        await kv.get(
          "p1"
        )
      );


    assert.equal(
      saved.mentalidade,
      21
    );


    console.log(
      "✅ TESTE 3 — !estado aplica e salva a regeneração quando o jogador está fora do PvP."
    );
  }


  /*
   * ==============================
   * TESTE 4
   * NÃO REGENERA DURANTE PvP
   * ==============================
   */
  {
    const kv =
      new FakeKV();

    await kv.put(
      "p1",
      JSON.stringify(
        makeProfile(
          "p1",
          {
            mentalidade: 20,
            lastMentalidadeRegenAt:
              now -
              10 *
              MENTALIDADE_REGEN_INTERVAL_MS
          }
        )
      )
    );


    const env = {
      MARBION_USERS_V2:
        kv,

      PVP_COORDINATOR: {
        idFromName() {
          return "test";
        },

        get() {
          return {
            async fetch() {
              return Response.json({
                ok: true,
                inBattle: true,
                turn: 3,
                opponent: "p2",
                hp: 100,
                maxHp: 100,
                mentalidade: 13,
                maxMentalidade: 50,
                effects: []
              });
            }
          };
        }
      }
    };


    const response =
      await estadoRoute(
        new Request(
          "https://marbion.test/estado?user=p1"
        ),
        env
      );


    const text =
      await response.text();


    assert.ok(
      text.includes(
        "Mentalidade: 13/50"
      )
    );


    const saved =
      JSON.parse(
        await kv.get(
          "p1"
        )
      );


    assert.equal(
      saved.mentalidade,
      20
    );


    console.log(
      "✅ TESTE 4 — Regeneração natural não interfere na Mentalidade viva do PvP."
    );
  }


  console.log(
    "\n🧠 TODOS OS TESTES DE INTEGRAÇÃO DA REGENERAÇÃO DE MENTALIDADE PASSARAM."
  );
}

finally {
  Date.now =
    originalDateNow;
}
