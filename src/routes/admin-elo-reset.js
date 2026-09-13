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
    return new Response(
      `@${actor}, o reset geral de Elo ainda não está disponível com segurança.`
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
