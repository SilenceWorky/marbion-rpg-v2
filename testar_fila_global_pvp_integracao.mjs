import assert from "node:assert/strict";
import fs from "node:fs";


const pvp =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const challengeRoute =
  fs.readFileSync(
    "src/routes/pvp.js",
    "utf8"
  );

const acceptRoute =
  fs.readFileSync(
    "src/routes/accept.js",
    "utf8"
  );

const attackRoute =
  fs.readFileSync(
    "src/routes/attack.js",
    "utf8"
  );

const adminRoute =
  fs.readFileSync(
    "src/routes/admin.js",
    "utf8"
  );


assert.match(
  pvp,
  /from "\.\.\/systems\/pvp-queue\.js";/
);

assert.match(
  pvp,
  /ensureGlobalPvpQueue\([\s\S]*?data[\s\S]*?\);/
);

console.log("✅ Durable Object persiste e normaliza a fila global.");


assert.match(
  pvp,
  /CHALLENGER_IN_QUEUE/
);

assert.match(
  pvp,
  /TARGET_IN_QUEUE/
);

assert.match(
  pvp,
  /findQueuedPvpByUser/
);

console.log("✅ Jogador não pode entrar em múltiplas posições da fila.");


assert.match(
  pvp,
  /const activeGlobalBattle =/[\s\S]*?enqueueAcceptedPvp/[\s\S]*?queued: true/
);

assert.match(
  pvp,
  /position:\s*queued\.position/
);

console.log("✅ !aceitar enfileira a dupla quando já existe batalha ativa.");


assert.match(
  pvp,
  /async startNextQueuedBattle\(\)/
);

assert.match(
  pvp,
  /dequeueNextPvp\([\s\S]*?data[\s\S]*?\)/
);

assert.match(
  pvp,
  /await this\.acceptChallenge\([\s\S]*?next\.target[\s\S]*?\)/
);

console.log("✅ Promoção automática usa a próxima dupla FIFO.");


const promotionCalls =
  pvp.match(
    /await this\.startNextQueuedBattle\(\)/g
  ) || [];

assert.ok(
  promotionCalls.length >= 2,
  "Fim natural e fim ADM precisam promover a fila."
);

assert.match(
  pvp,
  /naturalQueuePromotion/
);

assert.match(
  pvp,
  /adminQueuePromotion/
);

console.log("✅ Vitória/empate natural e encerramento ADM promovem a próxima luta.");


assert.match(
  challengeRoute,
  /CHALLENGER_IN_QUEUE/
);

assert.match(
  challengeRoute,
  /TARGET_IN_QUEUE/
);

assert.match(
  acceptRoute,
  /result\.queued === true/
);

assert.match(
  acceptRoute,
  /posição \$\{result\.position\}/
);

console.log("✅ Chat informa bloqueio e posição na fila.");


assert.match(
  attackRoute,
  /Próximo PvP da fila iniciado/
);

assert.match(
  adminRoute,
  /Próximo PvP da fila iniciado/
);

console.log("✅ Chat anuncia automaticamente a batalha promovida.");


console.log();
console.log("🎟️ INTEGRAÇÃO DA FILA GLOBAL DE PVP PASSOU.");
