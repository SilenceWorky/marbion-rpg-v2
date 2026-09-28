import {
  getMonthlySeasonId,
  getSeasonalFeaturedElements,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";

import {
  normalizeSeasonalSkillEffect
} from "../config/seasonal-skill-effects.js";

import {
  normalizeSkillRarity
} from "../config/skill-rarities.js";

import {
  getSeasonalChestRewardBindingSlot
} from "../config/seasonal-chest-reward-bindings.js";

import {
  normalizeSeasonCosmeticSlot
} from "../config/cosmetic-slots.js";


export const PVP_SEASON_CONTENT_VERSION = 6;

export const PVP_SEASON_CONTENT_STORAGE_PREFIX =
  "pvp_season_content:";

export const PVP_SEASON_CONTENT_REVISION_STORAGE_PREFIX =
  "pvp_season_content_revision:";

export const PVP_SEASONAL_CHEST_MONTH_CATALOG_VERSION = 1;

export const PVP_SEASONAL_CHEST_MONTH_CATALOG_STORAGE_PREFIX =
  "pvp_seasonal_chest_month_catalog:";

const PVP_SEASONAL_CHEST_INHERITANCE_START_YEAR =
  2026;


function normalizeText(
  value,
  max = 500
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  return text.slice(
    0,
    max
  );
}


function normalizeDamage(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const damage =
    Number(value);

  if (
    !Number.isFinite(damage) ||
    damage < 0 ||
    damage > 999999
  ) {
    return null;
  }

  return Math.round(
    damage
  );
}


function normalizeNonNegativeInteger(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 0
  ) {
    return fallback;
  }

  return number;
}


function normalizePositiveInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return number;
}


function getSeasonalChestOriginSeasonId(
  value
) {
  const id =
    normalizeText(
      value,
      180
    );

  if (!id) {
    return null;
  }

  const modern =
    id.match(
      /^seasonal:(\d{4}-(?:0[1-9]|1[0-2])):chest:[a-zA-Z0-9_-]{6,96}$/
    );

  const legacy =
    id.match(
      /^(\d{4}-(?:0[1-9]|1[0-2])):[a-zA-Z0-9_-]{3,120}$/
    );

  return (
    modern?.[1] ??
    legacy?.[1] ??
    null
  );
}


function isSeasonalChestIdAllowedForSeason(
  id,
  expectedSeasonId
) {
  if (!expectedSeasonId) {
    return true;
  }

  const originSeasonId =
    getSeasonalChestOriginSeasonId(
      id
    );

  if (!originSeasonId) {
    return false;
  }

  const [
    originYear,
    originMonth
  ] =
    originSeasonId
      .split("-")
      .map(Number);

  const [
    targetYear,
    targetMonth
  ] =
    String(
      expectedSeasonId
    )
      .split("-")
      .map(Number);

  return (
    originMonth ===
      targetMonth &&
    originYear <=
      targetYear
  );
}


function normalizeSeasonalChestId(
  value,
  expectedSeasonId = null
) {
  const id =
    normalizeText(
      value,
      180
    );

  if (
    !id ||
    !getSeasonalChestOriginSeasonId(
      id
    ) ||
    !isSeasonalChestIdAllowedForSeason(
      id,
      expectedSeasonId
    )
  ) {
    return null;
  }

  return id;
}


function normalizeSeasonalChest(
  value,
  seasonId
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const id =
    normalizeSeasonalChestId(
      value.id,
      seasonId
    );

  const storedSeasonId =
    normalizeText(
      value.seasonId,
      32
    ) ??
    seasonId;

  const order =
    normalizePositiveInteger(
      value.order
    );

  const name =
    normalizeText(
      value.name,
      160
    );

  const description =
    normalizeText(
      value.description,
      1200
    );

  if (
    !id ||
    storedSeasonId !== seasonId ||
    !order ||
    !name
  ) {
    return null;
  }

  return {
    id,
    originSeasonId:
      getSeasonalChestOriginSeasonId(
        id
      ),
    seasonId,
    order,
    name,
    description,
    poolRevision:
      normalizePositiveInteger(
        value.poolRevision
      ),
    createdAt:
      normalizeNonNegativeInteger(
        value.createdAt
      ),
    updatedAt:
      normalizeNonNegativeInteger(
        value.updatedAt
      )
  };
}


