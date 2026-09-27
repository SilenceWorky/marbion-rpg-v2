import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  SKILLS_URL
} from "../config/urls.js";

import {
  isAdminUser
} from "../config/admins.js";

import {
  CHEST_TYPE_LABELS,
  CHEST_TYPE_ORDER,
  addChests,
  removeChestById
} from "../systems/chest-inventory.js";
import {
  listConsumableDefinitions,
  getConsumableDefinition
} from "../systems/consumable-catalog.js";

import {
  addConsumableToInventory,
  removeConsumableById
} from "../systems/consumable-inventory.js";

import {
  addScrollToInventory,
  removeScrollById
} from "../systems/scroll-inventory.js";

import {
  getEligibleScrollRewardSkills
} from "../systems/scroll-reward-selector.js";

import {
  SCROLL_RARITY_TO_SKILL_RARITY
} from "../config/skill-rarities.js";
function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function authorized(url, env) {
  const actor =
    normalizeUser(
      url.searchParams.get("actor")
    );

  const key =
    String(
      url.searchParams.get("key") ?? ""
    );

  return Boolean(
    actor &&
    isAdminUser(actor) &&
    key &&
    env?.MARBION_ADMIN_KEY &&
    key === env.MARBION_ADMIN_KEY
  );
}

function normalizeCategory(value) {
  const category =
    normalizeText(value);

  return [
    "chest",
    "consumable",
    "scroll"
  ].includes(category)
    ? category
    : null;
}

function normalizeQuantity(
  value,
  fallback = 1
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const quantity =
    Number(value);

  return (
    Number.isSafeInteger(quantity) &&
    quantity >= 1
  )
    ? quantity
    : null;
}

function inventorySnapshot(
  user,
  profile
) {
  const chests =
    Array.isArray(profile.chests)
      ? profile.chests
      : [];
  const scrolls =
    Array.isArray(
      profile?.inventory?.scrolls
    )
      ? profile.inventory.scrolls
      : [];

  const consumables =
    Array.isArray(
      profile?.inventory?.consumables
    )
      ? profile.inventory.consumables
      : [];

  return {
    user,
    chests:
      chests.map(chest => ({
        ...chest,
        label:
          CHEST_TYPE_LABELS[
            chest?.type
          ] ??
          String(
            chest?.type ?? ""
          )
      })),
    chestTypes:
      CHEST_TYPE_ORDER.map(
        type => ({
          type,
          label:
            CHEST_TYPE_LABELS[
              type
            ]
        })
      ),
    scrolls,
    scrollTiers:
      Object.entries(
        SCROLL_RARITY_TO_SKILL_RARITY
      ).map(
        ([tier, skillRarity]) => ({
          tier,
          skillRarity
        })
      ),
    consumables,
    consumableCatalog:
      listConsumableDefinitions(),
    capabilities: {
      chests: true,
      scrolls: true,
      consumables: true,
      weapons: false
    }
  };
}
async function loadCharacter(
  env,
  user
) {
  const profile =
    await getProfile(
      env,
      user
    );

  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      status: 404,
      error:
        "CHARACTER_NOT_FOUND"
    };
  }

  return {
    ok: true,
    profile
  };
}

async function addInventoryItem(
  env,
  profile,
  body
) {
  const category =
    normalizeCategory(
      body?.category
    );

  if (!category) {
    return {
      ok: false,
      error:
        "INVALID_INVENTORY_CATEGORY"
    };
  }

  const quantity =
    normalizeQuantity(
      body?.quantity
    );

  if (!quantity) {
    return {
      ok: false,
      error:
        "INVALID_INVENTORY_QUANTITY"
    };
  }

  if (category === "chest") {
    const result =
      addChests(
        profile,
        {
          type:
            body?.chestType,
          quantity,
          metadata: {
            source: "admin"
          }
        }
      );

    return result.ok
      ? {
          ok: true,
          category,
          quantity:
            result.quantity,
          items:
            result.created,
          item:
            result.created[0] ??
            null
        }
      : result;
  }

  if (
    category ===
    "consumable"
  ) {
    const definition =
      getConsumableDefinition(
        body?.consumableKey
      );

    if (!definition.ok) {
      return definition;
    }

    const items = [];

    for (
      let index = 0;
      index < quantity;
      index += 1
    ) {
      const result =
        addConsumableToInventory(
          profile,
          {
            key:
              definition
                .consumable.key,
            name:
              definition
                .consumable.name,
            source: "admin"
          }
        );

      if (!result.ok) {
        return result;
      }

      items.push(
        result.consumable
      );
    }

    return {
      ok: true,
      category,
      quantity:
        items.length,
      items,
      item:
        items[0] ?? null
    };
  }

  const tier =
    String(
      body?.scrollTier ?? ""
    )
      .trim()
      .toUpperCase();

  const skillQuery =
    String(
      body?.skillQuery ?? ""
    ).trim();

  if (
    !tier ||
    !skillQuery
  ) {
    return {
      ok: false,
      error:
        "INVALID_SCROLL_INPUT"
    };
  }

  const skillsData =
    await fetchJson(
      SKILLS_URL
    );

  const eligible =
    getEligibleScrollRewardSkills(
      profile,
      skillsData,
      tier
    );

  if (!eligible.ok) {
    return eligible;
  }

  const normalizedQuery =
    normalizeText(
      skillQuery
    );

  const skill =
    eligible.candidates.find(
      candidate =>
        normalizeText(
          candidate.id
        ) ===
          normalizedQuery ||
        normalizeText(
          candidate.nome
        ) ===
          normalizedQuery
    ) ?? null;

  if (!skill) {
    return {
      ok: false,
      error:
        "SCROLL_SKILL_NOT_ELIGIBLE"
    };
  }

  const items = [];

  for (
    let index = 0;
    index < quantity;
    index += 1
  ) {
    const result =
      addScrollToInventory(
        profile,
        {
          tier,
          skill,
          source: "admin"
        }
      );

    if (!result.ok) {
      return result;
    }

    items.push(
      result.scroll
    );
  }

  return {
    ok: true,
    category,
    quantity:
      items.length,
    items,
    item:
      items[0] ?? null
  };
}

