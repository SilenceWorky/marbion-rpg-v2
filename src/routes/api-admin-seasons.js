import {
  isAdminUser
} from "../config/admins.js";

import {
  SEASON_PASS_REWARDS
} from "../config/season-pass-rewards.js";

import {
  SEASONAL_SKILL_EFFECTS,
  normalizeSeasonalSkillEffect
} from "../config/seasonal-skill-effects.js";

import {
  SKILL_RARITIES,
  normalizeSkillRarity
} from "../config/skill-rarities.js";

import {
  SEASON_PASS_MAX_TIER,
  SEASON_PASS_TOTAL_XP,
  SEASON_PASS_POST_REWARD_XP,
  getSeasonPassTierCost,
  getSeasonPassThreshold
} from "../systems/season-pass-progression.js";

import {
  getSeasonBaseTheme,
  getSeasonCalendarPartsAt,
  getSeasonMonthName,
  getMonthlySeasonId,
  getSeasonalFeaturedElements,
  normalizeSeasonMonth,
  normalizeSeasonYear,
  PVP_SEASON_TIMEZONE
} from "../systems/pvp-season-calendar.js";
function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
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
function getGlobalPvpCoordinator(env) {
  const namespace =
    env?.PVP_COORDINATOR;

  if (
    !namespace ||
    typeof namespace.idFromName !== "function" ||
    typeof namespace.get !== "function"
  ) {
    return null;
  }

  const id =
    namespace.idFromName(
      "marbion-global-pvp"
    );

  return namespace.get(id);
}

async function callCoordinatorJson(
  coordinator,
  path,
  {
    method = "GET",
    body = null
  } = {}
) {
  try {
    const response =
      await coordinator.fetch(
        new Request(
          `https://pvp.internal${path}`,
          {
            method,
            ...(body === null
              ? {}
              : {
                  headers: {
                    "Content-Type":
                      "application/json"
                  },
                  body:
                    JSON.stringify(body)
                })
          }
        )
      );

    const result =
      await response.json();

    return {
      httpStatus: response.status,
      ...result
    };
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }
}
function buildCalendar(year) {
  const months = [];

  for (
    let month = 1;
    month <= 12;
    month += 1
  ) {
    months.push({
      month,
      monthName:
        getSeasonMonthName(month),
      baseTheme:
        getSeasonBaseTheme(month),
      featuredElements:
        getSeasonalFeaturedElements(
          year,
          month
        ) ?? []
    });
  }

  return {
    year,
    timezone:
      PVP_SEASON_TIMEZONE,
    months
  };
}
function buildPassCatalog() {
  return {
    maxTier:
      SEASON_PASS_MAX_TIER,
    totalXp:
      SEASON_PASS_TOTAL_XP,
    postRewardXp:
      SEASON_PASS_POST_REWARD_XP,
    deliveryIntegrated: false,
    tiers:
      SEASON_PASS_REWARDS.map(
        entry => ({
          tier:
            entry.tier,
          cost:
            getSeasonPassTierCost(
              entry.tier
            ),
          threshold:
            getSeasonPassThreshold(
              entry.tier
            ),
          rewards:
            entry.rewards
        })
      )
  };
}

function normalizeLookup(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeSeasonalChestId(
  value,
  expectedSeasonId = null
) {
  const id =
    String(value ?? "")
      .trim();

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


export function normalizeSeasonalChests(
  value,
  seasonId
) {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHESTS"
    };
  }

  const chests = [];
  const ids = new Set();
  const orders = new Set();

  for (
    const raw of value.slice(0, 50)
  ) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST"
      };
    }

    const id =
      normalizeSeasonalChestId(
        raw.id,
        seasonId
      );

    const order =
      Number(raw.order);

    const name =
      String(
        raw.name ?? ""
      )
        .trim()
        .slice(0, 160);

    const description =
      String(
        raw.description ?? ""
      )
        .trim()
        .slice(0, 1200) ||
      null;

    const inputSeasonId =
      String(
        raw.seasonId ??
        seasonId
      ).trim();

    if (
      !id ||
      inputSeasonId !==
        seasonId ||
      !Number.isSafeInteger(order) ||
      order < 1 ||
      !name ||
      ids.has(id) ||
      orders.has(order)
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CHEST"
      };
    }

    ids.add(id);
    orders.add(order);

    chests.push({
      id,
      seasonId,
      order,
      name,
      description,
      poolRevision:
        Number.isSafeInteger(
          Number(raw.poolRevision)
        ) &&
        Number(raw.poolRevision) > 0
          ? Number(raw.poolRevision)
          : null,
      createdAt:
        Number.isSafeInteger(
          Number(raw.createdAt)
        ) &&
        Number(raw.createdAt) >= 0
          ? Number(raw.createdAt)
          : 0,
      updatedAt:
        Number.isSafeInteger(
          Number(raw.updatedAt)
        ) &&
        Number(raw.updatedAt) >= 0
          ? Number(raw.updatedAt)
          : 0
    });
  }

  chests.sort(
    (left, right) =>
      left.order -
      right.order
  );

  return {
    ok: true,
    value: chests
  };
}


