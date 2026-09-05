import assert from "node:assert/strict";
import fs from "node:fs";

const pvp = fs.readFileSync(
  "src/durable/PvpCoordinator.js",
  "utf8"
);

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

const oldReactionDamageUses = countMatches(
  pvp,
  /rawDamage\s*\*\s*incomingMultiplier/g
);

const comboReactionDamageUses = countMatches(
  pvp,
  /effectiveRawDamage\s*\*\s*incomingMultiplier/g
);

const comboResolvers = countMatches(
  pvp,
  /resolveElementalCombo\s*\(/g
);

const preservedPreComboDamage = countMatches(
  pvp,
  /rawDamageBeforeCombo\s*:/g
);

assert.equal(
  oldReactionDamageUses,
  0,
  "Nenhum caminho ofensivo integrado pode aplicar Counter/Refletir usando rawDamage anterior ao combo."
);

assert.equal(
  comboReactionDamageUses,
  2,
  "Ataque normal e Debuff devem aplicar Counter/Refletir sobre effectiveRawDamage."
);

assert.equal(
  comboResolvers,
  2,
  "Ataque normal e Debuff devem resolver combos elementais."
);

assert.equal(
  preservedPreComboDamage,
  2,
  "Ataque normal e Debuff devem preservar rawDamageBeforeCombo."
);

console.log("✅ Ataque normal usa dano pós-combo antes de Counter/Refletir.");
console.log("✅ Debuff usa dano pós-combo antes de Counter/Refletir.");
console.log("✅ Os dois caminhos preservam o dano anterior ao combo.");
console.log("\n🔒 INTEGRIDADE DOS COMBOS NO PVP PASSOU.\n");