function removeInventoryItem(
  profile,
  body
) {
  const category =
    normalizeCategory(
      body?.category
    );

  if (!category) {
    return {
      ok: false,
      error:
        "INVALID_INVENTORY_CATEGORY"
    };
  }

  const requestedIds =
    Array.isArray(
      body?.itemIds
    )
      ? body.itemIds
          .map(value =>
            String(value ?? "")
              .trim()
          )
          .filter(Boolean)
      : [
          String(
            body?.itemId ?? ""
          ).trim()
        ].filter(Boolean);

  const uniqueIds =
    Array.from(
      new Set(
        requestedIds
      )
    );

  if (
    uniqueIds.length === 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_INVENTORY_ITEM_ID"
    };
  }

  const requestedQuantity =
    normalizeQuantity(
      body?.quantity,
      uniqueIds.length
    );

  if (
    !requestedQuantity ||
    requestedQuantity !==
      uniqueIds.length
  ) {
    return {
      ok: false,
      error:
        "INVALID_INVENTORY_QUANTITY"
    };
  }

  const items = [];

  for (const itemId of uniqueIds) {
    let result;

    if (category === "chest") {
      result =
        removeChestById(
          profile,
          itemId
        );

      if (!result.ok) {
        return result;
      }

      items.push(
        result.chest
      );
      continue;
    }

    if (
      category ===
      "consumable"
    ) {
      result =
        removeConsumableById(
          profile,
          itemId
        );

      if (!result.ok) {
        return result;
      }

      items.push(
        result.consumable
      );
      continue;
    }

    result =
      removeScrollById(
        profile,
        itemId
      );

    if (!result.ok) {
      return result;
    }

    items.push(
      result.scroll
    );
  }

  return {
    ok: true,
    category,
    quantity:
      items.length,
    items,
    item:
      items[0] ?? null
  };
}

export async function adminInventoryApiRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  if (!authorized(url, env)) {
    return Response.json(
      {
        ok: false,
        error: "FORBIDDEN"
      },
      {
        status: 403
      }
    );
  }

  if (
    request.method === "GET"
  ) {
    const user =
      normalizeUser(
        url.searchParams.get(
          "user"
        )
      );

    if (!user) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_USER"
        },
        {
          status: 400
        }
      );
    }

    const loaded =
      await loadCharacter(
        env,
        user
      );

    if (!loaded.ok) {
      return Response.json(
        {
          ok: false,
          error: loaded.error
        },
        {
          status:
            loaded.status
        }
      );
    }
    return Response.json({
      ok: true,
      inventory:
        inventorySnapshot(
          user,
          loaded.profile
        )
    });
  }

  if (
    request.method !== "POST"
  ) {
    return Response.json(
      {
        ok: false,
        error:
          "METHOD_NOT_ALLOWED"
      },
      {
        status: 405
      }
    );
  }

  let body;

  try {
    body =
      await request.json();
  }
  catch {
    return Response.json(
      {
        ok: false,
        error: "INVALID_JSON"
      },
      {
        status: 400
      }
    );
  }

  const user =
    normalizeUser(
      body?.user
    );

  const operation =
    normalizeText(
      body?.operation
    );

  if (
    !user ||
    ![
      "add",
      "remove"
    ].includes(operation)
  ) {
    return Response.json(
      {
        ok: false,
        error: "INVALID_INPUT"
      },
      {
        status: 400
      }
    );
  }

  const loaded =
    await loadCharacter(
      env,
      user
    );

  if (!loaded.ok) {
    return Response.json(
      {
        ok: false,
        error: loaded.error
      },
      {
        status:
          loaded.status
      }
    );
  }

  let result;

  try {
    result =
      operation === "add"
        ? await addInventoryItem(
            env,
            loaded.profile,
            body
          )
        : removeInventoryItem(
            loaded.profile,
            body
          );
  }
  catch (error) {
    console.error(
      "ADMIN_INVENTORY_MUTATION_ERROR",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "INVENTORY_MUTATION_FAILED"
      },
      {
        status: 500
      }
    );
  }

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error:
          result.error ??
          "INVENTORY_MUTATION_FAILED"
      },
      {
        status: 400
      }
    );
  }

  const saved =
    await saveProfile(
      env,
      user,
      loaded.profile
    );

  return Response.json({
    ok: true,
    operation,
    category:
      result.category,
    quantity:
      result.quantity,
    item:
      result.item,
    items:
      result.items,
    inventory:
      inventorySnapshot(
        user,
        saved
      )
  });
}
