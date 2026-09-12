import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";


class FakeStorage {
  constructor(data) {
    this.data =
      structuredClone(data);
  }

  async get(key) {
    if (key !== "pvp") {
      return null;
    }

    return structuredClone(
      this.data
    );
  }

  async put(key, value) {
    if (key !== "pvp") {
      return;
    }

    this.data =
      structuredClone(value);
  }
}


function createCoordinator(data) {
  const storage =
    new FakeStorage(data);

  const coordinator =
    new PvpCoordinator(
      { storage },
      {}
    );

  return {
    coordinator,
    storage
  };
}


function makeChallenge(
  challenger,
  target
) {
  const now =
    Date.now();

  return {
    challenger,
    target,
    createdAt: now,
    expiresAt:
      now + 120000
  };
}


console.log(
  "=== !RECUSAR PVP ==="
);


/*
 * TESTE 1 — desafiante não pode recusar.
 */
{
  const {
    coordinator,
    storage
  } = createCoordinator({
    challenges: [
      makeChallenge(
        "alice",
        "bob"
      )
    ],
    battles: [],
    queue: []
  });


  const result =
    await coordinator.refuseChallenge(
      "alice"
    );


  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.error,
    "NO_CHALLENGE"
  );

  assert.equal(
    storage.data.challenges.length,
    1
  );


  console.log(
    "✅ o desafiante não pode recusar o próprio desafio"
  );
}


/*
 * TESTE 2 — alvo pode recusar e remove o desafio.
 */
{
  const {
    coordinator,
    storage
  } = createCoordinator({
    challenges: [
      makeChallenge(
        "alice",
        "bob"
      )
    ],
    battles: [],
    queue: []
  });


  const result =
    await coordinator.refuseChallenge(
      "@BoB"
    );


  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.challenger,
    "alice"
  );

  assert.equal(
    result.target,
    "bob"
  );

  assert.equal(
    storage.data.challenges.length,
    0
  );


  console.log(
    "✅ o alvo pode recusar e o desafio pendente é removido imediatamente"
  );
}


/*
 * TESTE 3 — outro usuário não interfere.
 */
{
  const {
    coordinator,
    storage
  } = createCoordinator({
    challenges: [
      makeChallenge(
        "alice",
        "bob"
      )
    ],
    battles: [],
    queue: []
  });


  const result =
    await coordinator.refuseChallenge(
      "charlie"
    );


  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.error,
    "NO_CHALLENGE"
  );

  assert.equal(
    storage.data.challenges.length,
    1
  );


  console.log(
    "✅ terceiros não podem remover desafios de outros jogadores"
  );
}


/*
 * TESTE 4 — dupla já aceita/enfileirada não é cancelada.
 */
{
  const queued = {
    id: "queue-test",
    challenger: "alice",
    target: "bob",
    acceptedAt:
      Date.now()
  };

  const {
    coordinator,
    storage
  } = createCoordinator({
    challenges: [],
    battles: [],
    queue: [queued]
  });


  const result =
    await coordinator.refuseChallenge(
      "bob"
    );


  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.error,
    "NO_CHALLENGE"
  );

  assert.equal(
    storage.data.queue.length,
    1
  );

  assert.equal(
    storage.data.queue[0].id,
    "queue-test"
  );


  console.log(
    "✅ !recusar não cancela uma dupla que já entrou na fila global"
  );
}


/*
 * TESTE 5 — batalha ativa não é alterada.
 */
{
  const battle = {
    id: "battle-test",
    status: "ACTIVE",
    player1: {
      user: "alice"
    },
    player2: {
      user: "bob"
    }
  };

  const {
    coordinator,
    storage
  } = createCoordinator({
    challenges: [],
    battles: [battle],
    queue: []
  });


  const result =
    await coordinator.refuseChallenge(
      "bob"
    );


  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.error,
    "NO_CHALLENGE"
  );

  assert.equal(
    storage.data.battles.length,
    1
  );

  assert.equal(
    storage.data.battles[0].status,
    "ACTIVE"
  );


  console.log(
    "✅ !recusar não interfere em PvP já ativo"
  );
}


/*
 * TESTE 6 — rota pública e router foram conectados.
 */
{
  const route =
    fs.readFileSync(
      "src/routes/refuse.js",
      "utf8"
    );

  const router =
    fs.readFileSync(
      "src/router.js",
      "utf8"
    );


  assert.ok(
    route.includes(
      "https://pvp.internal/refuse"
    )
  );

  assert.ok(
    router.includes(
      'path === "/recusar"'
    )
  );


  console.log(
    "✅ rota pública /recusar está ligada ao Durable Object"
  );
}


console.log(
  "\n🚫 TODOS OS TESTES DO !RECUSAR PASSARAM."
);