export function normalizeSeasonalConsumables(
  value,
  seasonalChests = null
) {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined
    };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CONSUMABLES"
    };
  }

  const consumables = [];

  for (
    const raw of value.slice(0, 100)
  ) {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CONSUMABLE"
      };
    }

    const name =
      String(
        raw.name ?? ""
      ).trim();

    const rarity =
      normalizeSkillRarity(
        raw.rarity
      );

    const introducedInSeasonalChestId =
      normalizeSeasonalChestId(
        raw.introducedInSeasonalChestId
      );

    const introducedInSeasonalChestOrder =
      Number(
        raw.introducedInSeasonalChestOrder
      );

    if (
      !name ||
      !rarity ||
      !introducedInSeasonalChestId ||
      !Number.isSafeInteger(
        introducedInSeasonalChestOrder
      ) ||
      introducedInSeasonalChestOrder < 1
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASONAL_CONSUMABLE",
        value: raw
      };
    }

    if (
      Array.isArray(
        seasonalChests
      )
    ) {
      const chest =
        seasonalChests.find(
          entry =>
            entry.id ===
            introducedInSeasonalChestId
        );

      if (
        !chest ||
        chest.order !==
          introducedInSeasonalChestOrder
      ) {
        return {
          ok: false,
          error:
            "INVALID_SEASONAL_CONSUMABLE_CHEST",
          value: raw
        };
      }
    }

    consumables.push({
      id:
        String(
          raw.id ?? ""
        ).trim() || undefined,
      key:
        String(
          raw.key ?? raw.id ?? ""
        ).trim() || undefined,
      name:
        name.slice(0, 120),
      rarity,
      description:
        String(
          raw.description ?? ""
        )
          .trim()
          .slice(0, 1200) ||
        null,
      introducedInSeasonalChestId,
      introducedInSeasonalChestOrder
    });
  }

  return {
    ok: true,
    value: consumables
  };
}


