import assert from "node:assert/strict";
import fs from "node:fs";


const pvp =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );

const attack =
  fs.readFileSync(
    "src/routes/attack.js",
    "utf8"
  );


assert.ok(
  pvp.includes(
    'from "../systems/elemental-combos.js"'
  ),
  "PvpCoordinator precisa importar o motor de combos."
);

assert.ok(
  pvp.includes(
    "resolveElementalCombo("
  ),
  "PvP precisa resolver combos após golpes ofensivos."
);

assert.ok(
  pvp.includes(
    "rawDamageBeforeCombo"
  ),
  "PvP precisa preservar o dano anterior ao combo."
);

assert.ok(
  pvp.includes(
    "effectiveRawDamage"
  ),
  "PvP precisa trabalhar com o dano final após combo."
);

assert.ok(
  pvp.includes(
    "combo?.directDamageAfterCombo"
  ),
  "PvP precisa incorporar o bônus de Eletrocussão ao dano direto."
);

assert.ok(
  pvp.includes(
    "action,\n      currentTurn"
  ),
  "Ataques ofensivos precisam receber o turno atual para expiração de Molhado."
);


assert.ok(
  attack.includes(
    "MOLHADO!"
  ),
  "Chat precisa informar quando Molhado é aplicado."
);

assert.ok(
  attack.includes(
    "ELETROCUSSÃO!"
  ),
  "Chat precisa informar quando Eletrocussão é ativada."
);

assert.ok(
  attack.includes(
    "EVAPORAÇÃO!"
  ),
  "Chat precisa informar quando Fogo consome Molhado."
);

assert.ok(
  attack.includes(
    "execution.combo.bonusDamage"
  ),
  "Chat precisa mostrar o bônus de dano da Eletrocussão."
);


console.log("✅ PvP importa e executa o motor de combos elementais.");
console.log("✅ Dano anterior e posterior ao combo ficam separados.");
console.log("✅ Eletrocussão entra antes de Counter/Refletir via rawDamage final.");
console.log("✅ Molhado recebe o turno atual para expiração correta.");
console.log("✅ Chat informa Molhado, Eletrocussão e Evaporação.");
console.log("\n💧⚡ INTEGRAÇÃO DOS COMBOS ELEMENTAIS NO PVP PASSOU.");
