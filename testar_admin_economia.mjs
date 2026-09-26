import assert from "node:assert/strict";

import {
  adminEconomyApiRoute
} from "./src/routes/api-admin-economy.js";

const env = {
  MARBION_ADMIN_KEY: "teste-seguro"
};

const response =
  await adminEconomyApiRoute(
    new Request(
      "https://worker.test/api/v1/admin/economy?actor=silenceworky&key=teste-seguro"
    ),
    env
  );

assert.equal(
  response.status,
  200
);

const body =
  await response.json();
assert.equal(body.ok, true);
assert.deepEqual(
  body.currencies.map(
    item => [
      item.key,
      item.valueInBronze
    ]
  ),
  [
    ["bronze", 1],
    ["silver", 10],
    ["gold", 100],
    ["platinum", 1000]
  ]
);

assert.equal(
  body.banking.fusionRatio,
  10
);

assert.equal(
  body.banking.splitRatio,
  10
);
assert.equal(
  body.banking.pix.ttlMs,
  120000
);

assert.equal(
  body.banking.earningsAutoConverted,
  false
);

assert.equal(
  body.banking.spendingUsesCanonicalChange,
  true
);

assert.equal(
  body.capabilities.storeIntegrated,
  false
);

assert.equal(
  body.capabilities.itemPricingIntegrated,
  false
);
const forbidden =
  await adminEconomyApiRoute(
    new Request(
      "https://worker.test/api/v1/admin/economy?actor=silenceworky&key=errada"
    ),
    env
  );

assert.equal(
  forbidden.status,
  403
);

const methodNotAllowed =
  await adminEconomyApiRoute(
    new Request(
      "https://worker.test/api/v1/admin/economy?actor=silenceworky&key=teste-seguro",
      { method: "POST" }
    ),
    env
  );

assert.equal(
  methodNotAllowed.status,
  405
);

console.log(
  "✅ Snapshot administrativo da economia segue as regras canônicas do banco."
);
