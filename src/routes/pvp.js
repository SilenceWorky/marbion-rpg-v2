function getCoordinator(
  env
) {
  const id =
    env.PVP_COORDINATOR.idFromName(
      "marbion-global-pvp"
    );

  return env.PVP_COORDINATOR.get(
    id
  );
}


export async function pvpRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const challenger =
    url.searchParams.get(
      "challenger"
    );

  const target =
    url.searchParams.get(
      "target"
    );


  if (
    !challenger ||
    !target
  ) {
    return new Response(
      "❌ Uso: !pvp @usuário"
    );
  }


  const coordinator =
    getCoordinator(
      env
    );


  const internalUrl =
    new URL(
      "https://pvp.internal/challenge"
    );


  internalUrl.searchParams.set(
    "challenger",
    challenger
  );

  internalUrl.searchParams.set(
    "target",
    target
  );


  const response =
    await coordinator.fetch(
      new Request(
        internalUrl.toString()
      )
    );


  const result =
    await response.json();


  if (!result.ok) {
    if (
      result.error ===
      "SELF_CHALLENGE"
    ) {
      return new Response(
        `@${result.challenger || challenger}, você não pode desafiar a si mesmo.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_NOT_FOUND"
    ) {
      return new Response(
        `@${challenger}, você ainda não possui um personagem.`
      );
    }


    if (
      result.error ===
      "TARGET_NOT_FOUND"
    ) {
      return new Response(
        `@${challenger}, esse jogador ainda não possui um personagem.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_IN_BATTLE"
    ) {
      return new Response(
        `@${challenger}, você já está em uma batalha.`
      );
    }


    if (
      result.error ===
      "TARGET_IN_BATTLE"
    ) {
      return new Response(
        `@${challenger}, esse jogador já está em uma batalha.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_IN_QUEUE"
    ) {
      return new Response(
        `@${challenger}, você já está aguardando um PvP na fila global.`
      );
    }


    if (
      result.error ===
      "TARGET_IN_QUEUE"
    ) {
      return new Response(
        `@${challenger}, esse jogador já está aguardando um PvP na fila global.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_HAS_CHALLENGE"
    ) {
      return new Response(
        `@${challenger}, você já está envolvido em outro desafio.`
      );
    }


    if (
      result.error ===
      "TARGET_HAS_CHALLENGE"
    ) {
      return new Response(
        `@${challenger}, esse jogador já está envolvido em outro desafio.`
      );
    }


    return new Response(
      "❌ Não foi possível criar o desafio."
    );
  }


  return new Response(
    `⚔️ @${result.challenger} desafiou @${result.target} para um PvP! @${result.target}, use !aceitar em até 2 minutos.`
  );
}