function normalizeSkill(
  value,
  index
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const element =
    normalizeText(
      value.element,
      80
    );

  const name =
    normalizeText(
      value.name,
      120
    );

  const description =
    normalizeText(
      value.description,
      1200
    );

  const baseDamage =
    normalizeDamage(
      value.baseDamage
    );

  const effect =
    normalizeSeasonalSkillEffect(
      value.effect
    );

  const rarity =
    normalizeSkillRarity(
      value.rarity
    );

  if (
    !element ||
    !name
  ) {
    return null;
  }

  const rawId =
    normalizeText(
      value.id,
      120
    );

  const id =
    rawId ??
    [
      element,
      name,
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9:_-]+/g,
        "_"
      )
      .toLowerCase();

  const introducedInSeasonalChestId =
    normalizeSeasonalChestId(
      value.introducedInSeasonalChestId
    );

  const introducedInSeasonalChestOrder =
    normalizePositiveInteger(
      value.introducedInSeasonalChestOrder ??
      value.introducedInChestOrder
    );

  return {
    id,
    element,
    name,
    rarity,
    baseDamage,
    effect:
      effect === undefined
        ? null
        : effect,
    description,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function normalizeSeasonalConsumable(
  value,
  index
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const name =
    normalizeText(
      value.name,
      120
    );

  const rarity =
    normalizeSkillRarity(
      value.rarity
    );

  const rawId =
    normalizeText(
      value.id,
      160
    );

  const id =
    rawId ??
    [
      "seasonal-consumable",
      name ?? "item",
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9:_-]+/g,
        "_"
      )
      .toLowerCase();

  const introducedInSeasonalChestId =
    normalizeSeasonalChestId(
      value.introducedInSeasonalChestId
    );

  const introducedInSeasonalChestOrder =
    normalizePositiveInteger(
      value.introducedInSeasonalChestOrder
    );

  if (
    !name ||
    !rarity ||
    !introducedInSeasonalChestId ||
    !introducedInSeasonalChestOrder
  ) {
    return null;
  }

  return {
    id,
    key:
      normalizeText(
        value.key,
        160
      ) ?? id,
    name,
    rarity,
    description:
      normalizeText(
        value.description,
        1200
      ),
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function normalizeSeasonalPvpFinisher(
  value,
  index
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const name =
    normalizeText(
      value.name,
      120
    );

  const rawId =
    normalizeText(
      value.id,
      160
    );

  const id =
    rawId ??
    [
      "seasonal-pvp-finisher",
      name ?? "finisher",
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9:_-]+/g,
        "_"
      )
      .toLowerCase();

  const introducedInSeasonalChestId =
    normalizeSeasonalChestId(
      value.introducedInSeasonalChestId
    );

  const introducedInSeasonalChestOrder =
    normalizePositiveInteger(
      value.introducedInSeasonalChestOrder
    );

  if (
    !name ||
    !introducedInSeasonalChestId ||
    !introducedInSeasonalChestOrder
  ) {
    return null;
  }

  return {
    id,
    name,
    description:
      normalizeText(
        value.description,
        1200
      ),
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function normalizeSeasonalVictoryMessage(
  value,
  index
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const text =
    normalizeText(
      value.text,
      500
    );

  const rawId =
    normalizeText(
      value.id,
      160
    );

  const id =
    rawId ??
    [
      "seasonal-victory-message",
      text ?? "message",
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9:_-]+/g,
        "_"
      )
      .toLowerCase();

  const introducedInSeasonalChestId =
    normalizeSeasonalChestId(
      value.introducedInSeasonalChestId
    );

  const introducedInSeasonalChestOrder =
    normalizePositiveInteger(
      value.introducedInSeasonalChestOrder
    );

  if (
    !text ||
    !introducedInSeasonalChestId ||
    !introducedInSeasonalChestOrder
  ) {
    return null;
  }

  return {
    id,
    text,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function normalizeSeasonalCosmetic(
  value,
  index
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const name =
    normalizeText(
      value.name,
      120
    );

  const slot =
    normalizeSeasonCosmeticSlot(
      value.slot
    );

  const rawId =
    normalizeText(
      value.id,
      160
    );

  const id =
    rawId ??
    [
      "seasonal-cosmetic",
      name ?? "cosmetic",
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9:_-]+/g,
        "_"
      )
      .toLowerCase();

  const introducedInSeasonalChestId =
    normalizeSeasonalChestId(
      value.introducedInSeasonalChestId
    );

  const introducedInSeasonalChestOrder =
    normalizePositiveInteger(
      value.introducedInSeasonalChestOrder
    );

  if (
    !name ||
    !introducedInSeasonalChestId ||
    !introducedInSeasonalChestOrder
  ) {
    return null;
  }

  return {
    id,
    name,
    slot,
    introducedInSeasonalChestId,
    introducedInSeasonalChestOrder
  };
}


function validateSeasonalChestRelations(
  chests,
  skills
) {
  const byId =
    new Map();

  const orders =
    new Set();

  for (
    const chest of
      chests
  ) {
    if (
      byId.has(chest.id) ||
      orders.has(chest.order)
    ) {
      return false;
    }

    byId.set(
      chest.id,
      chest
    );

    orders.add(
      chest.order
    );
  }

  for (
    const skill of
      skills
  ) {
    const id =
      skill
        .introducedInSeasonalChestId;

    const order =
      skill
        .introducedInSeasonalChestOrder;

    if (
      id === null &&
      order === null
    ) {
      continue;
    }

    if (!order) {
      return false;
    }

    if (!id) {
      const chestByOrder =
        chests.find(
          chest =>
            chest.order ===
            order
        );

      if (!chestByOrder) {
        return false;
      }

      continue;
    }

    const chest =
      byId.get(id);

    if (
      !chest ||
      chest.order !== order
    ) {
      return false;
    }
  }

  return true;
}


function normalizeSeasonalChestDefaultId(
  value,
  seasonalChests
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return {
      ok: true,
      value: null
    };
  }

  const id =
    normalizeText(
      value,
      180
    );

  const exists =
    seasonalChests.some(
      chest =>
        chest.id === id
    );

  if (
    !id ||
    !exists
  ) {
    return {
      ok: false,
      error:
        "INVALID_DEFAULT_SEASONAL_CHEST"
    };
  }

  return {
    ok: true,
    value: id
  };
}


function normalizeSeasonalChestPostPassPool(
  value,
  seasonalChests
) {
  if (!Array.isArray(value)) {
    return null;
  }

  const chestById =
    new Map(
      seasonalChests.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const seen =
    new Set();

  const pool = [];

  for (
    const raw of
      value.slice(0, 50)
  ) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return null;
    }

    const seasonalChestId =
      normalizeText(
        raw.seasonalChestId,
        180
      );

    const chance =
      Number(
        raw.chancePercent
      );

    if (
      !seasonalChestId ||
      !chestById.has(
        seasonalChestId
      ) ||
      seen.has(
        seasonalChestId
      ) ||
      !Number.isFinite(chance) ||
      chance <= 0 ||
      chance > 100
    ) {
      return null;
    }

    seen.add(
      seasonalChestId
    );

    pool.push({
      seasonalChestId,
      chancePercent:
        Math.round(
          chance * 100
        ) / 100
    });
  }

  if (
    pool.length > 0
  ) {
    const total =
      pool.reduce(
        (sum, entry) =>
          sum +
          entry.chancePercent,
        0
      );

    if (
      Math.abs(
        total - 100
      ) > 0.01
    ) {
      return null;
    }
  }

  return pool;
}


function normalizeSeasonalChestRewardBindings(
  value,
  seasonalChests
) {
  if (!Array.isArray(value)) {
    return null;
  }

  const chestById =
    new Map(
      seasonalChests.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const seen =
    new Set();

  const bindings = [];

  for (
    const raw of
      value.slice(0, 100)
  ) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return null;
    }

    const key =
      normalizeText(
        raw.key,
        120
      );

    const seasonalChestId =
      normalizeText(
        raw.seasonalChestId,
        180
      );

    const slot =
      getSeasonalChestRewardBindingSlot(
        key
      );

    const chest =
      seasonalChestId
        ? chestById.get(
            seasonalChestId
          )
        : null;

    if (
      !key ||
      !slot ||
      !seasonalChestId ||
      !chest ||
      seen.has(key)
    ) {
      return null;
    }

    seen.add(key);

    bindings.push({
      key,
      seasonalChestId
    });
  }

  return bindings;
}


