import {
  getMonthlySeasonId,
  getSeasonalFeaturedElements,
  normalizeSeasonMonth,
  normalizeSeasonYear
} from "./pvp-season-calendar.js";

export const PVP_SEASON_CONTENT_VERSION = 1;
export const PVP_SEASON_CONTENT_STORAGE_PREFIX =
  "pvp_season_content:";

function normalizeText(value, max = 500) {
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

  return text.slice(0, max);
}
function normalizeDamage(value) {
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

  return Math.round(damage);
}

function normalizeSkill(value, index) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const element =
    normalizeText(value.element, 80);

  const name =
    normalizeText(value.name, 120);

  const description =
    normalizeText(
      value.description,
      1200
    );
  const baseDamage =
    normalizeDamage(
      value.baseDamage
    );

  if (!element || !name) {
    return null;
  }

  const rawId =
    normalizeText(value.id, 120);

  const id =
    rawId ??
    [
      element,
      name,
      index + 1
    ]
      .join(":")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9:_-]+/g, "_")
      .toLowerCase();

  return {
    id,
    element,
    name,
    baseDamage,
    description
  };
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

  if (!year || !month) {
    return null;
  }
  const featuredElements =
    getSeasonalFeaturedElements(
      year,
      month
    ) ?? [];

  const rawSkills =
    Array.isArray(
      value.seasonalSkills
    )
      ? value.seasonalSkills
      : [];

  const seasonalSkills =
    rawSkills
      .slice(0, 50)
      .map(normalizeSkill)
      .filter(Boolean);

  const updatedAt =
    Math.max(
      0,
      Math.round(
        Number(value.updatedAt) || 0
      )
    );

  return {
    version:
      PVP_SEASON_CONTENT_VERSION,
    id:
      getMonthlySeasonId(
        year,
        month
      ),
    year,
    month,
    summary:
      normalizeText(
        value.summary,
        1200
      ),
    featuredElements,
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
    summary: null,
    featuredElements: [],
    seasonalSkills: [],
    updatedAt: 0
  });
}
export function getPvpSeasonContentStorageKey(
  year,
  month
) {
  const normalizedYear =
    normalizeSeasonYear(year);

  const normalizedMonth =
    normalizeSeasonMonth(month);

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
    typeof storage.get !== "function"
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
      await storage.get(key);
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
      { year, month }
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
export async function savePvpSeasonMonthContent(
  storage,
  input
) {
  if (
    !storage ||
    typeof storage.put !== "function"
  ) {
    return {
      ok: false,
      error:
        "SEASON_CONTENT_STORAGE_UNAVAILABLE"
    };
  }

  const content =
    normalizePvpSeasonContent({
      ...input,
      updatedAt:
        Date.now()
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
      content.year,
      content.month
    );

  try {
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
    normalizeSeasonYear(year);

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

  for (const entry of entries) {
    const month =
      entry.content.month;

    months[
      String(month).padStart(2, "0")
    ] = entry.content;
  }

  return {
    ok: true,
    year:
      normalizedYear,
    months
  };
}
