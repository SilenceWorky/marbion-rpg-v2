import assert from "node:assert/strict";

import {
  handleRequest
} from "./src/router.js";

import {
  PvpCoordinator
} from "./src/index.js";


function createStorage() {
  const data =
    new Map();

  let alarmAt =
    null;

  return {
    data,

    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      data.set(
        key,
        structuredClone(value)
      );
    },

    async delete(key) {
      data.delete(key);
    },

    async list({ prefix } = {}) {
      const result =
        new Map();

      for (
        const [key, value]
        of data.entries()
      ) {
        if (
          !prefix ||
          String(key).startsWith(prefix)
        ) {
          result.set(
            key,
            structuredClone(value)
          );
        }
      }

      return result;
    },

    async getAlarm() {
      return alarmAt;
    },

    async setAlarm(value) {
      alarmAt =
        Number(value);
    },

    async deleteAlarm() {
      alarmAt =
        null;
    }
  };
}


function createEnv() {
  const coordinator =
    new PvpCoordinator(
      {
        storage:
          createStorage()
      },
      {}
    );

  return {
    MARBION_ADMIN_KEY:
      "test-admin-key",

    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },

      get() {
        return coordinator;
      }
    }
  };
}


async function textRequest(
  url,
  env
) {
  const response =
    await handleRequest(
      new Request(url),
      env,
      {}
    );

  return {
    response,
    text:
      await response.text()
  };
}


function admUrl(
  actor,
  args
) {
  const url =
    new URL(
      "https://worker.test/adm"
    );

  url.searchParams.set(
    "actor",
    actor
  );

  url.searchParams.set(
    "key",
    "test-admin-key"
  );

  url.searchParams.set(
    "args",
    args
  );

  return url.toString();
}


console.log("=== ROTAS PÚBLICAS E ADM DE TEMPORADA MENSAL ===");


const originalDateNow =
  Date.now;

try {
  const now =
    Date.parse(
      "2026-08-20T12:00:00.000-03:00"
    );

  Date.now = () => now;

  const env =
    createEnv();


  const empty =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.equal(empty.response.status, 200);
  assert.match(
    empty.text,
    /não há temporada ranqueada/i
  );

  console.log("✅ !temporada informa corretamente quando não existe temporada atual ou agendada.");


  const unauthorized =
    await textRequest(
      admUrl(
        "naoadmin",
        "temporada definir 2026 9 Jardim do Criador"
      ),
      env
    );

  assert.equal(
    unauthorized.response.status,
    403
  );

  console.log("✅ Comandos administrativos de temporada continuam exigindo permissão de ADM.");


  const legacyStart =
    await textRequest(
      admUrl(
        "silenceworky",
        "temporada iniciar S1 Temporada 1"
      ),
      env
    );

  assert.equal(
    legacyStart.response.status,
    200
  );

  assert.match(
    legacyStart.text,
    /comando legado.*desativado/i
  );

  const stillEmpty =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.match(
    stillEmpty.text,
    /não há temporada ranqueada/i
  );

  console.log("✅ !adm temporada iniciar permanece bloqueado e não cria temporada arbitrária.");


  const defined =
    await textRequest(
      admUrl(
        "silenceworky",
        "temporada definir 2026 9 Jardim Desperto"
      ),
      env
    );

  assert.equal(
    defined.response.status,
    200
  );

  assert.match(
    defined.text,
    /Setembro\/2026 preparada/i
  );

  assert.match(
    defined.text,
    /Início automático no dia 1/i
  );

  console.log("✅ !adm temporada definir prepara e autoriza o mês futuro sem iniciar imediatamente.");


  const scheduled =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.equal(
    scheduled.response.status,
    200
  );

  assert.match(
    scheduled.text,
    /Jardim Desperto \[2026-09\]/
  );

  assert.match(
    scheduled.text,
    /Status: AGENDADA/
  );

  console.log("✅ !temporada exibe a próxima temporada mensal autorizada como AGENDADA.");


  const cancelled =
    await textRequest(
      admUrl(
        "silenceworky",
        "temporada cancelar 2026 9"
      ),
      env
    );

  assert.equal(
    cancelled.response.status,
    200
  );

  assert.match(
    cancelled.text,
    /Agendamento de Setembro\/2026 cancelado/i
  );

  console.log("✅ !adm temporada cancelar remove a autorização temporal sem depender do fluxo legado.");


  const afterCancel =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.match(
    afterCancel.text,
    /não há temporada ranqueada/i
  );

  console.log("✅ Após cancelar, !temporada não inventa nem mantém uma temporada fantasma.");
}
finally {
  Date.now =
    originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DAS ROTAS MENSAIS DE TEMPORADA PASSARAM.");