export function normalizePvpSeasonContent(
  value,
  fallback = {}
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const year =
    normalizeSeasonYear(
      value.year ??
      fallback.year
    );

  const month =
    normalizeSeasonMonth(
      value.month ??
      fallback.month
    );

  if (
    !year ||
    !month
  ) {
    return null;
  }

  const seasonId =
    getMonthlySeasonId(
      year,
      month
    );

  if (!seasonId) {
    return null;
  }

  const featuredElements =
    getSeasonalFeaturedElements(
      year,
      month
    ) ?? [];

  const rawChests =
    Array.isArray(
      value.seasonalChests
    )
      ? value.seasonalChests
      : [];

  const seasonalChests =
    rawChests
      .slice(0, 50)
      .map(
        chest =>
          normalizeSeasonalChest(
            chest,
            seasonId
          )
      )
      .filter(Boolean)
      .sort(
        (left, right) =>
          left.order -
          right.order
      );

  if (
    seasonalChests.length !==
    rawChests.slice(0, 50).length
  ) {
    return null;
  }

  const defaultSeasonalChest =
    normalizeSeasonalChestDefaultId(
      value.defaultSeasonalChestId,
      seasonalChests
    );

  if (!defaultSeasonalChest.ok) {
    return null;
  }

  const rawPostPassPool =
    Array.isArray(
      value.seasonalChestPostPassPool
    )
      ? value.seasonalChestPostPassPool
      : [];

  const seasonalChestPostPassPool =
    normalizeSeasonalChestPostPassPool(
      rawPostPassPool,
      seasonalChests
    );

  if (!seasonalChestPostPassPool) {
    return null;
  }

  const rawRewardBindings =
    Array.isArray(
      value.seasonalChestRewardBindings
    )
      ? value.seasonalChestRewardBindings
      : [];

  const seasonalChestRewardBindings =
    normalizeSeasonalChestRewardBindings(
      rawRewardBindings,
      seasonalChests
    );

  if (!seasonalChestRewardBindings) {
    return null;
  }

  const rawSkills =
    Array.isArray(
      value.seasonalSkills
    )
      ? value.seasonalSkills
      : [];

  const seasonalSkills =
    rawSkills
      .slice(0, 50)
      .map(
        normalizeSkill
      )
      .filter(Boolean);

  if (
    seasonalSkills.length !==
    rawSkills.slice(0, 50).length
  ) {
    return null;
  }

  const rawConsumables =
    Array.isArray(
      value.seasonalConsumables
    )
      ? value.seasonalConsumables
      : [];

  const seasonalConsumables =
    rawConsumables
      .slice(0, 100)
      .map(
        normalizeSeasonalConsumable
      )
      .filter(Boolean);

  if (
    seasonalConsumables.length !==
    rawConsumables.slice(0, 100).length
  ) {
    return null;
  }

  const rawPvpFinishers =
    Array.isArray(
      value.seasonalPvpFinishers
    )
      ? value.seasonalPvpFinishers
      : [];

  const seasonalPvpFinishers =
    rawPvpFinishers
      .slice(0, 100)
      .map(
        normalizeSeasonalPvpFinisher
      )
      .filter(Boolean);

  if (
    seasonalPvpFinishers.length !==
    rawPvpFinishers.slice(0, 100).length
  ) {
    return null;
  }

  const rawVictoryMessages =
    Array.isArray(
      value.seasonalVictoryMessages
    )
      ? value.seasonalVictoryMessages
      : [];

  const seasonalVictoryMessages =
    rawVictoryMessages
      .slice(0, 100)
      .map(
        normalizeSeasonalVictoryMessage
      )
      .filter(Boolean);

  if (
    seasonalVictoryMessages.length !==
    rawVictoryMessages.slice(0, 100).length
  ) {
    return null;
  }

  const rawCosmetics =
    Array.isArray(
      value.seasonalCosmetics
    )
      ? value.seasonalCosmetics
      : [];

  const seasonalCosmetics =
    rawCosmetics
      .slice(0, 100)
      .map(
        normalizeSeasonalCosmetic
      )
      .filter(Boolean);

  if (
    seasonalCosmetics.length !==
    rawCosmetics.slice(0, 100).length
  ) {
    return null;
  }

  if (
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalSkills
    ) ||
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalConsumables
    ) ||
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalPvpFinishers
    ) ||
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalVictoryMessages
    ) ||
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalCosmetics
    )
  ) {
    return null;
  }

  const updatedAt =
    normalizeNonNegativeInteger(
      value.updatedAt
    );

  return {
    version:
      PVP_SEASON_CONTENT_VERSION,
    id:
      seasonId,
    year,
    month,
    revision:
      normalizeNonNegativeInteger(
        value.revision
      ),
    summary:
      normalizeText(
        value.summary,
        1200
      ),
    featuredElements,
    seasonalChests,
    defaultSeasonalChestId:
      defaultSeasonalChest.value,
    seasonalChestRewardBindings,
    seasonalChestPostPassPool,
    seasonalSkills,
    seasonalConsumables,
    seasonalPvpFinishers,
    seasonalVictoryMessages,
    seasonalCosmetics,
    updatedAt
  };
}


