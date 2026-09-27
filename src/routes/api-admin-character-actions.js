import {
  isAdminUser
} from "../config/admins.js";

import {
  adminResetStatus,
  adminAddStatusPoints
} from "../systems/admin.js";


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


export async function adminCharacterActionsApiRoute(
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
        error: "INVALID_USER"
      },
      {
        status: 400
      }
    );
  }

  if (
    operation ===
    "reset-status"
  ) {
    const result =
      await adminResetStatus(
        env,
        user
      );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error:
            result.error ||
            "STATUS_RESET_FAILED"
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
      operation,
      user:
        result.user,
      before:
        result.before,
      after:
        result.after
    });
  }

  if (
    operation ===
    "add-status-points"
  ) {
    const amount =
      Number(
        body?.amount
      );

    const result =
      await adminAddStatusPoints(
        env,
        user,
        amount
      );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error:
            result.error ||
            "STATUS_POINTS_ADD_FAILED"
        },
        {
          status: 400
        }
      );
    }

    return Response.json({
      ok: true,
      operation,
      user:
        result.user,
      beforeStatusPoints:
        result.beforeStatusPoints,
      added:
        result.added,
      statusPoints:
        result.statusPoints
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
