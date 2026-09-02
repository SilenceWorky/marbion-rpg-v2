import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

const SKILL_ID =
  "Vento:Lamina_de_Ar_Cortante";

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

  async put(key, value) {
    this.data[key] = value;
  }
}

class FakeKV {
  constructor() {
    this.data = new Map();
  }

  async get(key) {
    return (
      this.data.get(key) ??
      null
    );
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
  skillId = null
) {
  return {
    user,
    race: "Terrariano",
    elements: ["Vento"],
    level: 1,
    xp: 0,
    hp: 500,
    maxHp: 500,
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
  skillId = null
) {
  return {
    user,
    hp: 500,
    maxHp: 500,
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
      SKILL_ID
    )
  )
);

await kv.put(
  "p2",
  JSON.stringify(
    makeProfile("p2")
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
            SKILL_ID
          ),
        player2:
          makePlayer("p2"),
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

Math.random =
  () => 0;

try {
  await coordinator.chooseAction(
    "p1",
    1
  );

  const result1 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  const battle =
    storage.data.pvp.battles[0];

  const execution =
    result1.firstExecution?.kind ===
    "bleed"
      ? result1.firstExecution
      : result1.secondExecution;

  assert.ok(
    execution,
    "Execução de Sangramento não encontrada."
  );

  assert.equal(
    execution.skill,
    "Lâmina de Ar Cortante"
  );

  assert.equal(
    execution.kind,
    "bleed"
  );

  assert.equal(
    execution.hit,
    true
  );

  assert.equal(
    execution.bleedApplied,
    true
  );

  assert.equal(
    execution.bleed.damagePerTurn,
    10
  );

  assert.equal(
    execution.bleed.duration,
    3
  );

  assert.equal(
    battle.player1.mentalidade,
    67
  );

  const tick1 =
    result1.dotTicks.find(
      tick =>
        tick.type ===
        "sangramento"
    );

  assert.ok(
    tick1,
    "Primeiro tick de Sangramento não encontrado."
  );

  assert.equal(
    tick1.damage,
    10
  );

  assert.equal(
    tick1.remainingTicks,
    2
  );

  const active1 =
    battle.player2.effects.find(
      effect =>
        effect.type ===
        "sangramento"
    );

  assert.ok(
    active1,
    "Sangramento deveria permanecer ativo após o primeiro tick."
  );

  assert.equal(
    active1.remainingTicks,
    2
  );

  await coordinator.chooseAction(
    "p1",
    4
  );

  const result2 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  const tick2 =
    result2.dotTicks.find(
      tick =>
        tick.type ===
        "sangramento"
    );

  assert.ok(
    tick2,
    "Segundo tick de Sangramento não encontrado."
  );

  assert.equal(
    tick2.damage,
    10
  );

  assert.equal(
    tick2.remainingTicks,
    1
  );

  await coordinator.chooseAction(
    "p1",
    4
  );

  const result3 =
    await coordinator.chooseAction(
      "p2",
      4
    );

  const tick3 =
    result3.dotTicks.find(
      tick =>
        tick.type ===
        "sangramento"
    );

  assert.ok(
    tick3,
    "Terceiro tick de Sangramento não encontrado."
  );

  assert.equal(
    tick3.damage,
    10
  );

  assert.equal(
    tick3.remainingTicks,
    0
  );

  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.type ===
        "sangramento"
    ),
    false
  );

  console.log(
    "🩸 Lâmina de Ar Cortante aplicou Sangramento por 3 ticks."
  );

  console.log(
    "✅ 10 de dano por tick (30% de 33 Mentalidade, arredondado)."
  );

  console.log(
    "✅ Primeiro tick ocorreu apenas no turno seguinte."
  );

  console.log(
    "✅ Efeito desapareceu após o terceiro tick."
  );

  console.log(
    "\n🩸 TODOS OS TESTES PvP DE SANGRAMENTO PASSARAM."
  );
}
finally {
  Math.random =
    originalRandom;
}
