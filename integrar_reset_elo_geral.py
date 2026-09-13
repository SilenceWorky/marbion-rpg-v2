from pathlib import Path

FILES = {
    "src/core/database.js": None,
    "src/core/profile.js": None,
    "src/durable/PvpCoordinator.js": None,
    "src/routes/admin-elo-reset.js": None,
    "testar_reset_elo_admin.mjs": None,
}

for name in FILES:
    FILES[name] = Path(name).read_text(encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"❌ {label}: esperado 1 bloco, encontrado {count}.")
    return text.replace(old, new, 1)


# ============================================================
# 1. database.js — sincronização preguiçosa da geração de Elo
# ============================================================
text = FILES["src/core/database.js"]

old = '''import {
  ensureProfileDefaults
} from "./profile.js";
'''
new = '''import {
  ensureProfileDefaults
} from "./profile.js";

import {
  normalizeEloGeneration,
  syncProfileEloGeneration
} from "../systems/pvp-elo-generation.js";
'''
text = replace_once(text, old, new, "database import")

anchor = '''function getProfileStoreStub(
  env,
  user
) {
'''
insert = '''function getEloGenerationStub(
  env
) {
  const namespace =
    env?.PVP_COORDINATOR;

  if (
    !namespace ||
    typeof namespace.idFromName !== "function" ||
    typeof namespace.get !== "function"
  ) {
    return null;
  }

  const id =
    namespace.idFromName(
      "marbion-elo-generation"
    );

  return namespace.get(id);
}


async function readCurrentEloGeneration(
  env
) {
  const stub =
    getEloGenerationStub(env);

  if (!stub) {
    return {
      supported: false,
      generation: null
    };
  }

  let response;

  try {
    response =
      await stub.fetch(
        new Request(
          "https://pvp.internal/elo-generation/get"
        )
      );
  }
  catch {
    return {
      supported: false,
      generation: null
    };
  }

  let result = null;

  try {
    result = await response.json();
  }
  catch {
    return {
      supported: false,
      generation: null
    };
  }

  if (
    result?.eloGenerationStore !== true ||
    result?.ok !== true
  ) {
    return {
      supported: false,
      generation: null
    };
  }

  return {
    supported: true,
    generation:
      normalizeEloGeneration(
        result.generation
      )
  };
}


async function syncLoadedProfileEloGeneration(
  env,
  user,
  profile
) {
  const generation =
    await readCurrentEloGeneration(env);

  if (!generation.supported) {
    return profile;
  }

  const sync =
    syncProfileEloGeneration(
      profile,
      generation.generation
    );

  if (!sync.ok) {
    throw new Error(
      `PROFILE_ELO_GENERATION_SYNC_FAILED:${sync.error || "UNKNOWN"}`
    );
  }

  if (sync.changed) {
    await saveProfile(
      env,
      user,
      profile
    );
  }

  return profile;
}


'''
text = replace_once(text, anchor, insert + anchor, "database generation helpers")

old = '''    return ensureProfileDefaults(
      strongResult.profile,
      normalizedUser
    );
'''
new = '''    const profile =
      ensureProfileDefaults(
        strongResult.profile,
        normalizedUser
      );

    return syncLoadedProfileEloGeneration(
      env,
      normalizedUser,
      profile
    );
'''
text = replace_once(text, old, new, "database strong profile sync")

old = '''  return ensureProfileDefaults(
    profile,
    normalizedUser
  );
'''
new = '''  const normalizedProfile =
    ensureProfileDefaults(
      profile,
      normalizedUser
    );

  return syncLoadedProfileEloGeneration(
    env,
    normalizedUser,
    normalizedProfile
  );
'''
text = replace_once(text, old, new, "database kv profile sync")
FILES["src/core/database.js"] = text


# ============================================================
# 2. profile.js — geração padrão
# ============================================================
text = FILES["src/core/profile.js"]
old = '''      rating: 1000,
      peakRating: 1000,

      rank: "Prata III",
'''
new = '''      rating: 1000,
      peakRating: 1000,

      /*
       * Geração global do Elo.
       * Perfis antigos sem o campo equivalem à geração 0.
       */
      eloGeneration: 0,

      rank: "Prata III",
'''
text = replace_once(text, old, new, "profile eloGeneration")
FILES["src/core/profile.js"] = text


# ============================================================
# 3. PvpCoordinator.js — store global + reset protegido
# ============================================================
text = FILES["src/durable/PvpCoordinator.js"]

