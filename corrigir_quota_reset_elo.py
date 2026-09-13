from pathlib import Path

FILES = {
    "src/core/database.js": None,
    "src/durable/PvpCoordinator.js": None,
    "testar_reset_elo_geral.mjs": None,
}

for name in FILES:
    FILES[name] = Path(name).read_text(encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"❌ {label}: esperado 1 bloco, encontrado {count}.")
    return text.replace(old, new, 1)


# ============================================================
# 1. database.js — geração de Elo via KV, sem DO extra
# ============================================================
text = FILES["src/core/database.js"]

old = '''function getEloGenerationStub(
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
'''

new = '''const PVP_ELO_GENERATION_KV_KEY =
  "__pvp_elo_generation__";


async function readCurrentEloGeneration(
  env
) {
  const kv =
    env?.MARBION_USERS_V2;

  if (
    !kv ||
    typeof kv.get !== "function"
  ) {
    return {
      supported: false,
      generation: null
    };
  }

  let stored = null;

  try {
    stored =
      await kv.get(
        PVP_ELO_GENERATION_KV_KEY
      );
  }
  catch {
    return {
      supported: false,
      generation: null
    };
  }

  return {
    supported: true,
    generation:
      normalizeEloGeneration(
        stored
      )
  };
}
'''

text = replace_once(
    text,
    old,
    new,
    "database troca DO extra por KV"
)

old = '''async function syncLoadedProfileEloGeneration(
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
'''

new = '''async function syncLoadedProfileEloGeneration(
  env,
  user,
  profile,
  forcedGeneration = null
) {
  const generation =
    forcedGeneration === null ||
    forcedGeneration === undefined
      ? await readCurrentEloGeneration(env)
      : {
          supported: true,
          generation:
            normalizeEloGeneration(
              forcedGeneration
            )
        };

  if (!generation.supported) {
    return profile;
  }

  const sync =
    syncProfileEloGeneration(
      profile,
      generation.generation
    );
'''

text = replace_once(
    text,
    old,
    new,
    "database geração forçada"
)

old = '''export async function getProfile(
  env,
  user
) {
'''
new = '''export async function getProfile(
  env,
  user,
  options = {}
) {
'''
text = replace_once(text, old, new, "database assinatura getProfile")

old = '''    return syncLoadedProfileEloGeneration(
      env,
      normalizedUser,
      profile
    );
'''
new = '''    return syncLoadedProfileEloGeneration(
      env,
      normalizedUser,
      profile,
      options?.eloGeneration
    );
'''
text = replace_once(text, old, new, "database sync strong")

old = '''  return syncLoadedProfileEloGeneration(
    env,
    normalizedUser,
    normalizedProfile
  );
'''
new = '''  return syncLoadedProfileEloGeneration(
    env,
    normalizedUser,
    normalizedProfile,
    options?.eloGeneration
  );
'''
text = replace_once(text, old, new, "database sync kv")

FILES["src/core/database.js"] = text


# ============================================================
# 2. PvpCoordinator.js — geração no coordenador global + espelho KV
# ============================================================
text = FILES["src/durable/PvpCoordinator.js"]

old = '''const CHALLENGE_TIMEOUT =
  2 * 60 * 1000;
'''
new = '''const CHALLENGE_TIMEOUT =
  2 * 60 * 1000;

const PVP_ELO_GENERATION_KV_KEY =
  "__pvp_elo_generation__";
'''
text = replace_once(text, old, new, "coordinator chave KV geração")

old = '''  async getStoredEloGeneration() {
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
'''

