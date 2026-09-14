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

  return {
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


console.log("=== ROTAS PÚBLICAS E ADM DE TEMPORADA ===");


{
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

  console.log("✅ !temporada informa corretamente quando não existe temporada atual.");


  const unauthorized =
    await textRequest(
      "https://worker.test/adm?actor=naoadmin&key=test-admin-key&args=temporada%20iniciar%20S1%20Temporada%201",
      env
    );

  assert.equal(
    unauthorized.response.status,
    403
  );

  console.log("✅ Comandos administrativos de temporada respeitam permissão de ADM.");


  const start =
    await textRequest(
      "https://worker.test/adm?actor=silenceworky&key=test-admin-key&args=temporada%20iniciar%20S1%20Temporada%201",
      env
    );

  assert.equal(start.response.status, 200);
  assert.match(
    start.text,
    /Temporada iniciada: Temporada 1 \[S1\]/
  );

  console.log("✅ !adm temporada iniciar cria a temporada global pelo dispatcher real.");


  const current =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.equal(current.response.status, 200);
  assert.match(current.text, /Temporada 1 \[S1\]/);
  assert.match(current.text, /Status: ATIVA/);
  assert.match(current.text, /Tempo restante:/);

  console.log("✅ !temporada consulta e formata a temporada ativa pelo router real.");


  const duplicate =
    await textRequest(
      "https://worker.test/adm?actor=silenceworky&key=test-admin-key&args=temporada%20iniciar%20S2%20Temporada%202",
      env
    );

  assert.match(
    duplicate.text,
    /já existe uma temporada atual/i
  );

  console.log("✅ ADM não consegue sobrescrever silenciosamente uma temporada existente.");


  const end =
    await textRequest(
      "https://worker.test/adm?actor=silenceworky&key=test-admin-key&args=temporada%20encerrar",
      env
    );

  assert.equal(end.response.status, 200);
  assert.match(
    end.text,
    /Temporada encerrada: Temporada 1 \[S1\]/
  );
  assert.match(
    end.text,
    /Soft reset e recompensas ainda não foram executados/
  );

  console.log("✅ !adm temporada encerrar persiste o encerramento sem executar soft reset prematuramente.");


  const ended =
    await textRequest(
      "https://worker.test/temporada?user=teste",
      env
    );

  assert.match(ended.text, /Status: ENCERRADA/);

  console.log("✅ !temporada passa a exibir a temporada encerrada corretamente.");
}


console.log("\n🏆 TODOS OS TESTES DAS ROTAS DE TEMPORADA PASSARAM.");
