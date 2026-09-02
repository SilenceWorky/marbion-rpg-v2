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
    skillId,
    element
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
    skills: [skillId],
    skillMeta: {
      [skillId]: {
        source: "admin",
        temporary: false
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
        speed: 1,
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
        speed: 100,
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
              speed: 1,
              skillId:
                SILENCE_SKILL
            }
          ),
        player2:
          makePlayer(
            "p2",
            {
              speed: 100,
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
    turn1.firstExecution?.attacker,
    "p2",
    "P2 deveria agir primeiro por Velocidade."
  );

  assert.equal(
    turn1.firstExecution?.kind,
    "damage",
    "P2 deve conseguir usar a habilidade Elemental antes de ser silenciado."
  );

  assert.equal(
    turn1.secondExecution?.kind,
    "silence"
  );

  const silence =
    battle.player2.effects.find(
      effect =>
        effect.type ===
          "silencio"
    );

  assert.ok(
    silence,
    "Silêncio deveria ficar ativo após a ação de P2."
  );

  assert.equal(
    silence.expiresAtTurn,
    4,
    "Aplicado depois da ação no T1 deve afetar T2 e T3 e expirar no T4."
  );

  assert.equal(
    battle.turn,
    2
  );

  for (
    const expectedTurn
    of [2, 3]
  ) {
    assert.equal(
      battle.turn,
      expectedTurn
    );

    const blocked =
      await coordinator.chooseAction(
        "p2",
        1
      );

    assert.equal(
      blocked.ok,
      false
    );

    assert.equal(
      blocked.error,
      "SILENCED_SKILL"
    );

    const punch =
      await coordinator.chooseAction(
        "p2",
        4
      );

    assert.equal(
      punch.ok,
      true
    );

    await coordinator.chooseAction(
      "p1",
      4
    );
  }

  assert.equal(
    battle.turn,
    4
  );

  assert.equal(
    battle.player2.effects.some(
      effect =>
        effect.type ===
          "silencio"
    ),
    false,
    "Silêncio deveria expirar na abertura do T4."
  );

  const allowed =
    await coordinator.chooseAction(
      "p2",
      1
    );

  assert.equal(
    allowed.ok,
    true,
    "No T4, a habilidade Elemental deve voltar a ser permitida."
  );

  console.log(
    "✅ Alvo mais rápido agiu antes de receber Silêncio."
  );

  console.log(
    "✅ Silêncio aplicado depois da ação bloqueou habilidades não físicas no T2 e T3."
  );

  console.log(
    "✅ Silêncio expirou na abertura do T4, independente da ordem de Velocidade."
  );

  console.log(
    "\n🤐 REGRESSÃO DE ORDEM DO SILÊNCIO PASSOU."
  );
}
finally {
  Math.random =
    originalRandom;
}
