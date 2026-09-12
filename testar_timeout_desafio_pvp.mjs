import assert from "node:assert/strict";
import fs from "node:fs";

import {
  partitionExpiredChallenges,
  getNextChallengeExpiry,
  formatChallengeTimeoutMessage
} from "./src/systems/pvp-challenge-timeout.js";

console.log("=== TIMEOUT AUTOMÁTICO DE DESAFIO PVP ===");

{
  const now = 1_000_000;
  const challenges = [
    {
      challenger: "a",
      target: "b",
      expiresAt: now - 1
    },
    {
      challenger: "c",
      target: "d",
      expiresAt: now
    },
    {
      challenger: "e",
      target: "f",
      expiresAt: now + 10_000
    }
  ];

  const result =
    partitionExpiredChallenges(
      challenges,
      now
    );

  assert.equal(result.expired.length, 2);
  assert.equal(result.active.length, 1);
  assert.equal(result.active[0].challenger, "e");
  console.log("✅ expiração separa vencidos sem tocar no desafio ativo");
}

{
  const now = 2_000_000;
  const next =
    getNextChallengeExpiry(
      [
        { expiresAt: now + 80_000 },
        { expiresAt: now + 20_000 },
        { expiresAt: now - 5 }
      ],
      now
    );

  assert.equal(next, now + 20_000);
  console.log("✅ próximo Alarm usa o desafio que vence primeiro");
}

{
  const message =
    formatChallengeTimeoutMessage({
      challenger: "@SilenceWorky",
      target: "@AcervoJuju"
    });

  assert.equal(
    message,
    "⌛ @acervojuju não respondeu ao desafio de @silenceworky a tempo. O desafio de PvP foi cancelado."
  );
  console.log("✅ mensagem automática de cancelamento está correta");
}

const source =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

assert.match(
  source,
  /scheduleCoordinatorAlarm\s*\(/
);

assert.match(
  source,
  /formatChallengeTimeoutMessage/
);

assert.match(
  source,
  /await sendTwitchChatMessage\(\s*this\.env,\s*message\s*\)/s
);

assert.match(
  source,
  /await this\.scheduleCoordinatorAlarm\(\s*data\s*\);\s*\n\s*return \{\s*\n\s*ok: true,\s*\n\s*challenger,/s
);

assert.match(
  source,
  /async alarm\(\) \{[\s\S]*?await this\.cleanExpiredChallenges\(\s*data,\s*alarmNow\s*\)/
);

assert.match(
  source,
  /warningResult[\s\S]*?await this\.scheduleCoordinatorAlarm\(\s*data,\s*battle\s*\)/
);

const cleanStart =
  source.indexOf(
    "  async cleanExpiredChallenges("
  );
const cleanEnd =
  source.indexOf(
    "  findBattleByUser(",
    cleanStart
  );

assert.ok(cleanStart >= 0 && cleanEnd > cleanStart);

const cleanBlock =
  source.slice(
    cleanStart,
    cleanEnd
  );

assert.doesNotMatch(
  cleanBlock,
  /registerPvpAfkIncident|applyRankedResult|rating|losses|wins/
);

assert.match(
  cleanBlock,
  /data\.challenges =\s*partition\.active/
);

console.log("✅ expiração não aplica AFK, Elo ou estatísticas");

const unsafeCleanupCalls =
  [
    ...source.matchAll(
      /this\.cleanExpiredChallenges\(/g
    )
  ]
    .filter(match => {
      const prefix =
        source.slice(
          Math.max(0, match.index - 12),
          match.index
        );

      return !prefix.includes("await ");
    });

assert.equal(
  unsafeCleanupCalls.length,
  0
);

console.log("✅ todos os cleanups existentes aguardam a notificação assíncrona");
console.log("\n⌛ TODOS OS TESTES DO TIMEOUT DE DESAFIO PASSARAM.");
