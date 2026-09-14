import {
  isAdminUser
} from "../config/admins.js";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeCommand(value) {
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


async function callCoordinator(
  env,
  path
) {
  const coordinator =
    getGlobalPvpCoordinator(env);

  if (!coordinator) {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  let response;

  try {
    response =
      await coordinator.fetch(
        new Request(
          `https://pvp.internal${path}`,
          {
            method: "POST"
          }
        )
      );
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  try {
    return await response.json();
  }
  catch {
    return {
      ok: false,
      error:
        "INVALID_COORDINATOR_RESPONSE"
    };
  }
}


export async function adminSeasonRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const actor =
    normalizeUser(
      url.searchParams.get("actor")
    );

  const adminKey =
    url.searchParams.get("key");

  const rawArgs =
    String(
      url.searchParams.get("args") ?? ""
    ).trim();


  if (!isAdminUser(actor)) {
    return new Response(
      "❌ Você não possui permissão para usar comandos de ADM.",
      { status: 403 }
    );
  }

  if (
    !env.MARBION_ADMIN_KEY ||
    adminKey !== env.MARBION_ADMIN_KEY
  ) {
    return new Response(
      "❌ Chave administrativa inválida.",
      { status: 403 }
    );
  }


  const args =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  const command =
    normalizeCommand(args[0]);

  const operation =
    normalizeCommand(args[1]);


  if (
    command !== "temporada"
  ) {
    return new Response(
      `@${actor}, uso: !adm temporada iniciar <ID> <nome> | !adm temporada encerrar`
    );
  }


  if (
    operation === "iniciar"
  ) {
    const id =
      String(args[2] ?? "").trim();

    const name =
      args.slice(3).join(" ").trim();

    if (
      !id ||
      !name
    ) {
      return new Response(
        `@${actor}, uso: !adm temporada iniciar <ID> <nome>`
      );
    }

    const startUrl =
      new URL(
        "https://pvp.internal/season/start"
      );

    startUrl.searchParams.set(
      "id",
      id
    );

    startUrl.searchParams.set(
      "name",
      name
    );

    const result =
      await callCoordinator(
        env,
        `${startUrl.pathname}${startUrl.search}`
      );

    if (!result.ok) {
      if (
        result.error ===
        "SEASON_ALREADY_EXISTS"
      ) {
        return new Response(
          `@${actor}, já existe uma temporada atual. Encerre-a antes de iniciar outra.`
        );
      }

      return new Response(
        `@${actor}, não foi possível iniciar a temporada.`
      );
    }

    return new Response(
      `🏆 ADM | Temporada iniciada: ${result.season.name} [${result.season.id}]. ` +
      `Duração padrão: 30 dias.`
    );
  }


  if (
    operation === "encerrar"
  ) {
    const result =
      await callCoordinator(
        env,
        "/season/end"
      );

    if (!result.ok) {
      if (
        result.error ===
        "NO_CURRENT_SEASON"
      ) {
        return new Response(
          `@${actor}, não existe temporada atual para encerrar.`
        );
      }

      return new Response(
        `@${actor}, não foi possível encerrar a temporada.`
      );
    }

    if (!result.changed) {
      return new Response(
        `🏆 ADM | ${result.season.name} [${result.season.id}] já estava encerrada.`
      );
    }

    return new Response(
      `🏆 ADM | Temporada encerrada: ${result.season.name} [${result.season.id}]. ` +
      `Soft reset e recompensas ainda não foram executados nesta etapa.`
    );
  }


  return new Response(
    `@${actor}, uso: !adm temporada iniciar <ID> <nome> | !adm temporada encerrar`
  );
}
