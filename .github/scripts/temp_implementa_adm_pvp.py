from pathlib import Path

# ==========================================
# PvpCoordinator
# ==========================================
pvp_path = Path("src/durable/PvpCoordinator.js")
pvp = pvp_path.read_text(encoding="utf-8")

method_marker = "  cleanExpiredChallenges(\n    data\n  ) {"

method = '''  async adminFinishBattle(
    mode,
    winnerUser = null
  ) {
    const normalizedMode =
      String(
        mode ?? ""
      )
        .trim()
        .toLowerCase();


    const normalizedWinner =
      normalizeUser(
        winnerUser
      );


    const data =
      await this.getData();


    const activeBattles =
      data.battles.filter(
        battle =>
          battle.status ===
          "ACTIVE"
      );


    if (
      activeBattles.length === 0
    ) {
      return {
        ok: false,
        error:
          "NO_ACTIVE_BATTLE"
      };
    }


    let battle;
    let winner = null;
    let loser = null;
    let draw = false;
    let finishReason;


    if (
      normalizedMode ===
      "draw"
    ) {
      if (
        activeBattles.length > 1
      ) {
        return {
          ok: false,
          error:
            "MULTIPLE_ACTIVE_BATTLES"
        };
      }


      battle =
        activeBattles[0];

      draw =
        true;

      finishReason =
        "ADMIN_DRAW";
    }

    else if (
      normalizedMode ===
      "win"
    ) {
      if (!normalizedWinner) {
        return {
          ok: false,
          error:
            "INVALID_WINNER"
        };
      }


      battle =
        activeBattles.find(
          candidate =>
            candidate.player1.user ===
              normalizedWinner ||
            candidate.player2.user ===
              normalizedWinner
        );


      if (!battle) {
        return {
          ok: false,
          error:
            "WINNER_NOT_IN_ACTIVE_BATTLE"
        };
      }


      winner =
        normalizedWinner;

      loser =
        battle.player1.user ===
          winner
          ? battle.player2.user
          : battle.player1.user;

      finishReason =
        "ADMIN_WIN";
    }

    else {
      return {
        ok: false,
        error:
          "INVALID_ADMIN_RESULT"
      };
    }


    const finishedAt =
      Date.now();


    const persistence =
      await this.persistBattleMentalidade(
        battle,
        finishedAt
      );


    if (!persistence.ok) {
      return {
        ok: false,
        error:
          "MENTALIDADE_PERSIST_FAILED"
      };
    }


    battle.status =
      "FINISHED";

    battle.state =
      "FINISHED";

    battle.draw =
      draw;

    battle.adminResult =
      true;

    battle.finishReason =
      finishReason;

    battle.winner =
      winner;

    battle.loser =
      loser;

    battle.rankedResult =
      null;

    battle.finishedAt =
      finishedAt;

    battle.player1.action =
      null;

    battle.player2.action =
      null;


    await this.saveData(
      data
    );


    return {
      ok: true,
      mode:
        normalizedMode,
      draw,
      winner,
      loser,
      finishReason,
      finishedAt,

      player1: {
        user:
          battle.player1.user,
        mentalidade:
          persistence.player1.mentalidade,
        maxMentalidade:
          battle.player1.maxMentalidade
      },

      player2: {
        user:
          battle.player2.user,
        mentalidade:
          persistence.player2.mentalidade,
        maxMentalidade:
          battle.player2.maxMentalidade
      }
    };
  }

'''

if "async adminFinishBattle(" not in pvp:
    if method_marker not in pvp:
        raise SystemExit("Marker de cleanExpiredChallenges não encontrado")
    pvp = pvp.replace(method_marker, method + method_marker, 1)

fetch_marker = '''    if (
      url.pathname ===
      "/player-state"
    ) {'''

fetch_block = '''    if (
      url.pathname ===
      "/admin-finish"
    ) {
      const result =
        await this.adminFinishBattle(
          url.searchParams.get(
            "mode"
          ),
          url.searchParams.get(
            "winner"
          )
        );


      return Response.json(
        result
      );
    }

'''

if '"/admin-finish"' not in pvp:
    if fetch_marker not in pvp:
        raise SystemExit("Marker de /player-state não encontrado")
    pvp = pvp.replace(fetch_marker, fetch_block + fetch_marker, 1)

pvp_path.write_text(pvp, encoding="utf-8")

# ==========================================
# admin route
# ==========================================
admin_path = Path("src/routes/admin.js")
admin = admin_path.read_text(encoding="utf-8")

helper_marker = '''export async function adminRoute(
  request,
  env
) {'''

helper = '''function getCoordinator(
  env
) {
  const id =
    env.PVP_COORDINATOR.idFromName(
      "marbion-global-pvp"
    );


  return env.PVP_COORDINATOR.get(
    id
  );
}


'''

