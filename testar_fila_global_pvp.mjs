import assert from "node:assert/strict";

import {
  ensureGlobalPvpQueue,
  getActivePvpBattles,
  getGlobalActivePvpBattle,
  findQueuedPvpByUser,
  enqueueAcceptedPvp,
  dequeueNextPvp,
  getQueuedPvpPosition
} from "./src/systems/pvp-queue.js";


console.log("=== FILA GLOBAL DE PVP ===");

{
  const data = {
    challenges: [],
    battles: []
  };

  const queue =
    ensureGlobalPvpQueue(data);

  assert.deepEqual(queue, []);
  assert.ok(Array.isArray(data.queue));

  console.log("✅ Estrutura antiga de PvP recebe fila vazia automaticamente.");
}

{
  const data = {
    queue: [],
    battles: [
      {
        status: "FINISHED",
        player1: { user: "a" },
        player2: { user: "b" }
      },
      {
        status: "ACTIVE",
        player1: { user: "c" },
        player2: { user: "d" }
      }
    ]
  };

  assert.equal(
    getActivePvpBattles(data).length,
    1
  );

  assert.equal(
    getGlobalActivePvpBattle(data)?.player1?.user,
    "c"
  );

  console.log("✅ Motor identifica a única batalha global ativa.");
}

{
  const data = {
    queue: []
  };

  const first =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "@Alpha",
        target: "Beta",
        acceptedAt: 1000
      }
    );

  const second =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "Gamma",
        target: "Delta",
        acceptedAt: 2000
      }
    );

  assert.equal(first.ok, true);
  assert.equal(first.position, 1);
  assert.equal(second.ok, true);
  assert.equal(second.position, 2);

  assert.equal(
    getQueuedPvpPosition(data, "alpha"),
    1
  );

  assert.equal(
    getQueuedPvpPosition(data, "@delta"),
    2
  );

  assert.equal(
    findQueuedPvpByUser(data, "beta")?.challenger,
    "alpha"
  );

  const duplicate =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "alpha",
        target: "epsilon"
      }
    );

  assert.equal(duplicate.ok, false);
  assert.equal(
    duplicate.error,
    "PLAYER_ALREADY_QUEUED"
  );

  console.log("✅ Duplas entram na fila sem permitir jogador duplicado.");

  const next1 =
    dequeueNextPvp(data);

  const next2 =
    dequeueNextPvp(data);

  assert.equal(next1.challenger, "alpha");
  assert.equal(next1.target, "beta");
  assert.equal(next2.challenger, "gamma");
  assert.equal(next2.target, "delta");
  assert.equal(dequeueNextPvp(data), null);

  console.log("✅ Ordem FIFO preservada: primeira dupla aceita joga primeiro.");
}

console.log();
console.log("🎟️ TODOS OS TESTES DA FILA GLOBAL DE PVP PASSARAM.");
