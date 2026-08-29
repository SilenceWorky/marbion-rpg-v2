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


export async function acceptRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const user =
    url.searchParams.get(
      "user"
    );


  if (!user) {
    return new Response(
      "❌ Usuário não informado."
    );
  }


  const coordinator =
    getCoordinator(
      env
    );


  const internalUrl =
    new URL(
      "https://pvp.internal/accept"
    );


  internalUrl.searchParams.set(
    "user",
    user
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
      "NO_CHALLENGE"
    ) {
      return new Response(
        `@${user}, você não possui nenhum desafio de PvP pendente.`
      );
    }


    if (
      result.error ===
      "PLAYER_NOT_FOUND"
    ) {
      return new Response(
        `@${user}, um dos personagens do desafio não existe mais.`
      );
    }


    if (
      result.error ===
      "PLAYER_IN_BATTLE"
    ) {
      return new Response(
        `@${user}, um dos jogadores já está em outra batalha.`
      );
    }


    return new Response(
      "❌ Não foi possível aceitar o desafio."
    );
  }


  const battle =
    result.battle;


  return new Response(
    `⚔️ PvP iniciado! @${battle.player1.user} VS @${battle.player2.user} | Turno 1 | HP: ${battle.player1.hp}/${battle.player1.maxHp} VS ${battle.player2.hp}/${battle.player2.maxHp} | Os dois jogadores já podem escolher !ataque 1-4.`
  );
}