import fs from "node:fs";
import assert from "node:assert/strict";

import {
  applyProfileTimeReset,
  normalizeAdminTimeScope
} from "./src/systems/admin-time-reset.js";

function ok(label) {
  console.log(`✅ ${label}`);
}

console.log("=== !ADM TEMPO RESET ===");

assert.equal(
  normalizeAdminTimeScope("TUDO"),
  "tudo"
);
assert.equal(
  normalizeAdminTimeScope("reload"),
  "reroll"
);
assert.equal(
  normalizeAdminTimeScope("meditação"),
  "meditar"
);
ok("aliases de escopo são normalizados");

const base = {
  race: "Terrariano",
  elements: ["Terra"],
  ratingMarker: 123,
  createdAt: 111,
  updatedAt: 222,
  diedAt: 333,
  lastCombat: 10,
  lastCheckin: 20,
  lastDaily: 30,
  lastXpChest: 40,
  lastReroll: 50,
  lastHpHeal: 60,
  skillCooldowns: {
    "Fogo:A": {
      availableAtTurn: 9
    },
    "Terra:B": {
      availableAtTurn: 10
    }
  },
  equippedSkills: [
    "Fogo:A",
    "Terra:B",
    null,
    null
  ],
  pvp: {
    rating: 1444,
    wins: 5,
    losses: 2,
    recentOpponents: {
      rival: [1, 2, 3]
    }
  }
};

const dailyProfile =
  structuredClone(base);

const daily =
  applyProfileTimeReset(
    dailyProfile,
    "daily"
  );

assert.equal(daily.ok, true);
assert.equal(dailyProfile.lastDaily, 0);
assert.equal(dailyProfile.lastCheckin, 20);
assert.equal(dailyProfile.lastReroll, 50);
assert.deepEqual(
  dailyProfile.skillCooldowns,
  base.skillCooldowns
);
ok("reset de daily não interfere em outros tempos");

const oneSkillProfile =
  structuredClone(base);

const oneSkill =
  applyProfileTimeReset(
    oneSkillProfile,
    "habilidade",
    "2"
  );

assert.equal(oneSkill.ok, true);
assert.equal(oneSkill.slot, 2);
assert.equal(oneSkill.skillId, "Terra:B");
assert.ok(oneSkillProfile.skillCooldowns["Fogo:A"]);
assert.equal(
  oneSkillProfile.skillCooldowns["Terra:B"],
  undefined
);
ok("reset de habilidade remove somente o cooldown do slot escolhido");

const pvpProfile =
  structuredClone(base);

const pvp =
  applyProfileTimeReset(
    pvpProfile,
    "pvp"
  );

assert.equal(pvp.ok, true);
assert.equal(pvpProfile.lastCombat, 0);
assert.deepEqual(pvpProfile.skillCooldowns, {});
assert.equal(pvpProfile.lastDaily, 30);
assert.equal(pvpProfile.pvp.rating, 1444);
assert.equal(pvpProfile.pvp.wins, 5);
ok("reset de PvP não altera Elo nem estatísticas ranqueadas");

const allProfile =
  structuredClone(base);

const all =
  applyProfileTimeReset(
    allProfile,
    "tudo"
  );

assert.equal(all.ok, true);

for (
  const field of [
    "lastCombat",
    "lastCheckin",
    "lastDaily",
    "lastXpChest",
    "lastReroll",
    "lastHpHeal"
  ]
) {
  assert.equal(
    allProfile[field],
    0,
    `${field} deveria ser zerado`
  );
}

assert.deepEqual(allProfile.skillCooldowns, {});
assert.equal(allProfile.createdAt, 111);
assert.equal(allProfile.updatedAt, 222);
assert.equal(allProfile.diedAt, 333);
assert.equal(allProfile.race, "Terrariano");
assert.deepEqual(allProfile.elements, ["Terra"]);
assert.equal(allProfile.pvp.rating, 1444);
ok("TUDO reseta cooldowns/lockouts sem apagar identidade, histórico ou Elo");

const invalidSlotProfile =
  structuredClone(base);

const invalidSlot =
  applyProfileTimeReset(
    invalidSlotProfile,
    "habilidade",
    "9"
  );

assert.equal(invalidSlot.ok, false);
assert.equal(invalidSlot.error, "INVALID_SLOT");
ok("slot inválido é rejeitado");

const adminSource =
  fs.readFileSync(
    "src/routes/admin.js",
    "utf8"
  );

assert.ok(
  adminSource.includes(
    'command === "tempo"'
  )
);
assert.ok(
  adminSource.includes(
    'command === "reset"'
  )
);
assert.ok(
  adminSource.includes(
    '"https://pvp.internal/admin-reset-time"'
  )
);
assert.ok(
  adminSource.includes(
    'scope === "antifarm"'
  )
);
ok("!adm tempo reset e !adm reset tempo estão ligados ao sistema");

const coordinatorSource =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

assert.ok(
  coordinatorSource.includes(
    "async adminResetBattleTime("
  )
);
assert.ok(
  coordinatorSource.includes(
    '"/admin-reset-time"'
  )
);
assert.ok(
  coordinatorSource.includes(
    "player.skillCooldowns = {};"
  )
);
assert.ok(
  coordinatorSource.includes(
    "delete player.meditationAvailableAtTurn;"
  )
);
ok("PvP vivo reseta cooldowns de habilidade e Meditação");

const systemSource =
  fs.readFileSync(
    "src/systems/admin-time-reset.js",
    "utf8"
  );

assert.ok(
  systemSource.includes(
    "delete pvp.recentOpponents[opponentUser];"
  )
);
assert.ok(
  systemSource.includes(
    "delete opponentPvp.recentOpponents[normalizedUser];"
  )
);
assert.ok(
  systemSource.includes(
    "pvp.recentOpponents = {};"
  )
);
ok("anti-farm é removido dos dois lados da dupla");

const routerSource =
  fs.readFileSync(
    "src/router.js",
    "utf8"
  );

assert.equal(
  routerSource.includes(
    'path === "/reroll"'
  ),
  false
);
ok("nenhum !reroll público foi criado; mudança de raça/elemento continua administrativa");

console.log("\n🕒 TODOS OS TESTES DO !ADM TEMPO RESET PASSARAM.");
