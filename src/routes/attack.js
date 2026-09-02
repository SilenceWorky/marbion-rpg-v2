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
      "SILENCED_SKILL"
    ) {
      return new Response(
        `@${user}, você está Silenciado por ${result.source || "Silêncio"}. ` +
        `Enquanto durar, use Soco, uma habilidade Física ou !meditar.`
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

    function getDotInfo(
      type
    ) {
      const normalized =
        String(
          type ?? ""
        )
          .trim()
          .toLowerCase();


      const dots = {
        veneno: {
          name: "Veneno",
          icon: "☠️"
        },

        queimadura: {
          name: "Queimadura",
          icon: "🔥"
        },

        sangramento: {
          name: "Sangramento",
          icon: "🩸"
        },

        radiacao: {
          name: "Radiação",
          icon: "☢️"
        },

        deterioracao: {
          name: "Deterioração",
          icon: "🧬"
        },

        lava: {
          name: "Lava",
          icon: "🌋"
        }
      };


      return (
        dots[normalized] || {
          name:
            normalized ||
            "Dano periódico",

          icon:
            "💥"
        }
      );
    }

    function getControlInfo(
      type
    ) {
      const normalized =
        String(
          type ?? ""
        )
          .trim()
          .toLowerCase();

      const controls = {
        paralisia: {
          name: "Paralisia",
          adjective: "Paralisado",
          icon: "⚡"
        },

        paralysis: {
          name: "Paralisia",
          adjective: "Paralisado",
          icon: "⚡"
        },

        congelamento: {
          name: "Congelamento",
          adjective: "Congelado",
          icon: "❄️"
        },

        freeze: {
          name: "Congelamento",
          adjective: "Congelado",
          icon: "❄️"
        },

        atordoamento: {
          name: "Atordoamento",
          adjective: "Atordoado",
          icon: "💫"
        }
      };

      return (
        controls[normalized] || {
          name:
            normalized ||
            "Controle",

          adjective:
            "Imobilizado",

          icon:
            "⛔"
        }
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
      "confusion_self_hit"
    ) {
      const playerHpData =
        hpData.player1.user ===
        execution.attacker
          ? hpData.player1
          : hpData.player2;


      const source =
        execution.confusion?.source
          ? ` por ${execution.confusion.source}`
          : "";


      return (
        `😵 @${execution.attacker} se confundiu${source}, ` +
        `se feriu em ${execution.damage} de dano e perdeu a ação ` +
        `que usaria ${execution.skill}. ` +
        `HP: ${execution.hpAfter}/${playerHpData.max}.`
      );
    }


    if (
      execution.kind ===
      "silence_blocked"
    ) {
      const source =
        execution.silence?.source
          ? ` por ${execution.silence.source}`
          : "";

      return (
        `🤐 @${execution.attacker} tentou usar ${execution.skill}, ` +
        `mas está Silenciado${source} e não conseguiu usar a habilidade por causa do Silêncio.`
      );
    }


    if (
      execution.kind ===
      "control_blocked"
    ) {
      const info =
        getControlInfo(
          execution.control?.type
        );

      const source =
        execution.control?.source
          ? ` por ${execution.control.source}`
          : "";

      return (
        `${info.icon} @${execution.attacker} tentou usar ` +
        `${execution.skill}, mas ficou ${info.adjective}${source} ` +
        `e perdeu a ação.`
      );
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
      "silence"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.silenceApplied &&
        execution.silence
      ) {
        text +=
          ` 🤐 @${execution.defender} ficou Silenciado: ` +
          `apenas habilidades Físicas e Meditação ` +
          `por ${execution.silence.duration} turnos.`;
      }


      return text;
    }


    if (
      execution.kind ===
      "confusion"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.confusionApplied &&
        execution.confusion
      ) {
        text +=
          ` 😵 @${execution.defender} ficou Confuso por ` +
          `${execution.confusion.duration} ações: ` +
          `50% de chance de agir normalmente e 50% de chance ` +
          `de se ferir e perder a ação.`;
      }


      return text;
    }


    if (
      execution.kind ===
      "slow"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.slowApplied &&
        execution.slow
      ) {
        text +=
          ` 🐌 @${execution.defender} ficou Lento: ` +
          `Velocidade -${execution.slow.amount} ` +
          `por ${execution.slow.duration} turnos.`;
      }


      return text;
    }


    if (
      execution.kind ===
      "blindness"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.blindnessApplied &&
        execution.blindness
      ) {
        text +=
          ` \u{1F311} @${execution.defender} ficou Cego: ` +
          `Precis\u00E3o -${execution.blindness.amount} ` +
          `por ${execution.blindness.duration} turnos.`;
      }


      return text;
    }

    if (
      execution.kind ===
      "poison"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
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


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}.`;


      /*
      * Debuff associado ao Veneno.
      */
      if (
        execution.debuffApplied &&
        execution.debuff
      ) {
        const statName =
          statNames[
            execution.debuff.stat
          ] ||
          execution.debuff.stat;


        text +=
          ` Reduziu ${statName} em ` +
          `${execution.debuff.amount} por ` +
          `${execution.debuff.duration} turnos.`;
      }


      /*
      * Envenenamento periódico.
      */
      if (
        execution.poisonApplied &&
        execution.poison
      ) {
        text +=
          ` ☠️ @${execution.defender} ficou Envenenado: ` +
          `${execution.poison.damagePerTurn} de dano por turno ` +
          `por ${execution.poison.duration} turnos.`;
      }


      return text;
    }

    /*
     * ==============================
     * QUEIMADURA
     * ==============================
     */
    if (
      execution.kind ===
      "burn"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      /*
       * HP imediatamente depois
       * do golpe, antes dos ticks
       * do próximo turno.
       */
      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.burnApplied &&
        execution.burn
      ) {
        text +=
          ` 🔥 @${execution.defender} ficou Queimado: ` +
          `${execution.burn.damagePerTurn} de dano por turno ` +
          `por ${execution.burn.duration} turnos.`;
      }


      return text;
    }

    /*
     * ==============================
     * SANGRAMENTO
     * ==============================
     */
    if (
      execution.kind ===
      "bleed"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.bleedApplied &&
        execution.bleed
      ) {
        text +=
          ` 🩸 @${execution.defender} ficou Sangrando: ` +
          `${execution.bleed.damagePerTurn} de dano por turno ` +
          `por ${execution.bleed.duration} turnos.`;
      }


      return text;
    }

      /*
      * ==============================
      * CONTROLE OFENSIVO
      * ==============================
      */
    if (
      execution.kind ===
        "paralysis" ||
      execution.kind ===
        "freeze" ||
      execution.kind ===
        "stun"
    ) {
        if (!execution.hit) {
          return (
            `@${execution.attacker} usou ${execution.skill}, ` +
            `mas errou.`
          );
        }

        const defenderHpData =
          hpData.player1.user ===
          execution.defender
            ? hpData.player1
            : hpData.player2;

        const hpAfterExecution =
          Number.isFinite(
            Number(
              execution.defenderHp
            )
          )
            ? Number(
                execution.defenderHp
              )
            : defenderHpData.current;

        let text =
          `@${execution.attacker} usou ${execution.skill} ` +
          `e causou ${execution.damage} de dano em ` +
          `@${execution.defender}. ` +
          `HP: ${hpAfterExecution}/${defenderHpData.max}.`;

        if (
          execution.controlApplied &&
          execution.control
        ) {
          const info =
            getControlInfo(
              execution.control.type
            );

          text +=
            ` ${info.icon} @${execution.defender} ficou ` +
            `${info.adjective} e perderá ` +
            `${execution.control.remainingBlocks} ação(ões).`;
        }

        return text;
      }

    if (
      execution.kind ===
      "debuff"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      if (
        !execution.debuffApplied
      ) {
        return (
          `@${execution.attacker} usou ${execution.skill} ` +
          `e causou ${execution.damage} de dano em ` +
          `@${execution.defender}, mas o Debuff não pôde ser aplicado.`
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
          execution.debuff.stat
        ] ||
        execution.debuff.stat;


      return (
        `@${execution.attacker} usou ${execution.skill}, ` +
        `causou ${execution.damage} de dano em ` +
        `@${execution.defender} e reduziu ` +
        `${statName} em ${execution.debuff.amount} ` +
        `por ${execution.debuff.duration} turnos.`
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


    const defenderHpData =
      hpData.player1.user ===
      execution.defender
        ? hpData.player1
        : hpData.player2;


    /*
    * Mostra o HP imediatamente
    * após ESTA ação.
    *
    * Não o HP final depois de
    * Veneno ou outros efeitos
    * do início do próximo turno.
    */
    const hpAfterExecution =
      Number.isFinite(
        Number(
          execution.defenderHp
        )
      )
        ? Number(
            execution.defenderHp
          )
        : defenderHpData.current;


    return (
      `@${execution.attacker} usou ${execution.skill} ` +
      `e causou ${execution.damage} de dano em ` +
      `@${execution.defender}. ` +
      `HP: ${hpAfterExecution}/${defenderHpData.max}.`
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

    const dotText =
      Array.isArray(
        result.dotTicks
      )
        ? result.dotTicks
            .map(
              tick => {
                const info =
                  getDotInfo(
                    tick.type
                  );


                return (
                  `${info.icon} Início do Turno ${Number(result.turn) + 1}: ` +
                  `@${tick.user} sofreu ${tick.damage} de dano por ${tick.source}. ` +
                  `HP: ${tick.hpAfter}/${tick.maxHp}.`
                );
              }
            )
            .join(" ")
        : "";

    let message =
    `⚔️ Turno ${result.turn} | ` +
    `@${result.player1.user}: ${result.player1.skill} | ` +
    `@${result.player2.user}: ${result.player2.skill} | ` +
    firstText;


    if (secondText) {
    message +=
        ` ${secondText}`;
    }

    if (dotText) {
      message +=
        ` ${dotText}`;
    }

    /*
     * ==============================
     * CAUSA DA DERROTA POR DoT
     * ==============================
     */
    const dotDefeats =
      result.dotDefeats || {};


    const defeatedByDot =
      [
        dotDefeats.player1,
        dotDefeats.player2
      ]
        .filter(Boolean);


    let dotDefeatText =
      "";


    if (
      defeatedByDot.length === 1
    ) {
      const defeat =
        defeatedByDot[0];

      const info =
        getDotInfo(
          defeat.type
        );


      dotDefeatText =
        ` 💀 @${defeat.user} foi derrotado por ` +
        `${info.icon} ${info.name} no início do turno.`;
    }


    else if (
      defeatedByDot.length === 2
    ) {
      const first =
        defeatedByDot[0];

      const second =
        defeatedByDot[1];


      const firstInfo =
        getDotInfo(
          first.type
        );

      const secondInfo =
        getDotInfo(
          second.type
        );


      /*
       * Os dois caíram pelo mesmo
       * tipo de efeito.
       */
      if (
        String(
          first.type
        ).toLowerCase() ===
        String(
          second.type
        ).toLowerCase()
      ) {
        dotDefeatText =
          ` 💀 @${first.user} e @${second.user} foram derrotados por ` +
          `${firstInfo.icon} ${firstInfo.name} no início do turno.`;
      }


      /*
       * Cada jogador caiu por
       * uma causa diferente.
       */
      else {
        dotDefeatText =
          ` 💀 @${first.user} foi derrotado por ` +
          `${firstInfo.icon} ${firstInfo.name} e ` +
          `@${second.user} foi derrotado por ` +
          `${secondInfo.icon} ${secondInfo.name} no início do turno.`;
      }
    }


    if (dotDefeatText) {
      message +=
        dotDefeatText;
    }

    if (
    result.battleOver
    ) {

    if (
      result.draw
    ) {
      message +=
        ` O PvP terminou em empate.`;


      return new Response(
        message
      );
    }

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