export function normalizeSeasonalSkills(
  value,
  allowedElements,
  seasonalChests = null
) {
  const byLookup =
    new Map(
      allowedElements.map(
        element => [
          normalizeLookup(element),
          element
        ]
      )
    );

  if (!Array.isArray(value)) {
    return {
      ok: true,
      value: []
    };
  }

  const skills = [];

  for (
    const raw
    of value.slice(0, 50)
  ) {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASON_SKILL"
      };
    }

    const element =
      byLookup.get(
        normalizeLookup(
          raw.element
        )
      );

    const name =
      String(
        raw.name ?? ""
      ).trim();

    const baseDamage =
      raw.baseDamage === null ||
      raw.baseDamage === undefined ||
      raw.baseDamage === ""
        ? null
        : Math.round(
            Number(
              raw.baseDamage
            )
          );

    const effect =
      normalizeSeasonalSkillEffect(
        raw.effect
      );

    const rarity =
      normalizeSkillRarity(
        raw.rarity
      );

    const introducedInSeasonalChestId =
      raw.introducedInSeasonalChestId ===
        null ||
      raw.introducedInSeasonalChestId ===
        undefined ||
      String(
        raw.introducedInSeasonalChestId
      ).trim() === ""
        ? null
        : normalizeSeasonalChestId(
            raw.introducedInSeasonalChestId
          );

    const rawIntroducedOrder =
      raw.introducedInSeasonalChestOrder ??
      raw.introducedInChestOrder;

    const introducedInSeasonalChestOrder =
      rawIntroducedOrder ===
        null ||
      rawIntroducedOrder ===
        undefined ||
      rawIntroducedOrder ===
        ""
        ? null
        : Number(
            rawIntroducedOrder
          );

    if (
      effect === undefined
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASON_SKILL_EFFECT",
        value:
          raw.effect
      };
    }

    if (
      !element ||
      !name ||
      !rarity ||
      (
        introducedInSeasonalChestId &&
        introducedInSeasonalChestOrder ===
          null
      ) ||
      (
        introducedInSeasonalChestOrder !==
          null &&
        (
          !Number.isSafeInteger(
            introducedInSeasonalChestOrder
          ) ||
          introducedInSeasonalChestOrder < 1
        )
      ) ||
      (
        baseDamage !== null &&
        (
          !Number.isFinite(
            baseDamage
          ) ||
          baseDamage < 0 ||
          baseDamage > 999999
        )
      )
    ) {
      return {
        ok: false,
        error:
          "INVALID_SEASON_SKILL",
        value: raw
      };
    }

    if (
      introducedInSeasonalChestId &&
      Array.isArray(
        seasonalChests
      )
    ) {
      const chest =
        seasonalChests.find(
          entry =>
            entry.id ===
            introducedInSeasonalChestId
        );

      if (
        !chest ||
        chest.order !==
          introducedInSeasonalChestOrder
      ) {
        return {
          ok: false,
          error:
            "INVALID_SEASON_SKILL_CHEST",
          value: raw
        };
      }
    }

    skills.push({
      id:
        String(
          raw.id ?? ""
        ).trim() || undefined,
      element,
      name:
        name.slice(0, 120),
      rarity,
      baseDamage,
      effect,
      description:
        String(
          raw.description ?? ""
        )
          .trim()
          .slice(0, 1200) ||
        null,
      introducedInSeasonalChestId,
      introducedInSeasonalChestOrder
    });
  }

  return {
    ok: true,
    value: skills
  };
}

