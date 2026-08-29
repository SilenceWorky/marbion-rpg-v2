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


export async function attackRoute(
  request,
  env
) {
  const url =
    new URL(request.url);


  const user =
    url.searchParams.get(
      "user"
    );

  const slot =
    url.searchParams.get(
      "slot"
    );


  if (!user) {
    return new Response(
      "❌ Usuário não informado."
    );
  }


  if (!slot) {
    return new Response(
      `@${user}, uso: !ataque 1-4`
    );
  }


  const coordinator =
    getCoordinator(
      env
    );


  const internalUrl =
    new URL(
      "https://pvp.internal/action"
    );


  internalUrl.searchParams.set(
    "user",
    user
  );

  internalUrl.searchParams.set(
    "slot",
    slot
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
      "INVALID_SLOT"
    ) {
      return new Response(
        `@${user}, escolha uma habilidade de 1 a 4.`
      );
    }


    if (
      result.error ===
      "NOT_IN_BATTLE"
    ) {
      return new Response(
        `@${user}, você não está em uma batalha PvP.`
      );
    }


    if (
      result.error ===
      "ACTION_ALREADY_SELECTED"
    ) {
      return new Response(
        `@${user}, você já escolheu a habilidade ${result.slot} neste turno. Aguarde seu adversário.`
      );
    }


    if (
      result.error ===
      "PLAYER_NOT_FOUND"
    ) {
      return new Response(
        `@${user}, não foi possível encontrar um dos personagens da batalha.`
      );
    }


    if (
      result.error ===
      "SKILL_NOT_FOUND"
    ) {
      return new Response(
        `❌ Uma das habilidades da batalha não foi encontrada. As escolhas deste turno foram canceladas.`
      );
    }


    return new Response(
      `❌ Não foi possível registrar o ataque.`
    );
  }


  /*
   * Apenas um jogador escolheu.
   *
   * Não revelamos a habilidade real.
   */
  if (
    result.waiting === true
  ) {
    return new Response(
      `⚔️ @${result.user} escolheu a habilidade ${result.slot}. Aguardando @${result.opponent}.`
    );
  }


  /*
   * Os dois já escolheram.
   *
   * Agora podemos revelar
   * as habilidades.
   */
    function formatExecution(
    execution,
    hpData
    ) {
    if (!execution) {
        return "";
    }


    if (!execution.hit) {
        return (
        `@${execution.attacker} usou ${execution.skill}, ` +
        `mas errou.`
        );
    }


    const defenderHp =
        hpData.player1.user ===
        execution.defender
        ? hpData.player1
        : hpData.player2;


    return (
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${defenderHp.current}/${defenderHp.max}.`
    );
    }


    const firstText =
    formatExecution(
        result.firstExecution,
        result.hp
    );

    const secondText =
    formatExecution(
        result.secondExecution,
        result.hp
    );


    let message =
    `⚔️ Turno ${result.turn} | ` +
    `@${result.player1.user}: ${result.player1.skill} | ` +
    `@${result.player2.user}: ${result.player2.skill} | ` +
    firstText;


    if (secondText) {
    message +=
        ` ${secondText}`;
    }


    if (
    result.battleOver
    ) {
    message +=
        ` 🏆 @${result.winner} venceu o PvP!`;

    return new Response(
        message
    );
    }


    message +=
    ` | Turno ${result.nextTurn} iniciado.`;


    return new Response(
    message
    );
}