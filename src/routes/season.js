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

  let response;

  try {
    response =
      await coordinator.fetch(
        new Request(
          "https://pvp.internal/season/current"
        )
      );
  }
  catch {
    return new Response(
      "❌ Não foi possível consultar a temporada atual.",
      { status: 503 }
    );
  }

  let result;

  try {
    result =
      await response.json();
  }
  catch {
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

  if (
    !result.season ||
    result.lifecycle === "NONE"
  ) {
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
      `Encerra: ${formatDateTime(season.endsAt)}.`
    );
  }

  if (
    result.lifecycle === "SCHEDULED"
  ) {
    return new Response(
      `🏆 ${season.name} [${season.id}] | Status: AGENDADA | ` +
      `Início: ${formatDateTime(season.startsAt)} | ` +
      `Fim: ${formatDateTime(season.endsAt)}.`
    );
  }

  if (
    result.lifecycle === "EXPIRED"
  ) {
    return new Response(
      `🏆 ${season.name} [${season.id}] | Status: EXPIRADA | ` +
      `Aguardando encerramento administrativo.`
    );
  }

  return new Response(
    `🏆 ${season.name} [${season.id}] | Status: ENCERRADA | ` +
    `Encerrada em: ${formatDateTime(season.endedAt)}.`
  );
}
