import assert from "node:assert/strict";

import {
  applyAdminResourceChange,
  createAdminResourceChange,
  normalizeAdminResource,
  parseAdminResourceChange
} from "./src/systems/admin-resources.js";


console.log("=== ADM HP / MENTALIDADE ===");

assert.equal(
  normalizeAdminResource("HP"),
  "hp"
);

assert.equal(
  normalizeAdminResource("mentalidade"),
  "mentalidade"
);

assert.deepEqual(
  parseAdminResourceChange(["5"]),
  {
    ok: true,
    mode: "set",
    amount: 5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["+5"]),
  {
    ok: true,
    mode: "delta",
    amount: 5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["-5"]),
  {
    ok: true,
    mode: "delta",
    amount: -5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["+", "5"]),
  {
    ok: true,
    mode: "delta",
    amount: 5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["-", "5"]),
  {
    ok: true,
    mode: "delta",
    amount: -5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["mais", "5"]),
  {
    ok: true,
    mode: "delta",
    amount: 5
  }
);

assert.deepEqual(
  parseAdminResourceChange(["menos", "5"]),
  {
    ok: true,
    mode: "delta",
    amount: -5
  }
);

console.log("✅ Parser aceita SET, +, -, mais e menos.");


const hp = {
  hp: 10,
  maxHp: 100
};

let result =
  applyAdminResourceChange(
    hp,
    "hp",
    parseAdminResourceChange(["5"])
  );

assert.equal(result.ok, true);
assert.equal(result.before, 10);
assert.equal(result.after, 5);
assert.equal(hp.hp, 5);

console.log("✅ !adm hp @user 5 define HP exatamente como 5.");


result =
  applyAdminResourceChange(
    hp,
    "hp",
    parseAdminResourceChange(["+5"])
  );

assert.equal(result.before, 5);
assert.equal(result.after, 10);
assert.equal(hp.hp, 10);

console.log("✅ !adm hp @user +5 soma 5 HP.");


result =
  applyAdminResourceChange(
    hp,
    "hp",
    parseAdminResourceChange(["-", "4"])
  );

assert.equal(result.before, 10);
assert.equal(result.after, 6);
assert.equal(hp.hp, 6);

console.log("✅ !adm hp @user - 4 remove 4 HP.");


result =
  applyAdminResourceChange(
    hp,
    "hp",
    parseAdminResourceChange(["-999"])
  );

assert.equal(result.after, 0);
assert.equal(hp.hp, 0);
assert.equal(result.clamped, true);

console.log("✅ HP nunca fica abaixo de 0.");


result =
  applyAdminResourceChange(
    hp,
    "hp",
    parseAdminResourceChange(["999"])
  );

assert.equal(result.after, 100);
assert.equal(hp.hp, 100);
assert.equal(result.clamped, true);

console.log("✅ HP nunca ultrapassa maxHp.");


const mind = {
  mentalidade: 10,
  maxMentalidade: 50
};

result =
  applyAdminResourceChange(
    mind,
    "mentalidade",
    parseAdminResourceChange(["20"])
  );

assert.equal(result.before, 10);
assert.equal(result.after, 20);
assert.equal(mind.mentalidade, 20);

result =
  applyAdminResourceChange(
    mind,
    "mentalidade",
    parseAdminResourceChange(["mais", "10"])
  );

assert.equal(result.after, 30);
assert.equal(mind.mentalidade, 30);

result =
  applyAdminResourceChange(
    mind,
    "mentalidade",
    parseAdminResourceChange(["menos", "50"])
  );

assert.equal(result.after, 0);
assert.equal(mind.mentalidade, 0);

console.log("✅ Mentalidade usa as mesmas regras de SET/+/- e limites.");


assert.deepEqual(
  createAdminResourceChange(
    "set",
    "12"
  ),
  {
    ok: true,
    mode: "set",
    amount: 12
  }
);

assert.deepEqual(
  createAdminResourceChange(
    "delta",
    "-7"
  ),
  {
    ok: true,
    mode: "delta",
    amount: -7
  }
);

console.log("✅ Mudança serializada pode atravessar a rota interna do Durable Object.");
console.log("\n🛠️ TODOS OS TESTES DE ADM HP/MENTALIDADE PASSARAM.");
