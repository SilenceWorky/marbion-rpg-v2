import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

import {
  applyBlindnessEffect
} from "./src/systems/skill-effects.js";

const BLINDNESS_SKILL =
  "Sombra:Veu_Ascendente";

class FakeStorage {
  constructor(data) {
    this.data = { pvp: data };
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

function makeProfile(user, skillId = null) {
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
    speed: user === "p1" ? 100 : 1,
    evasion: 0,
    accuracy: user === "p2" ? 90 : 100,
    defense: 10,
    skills: skillId ? [skillId] : [],
    skillMeta: skillId
      ? {
          [skillId]: {
            source: "admin",
            temporary: false
          }
        }
      : {},
    equippedSkills: [skillId, null, null, null],
    skillCooldowns: {},
    inventory: [],
    statusEffects: {}
  };
}

function makePlayer(user, skillId = null) {
  return {
    user,
    hp: 500,
    maxHp: 500,
    mentalidade: 100,
    maxMentalidade: 100,
    strength: 10,
    magicStrength: 10,
    speed: user === "p1" ? 100 : 1,
    evasion: 0,
    accuracy: user === "p2" ? 90 : 100,
    defense: 10,
    loadout: [skillId, null, null, null],
    effects: [],
    action: null
  };
}

const kv = new FakeKV();

await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1",
      BLINDNESS_SKILL
    )
  )
);

await kv.put(
  "p2",
  JSON.stringify(
    makeProfile("p2")
  )
);

const storage = new FakeStorage({
  challenges: [],
  battles: [
    {
      id: crypto.randomUUID(),
      status: "ACTIVE",
      state: "WAITING_ACTIONS",
      turn: 1,
      player1: makePlayer(
        "p1",
        BLINDNESS_SKILL
      ),
      player2: makePlayer("p2"),
      createdAt: Date.now()
    }
  ]
});

const coordinator = new PvpCoordinator(
  { storage },
  { MARBION_USERS_V2: kv }
);

coordinator.applyRankedBattleResult =
  async () => ({ ok: true });

const originalRandom = Math.random;
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

  const execution =
    turn1.firstExecution?.attacker === "p1"
      ? turn1.firstExecution
      : turn1.secondExecution;

  assert.ok(
    execution,
    "Execução do Véu Ascendente não encontrada."
  );

  assert.equal(
    execution.kind,
    "blindness"
  );

  assert.equal(
    execution.skill,
    "Véu Ascendente"
  );

  assert.equal(
    execution.hit,
    true
  );

  assert.equal(
    execution.blindnessApplied,
    true
  );

  assert.equal(
    execution.blindness.amount,
    20
  );

  assert.equal(
    execution.blindness.duration,
    2
  );

  assert.equal(
    battle.player2.accuracy,
    70
  );

  assert.equal(
    battle.player1.mentalidade,
    88
  );

  const active =
    battle.player2.effects.find(
      effect =>
        effect.type === "debuff" &&
        effect.subtype === "cegueira"
    );

  assert.ok(
    active,
    "Cegueira deveria estar ativa após o primeiro turno."
  );

  assert.equal(
    active.stat,
    "accuracy"
  );

  assert.equal(
    active.amount,
    20
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
    90
  );

  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.subtype === "cegueira"
    ),
    false
  );

  console.log(
    "🌑 Véu Ascendente aplicou Cegueira: Precisão 90 → 70."
  );

  console.log(
    "✅ Cegueira durou 2 turnos e restaurou Precisão para 90."
  );

  const directTarget = {
    user: "alvo",
    accuracy: 90,
    effects: []
  };

  const directSkill = {
    nome: "Teste de Cegueira",
    debuffAmount: 20,
    debuffDuration: 2
  };

  const first =
    applyBlindnessEffect(
      directTarget,
      directSkill,
      1
    );

  assert.equal(first.ok, true);
  assert.equal(directTarget.accuracy, 70);

  const refreshed =
    applyBlindnessEffect(
      directTarget,
      directSkill,
      2
    );

  assert.equal(refreshed.ok, true);
  assert.equal(refreshed.refreshed, true);
  assert.equal(directTarget.accuracy, 70);
  assert.equal(
    directTarget.effects.filter(
      effect =>
        effect.subtype === "cegueira"
    ).length,
    1
  );

  console.log(
    "✅ Reaplicação renova Cegueira sem acumular -20 novamente."
  );

  console.log(
    "\n🌑 TODOS OS TESTES PvP DE CEGUEIRA PASSARAM."
  );
}
finally {
  Math.random = originalRandom;
}
