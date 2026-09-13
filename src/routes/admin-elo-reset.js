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


async function resetGeneralElo(
  env
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
          "https://pvp.internal/admin-elo-reset-general",
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


export async function adminEloResetRoute(
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


  if (
    !isAdminUser(actor)
  ) {
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

  const target =
    args[2];


  if (
    command !== "elo" ||
    operation !== "reset" ||
    !target
  ) {
    return new Response(
      `@${actor}, uso: !adm elo reset @usuário`
    );
  }


  if (
    normalizeCommand(target) === "geral"
  ) {
    const result =
      await resetGeneralElo(env);

    if (!result.ok) {
      if (
        result.error === "ACTIVE_BATTLE" ||
        result.error === "PENDING_CHALLENGE" ||
        result.error === "PVP_QUEUE_NOT_EMPTY"
      ) {
        return new Response(
          `@${actor}, não é possível resetar o Elo geral enquanto houver atividade PvP em andamento.`
        );
      }

      if (
        result.error ===
        "ELO_RESET_IN_PROGRESS"
      ) {
        return new Response(
          `@${actor}, já existe um reset geral de Elo em andamento.`
        );
      }

      return new Response(
        `@${actor}, não foi possível executar o reset geral de Elo.`
      );
    }

    return new Response(
      `🏆 ADM | Reset geral de Elo ativado: geração ${result.before} → ${result.after}. ` +
      `Cada perfil será sincronizado para 1000 de Elo ao ser acessado; histórico competitivo preservado.`
    );
  }


  const result =
    await adminResetIndividualElo(
      env,
      target
    );


  if (!result.ok) {
    if (
      result.error ===
      "CHARACTER_NOT_FOUND"
    ) {
      return new Response(
        `@${actor}, @${normalizeUser(target)} ainda não possui personagem.`
      );
    }

    return new Response(
      `@${actor}, não foi possível resetar o Elo de @${normalizeUser(target)}.`
    );
  }


  return new Response(
    `🏆 ADM | Elo de @${result.user} resetado: ` +
    `${result.before.rating} [${result.before.displayRank}] → ` +
    `${result.after.rating} [${result.after.displayRank}]. ` +
    `Histórico competitivo preservado.`
  );
}
