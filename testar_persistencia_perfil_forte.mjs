import assert from "node:assert/strict";

import {
  getProfile,
  saveProfile
} from "./src/core/database.js";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";


class FakeStorage {
  constructor(initial = {}) {
    this.data =
      new Map(
        Object.entries(initial)
      );
  }

  async get(key) {
    return this.data.has(key)
      ? this.data.get(key)
      : null;
  }

  async put(key, value) {
    this.data.set(
      key,
      value
    );
  }

  async delete(key) {
    this.data.delete(key);
  }
}


class FakeKV {
  constructor() {
    this.data =
      new Map();
  }

  async get(key) {
    return this.data.has(key)
      ? this.data.get(key)
      : null;
  }

  async put(key, value) {
    this.data.set(
      key,
      value
    );
  }

  async delete(key) {
    this.data.delete(key);
  }

  forceSet(key, value) {
    this.data.set(
      key,
      value
    );
  }
}


class FakePvpNamespace {
  constructor(env) {
    this.env = env;
    this.instances =
      new Map();
  }

  idFromName(name) {
    return String(name);
  }

  get(id) {
    const key =
      String(id);

    if (
      !this.instances.has(key)
    ) {
      const coordinator =
        new PvpCoordinator(
          {
            storage:
              new FakeStorage()
          },
          this.env
        );

      this.instances.set(
        key,
        coordinator
      );
    }

    const coordinator =
      this.instances.get(key);

    return {
      fetch(request) {
        return coordinator.fetch(
          request
        );
      }
    };
  }
}


function makeProfile(
  user,
  {
    speed = 5,
    statusPoints = 20,
    mentalidade = 50
  } = {}
) {
  const now =
    Date.now();

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
    maxMentalidade: 50,
    lastMentalidadeRegenAt: now,
    strength: 5,
    magicStrength: 5,
    speed,
    evasion: 5,
    accuracy: 90,
    defense: 0,
    statusPoints,
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
    },
    createdAt: now,
    updatedAt: now
  };
}


const kv =
  new FakeKV();

const env = {
  MARBION_USERS_V2:
    kv
};

env.PVP_COORDINATOR =
  new FakePvpNamespace(
    env
  );


const oldP1 =
  makeProfile(
    "p1",
    {
      speed: 5,
      statusPoints: 20
    }
  );

await kv.put(
  "p1",
  JSON.stringify(oldP1)
);

await kv.put(
  "p2",
  JSON.stringify(
    makeProfile(
      "p2",
      {
        speed: 6,
        statusPoints: 0
      }
    )
  )
);


/*
 * Primeira leitura importa o perfil
 * legado do KV para o Durable Object
 * individual do jogador.
 */
const p1 =
  await getProfile(
    env,
    "p1"
  );

assert.equal(
  p1.speed,
  5
);


/*
 * Simula !status velocidade 20.
 */
p1.speed = 25;
p1.statusPoints = 0;

await saveProfile(
  env,
  "p1",
  p1
);


/*
 * Simula exatamente o problema real:
 * uma leitura posterior do KV enxerga
 * uma cópia antiga por consistência
 * eventual.
 */
kv.forceSet(
  "p1",
  JSON.stringify(oldP1)
);


const strongRead =
  await getProfile(
    env,
    "p1"
  );

assert.equal(
  strongRead.speed,
  25
);

assert.equal(
  strongRead.statusPoints,
  0
);

console.log(
  "✅ Perfil forte ignora uma cópia antiga do KV após uma alteração recente."
);


/*
 * Agora entra em PvP. Antes da correção,
 * acceptChallenge() podia reler o KV antigo
 * e sobrescrever o perfil recém-alterado.
 */
const battleStorage =
  new FakeStorage({
    pvp: {
      challenges: [
        {
          challenger: "p1",
          target: "p2",
          createdAt:
            Date.now() - 1000,
          expiresAt:
            Date.now() + 60_000
        }
      ],
      battles: []
    }
  });

const battleCoordinator =
  new PvpCoordinator(
    {
      storage:
        battleStorage
    },
    env
  );

const accepted =
  await battleCoordinator.acceptChallenge(
    "p2"
  );

assert.equal(
  accepted.ok,
  true
);

assert.equal(
  accepted.battle.player1.speed,
  25
);

const afterPvpStart =
  await getProfile(
    env,
    "p1"
  );

assert.equal(
  afterPvpStart.speed,
  25
);

assert.equal(
  afterPvpStart.statusPoints,
  0
);

console.log(
  "✅ Entrar em PvP preserva o Status mais recente do jogador."
);


const mirroredKv =
  JSON.parse(
    await kv.get(
      "p1"
    )
  );

assert.equal(
  mirroredKv.speed,
  25
);

assert.equal(
  mirroredKv.statusPoints,
  0
);

console.log(
  "✅ O perfil forte continua espelhado no KV sem restaurar dados antigos."
);

console.log(
  "\n🔒 TODOS OS TESTES DE PERSISTENCIA FORTE DO PERFIL PASSARAM."
);
