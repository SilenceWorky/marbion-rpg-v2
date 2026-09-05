import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ensureGlobalPvpQueue,
  getActivePvpBattles,
  getGlobalActivePvpBattle,
  enqueueAcceptedPvp,
  dequeueNextPvp,
  findQueuedPvpByUser,
  getQueuedPvpPosition
} from "./src/systems/pvp-queue.js";


console.log("=== HARDENING FILA GLOBAL DE PVP ===");


/* =========================================================
 * MOTOR PURO DA FILA
 * ========================================================= */
{
  const data = {
    battles: [
      {
        id: "old-finished",
        status: "FINISHED"
      },
      {
        id: "current",
        status: "ACTIVE",
        player1: { user: "a" },
        player2: { user: "b" }
      }
    ]
  };

  ensureGlobalPvpQueue(data);

  assert.deepEqual(
    data.queue,
    []
  );

  assert.equal(
    getActivePvpBattles(data).length,
    1
  );

  assert.equal(
    getGlobalActivePvpBattle(data)?.id,
    "current"
  );

  console.log("✅ Apenas batalhas ACTIVE contam como PvP global ativo.");
}


{
  const data = {
    battles: [],
    queue: []
  };

  const first =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "@Alpha",
        target: "@Beta",
        acceptedAt: 100
      }
    );

  const second =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "Gamma",
        target: "Delta",
        acceptedAt: 200
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
    getQueuedPvpPosition(data, "delta"),
    2
  );

  assert.ok(
    findQueuedPvpByUser(data, "@beta")
  );

  const duplicate =
    enqueueAcceptedPvp(
      data,
      {
        challenger: "beta",
        target: "epsilon"
      }
    );

  assert.equal(duplicate.ok, false);
  assert.equal(
    duplicate.error,
    "PLAYER_ALREADY_QUEUED"
  );

  const next =
    dequeueNextPvp(data);

  assert.equal(next.challenger, "alpha");
  assert.equal(next.target, "beta");
  assert.equal(data.queue.length, 1);
  assert.equal(data.queue[0].challenger, "gamma");

  console.log("✅ FIFO, posição e bloqueio de duplicidade permanecem consistentes.");
}


/* =========================================================
 * INVARIANTES DA INTEGRAÇÃO NO COORDENADOR
 * ========================================================= */
const pvp =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );


assert.match(
  pvp,
  /async startNextQueuedBattle\(\)[\s\S]*?getGlobalActivePvpBattle\([\s\S]*?return \{[\s\S]*?started: false,[\s\S]*?reason: "ACTIVE_BATTLE"[\s\S]*?dequeueNextPvp\(/,
  "A fila não pode remover/promover ninguém enquanto já houver PvP ACTIVE."
);

console.log("✅ Promoção consulta a batalha ativa antes de retirar alguém da fila.");


const promotionCalls =
  pvp.match(
    /await this\.startNextQueuedBattle\(\)/g
  ) || [];

assert.equal(
  promotionCalls.length,
  2,
  "Devem existir exatamente duas promoções automáticas: fim natural e fim ADM."
);

console.log("✅ Existe exatamente uma promoção no fim natural e uma no fim ADM.");


const rankedCalls =
  pvp.match(
    /await this\.applyRankedBattleResult\(/g
  ) || [];

assert.equal(
  rankedCalls.length,
  1,
  "O resultado ranqueado deve ser aplicado uma única vez no fluxo normal da batalha."
);

console.log("✅ Ranking possui uma única chamada de aplicação no fluxo normal.");


const naturalPromotionIndex =
  pvp.indexOf(
    "const naturalQueuePromotion ="
  );

const adminPromotionIndex =
  pvp.indexOf(
    "const adminQueuePromotion ="
  );

assert.ok(
  naturalPromotionIndex >= 0 &&
  adminPromotionIndex >= 0
);


const naturalWindow =
  pvp.slice(
    Math.max(0, naturalPromotionIndex - 5000),
    naturalPromotionIndex + 1000
  );

assert.match(
  naturalWindow,
  /battle\.status\s*=\s*[\s\S]*?"FINISHED"/,
  "A luta encerrada deve estar FINISHED antes da promoção natural."
);


const adminWindow =
  pvp.slice(
    Math.max(0, adminPromotionIndex - 3500),
    adminPromotionIndex + 1000
  );

assert.match(
  adminWindow,
  /battle\.status\s*=\s*[\s\S]*?"FINISHED"/,
  "A luta encerrada deve estar FINISHED antes da promoção ADM."
);

console.log("✅ A luta antiga é marcada FINISHED antes de promover a próxima.");


assert.match(
  pvp,
  /dequeueNextPvp\([\s\S]*?data[\s\S]*?\)[\s\S]*?data\.challenges\.push\([\s\S]*?promotedFromQueue:[\s\S]*?true[\s\S]*?await this\.acceptChallenge\(/,
  "A promoção deve retirar uma entrada FIFO e reutilizar o fluxo normal de aceite exatamente depois."
);

console.log("✅ Promoção retira uma única entrada e reutiliza o aceite normal.");


console.log();
console.log("🔒 HARDENING DA FILA GLOBAL DE PVP PASSOU.");
