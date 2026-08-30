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
      "MENTALIDADE_FULL"
    ) {
      return new Response(
        `@${user}, sua Mentalidade já está cheia: ` +
        `${result.currentMentalidade}/${result.maxMentalidade}.`
      );
    }


    if (
      result.error ===
      "MEDITATION_COOLDOWN"
    ) {
      return new Response(
        `@${user}, você ainda não pode meditar. ` +
        `Aguarde ${result.turnsRemaining} turno(s).`
      );
    }

    if (
      result.error ===
      "INSUFFICIENT_MENTALIDADE"
    ) {
      return new Response(
        `@${user}, você não possui Mentalidade suficiente para a habilidade ${result.slot}. ` +
        `Necessário: ${result.requiredMentalidade} | Atual: ${result.currentMentalidade}.`
      );
    }

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

      if (
        result.meditating
      ) {
        return new Response(
          `🧘 @${result.user} começou a meditar. ` +
          `Aguardando @${result.opponent}.`
        );
      }

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

    if (
      execution.kind ===
      "heal"
    ) {
      return (
        `@${execution.user} usou ${execution.skill} ` +
        `e recuperou ${execution.healing} de HP. ` +
        `HP: ${execution.hpAfter}/${execution.maxHp}.`
      );
    }

    if (
      execution.kind ===
      "buff"
    ) {
      if (
        execution.ok === false
      ) {
        return (
          `@${execution.user} usou ${execution.skill}, ` +
          `mas o buff não pôde ser aplicado.`
        );
      }


      const statNames = {
        strength: "Força",
        magicStrength: "Magia",
        speed: "Velocidade",
        evasion: "Evasão",
        accuracy: "Precisão",
        defense: "Defesa"
      };


      const statName =
        statNames[
          execution.stat
        ] ||
        execution.stat;


      return (
        `@${execution.user} usou ${execution.skill} ` +
        `e recebeu +${execution.amount} de ${statName} ` +
        `por ${execution.duration} turnos.`
      );
    }

    if (
      execution.kind ===
      "meditate"
    ) {
      return (
        `🧘 @${execution.user} meditou e recuperou ` +
        `${execution.recovered} de Mentalidade. ` +
        `Mentalidade: ${execution.after}/${execution.maxMentalidade}.`
      );
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


    const ranked =
        result.rankedResult;


    if (
        ranked?.ok
    ) {
        message +=
        ` | XP de Combate: ` +
        `@${result.winner} +${ranked.change} → ${ranked.winner.after} ` +
        `[${ranked.winner.rank}] | ` +
        `@${result.loser} -${ranked.change} → ${ranked.loser.after} ` +
        `[${ranked.loser.rank}] | ` +
        `Sequência: ${ranked.winner.streak}`;
    }

    else {
        message +=
        ` | ⚠️ O resultado da luta foi salvo, mas o ranking não pôde ser atualizado.`;
    }


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