export async function adminSeasonsApiRoute(
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
      { status: 403 }
    );
  }

  const method =
    String(
      request.method ?? "GET"
    ).toUpperCase();

  if (
    method !== "GET" &&
    method !== "PATCH"
  ) {
    return Response.json(
      {
        ok: false,
        error: "METHOD_NOT_ALLOWED"
      },
      { status: 405 }
    );
  }

  const now =
    Date.now();

  const calendarNow =
    getSeasonCalendarPartsAt(
      now
    );

  const requestedYear =
    normalizeSeasonYear(
      url.searchParams.get("year")
    ) ??
    calendarNow?.year;

  if (!requestedYear) {
    return Response.json(
      {
        ok: false,
        error:
          "INVALID_SEASON_YEAR"
      },
      { status: 400 }
    );
  }

  const coordinator =
    getGlobalPvpCoordinator(env);

  if (!coordinator) {
    return Response.json(
      {
        ok: false,
        error:
          "PVP_COORDINATOR_UNAVAILABLE"
      },
      { status: 503 }
    );
  }

  if (method === "PATCH") {
    const month =
      normalizeSeasonMonth(
        url.searchParams.get("month")
      );

    if (!month) {
      return Response.json(
        {
          ok: false,
          error:
            "INVALID_SEASON_MONTH"
        },
        { status: 400 }
      );
    }

    let input;

    try {
      input =
        await request.json();
    }
    catch {
      return Response.json(
        {
          ok: false,
          error: "INVALID_JSON"
        },
        { status: 400 }
      );
    }

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "INVALID_SEASON_CONTENT"
        },
        { status: 400 }
      );
    }

    const featuredElements =
      getSeasonalFeaturedElements(
        requestedYear,
        month
      );

    if (!featuredElements) {
      return Response.json(
        {
          ok: false,
          error:
            "INVALID_SEASON_ELEMENTS"
        },
        { status: 400 }
      );
    }

    const seasonId =
      getMonthlySeasonId(
        requestedYear,
        month
      );

    if (!seasonId) {
      return Response.json(
        {
          ok: false,
          error:
            "INVALID_SEASON_ID"
        },
        { status: 400 }
      );
    }

    const chests =
      input.seasonalChests ===
        undefined
        ? {
            ok: true,
            value: undefined
          }
        : normalizeSeasonalChests(
            input.seasonalChests,
            seasonId
          );

    if (!chests.ok) {
      return Response.json(
        chests,
        { status: 400 }
      );
    }

    const skills =
      normalizeSeasonalSkills(
        input.seasonalSkills,
        featuredElements,
        chests.value ?? null
      );

    if (!skills.ok) {
      return Response.json(
        skills,
        { status: 400 }
      );
    }

    const consumables =
      normalizeSeasonalConsumables(
        input.seasonalConsumables,
        chests.value ?? null
      );

    if (!consumables.ok) {
      return Response.json(
        consumables,
        { status: 400 }
      );
    }

    let definition = null;

    const requestedName =
      String(
        input.name ?? ""
      ).trim();

    if (requestedName) {
      const renameUrl =
        new URL(
          "https://pvp.internal/season/plan/rename"
        );

      renameUrl.searchParams.set(
        "year",
        String(requestedYear)
      );

      renameUrl.searchParams.set(
        "month",
        String(month)
      );

      renameUrl.searchParams.set(
        "name",
        requestedName.slice(0, 160)
      );

      const renamed =
        await callCoordinatorJson(
          coordinator,
          `${renameUrl.pathname}${renameUrl.search}`,
          {
            method: "POST"
          }
        );

      if (!renamed.ok) {
        return Response.json(
          {
            ok: false,
            error:
              renamed.error ??
              "SEASON_RENAME_FAILED"
          },
          {
            status:
              renamed.httpStatus >= 400
                ? renamed.httpStatus
                : 502
          }
        );
      }

      definition =
        renamed.definition ?? null;
    }

    const saved =
      await callCoordinatorJson(
        coordinator,
        `/season/content/month/save?year=${requestedYear}&month=${month}`,
        {
          method: "POST",
          body: {
            summary:
              String(
                input.summary ?? ""
              ).trim() || null,
            featuredElements,
            ...(chests.value ===
              undefined
              ? {}
              : {
                  seasonalChests:
                    chests.value
                }),
            seasonalSkills:
              skills.value,
            ...(consumables.value ===
              undefined
              ? {}
              : {
                  seasonalConsumables:
                    consumables.value
                })
          }
        }
      );

    if (!saved.ok) {
      return Response.json(
        {
          ok: false,
          error:
            saved.error ??
            "SEASON_CONTENT_SAVE_FAILED"
        },
        {
          status:
            saved.httpStatus >= 400
              ? saved.httpStatus
              : 502
        }
      );
    }

    return Response.json({
      ok: true,
      year:
        requestedYear,
      month,
      monthName:
        getSeasonMonthName(month),
      baseTheme:
        getSeasonBaseTheme(month),
      skillEffects:
        SEASONAL_SKILL_EFFECTS,
      skillRarities:
        Object.values(
          SKILL_RARITIES
        ),
      definition,
      content:
        saved.content
    });
  }

  const [
    current,
    plan,
    schedule,
    content
  ] = await Promise.all([
    callCoordinatorJson(
      coordinator,
      "/season/current"
    ),
    callCoordinatorJson(
      coordinator,
      `/season/plan?year=${requestedYear}`
    ),
    callCoordinatorJson(
      coordinator,
      `/season/schedule?year=${requestedYear}`
    ),
    callCoordinatorJson(
      coordinator,
      `/season/content/year?year=${requestedYear}`
    )
  ]);

  if (
    !current.ok ||
    !plan.ok ||
    !schedule.ok ||
    !content.ok
  ) {
    return Response.json(
      {
        ok: false,
        error:
          current.error ??
          plan.error ??
          schedule.error ??
          content.error ??
          "SEASON_READ_FAILED"
      },
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    now,
    currentTime:
      calendarNow,
    calendar:
      buildCalendar(
        requestedYear
      ),
    current: {
      season:
        current.season ?? null,
      lifecycle:
        current.lifecycle ?? "NONE",
      active:
        current.active === true,
      remainingMs:
        Number(
          current.remainingMs
        ) || 0
    },
    plan:
      plan.plan ?? null,
    schedule:
      schedule.schedule ?? null,
    content:
      content.months ?? {},
    skillEffects:
      SEASONAL_SKILL_EFFECTS,
    skillRarities:
      Object.values(
        SKILL_RARITIES
      ),
    pass:
      buildPassCatalog()
  });
}