export function createEmptyPvpSeasonContent(
  year,
  month
) {
  return normalizePvpSeasonContent({
    year,
    month,
    revision: 0,
    summary: null,
    featuredElements: [],
    seasonalChests: [],
    defaultSeasonalChestId: null,
    seasonalChestRewardBindings: [],
    seasonalChestPostPassPool: [],
    seasonalSkills: [],
    seasonalConsumables: [],
    seasonalPvpFinishers: [],
    seasonalVictoryMessages: [],
    seasonalCosmetics: [],
    updatedAt: 0
  });
}


export function getPvpSeasonContentStorageKey(
  year,
  month
) {
  const normalizedYear =
    normalizeSeasonYear(
      year
    );

  const normalizedMonth =
    normalizeSeasonMonth(
      month
    );

  if (
    !normalizedYear ||
    !normalizedMonth
  ) {
    return null;
  }

  return (
    PVP_SEASON_CONTENT_STORAGE_PREFIX +
    getMonthlySeasonId(
      normalizedYear,
      normalizedMonth
    )
  );
}


export function getPvpSeasonContentRevisionStorageKey(
  year,
  month,
  revision
) {
  const seasonId =
    getMonthlySeasonId(
      year,
      month
    );

  const normalizedRevision =
    normalizePositiveInteger(
      revision
    );

  if (
    !seasonId ||
    !normalizedRevision
  ) {
    return null;
  }

  return (
    PVP_SEASON_CONTENT_REVISION_STORAGE_PREFIX +
    seasonId +
    ":" +
    normalizedRevision
  );
}


export function getPvpSeasonalChestMonthCatalogStorageKey(
  month
) {
  const normalizedMonth =
    normalizeSeasonMonth(
      month
    );

  if (!normalizedMonth) {
    return null;
  }

  return (
    PVP_SEASONAL_CHEST_MONTH_CATALOG_STORAGE_PREFIX +
    String(
      normalizedMonth
    ).padStart(2, "0")
  );
}


