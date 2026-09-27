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


export const PVP_SEASON_CONTENT_VERSION = 2;

export const PVP_SEASON_CONTENT_STORAGE_PREFIX =
  "pvp_season_content:";

export const PVP_SEASON_CONTENT_REVISION_STORAGE_PREFIX =
  "pvp_season_content_revision:";


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


function normalizeSeasonalChestId(
  value,
  expectedSeasonId = null
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

  const embeddedSeasonId =
    modern?.[1] ??
    legacy?.[1] ??
    null;

  if (
    !embeddedSeasonId ||
    (
      expectedSeasonId &&
      embeddedSeasonId !==
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

  if (
    !validateSeasonalChestRelations(
      seasonalChests,
      seasonalSkills
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
    seasonalSkills,
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
    seasonalSkills: [],
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


export async function readPvpSeasonMonthContent(
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
    content
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
        raw?.id
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

      reconciled.push({
        ...existing,
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
      seasonalSkills:
        input?.seasonalSkills ===
          undefined
          ? existing.seasonalSkills
          : input.seasonalSkills,
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

  if (
    !key ||
    !revisionKey
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