new = '''  async getStoredEloGeneration() {
    const stored =
      await this.state.storage.get(
        "elo_generation"
      );

    if (
      stored !== undefined &&
      stored !== null
    ) {
      return normalizeEloGeneration(
        stored
      );
    }

    let mirrored = null;

    try {
      mirrored =
        await this.env?.MARBION_USERS_V2?.get?.(
          PVP_ELO_GENERATION_KV_KEY
        );
    }
    catch {
      mirrored = null;
    }

    const generation =
      normalizeEloGeneration(
        mirrored
      );

    await this.state.storage.put(
      "elo_generation",
      generation
    );

    return generation;
  }


  async advanceStoredEloGeneration() {
    const before =
      await this.getStoredEloGeneration();

    const next =
      nextEloGeneration(before);

    if (!next.ok) {
      return next;
    }

    const kv =
      this.env?.MARBION_USERS_V2;

    if (
      !kv ||
      typeof kv.put !== "function"
    ) {
      return {
        ok: false,
        error:
          "ELO_GENERATION_KV_UNAVAILABLE"
      };
    }

    await this.state.storage.put(
      "elo_generation",
      next.after
    );

    try {
      await kv.put(
        PVP_ELO_GENERATION_KV_KEY,
        String(next.after)
      );
    }
    catch {
      await this.state.storage.put(
        "elo_generation",
        before
      );

      return {
        ok: false,
        error:
          "ELO_GENERATION_KV_WRITE_FAILED"
      };
    }

    return {
      ok: true,
      before:
        next.before,
      after:
        next.after
    };
  }
'''

text = replace_once(
    text,
    old,
    new,
    "coordinator geração local + KV"
)

old = '''    try {
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
'''

new = '''    try {
      const result =
        await this.advanceStoredEloGeneration();

      if (!result?.ok) {
        return {
          ok: false,
          error:
            result?.error ||
            "ELO_GENERATION_ADVANCE_FAILED"
        };
      }

      return result;
    }
'''

text = replace_once(
    text,
    old,
    new,
    "coordinator reset sem DO secundário"
)

old = '''    const challengerProfile =
      await getProfile(
        this.env,
        challenger
      );

    const targetProfile =
      await getProfile(
        this.env,
        target
      );
'''

new = '''    const eloGeneration =
      await this.getStoredEloGeneration();

    const challengerProfile =
      await getProfile(
        this.env,
        challenger,
        { eloGeneration }
      );

    const targetProfile =
      await getProfile(
        this.env,
        target,
        { eloGeneration }
      );
'''

text = replace_once(
    text,
    old,
    new,
    "challenge usa geração forte"
)

old = '''    const challengerProfile =
      await getProfile(
        this.env,
        challenge.challenger
      );

    const targetProfile =
      await getProfile(
        this.env,
        challenge.target
      );
'''

new = '''    const eloGeneration =
      await this.getStoredEloGeneration();

    const challengerProfile =
      await getProfile(
        this.env,
        challenge.challenger,
        { eloGeneration }
      );

    const targetProfile =
      await getProfile(
        this.env,
        challenge.target,
        { eloGeneration }
      );
'''

text = replace_once(
    text,
    old,
    new,
    "accept usa geração forte"
)

old = '''    if (
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


'''

text = replace_once(
    text,
    old,
    "",
    "remove rotas do DO secundário"
)

FILES["src/durable/PvpCoordinator.js"] = text


# ============================================================
# 3. testes — mocks compatíveis com geração em KV
# ============================================================
text = FILES["testar_reset_elo_geral.mjs"]

old = '''      get(id) {
        if (id === "marbion-elo-generation") {
          return {
            async fetch() {
              return Response.json({
                eloGenerationStore: true,
                ok: true,
                generation: 1
              });
            }
          };
        }

        if (id === "marbion-profile:alice") {
'''
new = '''      get(id) {
        if (id === "marbion-profile:alice") {
'''
text = replace_once(text, old, new, "teste remove generation DO")

old = '''    MARBION_USERS_V2: {
      async get() {
        return null;
      },
      async put() {}
    }
'''
new = '''    MARBION_USERS_V2: {
      async get(key) {
        if (key === "__pvp_elo_generation__") {
          return "1";
        }

        return null;
      },
      async put() {}
    }
'''
text = replace_once(text, old, new, "teste geração via KV")