function normalizeSeasonalChestMonthCatalog(
  value,
  month
) {
  const normalizedMonth =
    normalizeSeasonMonth(
      month
    );

  if (
    !normalizedMonth ||
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const rawChests =
    Array.isArray(
      value.chests
    )
      ? value.chests
      : [];

  const ids =
    new Set();

  const orders =
    new Set();

  const chests = [];

  for (
    const raw of
      rawChests.slice(0, 50)
  ) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return null;
    }

    const id =
      normalizeSeasonalChestId(
        raw.id
      );

    const originSeasonId =
      getSeasonalChestOriginSeasonId(
        id
      );

    const originMonth =
      Number(
        originSeasonId
          ?.split("-")[1]
      );

    const order =
      normalizePositiveInteger(
        raw.order
      );

    const name =
      normalizeText(
        raw.name,
        160
      );

    const description =
      normalizeText(
        raw.description,
        1200
      );

    if (
      !id ||
      !originSeasonId ||
      originMonth !==
        normalizedMonth ||
      !order ||
      !name ||
      ids.has(id) ||
      orders.has(order)
    ) {
      return null;
    }

    ids.add(id);
    orders.add(order);

    const latestSeasonId =
      normalizeText(
        raw.latestSeasonId,
        32
      ) ??
      originSeasonId;

    const latestMonth =
      Number(
        latestSeasonId
          .split("-")[1]
      );

    const latestYear =
      Number(
        latestSeasonId
          .split("-")[0]
      );

    const originYear =
      Number(
        originSeasonId
          .split("-")[0]
      );

    if (
      latestMonth !==
        normalizedMonth ||
      !Number.isSafeInteger(
        latestYear
      ) ||
      latestYear <
        originYear
    ) {
      return null;
    }

    chests.push({
      id,
      originSeasonId,
      latestSeasonId,
      order,
      name,
      description,
      createdAt:
        normalizeNonNegativeInteger(
          raw.createdAt
        ),
      updatedAt:
        normalizeNonNegativeInteger(
          raw.updatedAt
        )
    });
  }

  return {
    version:
      PVP_SEASONAL_CHEST_MONTH_CATALOG_VERSION,
    month:
      normalizedMonth,
    chests:
      chests.sort(
        (left, right) =>
          left.order -
          right.order
      ),
    updatedAt:
      normalizeNonNegativeInteger(
        value.updatedAt
      )
  };
}


async function readStoredPvpSeasonMonthContent(
  storage,
  year,
  month
) {
  const key =
    getPvpSeasonContentStorageKey(
      year,
      month
    );

  if (
    !key ||
    !storage ||
    typeof storage.get !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_STORAGE_UNAVAILABLE"
    };
  }

  let stored;

  try {
    stored =
      await storage.get(
        key
      );
  }
  catch {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_STORAGE_READ_FAILED"
    };
  }

  if (
    stored === null ||
    stored === undefined
  ) {
    return {
      ok: true,
      found: false,
      content:
        createEmptyPvpSeasonContent(
          year,
          month
        )
    };
  }

  const content =
    normalizePvpSeasonContent(
      stored,
      {
        year,
        month
      }
    );

  if (!content) {
    return {
      ok: false,
      error:
        "INVALID_STORED_SEASON_CONTENT"
    };
  }

  return {
    ok: true,
    found: true,
    content
  };
}


async function readSeasonalChestMonthCatalog(
  storage,
  month,
  targetYear
) {
  const normalizedMonth =
    normalizeSeasonMonth(
      month
    );

  const normalizedTargetYear =
    normalizeSeasonYear(
      targetYear
    );

  const key =
    getPvpSeasonalChestMonthCatalogStorageKey(
      normalizedMonth
    );

  if (
    !key ||
    !normalizedTargetYear ||
    !storage ||
    typeof storage.get !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CATALOG_UNAVAILABLE"
    };
  }

  let stored;

  try {
    stored =
      await storage.get(
        key
      );
  }
  catch {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CATALOG_READ_FAILED"
    };
  }

  if (
    stored !== null &&
    stored !== undefined
  ) {
    const catalog =
      normalizeSeasonalChestMonthCatalog(
        stored,
        normalizedMonth
      );

    if (!catalog) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_CATALOG"
      };
    }

    return {
      ok: true,
      source:
        "catalog",
      catalog
    };
  }

  /*
   * Migração segura dos dados já existentes:
   * antes do catálogo mensal, os baús viviam apenas
   * dentro do conteúdo anual. Procuramos o ano anterior
   * mais recente do mesmo mês, sem escrever nada durante
   * uma leitura.
   */
  for (
    let candidateYear =
      normalizedTargetYear;
    candidateYear >=
      PVP_SEASONAL_CHEST_INHERITANCE_START_YEAR;
    candidateYear -= 1
  ) {
    const annual =
      await readStoredPvpSeasonMonthContent(
        storage,
        candidateYear,
        normalizedMonth
      );

    if (!annual.ok) {
      return annual;
    }

    if (
      annual.content
        .seasonalChests
        .length === 0
    ) {
      continue;
    }

    const catalog =
      normalizeSeasonalChestMonthCatalog(
        {
          month:
            normalizedMonth,
          chests:
            annual.content
              .seasonalChests
              .map(chest => ({
                id:
                  chest.id,
                originSeasonId:
                  chest.originSeasonId ??
                  getSeasonalChestOriginSeasonId(
                    chest.id
                  ),
                latestSeasonId:
                  annual.content.id,
                order:
                  chest.order,
                name:
                  chest.name,
                description:
                  chest.description,
                createdAt:
                  chest.createdAt,
                updatedAt:
                  chest.updatedAt
              })),
          updatedAt:
            annual.content.updatedAt
        },
        normalizedMonth
      );

    if (!catalog) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_CATALOG"
      };
    }

    return {
      ok: true,
      source:
        "annual_fallback",
      catalog
    };
  }

  return {
    ok: true,
    source:
      "empty",
    catalog:
      normalizeSeasonalChestMonthCatalog(
        {
          month:
            normalizedMonth,
          chests: [],
          updatedAt: 0
        },
        normalizedMonth
      )
  };
}


