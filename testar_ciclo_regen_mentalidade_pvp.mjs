import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

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
    mentalidade = 50,
    maxMentalidade = 50,
    lastMentalidadeRegenAt = 1_000_000
  } = {}
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

    weapon: null,
    weapons: {},
    soulWeapon: null,
    soulWeaponDurability: null,
    adminWeapon: null,
    adminWeaponDurability: null,

    inventory: {},

    dead: false,
    deaths: 0,
    cycles: 0,
    rebuffs: 0,
    reincarnations: 0,
    deathReason: null,
    diedAt: null,

    rebuffBonus: {
      damageBonus: 0,
      xpBonus: 0,
      criticalBonus: 0
    },

    pendingFinalRebuff: false,

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

    tag: null,
    unlockedTags: [],
    rewardsClaimed: {},
    elementRewardsClaimed: {},

    lastCombat: 0,
    lastCheckin: 0,
    lastDaily: 0,
    lastXpChest: 0,
    lastReroll: 0,
    lastHpHeal: 0,

    createdAt: 1_000_000,
    updatedAt: 1_000_000
  };
}


const originalDateNow =
  Date.now;


const finishAt =
  10_000_000;


try {
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
            finishAt
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
            finishAt
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


  /*
   * ==============================
   * ETAPA 1
   * PvP TERMINA COM 7/50
   * ==============================
   */
  Date.now =
    () => finishAt;


  const persistResult =
    await coordinator.persistBattleMentalidade(
      {
        player1: {
          user: "p1",
          mentalidade: 7,
          maxMentalidade: 50
        },

        player2: {
          user: "p2",
          mentalidade: 18,
          maxMentalidade: 50
        }
      },
      finishAt
    );


  assert.equal(
    persistResult.ok,
    true
  );


  let p1 =
    JSON.parse(
      await kv.get(
        "p1"
      )
    );


  assert.equal(
    p1.mentalidade,
    7
  );

  assert.equal(
    p1.lastMentalidadeRegenAt,
    finishAt
  );


  console.log(
    "✅ ETAPA 1 — PvP terminou e persistiu Mentalidade 7/50."
  );


  /*
   * ==============================
   * ETAPA 2
   * 20 MIN FORA DO COMBATE
   * ==============================
   *
   * +1 a cada 5 min
   * 20 min = +4
   *
   * 7/50 → 11/50
   */
  const nextBattleAt =
    finishAt +
    4 *
    MENTALIDADE_REGEN_INTERVAL_MS;


  Date.now =
    () => nextBattleAt;


  storage.data.pvp.challenges = [
    {
      challenger: "p1",
      target: "p2",
      createdAt:
        nextBattleAt - 1000,
      expiresAt:
        nextBattleAt + 60_000
    }
  ];


  const acceptResult =
    await coordinator.acceptChallenge(
      "p2"
    );


  assert.equal(
    acceptResult.ok,
    true
  );


  /*
   * O perfil de P1 deve ter recuperado
   * exatamente 4 pontos antes do PvP.
   */
  p1 =
    JSON.parse(
      await kv.get(
        "p1"
      )
    );


  assert.equal(
    p1.mentalidade,
    11
  );

  assert.equal(
    p1.lastMentalidadeRegenAt,
    nextBattleAt
  );


  console.log(
    "✅ ETAPA 2 — Após 20 minutos fora do PvP, Mentalidade regenerou de 7/50 para 11/50."
  );


  /*
   * ==============================
   * ETAPA 3
   * NOVO PvP COMEÇA COM 11/50
   * ==============================
   */
  assert.equal(
    acceptResult.battle.player1.user,
    "p1"
  );

  assert.equal(
    acceptResult.battle.player1.mentalidade,
    11
  );

  assert.equal(
    acceptResult.battle.player1.maxMentalidade,
    50
  );


  console.log(
    "✅ ETAPA 3 — Novo PvP começou exatamente com Mentalidade 11/50."
  );


  /*
   * P2 também deve respeitar sua própria
   * regeneração e nunca ultrapassar o máximo.
   *
   * 18 + 4 = 22.
   */
  const p2 =
    JSON.parse(
      await kv.get(
        "p2"
      )
    );


  assert.equal(
    p2.mentalidade,
    22
  );

  assert.equal(
    acceptResult.battle.player2.mentalidade,
    22
  );


  console.log(
    "✅ ETAPA 4 — Cada jogador regenerou a própria Mentalidade de forma independente."
  );


  console.log(
    "\n🧠 CICLO COMPLETO DA REGENERAÇÃO DE MENTALIDADE PASSOU."
  );
}

finally {
  Date.now =
    originalDateNow;
}