old = '''import {
  createPvpResultRecord,
  getPvpResultRecord,
  restorePvpRankingState,
  storePvpResultRecord,
  validatePvpResultRecord
} from "../systems/pvp-result-idempotency.js";
'''
new = '''import {
  createPvpResultRecord,
  getPvpResultRecord,
  restorePvpRankingState,
  storePvpResultRecord,
  validatePvpResultRecord
} from "../systems/pvp-result-idempotency.js";

import {
  normalizeEloGeneration,
  nextEloGeneration
} from "../systems/pvp-elo-generation.js";
'''
text = replace_once(text, old, new, "coordinator generation import")

old = '''  constructor(
    state,
    env
  ) {
    this.state =
      state;

    this.env =
      env;
  }


  async getData() {
'''
new = '''  constructor(
    state,
    env
  ) {
    this.state =
      state;

    this.env =
      env;
  }


  async getStoredEloGeneration() {
    const stored =
      await this.state.storage.get(
        "elo_generation"
      );

    return normalizeEloGeneration(
      stored
    );
  }


  async advanceStoredEloGeneration() {
    const before =
      await this.getStoredEloGeneration();

    const next =
      nextEloGeneration(before);

    if (!next.ok) {
      return next;
    }

    await this.state.storage.put(
      "elo_generation",
      next.after
    );

    return {
      ok: true,
      before:
        next.before,
      after:
        next.after
    };
  }


  async isEloResetInProgress() {
    return (
      await this.state.storage.get(
        "elo_reset_in_progress"
      )
    ) === true;
  }


  async adminResetGeneralElo() {
    if (
      await this.isEloResetInProgress()
    ) {
      return {
        ok: false,
        error:
          "ELO_RESET_IN_PROGRESS"
      };
    }

    const data =
      await this.getData();

    const activeBattle =
      getGlobalActivePvpBattle(
        data
      );

    if (activeBattle) {
      return {
        ok: false,
        error:
          "ACTIVE_BATTLE",
        battleId:
          activeBattle.id || null
      };
    }

    if (
      Array.isArray(data.challenges) &&
      data.challenges.length > 0
    ) {
      return {
        ok: false,
        error:
          "PENDING_CHALLENGE"
      };
    }

    if (
      Array.isArray(data.queue) &&
      data.queue.length > 0
    ) {
      return {
        ok: false,
        error:
          "PVP_QUEUE_NOT_EMPTY"
      };
    }

    await this.state.storage.put(
      "elo_reset_in_progress",
      true
    );

    try {
      const namespace =
        this.env?.PVP_COORDINATOR;

      if (
        !namespace ||
        typeof namespace.idFromName !== "function" ||
        typeof namespace.get !== "function"
      ) {
        return {
          ok: false,
          error:
            "ELO_GENERATION_STORE_UNAVAILABLE"
        };
      }

      const generationId =
        namespace.idFromName(
          "marbion-elo-generation"
        );

      const generationStub =
        namespace.get(
          generationId
        );

      const response =
        await generationStub.fetch(
          new Request(
            "https://pvp.internal/elo-generation/advance",
            {
              method: "POST"
            }
          )
        );

      const result =
        await response.json();

      if (!result?.ok) {
        return {
          ok: false,
          error:
            result?.error ||
            "ELO_GENERATION_ADVANCE_FAILED"
        };
      }

      return {
        ok: true,
        before:
          result.before,
        after:
          result.after
      };
    }
    finally {
      await this.state.storage.delete(
        "elo_reset_in_progress"
      );
    }
  }


  async getData() {
'''
text = replace_once(text, old, new, "coordinator generation methods")

old = '''  async createChallenge(
    challenger,
    target
  ) {
    challenger =
'''
new = '''  async createChallenge(
    challenger,
    target
  ) {
    if (
      await this.isEloResetInProgress()
    ) {
      return {
        ok: false,
        error:
          "ELO_RESET_IN_PROGRESS"
      };
    }

    challenger =
'''
text = replace_once(text, old, new, "challenge reset lock")

old = '''  async acceptChallenge(
    user
  ) {
    user =
'''
new = '''  async acceptChallenge(
    user
  ) {
    if (
      await this.isEloResetInProgress()
    ) {
      return {
        ok: false,
        error:
          "ELO_RESET_IN_PROGRESS"
      };
    }

    user =
'''
text = replace_once(text, old, new, "accept reset lock")

