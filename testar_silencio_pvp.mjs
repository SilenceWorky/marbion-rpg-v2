import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

const SILENCE_SKILL =
  "Som:Acorde_Ascendente";

const ELEMENTAL_SKILL =
  "Fogo:Labareda_Ascendente";

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
    skillId = null,
    element = "Som"
  }
) {
  return {
    user,
    race: "Terrariano",
    elements: [element],
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
    hp: 500,
    maxHp: 500,
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

const kv =
  new FakeKV();

await kv.put(
  "p1",
  JSON.stringify(
    makeProfile(
      "p1",
      {
        speed: 100,
        skillId:
          SILENCE_SKILL,
        element: "Som"
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
        speed: 1,
        skillId:
          ELEMENTAL_SKILL,
        element: "Fogo"
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
              speed: 100,
              skillId:
                SILENCE_SKILL
            }
          ),
        player2:
          makePlayer(
            "p2",
            {
              speed: 1,
              skillId:
                ELEMENTAL_SKILL
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
  await coordinator.chooseAction(
    "p1",
    1
  );

  const turn1 =
    await coordinator.chooseAction(
      "p2",
      1
    );

  const battle =
    storage.data.pvp.battles[0];

  assert.equal(
    turn1.firstExecution?.kind,
    "silence"
  );

  assert.equal(
    turn1.firstExecution?.silenceApplied,
    true
  );

  assert.equal(
    turn1.secondExecution?.kind,
    "silence_blocked"
  );

  assert.equal(
    turn1.secondExecution?.blocked,
    true
  );

  assert.equal(
    battle.player2.mentalidade,
    100,
    "Ação bloqueada por Silêncio não deve gastar Mentalidade."
  );

  const silence =
    battle.player2.effects.find(
      effect =>
        effect.type ===
          "silencio"
    );

  assert.ok(
    silence,
    "Silêncio deveria estar ativo no alvo."
  );

  assert.equal(
    silence.expiresAtTurn,
    3,
    "Aplicado antes da ação no T1 deve afetar T1 e T2 e expirar no T3."
  );

  assert.equal(
    battle.turn,
    2
  );

  const blockedSelection =
    await coordinator.chooseAction(
      "p2",
      1
    );

  assert.equal(
    blockedSelection.ok,
    false
  );

  assert.equal(
    blockedSelection.error,
    "SILENCED_SKILL"
  );

  assert.equal(
    battle.player2.action,
    null,
    "Seleção inválida por Silêncio não deve travar a ação do jogador."
  );

  const allowedPunch =
    await coordinator.chooseAction(
      "p2",
      4
    );

  assert.equal(
    allowedPunch.ok,
    true,
    "Soco deve continuar permitido durante Silêncio."
  );

  await coordinator.chooseAction(
    "p1",
    4
  );

  assert.equal(
    battle.turn,
    3
  );

  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.type ===
          "silencio"
    ),
    false,
    "Silêncio deveria expirar na abertura do T3."
  );

  const allowedAgain =
    await coordinator.chooseAction(
      "p2",
      1
    );

  assert.equal(
    allowedAgain.ok,
    true,
    "Habilidade elemental deve voltar a ser selecionável após o Silêncio."
  );

  console.log(
    "✅ Silêncio aplicado antes da ação bloqueou habilidade não física no mesmo turno."
  );

  console.log(
    "✅ Ação bloqueada não gastou Mentalidade."
  );

  console.log(
    "✅ No turno seguinte, habilidade Elemental foi rejeitada e Soco continuou permitido."
  );

  console.log(
    "✅ Silêncio expirou após 2 turnos efetivos."
  );

  console.log(
    "\n🤐 TODOS OS TESTES PvP DE SILÊNCIO PASSARAM."
  );
}
finally {
  Math.random =
    originalRandom;
}
