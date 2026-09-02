import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

const SLOW_SKILL =
  "Gelo:Nevasca_Ascendente";

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
    elements: ["Gelo"],
    level: 1,
    xp: 0,
    hp: 1000,
    maxHp: 1000,
    mentalidade: 200,
    maxMentalidade: 200,
    strength: 10,
    magicStrength: 10,
    speed,
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
    hp: 1000,
    maxHp: 1000,
    mentalidade: 200,
    maxMentalidade: 200,
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

const kv =
  new FakeKV();

await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1",
      {
        speed: 10,
        skillId: SLOW_SKILL
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
        speed: 25
      }
    )
  )
);

const storage =
  new FakeStorage({
    challenges: [],
    battles: [
      {
        id: crypto.randomUUID(),
        status: "ACTIVE",
        state: "WAITING_ACTIONS",
        turn: 1,
        player1:
          makePlayer(
            "p1",
            {
              speed: 10,
              skillId: SLOW_SKILL
            }
          ),
        player2:
          makePlayer(
            "p2",
            {
              speed: 25
            }
          ),
        createdAt: Date.now()
      }
    ]
  });

const coordinator =
  new PvpCoordinator(
    {
      storage
    },
    {
      MARBION_USERS_V2: kv
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
  await coordinator.chooseAction(
    "p1",
    1
  );

  const turn1 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  const battle =
    storage.data.pvp.battles[0];

  assert.equal(
    turn1.firstExecution.attacker,
    "p2",
    "P2 deve agir primeiro no T1 antes de receber Lentidao."
  );

  assert.equal(
    battle.player2.speed,
    5,
    "Lentidao deve reduzir Velocidade de 25 para 5."
  );

  let slow =
    battle.player2.effects.find(
      effect =>
        effect.subtype ===
        "lentidao"
    );

  assert.ok(
    slow,
    "Lentidao deveria estar ativa no T2."
  );

  assert.equal(
    slow.expiresAtTurn,
    4,
    "Aplicada no T1, Lentidao deve afetar T2 e T3 e expirar no T4."
  );

  const waiting2 =
    await coordinator.chooseAction(
      "p1",
      4
    );

  assert.equal(
    waiting2.waiting,
    true
  );

  const turn2 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  assert.equal(
    turn2.firstExecution.attacker,
    "p1",
    "Com Lentidao ativa, P1 deve ultrapassar P2 na ordem do T2."
  );

  assert.equal(
    battle.turn,
    3
  );

  assert.equal(
    battle.player2.speed,
    5
  );

  const turn3Waiting =
    await coordinator.chooseAction(
      "p1",
      4
    );

  assert.equal(
    turn3Waiting.waiting,
    true
  );

  const turn3 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  assert.equal(
    turn3.firstExecution.attacker,
    "p1",
    "Lentidao ainda deve alterar a ordem no T3."
  );

  assert.equal(
    battle.turn,
    4
  );

  assert.equal(
    battle.player2.speed,
    25,
    "Velocidade deve ser restaurada na abertura do T4."
  );

  slow =
    battle.player2.effects.find(
      effect =>
        effect.subtype ===
        "lentidao"
    );

  assert.equal(
    slow,
    undefined,
    "Lentidao deve ter sido removida no T4."
  );

  console.log(
    "✅ Lentidao reduziu Velocidade de 25 para 5."
  );
  console.log(
    "✅ A ordem mudou nos dois turnos futuros: T2 e T3."
  );
  console.log(
    "✅ Velocidade foi restaurada na abertura do T4."
  );
  console.log(
    "\n🐌 TODOS OS TESTES PvP DE LENTIDAO PASSARAM."
  );
}
finally {
  Math.random =
    originalRandom;
}
