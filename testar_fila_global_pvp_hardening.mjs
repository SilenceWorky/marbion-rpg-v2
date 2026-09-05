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


/*
 * O arquivo já possui chamadas legítimas de ranking em ramos
 * diferentes de encerramento (por exemplo, diferentes formas de
 * derrota). O que a fila precisa garantir é que PROMOVER a próxima
 * batalha nunca aplique ranking por conta própria.
 */
const startNextStart =
  pvp.indexOf(
    "async startNextQueuedBattle()"
  );

const startNextEnd =
  pvp.indexOf(
    "async acceptChallenge(",
    startNextStart
  );

assert.ok(
  startNextStart >= 0 &&
  startNextEnd > startNextStart,
  "Não foi possível isolar startNextQueuedBattle()."
);

const startNextSection =
  pvp.slice(
    startNextStart,
    startNextEnd
  );

assert.doesNotMatch(
  startNextSection,
  /applyRankedBattleResult\(/,
  "Promover a próxima luta da fila nunca deve aplicar Elo/XP de Combate."
);

console.log("✅ Promoção da fila não aplica ranking à luta recém-iniciada.");


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


const naturalChooseStart =
  pvp.lastIndexOf(
    "async chooseAction(",
    naturalPromotionIndex
  );

const naturalFinishedAssignment =
  pvp.lastIndexOf(
    "battle.status =",
    naturalPromotionIndex
  );

const naturalFinishedValue =
  pvp.indexOf(
    '"FINISHED"',
    naturalFinishedAssignment
  );

assert.ok(
  naturalChooseStart >= 0 &&
  naturalFinishedAssignment > naturalChooseStart &&
  naturalFinishedValue > naturalFinishedAssignment &&
  naturalFinishedValue < naturalPromotionIndex,
  "A luta encerrada deve estar FINISHED antes da promoção natural."
);


const adminMethodStart =
  pvp.lastIndexOf(
    "async adminFinishBattle(",
    adminPromotionIndex
  );

const adminFinishedAssignment =
  pvp.lastIndexOf(
    "battle.status =",
    adminPromotionIndex
  );

const adminFinishedValue =
  pvp.indexOf(
    '"FINISHED"',
    adminFinishedAssignment
  );

assert.ok(
  adminMethodStart >= 0 &&
  adminFinishedAssignment > adminMethodStart &&
  adminFinishedValue > adminFinishedAssignment &&
  adminFinishedValue < adminPromotionIndex,
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