function mergeInheritedSeasonalChests(
  content,
  catalog
) {
  if (
    !content ||
    !catalog
  ) {
    return content;
  }

  const currentYear =
    Number(content.year);

  const currentSeasonId =
    content.id;

  const byId =
    new Map(
      content.seasonalChests.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const merged =
    [
      ...content.seasonalChests
    ];

  for (
    const definition of
      catalog.chests
  ) {
    const originYear =
      Number(
        definition
          .originSeasonId
          .split("-")[0]
      );

    if (
      originYear >
        currentYear ||
      byId.has(
        definition.id
      )
    ) {
      continue;
    }

    merged.push({
      id:
        definition.id,
      originSeasonId:
        definition.originSeasonId,
      seasonId:
        currentSeasonId,
      order:
        definition.order,
      name:
        definition.name,
      description:
        definition.description,
      poolRevision: null,
      createdAt:
        definition.createdAt,
      updatedAt:
        definition.updatedAt,
      inherited:
        true
    });
  }

  return {
    ...content,
    seasonalChests:
      merged.sort(
        (left, right) =>
          left.order -
          right.order
      )
  };
}


function buildSeasonalChestMonthCatalog(
  existingCatalog,
  annualChests,
  seasonId,
  month,
  now
) {
  const normalizedMonth =
    normalizeSeasonMonth(
      month
    );

  const currentYear =
    Number(
      String(seasonId)
        .split("-")[0]
    );

  if (
    !normalizedMonth ||
    !Number.isSafeInteger(
      currentYear
    )
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_CATALOG"
    };
  }

  const byId =
    new Map(
      (
        existingCatalog?.chests ??
        []
      ).map(
        chest => [
          chest.id,
          {
            ...chest
          }
        ]
      )
    );

  for (
    const chest of
      annualChests
  ) {
    const originSeasonId =
      chest.originSeasonId ??
      getSeasonalChestOriginSeasonId(
        chest.id
      );

    if (
      !originSeasonId ||
      !isSeasonalChestIdAllowedForSeason(
        chest.id,
        seasonId
      )
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST_CATALOG_IDENTITY"
      };
    }

    const existing =
      byId.get(
        chest.id
      );

    if (existing) {
      if (
        existing.order !==
          chest.order ||
        existing.originSeasonId !==
          originSeasonId
      ) {
        return {
          ok: false,
          error:
            "SEASONAL_CHEST_CATALOG_IDENTITY_IMMUTABLE"
        };
      }

      const latestYear =
        Number(
          String(
            existing.latestSeasonId ??
            existing.originSeasonId
          )
            .split("-")[0]
        );

      if (
        currentYear >=
          latestYear
      ) {
        byId.set(
          chest.id,
          {
            ...existing,
            latestSeasonId:
              seasonId,
            name:
              chest.name,
            description:
              chest.description,
            createdAt:
              existing.createdAt ||
              chest.createdAt ||
              now,
            updatedAt:
              now
          }
        );
      }

      continue;
    }

    byId.set(
      chest.id,
      {
        id:
          chest.id,
        originSeasonId,
        latestSeasonId:
          seasonId,
        order:
          chest.order,
        name:
          chest.name,
        description:
          chest.description,
        createdAt:
          chest.createdAt ||
          now,
        updatedAt:
          now
      }
    );
  }

  const catalog =
    normalizeSeasonalChestMonthCatalog(
      {
        version:
          PVP_SEASONAL_CHEST_MONTH_CATALOG_VERSION,
        month:
          normalizedMonth,
        chests:
          [
            ...byId.values()
          ],
        updatedAt:
          now
      },
      normalizedMonth
    );

  if (!catalog) {
    return {
      ok: false,
      error:
        "SEASONAL_CHEST_CATALOG_CONFLICT"
    };
  }

  return {
    ok: true,
    catalog
  };
}


