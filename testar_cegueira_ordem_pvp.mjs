import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

const BLINDNESS_SKILL =
  "Sombra:Veu_Ascendente";

class FakeStorage {
  constructor(data) {
    this.data = {
      pvp: data
    };
  }

  async get(key) {
    return this.data[key] ?? null;
  }

  async put(key, value) {
    this.data[key] = value;
  }
}

class FakeKV {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return this.data.get(key) ?? null;
  }

  async put(key, value) {
    this.data.set(key, value);
  }

  async delete(key) {
    this.data.delete(key);
  }
}

function makeProfile(
  user,
  {
    speed,
    skillId = null
  }
) {
  return {
    user,
    race: "Terrariano",
    elements: ["Sombra"],
    level: 1,
    xp: 0,
    hp: 500,
    maxHp: 500,
    mentalidade: 100,
    maxMentalidade: 100,
    strength: 10,
    magicStrength: 10,
    speed,
    evasion: 0,
    accuracy:
      user === "p2"
        ? 90
        : 100,
    defense: 10,
    skills:
      skillId
        ? [skillId]
        : [],
    skillMeta:
      skillId
        ? {
            [skillId]: {
              source: "admin",
              temporary: false
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
    speed,
    skillId = null
  }
) {
  return {
    user,
    hp: 500,
    maxHp: 500,
    mentalidade: 100,
    maxMentalidade: 100,
    strength: 10,
    magicStrength: 10,
    speed,
    evasion: 0,
    accuracy:
      user === "p2"
        ? 90
        : 100,
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

const kv =
  new FakeKV();

await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1",
      {
        speed: 1,
        skillId:
          BLINDNESS_SKILL
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
        speed: 100
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
        status: "ACTIVE",
        state:
          "WAITING_ACTIONS",
        turn: 1,
        player1:
          makePlayer(
            "p1",
            {
              speed: 1,
              skillId:
                BLINDNESS_SKILL
            }
          ),
        player2:
          makePlayer(
            "p2",
            {
              speed: 100
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

coordinator.applyRankedBattleResult =
  async () => ({
    ok: true
  });

const originalRandom =
  Math.random;

Math.random = () => 0;

try {
  /*
   * P2 e mais rapido e age antes.
   * P1 aplica Cegueira somente depois.
   *
   * A Cegueira de duracao 2 deve entao
   * afetar os DOIS proximos turnos de P2:
   * T2 e T3.
   */
  await coordinator.chooseAction(
    "p1",
    1
  );

  await coordinator.chooseAction(
    "p2",
    4
  );

  const battle =
    storage.data.pvp.battles[0];

  assert.equal(
    battle.turn,
    2
  );

  assert.equal(
    battle.player2.accuracy,
    70,
    "Cegueira deve reduzir Precisao de 90 para 70."
  );

  let blindness =
    battle.player2.effects.find(
      effect =>
        effect.subtype ===
        "cegueira"
    );

  assert.ok(
    blindness,
    "Cegueira deveria estar ativa no T2."
  );

  assert.equal(
    blindness.expiresAtTurn,
    4,
    "Como P2 ja agiu no T1, a Cegueira deve expirar apenas na abertura do T4."
  );

  await coordinator.chooseAction(
    "p1",
    4
  );

  await coordinator.chooseAction(
    "p2",
    4
  );

  assert.equal(
    battle.turn,
    3
  );

  assert.equal(
    battle.player2.accuracy,
    70,
    "Cegueira ainda deve estar ativa durante o T3."
  );

  blindness =
    battle.player2.effects.find(
      effect =>
        effect.subtype ===
        "cegueira"
    );

  assert.ok(
    blindness,
    "Cegueira deveria continuar ativa no T3."
  );

  await coordinator.chooseAction(
    "p1",
    4
  );

  await coordinator.chooseAction(
    "p2",
    4
  );

  assert.equal(
    battle.turn,
    4
  );

  assert.equal(
    battle.player2.accuracy,
    90,
    "Precisao deve ser restaurada apos duas acoes afetadas."
  );

  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.subtype ===
        "cegueira"
    ),
    false
  );

  console.log(
    "✅ Cegueira aplicada depois da acao do alvo dura T2 e T3."
  );

  console.log(
    "✅ Duracao da Cegueira nao depende mais da ordem de Velocidade."
  );

  console.log(
    "✅ Precisao foi restaurada na abertura do T4."
  );

  console.log(
    "\n🌑 REGRESSAO DE ORDEM DA CEGUEIRA PASSOU."
  );
}
finally {
  Math.random =
    originalRandom;
}
