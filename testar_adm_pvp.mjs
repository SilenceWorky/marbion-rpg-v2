import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

import {
  adminRoute
} from "./src/routes/admin.js";

class FakeStorage {
  constructor(data) {
    this.data = {};

    if (data !== undefined) {
      this.data.pvp = data;
    }
  }

  async get(key) {
    return this.data[key] ?? null;
  }

  async put(key, value) {
    this.data[key] = value;
  }

  async delete(key) {
    delete this.data[key];
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

function makeProfile(user) {
  return {
    version: 2,
    user,
    race: "Terrariano",
    elements: ["Fogo"],
    xp: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    mentalidade: 50,
    maxMentalidade: 50,
    lastMentalidadeRegenAt: 1,
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
    equippedSkills: [null, null, null, null],
    skillCooldowns: {},
    inventory: {},
    rebuffBonus: {
      damageBonus: 0,
      xpBonus: 0,
      criticalBonus: 0
    },
    pvp: {
      wins: 3,
      losses: 2,
      duels: 5,
      accepted: 0,
      refused: 0,
      streak: 2,
      bestStreak: 4,
      rating: 1234,
      peakRating: 1300,
      rank: "Ouro II",
      prodigyPosition: null,
      points: 0
    }
  };
}

function makeBattle() {
  return {
    id: "battle-test",
    status: "ACTIVE",
    state: "WAITING_ACTIONS",
    turn: 4,
    player1: {
      user: "silenceworky",
      hp: 70,
      maxHp: 100,
      mentalidade: 6,
      maxMentalidade: 50,
      action: null
    },
    player2: {
      user: "acervojuju",
      hp: 80,
      maxHp: 100,
      mentalidade: 31,
      maxMentalidade: 50,
      action: null
    },
    createdAt: 1000
  };
}

async function makeEnv() {
  const kv = new FakeKV();
  await kv.put("silenceworky", JSON.stringify(makeProfile("silenceworky")));
  await kv.put("acervojuju", JSON.stringify(makeProfile("acervojuju")));

  const storage = new FakeStorage({
    challenges: [],
    battles: [makeBattle()]
  });

  const env = {
    MARBION_USERS_V2: kv,
    MARBION_ADMIN_KEY: "test-key"
  };

  const globalCoordinator =
    new PvpCoordinator(
      { storage },
      env
    );

  const coordinatorById =
    new Map([
      [
        "marbion-global-pvp",
        globalCoordinator
      ]
    ]);

  env.PVP_COORDINATOR = {
    idFromName(name) {
      return String(name);
    },

    get(id) {
      const normalizedId =
        String(id);

      if (
        !coordinatorById.has(
          normalizedId
        )
      ) {
        coordinatorById.set(
          normalizedId,
          new PvpCoordinator(
            {
              storage:
                new FakeStorage()
            },
            env
          )
        );
      }

      const coordinator =
        coordinatorById.get(
          normalizedId
        );

      return {
        fetch(request) {
          return coordinator.fetch(request);
        }
      };
    }
  };

  return { env, kv, storage };
}

const originalNow = Date.now;
Date.now = () => 9_000_000;

try {
  {
    const { env, kv, storage } = await makeEnv();
    const response = await adminRoute(
      new Request(
        "https://marbion.test/adm?actor=silenceworky&key=test-key&args=pvp%20empate"
      ),
      env
    );
    const text = await response.text();
    assert.ok(text.includes("empate administrativo"));

    const battle = storage.data.pvp.battles[0];
    assert.equal(battle.status, "FINISHED");
    assert.equal(battle.draw, true);
    assert.equal(battle.adminResult, true);
    assert.equal(battle.finishReason, "ADMIN_DRAW");
    assert.equal(battle.winner, null);

    const p1 = JSON.parse(await kv.get("silenceworky"));
    const p2 = JSON.parse(await kv.get("acervojuju"));
    assert.equal(p1.mentalidade, 6);
    assert.equal(p2.mentalidade, 31);
    assert.equal(p1.pvp.rating, 1234);
    assert.equal(p1.pvp.wins, 3);
    assert.equal(p1.pvp.streak, 2);

    console.log(
      "✅ TESTE 1 — !adm pvp empate encerra sem ranking e preserva Mentalidade."
    );
  }

  {
    const { env, kv, storage } = await makeEnv();
    const response = await adminRoute(
      new Request(
        "https://marbion.test/adm?actor=silenceworky&key=test-key&args=pvp%20vitoria%20%40silenceworky"
      ),
      env
    );
    const text = await response.text();
    assert.ok(
      text.includes(
        "@silenceworky definido como vencedor administrativo"
      )
    );

    const battle = storage.data.pvp.battles[0];
    assert.equal(battle.status, "FINISHED");
    assert.equal(battle.draw, false);
    assert.equal(battle.adminResult, true);
    assert.equal(battle.finishReason, "ADMIN_WIN");
    assert.equal(battle.winner, "silenceworky");
    assert.equal(battle.loser, "acervojuju");

    const p1 = JSON.parse(await kv.get("silenceworky"));
    const p2 = JSON.parse(await kv.get("acervojuju"));
    assert.equal(p1.mentalidade, 6);
    assert.equal(p2.mentalidade, 31);
    assert.equal(p1.pvp.rating, 1234);
    assert.equal(p1.pvp.wins, 3);
    assert.equal(p2.pvp.losses, 2);

    console.log(
      "✅ TESTE 2 — !adm pvp vitória define vencedor sem alterar ranking/estatísticas."
    );
  }

  console.log(
    "\n🛠️ TODOS OS TESTES DOS COMANDOS ADM DE PVP PASSARAM."
  );
}
finally {
  Date.now = originalNow;
}
