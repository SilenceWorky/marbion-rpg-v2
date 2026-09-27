import {
  isAdminUser
} from "../config/admins.js";

import {
  adminResetIndividualElo
} from "../systems/admin-elo-reset.js";


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

  if (
    operation !== "reset-elo" ||
    !user
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
