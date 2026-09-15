import {
  isAdminUser
} from "../config/admins.js";

import {
  getMonthlySeasonBounds,
  getSeasonBaseTheme
} from "../systems/pvp-season-calendar.js";


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


function getUsage(actor) {
  return (
    `@${actor}, uso: ` +
    `!adm temporada definir <ano> <mês> <nome> | ` +
    `!adm temporada cancelar <ano> <mês> | ` +
    `!adm temporada encerrar`
  );
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
      getUsage(actor)
    );
  }


  if (
    operation === "iniciar" ||
    operation === "agendar"
  ) {
    return new Response(
      `@${actor}, o comando legado de início/agendamento manual foi desativado. ` +
      `Use !adm temporada definir <ano> <mês> <nome>.`
    );
  }


  if (
    operation === "definir"
  ) {
    const year =
      args[2];

    const month =
      args[3];

    const name =
      args.slice(4)
        .join(" ")
        .trim();

    const bounds =
      getMonthlySeasonBounds(
        year,
        month
      );

    if (
      !bounds.ok ||
      !name
    ) {
      return new Response(
        `@${actor}, uso: !adm temporada definir <ano> <mês> <nome>`
      );
    }

    if (
      Date.now() >=
      bounds.startsAt
    ) {
      return new Response(
        `@${actor}, só é possível definir e autorizar uma temporada antes do início do mês correspondente.`
      );
    }

    const baseTheme =
      getSeasonBaseTheme(
        bounds.month
      );

    if (!baseTheme) {
      return new Response(
        `@${actor}, ${bounds.monthName}/${bounds.year} ainda não possui tema-base canônico configurado e não pode ser autorizado.`
      );
    }

    const defineUrl =
      new URL(
        "https://pvp.internal/season/plan/define"
      );

    defineUrl.searchParams.set(
      "year",
      String(bounds.year)
    );

    defineUrl.searchParams.set(
      "month",
      String(bounds.month)
    );

    defineUrl.searchParams.set(
      "name",
      name
    );

    const defined =
      await callCoordinator(
        env,
        `${defineUrl.pathname}${defineUrl.search}`
      );

    if (!defined.ok) {
      return new Response(
        `@${actor}, não foi possível definir a temporada.`
      );
    }

    const scheduleUrl =
      new URL(
        "https://pvp.internal/season/schedule/add"
      );

    scheduleUrl.searchParams.set(
      "year",
      String(bounds.year)
    );

    scheduleUrl.searchParams.set(
      "month",
      String(bounds.month)
    );

    const scheduled =
      await callCoordinator(
        env,
        `${scheduleUrl.pathname}${scheduleUrl.search}`
      );

    if (!scheduled.ok) {
      if (
        scheduled.error ===
          "SEASON_SCHEDULE_WINDOW_CLOSED"
      ) {
        return new Response(
          `@${actor}, o mês começou antes de o agendamento ser concluído. A temporada não foi autorizada.`
        );
      }

      return new Response(
        `@${actor}, o nome foi salvo, mas não foi possível autorizar/agendar a temporada. Repita o comando.`
      );
    }

    return new Response(
      `🏆 ADM | ${bounds.monthName}/${bounds.year} preparada: ` +
      `${defined.definition.name} [${defined.definition.id}]. ` +
      `Início automático no dia 1 às 00:00 (${bounds.timezone}).`
    );
  }


  if (
    operation === "cancelar"
  ) {
    const bounds =
      getMonthlySeasonBounds(
        args[2],
        args[3]
      );

    if (!bounds.ok) {
      return new Response(
        `@${actor}, uso: !adm temporada cancelar <ano> <mês>`
      );
    }

    const cancelUrl =
      new URL(
        "https://pvp.internal/season/schedule/cancel"
      );

    cancelUrl.searchParams.set(
      "year",
      String(bounds.year)
    );

    cancelUrl.searchParams.set(
      "month",
      String(bounds.month)
    );

    const result =
      await callCoordinator(
        env,
        `${cancelUrl.pathname}${cancelUrl.search}`
      );

    if (!result.ok) {
      return new Response(
        `@${actor}, não foi possível cancelar o agendamento da temporada.`
      );
    }

    if (!result.changed) {
      return new Response(
        `@${actor}, não existe agendamento para ${bounds.monthName}/${bounds.year}. ` +
        `Se a temporada já estiver ACTIVE, use !adm temporada encerrar.`
      );
    }

    return new Response(
      `🏆 ADM | Agendamento de ${bounds.monthName}/${bounds.year} cancelado. ` +
      `O nome planejado foi preservado.`
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
    getUsage(actor)
  );
}