export async function readPvpSeasonMonthContent(
  storage,
  year,
  month
) {
  const annual =
    await readStoredPvpSeasonMonthContent(
      storage,
      year,
      month
    );

  if (!annual.ok) {
    return annual;
  }

  const catalogResult =
    await readSeasonalChestMonthCatalog(
      storage,
      month,
      year
    );

  if (!catalogResult.ok) {
    return catalogResult;
  }

  return {
    ok: true,
    content:
      mergeInheritedSeasonalChests(
        annual.content,
        catalogResult.catalog
      ),
    seasonalChestCatalogSource:
      catalogResult.source
  };
}


export async function readPvpSeasonContentRevision(
  storage,
  year,
  month,
  revision
) {
  const key =
    getPvpSeasonContentRevisionStorageKey(
      year,
      month,
      revision
    );

  if (
    !key ||
    !storage ||
    typeof storage.get !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_REVISION_UNAVAILABLE"
    };
  }

  let stored;

  try {
    stored =
      await storage.get(
        key
      );
  }
  catch {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_REVISION_READ_FAILED"
    };
  }

  if (
    stored === null ||
    stored === undefined
  ) {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_REVISION_NOT_FOUND"
    };
  }

  const content =
    normalizePvpSeasonContent(
      stored,
      {
        year,
        month
      }
    );

  if (
    !content ||
    content.revision !==
      Number(revision)
  ) {
    return {
      ok: false,
      error:
        "INVALID_STORED_SEASON_CONTENT_REVISION"
    };
  }

  return {
    ok: true,
    content
  };
}


function reconcileSeasonalChests(
  existingChests,
  inputChests,
  seasonId,
  nextRevision,
  now
) {
  const existingById =
    new Map(
      existingChests.map(
        chest => [
          chest.id,
          chest
        ]
      )
    );

  const existingIds =
    new Set(
      existingById.keys()
    );

  const maxExistingOrder =
    existingChests.reduce(
      (max, chest) =>
        Math.max(
          max,
          chest.order
        ),
      0
    );

  const seenIds =
    new Set();

  const seenOrders =
    new Set();

  const reconciled = [];

  for (
    const raw of
      inputChests.slice(0, 50)
  ) {
    const id =
      normalizeSeasonalChestId(
        raw?.id,
        seasonId
      );

    const order =
      normalizePositiveInteger(
        raw?.order
      );

    const name =
      normalizeText(
        raw?.name,
        160
      );

    const description =
      normalizeText(
        raw?.description,
        1200
      );

    const inputSeasonId =
      normalizeText(
        raw?.seasonId,
        32
      ) ??
      seasonId;

    if (
      !id ||
      !order ||
      !name ||
      inputSeasonId !==
        seasonId ||
      seenIds.has(id) ||
      seenOrders.has(order)
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST"
      };
    }

    seenIds.add(id);
    seenOrders.add(order);

    const existing =
      existingById.get(
        id
      );

    if (existing) {
      if (
        existing.seasonId !==
          seasonId ||
        existing.order !==
          order
      ) {
        return {
          ok: false,
          error:
            "SEASONAL_CHEST_IDENTITY_IMMUTABLE"
        };
      }

      /*
       * Baú herdado de um ano anterior:
       * a identidade já existe no catálogo mensal, mas
       * ainda não possui revisão de pool neste ano.
       * O primeiro save anual publica o mesmo ID na
       * revisão atual.
       */
      if (
        !existing.poolRevision
      ) {
        reconciled.push({
          id,
          originSeasonId:
            existing.originSeasonId ??
            getSeasonalChestOriginSeasonId(
              id
            ),
          seasonId,
          order,
          name,
          description,
          poolRevision:
            nextRevision,
          createdAt:
            existing.createdAt ||
            now,
          updatedAt:
            now
        });

        continue;
      }

      reconciled.push({
        ...existing,
        originSeasonId:
          existing.originSeasonId ??
          getSeasonalChestOriginSeasonId(
            id
          ),
        name,
        description,
        updatedAt:
          now
      });

      continue;
    }

    if (
      order <=
      maxExistingOrder
    ) {
      return {
        ok: false,
        error:
          "SEASONAL_CHEST_ORDER_ALREADY_PUBLISHED"
      };
    }

    reconciled.push({
      id,
      originSeasonId:
        getSeasonalChestOriginSeasonId(
          id
        ),
      seasonId,
      order,
      name,
      description,
      poolRevision:
        nextRevision,
      createdAt:
        now,
      updatedAt:
        now
    });
  }

  for (
    const existingId of
      existingIds
  ) {
    if (
      !seenIds.has(
        existingId
      )
    ) {
      return {
        ok: false,
        error:
          "SEASONAL_CHEST_REMOVAL_FORBIDDEN"
      };
    }
  }

  return {
    ok: true,
    chests:
      reconciled.sort(
        (left, right) =>
          left.order -
          right.order
      )
  };
}


