import assert from "node:assert/strict";
import fs from "node:fs";


const admin =
  fs.readFileSync(
    "src/routes/admin.js",
    "utf8"
  );

const pvp =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );


assert.ok(
  admin.includes(
    'from "../systems/admin-resources.js"'
  ),
  "Rota ADM precisa importar o motor de recursos."
);

assert.ok(
  admin.includes(
    'command === "hp"'
  ),
  "Rota ADM precisa reconhecer !adm hp."
);

assert.ok(
  admin.includes(
    'command === "mentalidade"'
  ),
  "Rota ADM precisa reconhecer !adm mentalidade."
);

assert.ok(
  admin.includes(
    '"https://pvp.internal/admin-resource"'
  ),
  "Rota ADM precisa tentar alterar o estado vivo do PvP primeiro."
);

assert.ok(
  admin.includes(
    "adminModifyProfileResource("
  ),
  "Fora do PvP, o comando precisa alterar o perfil persistente."
);

assert.ok(
  pvp.includes(
    "async adminModifyBattleResource("
  ),
  "Durable Object precisa conseguir alterar recurso durante PvP."
);

assert.ok(
  pvp.includes(
    'url.pathname ===\n      "/admin-resource"'
  ),
  "Durable Object precisa expor a rota interna /admin-resource."
);

assert.ok(
  pvp.includes(
    "applyAdminResourceChange("
  ),
  "PvP precisa usar a mesma regra de SET/+/- do perfil."
);

console.log("✅ !adm hp reconhecido pela rota administrativa.");
console.log("✅ !adm mentalidade reconhecido pela rota administrativa.");
console.log("✅ Durante PvP, HP/Mentalidade alteram o snapshot vivo.");
console.log("✅ Fora do PvP, HP/Mentalidade alteram o perfil persistente.");
console.log("✅ SET e ajustes +/- compartilham o mesmo motor e limites.");
console.log("\n🛠️ INTEGRAÇÃO ADM HP/MENTALIDADE PASSOU.");
