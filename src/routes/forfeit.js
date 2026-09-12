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


export async function forfeitRoute(
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
      "https://pvp.internal/forfeit"
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
      "NOT_IN_BATTLE"
    ) {
      return new Response(
        "@" + user + ", você não está em uma batalha PvP ativa."
      );
    }

    return new Response(
      "❌ Não foi possível desistir do PvP."
    );
  }


  const ranked =
    result.rankedResult;

  const winnerGain =
    Number(
      ranked?.winner?.gain
    ) || 0;

  const loserLoss =
    Number(
      ranked?.loser?.loss
    ) || 0;


  let message =
    "🏳️ @" + result.loser +
    " desistiu no Turno " + result.turn +
    ". 🏆 @" + result.winner +
    " venceu.";


  if (
    result.earlyForfeit === true
  ) {
    message +=
      " | Desistência antes do Turno 3: @" + result.winner +
      " +0 XP de Combate → " + ranked.winner.after +
      " [" + ranked.winner.rank + "] | @" + result.loser +
      " -" + loserLoss + " → " + ranked.loser.after +
      " [" + ranked.loser.rank + "].";
  }

  else if (
    ranked?.antiFarm === true
  ) {
    message +=
      " | 🤝 Anti-farm: recompensa de @" + result.winner +
      " bloqueada (+0). @" + result.loser +
      " ainda recebe a penalidade de desistência: -" + loserLoss +
      " → " + ranked.loser.after +
      " [" + ranked.loser.rank + "].";
  }

  else {
    message +=
      " | XP de Combate: @" + result.winner +
      " +" + winnerGain + " → " + ranked.winner.after +
      " [" + ranked.winner.rank + "] | @" + result.loser +
      " -" + loserLoss + " → " + ranked.loser.after +
      " [" + ranked.loser.rank + "].";
  }


  const next =
    result.nextQueuedBattle;

  if (
    next?.player1?.user &&
    next?.player2?.user
  ) {
    message +=
      " | ▶️ Próximo PvP iniciado: @" + next.player1.user +
      " VS @" + next.player2.user + ".";
  }


  return new Response(
    message
  );
}