export async function savePvpSeasonMonthContent(
  storage,
  input
) {
  if (
    !storage ||
    typeof storage.put !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_STORAGE_UNAVAILABLE"
    };
  }

  const year =
    normalizeSeasonYear(
      input?.year
    );

  const month =
    normalizeSeasonMonth(
      input?.month
    );

  if (
    !year ||
    !month
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_CONTENT"
    };
  }

  const existingResult =
    await readPvpSeasonMonthContent(
      storage,
      year,
      month
    );

  if (!existingResult.ok) {
    return existingResult;
  }

  const existing =
    existingResult.content;

  const seasonId =
    existing.id;

  const nextRevision =
    Math.max(
      0,
      Number(
        existing.revision
      ) || 0
    ) + 1;

  const now =
    Date.now();

  const rawChests =
    input?.seasonalChests ===
      undefined
      ? existing.seasonalChests
      : Array.isArray(
          input.seasonalChests
        )
        ? input.seasonalChests
        : null;

  if (!rawChests) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHESTS"
    };
  }

  const reconciled =
    reconcileSeasonalChests(
      existing.seasonalChests,
      rawChests,
      seasonId,
      nextRevision,
      now
    );

  if (!reconciled.ok) {
    return reconciled;
  }

  const content =
    normalizePvpSeasonContent({
      ...input,
      year,
      month,
      revision:
        nextRevision,
      seasonalChests:
        reconciled.chests,
      defaultSeasonalChestId:
        input?.defaultSeasonalChestId ===
          undefined
          ? existing.defaultSeasonalChestId
          : input.defaultSeasonalChestId,
      seasonalChestRewardBindings:
        input?.seasonalChestRewardBindings ===
          undefined
          ? existing.seasonalChestRewardBindings
          : input.seasonalChestRewardBindings,
      seasonalChestPostPassPool:
        input?.seasonalChestPostPassPool ===
          undefined
          ? existing.seasonalChestPostPassPool
          : input.seasonalChestPostPassPool,
      seasonalSkills:
        input?.seasonalSkills ===
          undefined
          ? existing.seasonalSkills
          : input.seasonalSkills,
      seasonalConsumables:
        input?.seasonalConsumables ===
          undefined
          ? existing.seasonalConsumables
          : input.seasonalConsumables,
      seasonalPvpFinishers:
        input?.seasonalPvpFinishers ===
          undefined
          ? existing.seasonalPvpFinishers
          : input.seasonalPvpFinishers,
      seasonalVictoryMessages:
        input?.seasonalVictoryMessages ===
          undefined
          ? existing.seasonalVictoryMessages
          : input.seasonalVictoryMessages,
      seasonalCosmetics:
        input?.seasonalCosmetics ===
          undefined
          ? existing.seasonalCosmetics
          : input.seasonalCosmetics,
      updatedAt:
        now
    });

  if (!content) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_CONTENT"
    };
  }

  const catalogResult =
    await readSeasonalChestMonthCatalog(
      storage,
      month,
      year
    );

  if (!catalogResult.ok) {
    return catalogResult;
  }

  const nextCatalog =
    buildSeasonalChestMonthCatalog(
      catalogResult.catalog,
      content.seasonalChests,
      seasonId,
      month,
      now
    );

  if (!nextCatalog.ok) {
    return nextCatalog;
  }

  const key =
    getPvpSeasonContentStorageKey(
      year,
      month
    );

  const revisionKey =
    getPvpSeasonContentRevisionStorageKey(
      year,
      month,
      nextRevision
    );

  const catalogKey =
    getPvpSeasonalChestMonthCatalogStorageKey(
      month
    );

  if (
    !key ||
    !revisionKey ||
    !catalogKey
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_CONTENT"
    };
  }

  try {
    /*
     * A revisão histórica é escrita antes do ponteiro atual.
     * Em retry, a mesma revisão pode ser sobrescrita de forma
     * idempotente antes de o conteúdo atual avançar.
     */
    await storage.put(
      revisionKey,
      content
    );

    await storage.put(
      key,
      content
    );

    await storage.put(
      catalogKey,
      nextCatalog.catalog
    );
  }
  catch {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_STORAGE_WRITE_FAILED"
    };
  }

  return {
    ok: true,
    content
  };
}


export async function readPvpSeasonYearContent(
  storage,
  year
) {
  const normalizedYear =
    normalizeSeasonYear(
      year
    );

  if (!normalizedYear) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_YEAR"
    };
  }

  const entries =
    await Promise.all(
      Array.from(
        { length: 12 },
        (_, index) =>
          readPvpSeasonMonthContent(
            storage,
            normalizedYear,
            index + 1
          )
      )
    );

  const failed =
    entries.find(
      entry => !entry.ok
    );

  if (failed) {
    return failed;
  }

  const months = {};

  for (
    const entry of
      entries
  ) {
    const month =
      entry.content.month;

    months[
      String(month)
        .padStart(2, "0")
    ] =
      entry.content;
  }

  return {
    ok: true,
    year:
      normalizedYear,
    months
  };
}