if "function getCoordinator(" not in admin:
    if helper_marker not in admin:
        raise SystemExit("Marker de adminRoute não encontrado")
    admin = admin.replace(helper_marker, helper + helper_marker, 1)

skill_marker = '''  /*
   * ==========================
   * SKILL
   * ==========================
   *
   * !adm skill @user add Chama Devastadora'''

pvp_block = '''  /*
   * ==========================
   * PVP
   * ==========================
   *
   * !adm pvp empate
   * !adm pvp vitória @usuario
   */
  if (
    command === "pvp"
  ) {
    const operation =
      normalizeCommand(
        args[1]
      );


    if (!operation) {
      return new Response(
        `@${actor}, uso: !adm pvp empate | !adm pvp vitória @usuário`
      );
    }


    let mode;
    let winner = null;


    if (
      operation === "empate" ||
      operation === "draw"
    ) {
      mode =
        "draw";
    }

    else if (
      operation === "vitoria" ||
      operation === "win"
    ) {
      winner =
        normalizeUser(
          args[2]
        );


      if (!winner) {
        return new Response(
          `@${actor}, uso: !adm pvp vitória @usuário`
        );
      }


      mode =
        "win";
    }

    else {
      return new Response(
        `@${actor}, use !adm pvp empate ou !adm pvp vitória @usuário.`
      );
    }


    const coordinator =
      getCoordinator(
        env
      );


    const internalUrl =
      new URL(
        "https://pvp.internal/admin-finish"
      );


    internalUrl.searchParams.set(
      "mode",
      mode
    );


    if (winner) {
      internalUrl.searchParams.set(
        "winner",
        winner
      );
    }


    const response =
      await coordinator.fetch(
        new Request(
          internalUrl.toString()
        )
      );


    const result =
      await response.json();


    if (!result.ok) {
      if (
        result.error ===
        "NO_ACTIVE_BATTLE"
      ) {
        return new Response(
          `@${actor}, não existe nenhum PvP ativo.`
        );
      }


      if (
        result.error ===
        "MULTIPLE_ACTIVE_BATTLES"
      ) {
        return new Response(
          `@${actor}, existem múltiplos PvPs ativos; o empate ADM não encerrará uma luta arbitrariamente.`
        );
      }


      if (
        result.error ===
        "WINNER_NOT_IN_ACTIVE_BATTLE"
      ) {
        return new Response(
          `@${actor}, @${winner} não está em um PvP ativo.`
        );
      }


      if (
        result.error ===
        "MENTALIDADE_PERSIST_FAILED"
      ) {
        return new Response(
          `@${actor}, não foi possível preservar a Mentalidade dos jogadores. O PvP não foi encerrado.`
        );
      }


      return new Response(
        `@${actor}, não foi possível encerrar o PvP.`
      );
    }


    const mentalidadeText =
      `@${result.player1.user}: 🧠 ${result.player1.mentalidade}/${result.player1.maxMentalidade} | ` +
      `@${result.player2.user}: 🧠 ${result.player2.mentalidade}/${result.player2.maxMentalidade}`;


    if (
      result.mode ===
      "draw"
    ) {
      return new Response(
        `🛠️ ADM | PvP entre @${result.player1.user} e @${result.player2.user} encerrado em empate administrativo. ` +
        `Sem alteração de Elo/estatísticas. | ${mentalidadeText}`
      );
    }


    return new Response(
      `🛠️ ADM | PvP encerrado. @${result.winner} definido como vencedor administrativo sobre @${result.loser}. ` +
      `Sem alteração de Elo/estatísticas. | ${mentalidadeText}`
    );
  }


'''

if 'command === "pvp"' not in admin:
    if skill_marker not in admin:
        raise SystemExit("Marker de SKILL não encontrado")
    admin = admin.replace(skill_marker, pvp_block + skill_marker, 1)

admin = admin.replace(
    '`@${actor}, uso: !adm level/raça/elemento/skill ...`',
    '`@${actor}, uso: !adm level/raça/elemento/pontos/skill/pvp ...`'
)

admin = admin.replace(
    '`@${actor}, comando ADM desconhecido. Use level, raça, elemento, pontos ou skill.`',
    '`@${actor}, comando ADM desconhecido. Use level, raça, elemento, pontos, skill ou pvp.`'
)

admin_path.write_text(admin, encoding="utf-8")

# ==========================================
# Teste
# ==========================================
test = '''import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";

import {
  adminRoute
} from "./src/routes/admin.js";

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

  const coordinator = new PvpCoordinator({ storage }, env);

  env.PVP_COORDINATOR = {
    idFromName() {
      return "test";
    },
    get() {
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
    "\\n🛠️ TODOS OS TESTES DOS COMANDOS ADM DE PVP PASSARAM."
  );
}
finally {
  Date.now = originalNow;
}
'''

Path("testar_adm_pvp.mjs").write_text(test, encoding="utf-8")
