import {
  getProfile
} from "../core/database.js";

import {
  getDisplayRank
} from "../systems/pvp-ranking.js";


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


function formatRemainingTime(
  remainingMs
) {
  const totalMinutes =
    Math.max(
      0,
      Math.floor(
        Number(remainingMs) / 60_000
      )
    );

  const days =
    Math.floor(
      totalMinutes / (24 * 60)
    );

  const hours =
    Math.floor(
      (totalMinutes % (24 * 60)) / 60
    );

  const minutes =
    totalMinutes % 60;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (
    hours > 0 ||
    days > 0
  ) {
    parts.push(`${hours}h`);
  }

  if (days === 0) {
    parts.push(`${minutes}min`);
  }

  return parts.join(" ") || "0min";
}


function formatDateTime(
  timestamp
) {
  const value =
    Number(timestamp);

  if (!Number.isFinite(value)) {
    return "data desconhecida";
  }

  return new Date(value)
    .toLocaleString(
      "pt-BR",
      {
        timeZone: "America/Fortaleza"
      }
    );
}


async function getPlayerRankingContext(
  env,
  user
) {
  if (!user) {
    return null;
  }

  let profile;

  try {
    profile =
      await getProfile(
        env,
        user
      );
  }
  catch {
    return null;
  }

  if (!profile?.race) {
    return null;
  }

  const rating =
    Math.max(
      0,
      Math.round(
        Number(
          profile?.pvp?.rating
        ) || 0
      )
    );

  return {
    user,
    rating,
    rank:
      getDisplayRank(
        profile
      )
  };
}


function formatPlayerRanking(
  context
) {
  if (!context) {
    return "";
  }

  return (
    ` | @${context.user}: ${context.rank} | ` +
    `Rating: ${context.rating}`
  );
}


async function callCoordinatorJson(
  coordinator,
  path
) {
  let response;

  try {
    response =
      await coordinator.fetch(
        new Request(
          `https://pvp.internal${path}`
        )
      );
  }
  catch {
    return {
      ok: false,
      transportError: true
    };
  }

  try {
    return await response.json();
  }
  catch {
    return {
      ok: false,
      invalidResponse: true
    };
  }
}


export async function seasonRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const user =
    String(
      url.searchParams.get("user") ?? ""
    )
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  const coordinator =
    getGlobalPvpCoordinator(env);

  if (!coordinator) {
    return new Response(
      "❌ Sistema de temporadas indisponível no momento.",
      { status: 503 }
    );
  }

  const result =
    await callCoordinatorJson(
      coordinator,
      "/season/current"
    );

  if (result.transportError) {
    return new Response(
      "❌ Não foi possível consultar a temporada atual.",
      { status: 503 }
    );
  }

  if (result.invalidResponse) {
    return new Response(
      "❌ Resposta inválida do sistema de temporadas.",
      { status: 502 }
    );
  }

  const mention =
    user
      ? `@${user}, `
      : "";

  if (!result.ok) {
    return new Response(
      `${mention}não foi possível consultar a temporada atual.`
    );
  }

  const playerRanking =
    await getPlayerRankingContext(
      env,
      user
    );

  const playerSuffix =
    formatPlayerRanking(
      playerRanking
    );

  /*
   * Com o novo modelo, uma temporada futura fica
   * no calendário de agendamento e não em
   * pvp_current_season. Quando não há temporada
   * atual, consultamos a próxima agendada para que
   * !temporada continue exibindo Status: AGENDADA.
   */
  if (
    !result.season ||
    result.lifecycle === "NONE"
  ) {
    const next =
      await callCoordinatorJson(
        coordinator,
        "/season/schedule/next"
      );

    if (
      next.ok &&
      next.entry
    ) {
      const scheduled =
        next.entry;

      return new Response(
        `🏆 ${scheduled.name} [${scheduled.id}] | Status: AGENDADA | ` +
        `Início: ${formatDateTime(scheduled.startsAt)} | ` +
        `Fim: ${formatDateTime(scheduled.endsAt)}` +
        `${playerSuffix}.`
      );
    }

    return new Response(
      `${mention}não há temporada ranqueada cadastrada no momento.`
    );
  }

  const season =
    result.season;

  if (
    result.lifecycle === "ACTIVE"
  ) {
    return new Response(
      `🏆 ${season.name} [${season.id}] | Status: ATIVA | ` +
      `Tempo restante: ${formatRemainingTime(result.remainingMs)} | ` +
      `Encerra: ${formatDateTime(season.endsAt)}` +
      `${playerSuffix}.`
    );
  }

  if (
    result.lifecycle === "SCHEDULED"
  ) {
    return new Response(
      `🏆 ${season.name} [${season.id}] | Status: AGENDADA | ` +
      `Início: ${formatDateTime(season.startsAt)} | ` +
      `Fim: ${formatDateTime(season.endsAt)}` +
      `${playerSuffix}.`
    );
  }

  if (
    result.lifecycle === "EXPIRED"
  ) {
    return new Response(
      `🏆 ${season.name} [${season.id}] | Status: EXPIRADA | ` +
      `Aguardando encerramento administrativo` +
      `${playerSuffix}.`
    );
  }

  return new Response(
    `🏆 ${season.name} [${season.id}] | Status: ENCERRADA | ` +
    `Encerrada em: ${formatDateTime(season.endedAt)}` +
    `${playerSuffix}.`
  );
}
