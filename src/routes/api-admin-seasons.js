import {
  isAdminUser
} from "../config/admins.js";

import {
  SEASON_PASS_REWARDS
} from "../config/season-pass-rewards.js";

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
  path
) {
  try {
    const response =
      await coordinator.fetch(
        new Request(
          `https://pvp.internal${path}`
        )
      );

    const body =
      await response.json();

    return {
      httpStatus: response.status,
      ...body
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
        getSeasonBaseTheme(month)
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

  if (request.method !== "GET") {
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

  const [
    current,
    plan,
    schedule
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
    )
  ]);

  if (
    !current.ok ||
    !plan.ok ||
    !schedule.ok
  ) {
    return Response.json(
      {
        ok: false,
        error:
          current.error ??
          plan.error ??
          schedule.error ??
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
    pass:
      buildPassCatalog()
  });
}
