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

export function normalizeSeasonalSkills(
  value,
  allowedElements
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
        null
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

    const skills =
      normalizeSeasonalSkills(
        input.seasonalSkills,
        featuredElements
      );

    if (!skills.ok) {
      return Response.json(
        skills,
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
            seasonalSkills:
              skills.value
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
