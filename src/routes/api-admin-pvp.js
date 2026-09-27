import {
  isAdminUser
} from "../config/admins.js";

import {
  adminResetIndividualElo
} from "../systems/admin-elo-reset.js";

import {
  adminResetProfileTime,
  normalizeAdminTimeScope
} from "../systems/admin-time-reset.js";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeOperation(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function getGlobalPvpCoordinator(
  env
) {
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


async function resetLiveBattleTime(
  env,
  user,
  scope,
  extra = null
) {
  const coordinator =
    getGlobalPvpCoordinator(
      env
    );

  if (!coordinator) {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  const internalUrl =
    new URL(
      "https://pvp.internal/admin-reset-time"
    );

  internalUrl.searchParams.set(
    "user",
    user
  );

  internalUrl.searchParams.set(
    "scope",
    scope
  );

  if (
    extra !== null &&
    extra !== undefined &&
    String(extra).trim() !== ""
  ) {
    internalUrl.searchParams.set(
      "extra",
      String(extra)
    );
  }

  try {
    const response =
      await coordinator.fetch(
        new Request(
          internalUrl.toString()
        )
      );

    return await response.json();
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }
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


export async function adminPvpApiRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  if (
    !authorized(
      url,
      env
    )
  ) {
    return Response.json(
      {
        ok: false,
        error: "UNAUTHORIZED"
      },
      {
        status: 401
      }
    );
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

  const operation =
    normalizeOperation(
      body?.operation
    );

  const user =
    normalizeUser(
      body?.user
    );

  if (!user) {
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

  if (
    operation === "reset-elo"
  ) {
    const result =
      await adminResetIndividualElo(
        env,
        user
      );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error:
            result.error ||
            "ELO_RESET_FAILED"
        },
        {
          status:
            result.error ===
            "CHARACTER_NOT_FOUND"
              ? 404
              : 400
        }
      );
    }

    return Response.json({
      ok: true,
      operation: "reset-elo",
      user: result.user,
      before: result.before,
      after: result.after
    });
  }

  if (
    operation === "reset-time"
  ) {
    const scope =
      normalizeAdminTimeScope(
        body?.scope
      );

    const extra =
      body?.extra ?? null;

    if (!scope) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_SCOPE"
        },
        {
          status: 400
        }
      );
    }

    if (
      scope === "habilidade" &&
      (
        !Number.isInteger(
          Number(extra)
        ) ||
        Number(extra) < 1 ||
        Number(extra) > 4
      )
    ) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_SLOT"
        },
        {
          status: 400
        }
      );
    }

    if (
      scope === "antifarm" &&
      !normalizeUser(extra)
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "OPPONENT_REQUIRED"
        },
        {
          status: 400
        }
      );
    }

    const profileResult =
      await adminResetProfileTime(
        env,
        user,
        scope,
        extra
      );

    if (!profileResult.ok) {
      const status =
        profileResult.error ===
        "CHARACTER_NOT_FOUND"
          ? 404
          : profileResult.error ===
            "OPPONENT_NOT_FOUND"
            ? 404
            : 400;

      return Response.json(
        {
          ok: false,
          error:
            profileResult.error ||
            "TIME_RESET_FAILED"
        },
        {
          status
        }
      );
    }

    const battleScopes =
      new Set([
        "tudo",
        "pvp",
        "afk",
        "habilidades",
        "habilidade",
        "meditar"
      ]);

    let battleResult =
      null;

    if (
      battleScopes.has(
        scope
      )
    ) {
      battleResult =
        await resetLiveBattleTime(
          env,
          user,
          scope,
          extra
        );

      if (!battleResult.ok) {
        return Response.json(
          {
            ok: false,
            error:
              battleResult.error ||
              "PVP_TIME_RESET_SYNC_FAILED",
            profileResetApplied:
              true,
            profile:
              profileResult
          },
          {
            status: 502
          }
        );
      }
    }

    return Response.json({
      ok: true,
      operation: "reset-time",
      user:
        profileResult.user,
      scope:
        profileResult.scope,
      resetFields:
        profileResult.resetFields ??
        [],
      slot:
        profileResult.slot ??
        null,
      skillId:
        profileResult.skillId ??
        null,
      opponent:
        profileResult.opponent ??
        null,
      antiFarmCleared:
        profileResult.antiFarmCleared ??
        null,
      antiFarmOpponentsCleared:
        profileResult
          .antiFarmOpponentsCleared ??
        0,
      mirroredAntiFarmCleared:
        profileResult
          .mirroredAntiFarmCleared ??
        0,
      battle:
        battleResult
    });
  }

  return Response.json(
    {
      ok: false,
      error: "INVALID_OPERATION"
    },
    {
      status: 400
    }
  );
}
