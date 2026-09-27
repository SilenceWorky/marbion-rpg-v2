import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  adminInventoryApiRoute
} from "./src/routes/api-admin-inventory.js";

const store =
  new Map();

const env = {
  MARBION_ADMIN_KEY:
    "teste-seguro",
  MARBION_USERS_V2: {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    }
  }
};
const profile =
  createBaseProfile(
    "silenceworky"
  );

profile.race = "Terrariano";
profile.elements = ["Fogo"];

store.set(
  "silenceworky",
  JSON.stringify(profile)
);

const originalFetch =
  globalThis.fetch;

const skillsData = {
  Fogo: {
    Chama_Teste: {
      nome: "Chama Teste",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Fogo",
      custoMentalidade: 5,
      cooldown: 0,
      escala: "magicStrength",
      dano: 10,
      precisao: 100,
      prioridade: 0
    }
  },
  Agua: {
    Onda_Teste: {
      nome: "Onda Teste",
      tipo: "Elemental",
      raridade: "Comum",
      elemento: "Água",
      custoMentalidade: 5,
      cooldown: 0,
      escala: "magicStrength",
      dano: 10,
      precisao: 100,
      prioridade: 0
    }
  }
};

globalThis.fetch =
  async () =>
    Response.json(
      skillsData
    );

function adminUrl(
  suffix = ""
) {
  return (
    "https://worker.test/api/v1/admin/inventory" +
    "?actor=silenceworky" +
    "&key=teste-seguro" +
    suffix
  );
}
async function readInventory() {
  const response =
    await adminInventoryApiRoute(
      new Request(
        adminUrl(
          "&user=silenceworky"
        )
      ),
      env
    );

  assert.equal(
    response.status,
    200
  );

  const body =
    await response.json();

  assert.equal(
    body.ok,
    true
  );

  return body.inventory;
}

async function mutate(
  body
) {
  const response =
    await adminInventoryApiRoute(
      new Request(
        adminUrl(),
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify({
              user:
                "silenceworky",
              ...body
            })
        }
      ),
      env
    );

  const payload =
    await response.json();

  return {
    response,
    payload
  };
}

try {
  const forbidden =
    await adminInventoryApiRoute(
      new Request(
        "https://worker.test/api/v1/admin/inventory" +
        "?actor=nao-admin&key=teste-seguro&user=silenceworky"
      ),
      env
    );

  assert.equal(
    forbidden.status,
    403
  );

  const initial =
    await readInventory();

  assert.deepEqual(
    initial.chests,
    []
  );
  assert.deepEqual(
    initial.scrolls,
    []
  );
  assert.deepEqual(
    initial.consumables,
    []
  );
  assert.equal(
    initial.chestTypes.length,
    5
  );
  assert.equal(
    initial.consumableCatalog.length,
    8
  );
  assert.equal(
    initial.scrollTiers.length,
    5
  );

  const chestAdd =
    await mutate({
      operation: "add",
      category: "chest",
      chestType: "atomic"
    });

  assert.equal(
    chestAdd.response.status,
    200
  );
  assert.equal(
    chestAdd.payload.item.type,
    "atomic"
  );

  const consumableAdd =
    await mutate({
      operation: "add",
      category: "consumable",
      consumableKey:
        "vida_especial"
    });
  assert.equal(
    consumableAdd.response.status,
    200
  );
  assert.equal(
    consumableAdd.payload.item.key,
    "vida_especial"
  );
  assert.equal(
    consumableAdd.payload.item.source,
    "admin"
  );

  const scrollAdd =
    await mutate({
      operation: "add",
      category: "scroll",
      scrollTier: "R1",
      skillQuery:
        "Fogo:Chama_Teste"
    });

  assert.equal(
    scrollAdd.response.status,
    200
  );
  assert.equal(
    scrollAdd.payload.item.tier,
    "R1"
  );
  assert.equal(
    scrollAdd.payload.item.skill.id,
    "Fogo:Chama_Teste"
  );

  const invalidScroll =
    await mutate({
      operation: "add",
      category: "scroll",
      scrollTier: "R1",
      skillQuery:
        "Agua:Onda_Teste"
    });

  assert.equal(
    invalidScroll.response.status,
    400
  );
  assert.equal(
    invalidScroll.payload.error,
    "SCROLL_SKILL_NOT_ELIGIBLE"
  );

  let inventory =
    await readInventory();

  assert.equal(
    inventory.chests.length,
    1
  );
  assert.equal(
    inventory.consumables.length,
    1
  );
  assert.equal(
    inventory.scrolls.length,
    1
  );

  const chestId =
    inventory.chests[0].id;
  const consumableId =
    inventory.consumables[0].id;
  const scrollId =
    inventory.scrolls[0].id;

  for (
    const [category, itemId]
    of [
      ["chest", chestId],
      [
        "consumable",
        consumableId
      ],
      ["scroll", scrollId]
    ]
  ) {
    const removed =
      await mutate({
        operation: "remove",
        category,
        itemId
      });

    assert.equal(
      removed.response.status,
      200
    );
    assert.equal(
      removed.payload.operation,
      "remove"
    );
  }

  inventory =
    await readInventory();

  assert.equal(
    inventory.chests.length,
    0
  );
  assert.equal(
    inventory.consumables.length,
    0
  );
  assert.equal(
    inventory.scrolls.length,
    0
  );

  const stackedChests =
    await mutate({
      operation: "add",
      category: "chest",
      chestType: "atomic",
      quantity: 3
    });

  assert.equal(
    stackedChests.response.status,
    200
  );
  assert.equal(
    stackedChests.payload.quantity,
    3
  );
  assert.equal(
    stackedChests.payload.items.length,
    3
  );
  assert.equal(
    stackedChests.payload.inventory.chests.length,
    3
  );

  const stackedConsumables =
    await mutate({
      operation: "add",
      category: "consumable",
      consumableKey:
        "vida_especial",
      quantity: 4
    });

  assert.equal(
    stackedConsumables.response.status,
    200
  );
  assert.equal(
    stackedConsumables.payload.quantity,
    4
  );
  assert.equal(
    stackedConsumables.payload.inventory.consumables.length,
    4
  );

  const stackedScrolls =
    await mutate({
      operation: "add",
      category: "scroll",
      scrollTier: "R1",
      skillQuery:
        "Fogo:Chama_Teste",
      quantity: 2
    });

  assert.equal(
    stackedScrolls.response.status,
    200
  );
  assert.equal(
    stackedScrolls.payload.quantity,
    2
  );
  assert.equal(
    stackedScrolls.payload.inventory.scrolls.length,
    2
  );

  inventory =
    await readInventory();

  const removeTwoChests =
    await mutate({
      operation: "remove",
      category: "chest",
      quantity: 2,
      itemIds:
        inventory.chests
          .slice(0, 2)
          .map(item => item.id)
    });

  assert.equal(
    removeTwoChests.response.status,
    200
  );
  assert.equal(
    removeTwoChests.payload.quantity,
    2
  );
  assert.equal(
    removeTwoChests.payload.inventory.chests.length,
    1
  );

  const invalidQuantity =
    await mutate({
      operation: "add",
      category: "chest",
      chestType: "atomic",
      quantity: 0
    });

  assert.equal(
    invalidQuantity.response.status,
    400
  );
  assert.equal(
    invalidQuantity.payload.error,
    "INVALID_INVENTORY_QUANTITY"
  );

  console.log(
    "✅ Inventário administrativo validado com quantidades."
  );
}
finally {
  globalThis.fetch =
    originalFetch;
}