old = '''{
  const generationStorage = makeStorage({
    elo_generation: 7
  });

  const coordinatorStorage = makeStorage({
    pvp: {
      challenges: [],
      battles: [],
      queue: []
    }
  });

  const generationState = {
    storage: generationStorage
  };

  const generationCoordinator =
    new PvpCoordinator(
      generationState,
      {
        MARBION_USERS_V2: {}
      }
    );

  const env = {
    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },
      get(id) {
        assert.equal(
          id,
          "marbion-elo-generation"
        );

        return {
          fetch(request) {
            return generationCoordinator.fetch(request);
          }
        };
      }
    }
  };

  const coordinator =
    new PvpCoordinator(
      {
        storage: coordinatorStorage
      },
      env
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, true);
  assert.equal(result.before, 7);
  assert.equal(result.after, 8);
  assert.equal(
    generationStorage._data.get("elo_generation"),
    8
  );
  assert.equal(
    coordinatorStorage._data.has("elo_reset_in_progress"),
    false
  );

  console.log("✅ reset geral avança a geração global e libera a trava ao terminar");
}
'''

new = '''{
  const coordinatorStorage = makeStorage({
    elo_generation: 7,
    pvp: {
      challenges: [],
      battles: [],
      queue: []
    }
  });

  let kvGeneration = "7";
  let kvWrites = 0;

  const env = {
    MARBION_USERS_V2: {
      async get(key) {
        assert.equal(
          key,
          "__pvp_elo_generation__"
        );

        return kvGeneration;
      },
      async put(key, value) {
        assert.equal(
          key,
          "__pvp_elo_generation__"
        );

        kvWrites += 1;
        kvGeneration = value;
      }
    }
  };

  const coordinator =
    new PvpCoordinator(
      {
        storage: coordinatorStorage
      },
      env
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, true);
  assert.equal(result.before, 7);
  assert.equal(result.after, 8);
  assert.equal(
    coordinatorStorage._data.get("elo_generation"),
    8
  );
  assert.equal(kvGeneration, "8");
  assert.equal(kvWrites, 1);
  assert.equal(
    coordinatorStorage._data.has("elo_reset_in_progress"),
    false
  );

  console.log("✅ reset geral avança a geração no coordenador e espelha no KV");
}
'''

text = replace_once(
    text,
    old,
    new,
    "teste reset geral sem DO secundário"
)

old = '''{
  let generationCalls = 0;

  const coordinator =
    new PvpCoordinator(
      {
        storage: makeStorage({
          pvp: {
            challenges: [],
            battles: [
              {
                id: "battle-active",
                status: "ACTIVE",
                state: "WAITING_ACTIONS",
                player1: { user: "alice" },
                player2: { user: "bob" }
              }
            ],
            queue: []
          }
        })
      },
      {
        PVP_COORDINATOR: {
          idFromName(name) {
            return name;
          },
          get() {
            generationCalls += 1;
            throw new Error("should not reach generation store");
          }
        }
      }
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, false);
  assert.equal(result.error, "ACTIVE_BATTLE");
  assert.equal(generationCalls, 0);

  console.log("✅ reset geral é recusado enquanto existe batalha PvP ativa");
}
'''

new = '''{
  let kvWrites = 0;

  const coordinator =
    new PvpCoordinator(
      {
        storage: makeStorage({
          pvp: {
            challenges: [],
            battles: [
              {
                id: "battle-active",
                status: "ACTIVE",
                state: "WAITING_ACTIONS",
                player1: { user: "alice" },
                player2: { user: "bob" }
              }
            ],
            queue: []
          }
        })
      },
      {
        MARBION_USERS_V2: {
          async put() {
            kvWrites += 1;
          }
        }
      }
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, false);
  assert.equal(result.error, "ACTIVE_BATTLE");
  assert.equal(kvWrites, 0);

  console.log("✅ reset geral é recusado enquanto existe batalha PvP ativa");
}
'''

text = replace_once(
    text,
    old,
    new,
    "teste batalha ativa sem generation DO"
)

FILES["testar_reset_elo_geral.mjs"] = text


for name, content in FILES.items():
    Path(name).write_text(content, encoding="utf-8")

print("✅ Correção de quota aplicada localmente.")
print("✅ Geração de Elo não cria mais um Durable Object extra por leitura de perfil.")
print("✅ PvP usa a geração forte do coordenador global ao desafiar/aceitar.")
print("✅ Nenhum JSON protegido foi tocado.")