old = '''    if (
      url.pathname ===
      "/profile-store/get"
    ) {
'''
new = '''    if (
      url.pathname ===
      "/elo-generation/get"
    ) {
      const generation =
        await this.getStoredEloGeneration();

      return Response.json({
        eloGenerationStore: true,
        ok: true,
        generation
      });
    }


    if (
      url.pathname ===
      "/elo-generation/advance"
    ) {
      const result =
        await this.advanceStoredEloGeneration();

      return Response.json({
        eloGenerationStore: true,
        ...result
      }, {
        status:
          result.ok
            ? 200
            : 400
      });
    }


    if (
      url.pathname ===
      "/admin-elo-reset-general"
    ) {
      const result =
        await this.adminResetGeneralElo();

      return Response.json(
        result,
        {
          status:
            result.ok
              ? 200
              : 409
        }
      );
    }


    if (
      url.pathname ===
      "/profile-store/get"
    ) {
'''
text = replace_once(text, old, new, "coordinator internal routes")
FILES["src/durable/PvpCoordinator.js"] = text


# ============================================================
# 4. admin-elo-reset.js — habilita o comando geral
# ============================================================
text = FILES["src/routes/admin-elo-reset.js"]

anchor = '''function normalizeCommand(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim()
    .toLowerCase();
}


'''
insert = '''function getGlobalPvpCoordinator(
  env
) {
  const namespace =
    env?.PVP_COORDINATOR;

  if (
    !namespace ||
    typeof namespace.idFromName !== "function" ||
    typeof namespace.get !== "function"
  ) {
    return null;
  }

  const id =
    namespace.idFromName(
      "marbion-global-pvp"
    );

  return namespace.get(id);
}


async function resetGeneralElo(
  env
) {
  const coordinator =
    getGlobalPvpCoordinator(env);

  if (!coordinator) {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  let response;

  try {
    response =
      await coordinator.fetch(
        new Request(
          "https://pvp.internal/admin-elo-reset-general",
          {
            method: "POST"
          }
        )
      );
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  try {
    return await response.json();
  }
  catch {
    return {
      ok: false,
      error:
        "INVALID_COORDINATOR_RESPONSE"
    };
  }
}


'''
text = replace_once(text, anchor, anchor + insert, "admin general helper")

old = '''  if (
    normalizeCommand(target) === "geral"
  ) {
    return new Response(
      `@${actor}, o reset geral de Elo ainda não está disponível com segurança.`
    );
  }
'''
new = '''  if (
    normalizeCommand(target) === "geral"
  ) {
    const result =
      await resetGeneralElo(env);

    if (!result.ok) {
      if (
        result.error === "ACTIVE_BATTLE" ||
        result.error === "PENDING_CHALLENGE" ||
        result.error === "PVP_QUEUE_NOT_EMPTY"
      ) {
        return new Response(
          `@${actor}, não é possível resetar o Elo geral enquanto houver atividade PvP em andamento.`
        );
      }

      if (
        result.error ===
        "ELO_RESET_IN_PROGRESS"
      ) {
        return new Response(
          `@${actor}, já existe um reset geral de Elo em andamento.`
        );
      }

      return new Response(
        `@${actor}, não foi possível executar o reset geral de Elo.`
      );
    }

    return new Response(
      `🏆 ADM | Reset geral de Elo ativado: geração ${result.before} → ${result.after}. ` +
      `Cada perfil será sincronizado para 1000 de Elo ao ser acessado; histórico competitivo preservado.`
    );
  }
'''
text = replace_once(text, old, new, "admin general route")
FILES["src/routes/admin-elo-reset.js"] = text


# ============================================================
# 5. teste antigo — deixa de esperar bloqueio permanente
# ============================================================
text = FILES["testar_reset_elo_admin.mjs"]
old = '''  assert.match(
    route,
    /reset geral de Elo ainda não está disponível com segurança/
  );

  console.log("✅ !adm elo reset está roteado e reset geral segue bloqueado");
'''
new = '''  assert.match(
    route,
    /resetGeneralElo/
  );

  assert.doesNotMatch(
    route,
    /reset geral de Elo ainda não está disponível com segurança/
  );

  console.log("✅ !adm elo reset está roteado para reset individual e geral");
'''
text = replace_once(text, old, new, "legacy admin test")
FILES["testar_reset_elo_admin.mjs"] = text


# Só grava depois que TODAS as substituições foram validadas.
for name, content in FILES.items():
    Path(name).write_text(content, encoding="utf-8")

print("✅ Integração do reset geral de Elo aplicada localmente.")
print("✅ Nenhum JSON protegido foi tocado.")
