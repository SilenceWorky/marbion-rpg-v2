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


export async function refuseRoute(
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
      "https://pvp.internal/refuse"
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
        `@${user}, você não possui nenhum desafio de PvP pendente para recusar.`
      );
    }


    return new Response(
      "❌ Não foi possível recusar o desafio."
    );
  }


  return new Response(
    `🚫 @${result.target} recusou o desafio de @${result.challenger}.`
  );
}
