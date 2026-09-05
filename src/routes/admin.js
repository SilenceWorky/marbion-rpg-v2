import {
  isAdminUser
} from "../config/admins.js";

import {
  adminSetLevel,
  adminSetRace,
  adminSetElements,
  adminAddStatusPoints,
  adminResetStatus,
  adminSkill
} from "../systems/admin.js";

import {
  adminModifyProfileResource,
  parseAdminResourceChange
} from "../systems/admin-resources.js";


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


export async function adminRoute(
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


  /*
   * PRIMEIRA PROTEÇÃO:
   * somente usuários cadastrados
   * como ADM.
   */
  if (
    !isAdminUser(
      actor
    )
  ) {
    return new Response(
      "❌ Você não possui permissão para usar comandos de ADM.",
      {
        status: 403
      }
    );
  }


  /*
   * SEGUNDA PROTEÇÃO:
   * chave secreta do Worker.
   */
  if (
    !env.MARBION_ADMIN_KEY ||
    adminKey !==
      env.MARBION_ADMIN_KEY
  ) {
    return new Response(
      "❌ Chave administrativa inválida.",
      {
        status: 403
      }
    );
  }


  if (!rawArgs) {
    return new Response(
      `@${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp/hp/mentalidade ...`
    );
  }


  const args =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);


  const command =
    normalizeCommand(
      args[0]
    );


  /*
   * ==========================
   * LEVEL
   * ==========================
   *
   * !adm level @user 20
   */
  if (
    command === "level"
  ) {
    const target =
      args[1];

    const level =
      args[2];


    if (
      !target ||
      !level
    ) {
      return new Response(
        `@${actor}, uso: !adm level @usuário número`
      );
    }


    const result =
      await adminSetLevel(
        env,
        target,
        level
      );


    if (!result.ok) {
      if (
        result.error ===
        "INVALID_LEVEL"
      ) {
        return new Response(
          `@${actor}, informe um nível válido maior ou igual a 1.`
        );
      }


      return new Response(
        `@${actor}, não foi possível alterar o nível.`
      );
    }


    return new Response(
      `✅ ADM | @${result.user} agora está no nível ${result.level}.`
    );
  }


  /*
   * ==========================
   * RAÇA
   * ==========================
   *
   * !adm raça @user Terrariano
   *
   * Também suporta:
   * !adm raca ...
   */
  if (
    command === "raca"
  ) {
    const target =
      args[1];

    const race =
      args
        .slice(2)
        .join(" ");


    if (
      !target ||
      !race
    ) {
      return new Response(
        `@${actor}, uso: !adm raça @usuário raça`
      );
    }


    const result =
      await adminSetRace(
        env,
        target,
        race
      );


    if (!result.ok) {
      if (
        result.error ===
        "RACE_NOT_FOUND"
      ) {
        return new Response(
          `@${actor}, essa raça não existe.`
        );
      }


      return new Response(
        `@${actor}, não foi possível alterar a raça.`
      );
    }


    return new Response(
      `✅ ADM | A raça de @${result.user} agora é ${result.race}.`
    );
  }


  /*
   * ==========================
   * ELEMENTO
   * ==========================
   *
   * !adm elemento @user Fogo
   * !adm elemento @user Fogo Terra
   */
  if (
    command === "elemento"
  ) {
    const target =
      args[1];

    const elements =
      args.slice(2);


    if (
      !target ||
      elements.length === 0
    ) {
      return new Response(
        `@${actor}, uso: !adm elemento @usuário elemento [elemento2]`
      );
    }


    const result =
      await adminSetElements(
        env,
        target,
        elements
      );


    if (!result.ok) {
      if (
        result.error ===
        "ELEMENT_NOT_FOUND"
      ) {
        return new Response(
          `@${actor}, o elemento "${result.element}" não existe.`
        );
      }


      if (
        result.error ===
        "INVALID_ELEMENT_COUNT"
      ) {
        return new Response(
          `@${actor}, informe 1 ou 2 elementos.`
        );
      }


      if (
        result.error ===
        "NEUTRAL_EXCLUSIVE"
      ) {
        return new Response(
          `@${actor}, Neutro é exclusivo e não pode coexistir com outro elemento.`
        );
      }


      return new Response(
        `@${actor}, não foi possível alterar os elementos.`
      );
    }


    return new Response(
      `✅ ADM | Elemento de @${result.user}: ${result.elements.join(" + ")}.`
    );
  }

  /*
   * ==========================
   * HP / MENTALIDADE
   * ==========================
   *
   * SET absoluto:
   * !adm hp @user 5
   * !adm mentalidade @user 20
   *
   * Ajuste relativo:
   * !adm hp @user +5
   * !adm hp @user -5
   * !adm hp @user + 5
   * !adm hp @user - 5
   * !adm mentalidade @user mais 10
   * !adm mentalidade @user menos 10
   */
  if (
    command === "hp" ||
    command === "mentalidade" ||
    command === "mental"
  ) {
    const target =
      args[1];

    const resource =
      command === "hp"
        ? "hp"
        : "mentalidade";

    const change =
      parseAdminResourceChange(
        args.slice(2)
      );


    if (
      !target ||
      !change.ok
    ) {
      const resourceName =
        resource === "hp"
          ? "hp"
          : "mentalidade";


      return new Response(
        `@${actor}, uso: !adm ${resourceName} @usuário 5 | +5 | -5 | + 5 | - 5`
      );
    }


    const coordinator =
      getCoordinator(
        env
      );

    const internalUrl =
      new URL(
        "https://pvp.internal/admin-resource"
      );


    internalUrl.searchParams.set(
      "user",
      normalizeUser(target)
    );

    internalUrl.searchParams.set(
      "resource",
      resource
    );

    internalUrl.searchParams.set(
      "mode",
      change.mode
    );

    internalUrl.searchParams.set(
      "amount",
      String(change.amount)
    );


    const battleResponse =
      await coordinator.fetch(
        new Request(
          internalUrl.toString()
        )
      );

    const battleResult =
      await battleResponse.json();


    if (!battleResult.ok) {
      return new Response(
        `@${actor}, não foi possível alterar ${resource === "hp" ? "o HP" : "a Mentalidade"}.`
      );
    }


    let result =
      battleResult;


    if (!battleResult.inBattle) {
      result =
        await adminModifyProfileResource(
          env,
          target,
          resource,
          change
        );
    }


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
        `@${actor}, não foi possível alterar ${resource === "hp" ? "o HP" : "a Mentalidade"}.`
      );
    }


    const operationText =
      result.mode === "set"
        ? `SET ${result.requestedAmount}`
        : result.requestedAmount >= 0
          ? `+${result.requestedAmount}`
          : String(
              result.requestedAmount
            );

    const scopeText =
      result.inBattle
        ? "PvP"
        : "perfil";

    const clampText =
      result.clamped
        ? " | limitado ao intervalo válido"
        : "";


    return new Response(
      `🛠️ ADM | @${result.user} | ${result.icon} ${result.label}: ${result.before} → ${result.after}/${result.max} | ${operationText} | ${scopeText}${clampText}.`
    );
  }


  /*
   * ==========================
   * STATUS RESET
   * ==========================
   *
   * !adm status reset @user
   *
   * Zera todos os Status Points guardados
   * e restaura os atributos de teste/base
   * definidos pelo ADM.
   */
  if (
    command === "status"
  ) {
    const operation =
      normalizeCommand(
        args[1]
      );

    const target =
      args[2];


    if (
      operation !== "reset" ||
      !target
    ) {
      return new Response(
        `@${actor}, uso: !adm status reset @usuário`
      );
    }


    const result =
      await adminResetStatus(
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
        `@${actor}, não foi possível resetar os Status de @${normalizeUser(target)}.`
      );
    }


    return new Response(
      `🛠️ ADM | Status de @${result.user} resetados. ` +
      `Pontos: 0 | Força: ${result.after.strength} | ` +
      `Força Mágica: ${result.after.magicStrength} | ` +
      `Velocidade: ${result.after.speed} | ` +
      `Evasão: ${result.after.evasion} | ` +
      `Precisão: ${result.after.accuracy} | ` +
      `Defesa: ${result.after.defense}.`
    );
  }


  /*
  * ==========================
  * PONTOS
  * ==========================
  *
  * !adm pontos @user 10
  */
  if (
    command === "pontos" ||
    command === "points" ||
    command === "statuspoints"
  ) {
    const target =
      args[1];

    const amount =
      args[2];


    if (
      !target ||
      !amount
    ) {
      return new Response(
        `@${actor}, uso: !adm pontos @usuário quantidade`
      );
    }


    const result =
      await adminAddStatusPoints(
        env,
        target,
        amount
      );


    if (!result.ok) {
      if (
        result.error ===
        "INVALID_STATUS_POINTS"
      ) {
        return new Response(
          `@${actor}, informe uma quantidade inteira maior que 0.`
        );
      }


      return new Response(
        `@${actor}, não foi possível adicionar Status Points.`
      );
    }


    return new Response(
      `✅ ADM | @${result.user} recebeu ${result.added} Status Points. ` +
      `Total disponível: ${result.statusPoints}.`
    );
  }

  /*
   * ==========================
   * PVP
   * ==========================
   *
   * !adm pvp empate
   * !adm pvp vitória @usuario
   */
  if (
    command === "pvp"
  ) {
    const operation =
      normalizeCommand(
        args[1]
      );


    if (!operation) {
      return new Response(
        `@${actor}, uso: !adm pvp empate | !adm pvp vitória @usuário`
      );
    }


    let mode;
    let winner = null;


    if (
      operation === "empate" ||
      operation === "draw"
    ) {
      mode =
        "draw";
    }

    else if (
      operation === "vitoria" ||
      operation === "win"
    ) {
      winner =
        normalizeUser(
          args[2]
        );


      if (!winner) {
        return new Response(
          `@${actor}, uso: !adm pvp vitória @usuário`
        );
      }


      mode =
        "win";
    }

    else {
      return new Response(
        `@${actor}, use !adm pvp empate ou !adm pvp vitória @usuário.`
      );
    }


    const coordinator =
      getCoordinator(
        env
      );


    const internalUrl =
      new URL(
        "https://pvp.internal/admin-finish"
      );


    internalUrl.searchParams.set(
      "mode",
      mode
    );


    if (winner) {
      internalUrl.searchParams.set(
        "winner",
        winner
      );
    }


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
        "NO_ACTIVE_BATTLE"
      ) {
        return new Response(
          `@${actor}, não existe nenhum PvP ativo.`
        );
      }


      if (
        result.error ===
        "MULTIPLE_ACTIVE_BATTLES"
      ) {
        return new Response(
          `@${actor}, existem múltiplos PvPs ativos; o empate ADM não encerrará uma luta arbitrariamente.`
        );
      }


      if (
        result.error ===
        "WINNER_NOT_IN_ACTIVE_BATTLE"
      ) {
        return new Response(
          `@${actor}, @${winner} não está em um PvP ativo.`
        );
      }


      if (
        result.error ===
        "MENTALIDADE_PERSIST_FAILED"
      ) {
        return new Response(
          `@${actor}, não foi possível preservar a Mentalidade dos jogadores. O PvP não foi encerrado.`
        );
      }


      return new Response(
        `@${actor}, não foi possível encerrar o PvP.`
      );
    }


    const mentalidadeText =
      `@${result.player1.user}: 🧠 ${result.player1.mentalidade}/${result.player1.maxMentalidade} | ` +
      `@${result.player2.user}: 🧠 ${result.player2.mentalidade}/${result.player2.maxMentalidade}`;


    const nextQueuedBattleText =
      result.nextQueuedBattle
        ? ` | ⚔️ Próximo PvP da fila iniciado: @${result.nextQueuedBattle.player1.user} VS @${result.nextQueuedBattle.player2.user} | Turno 1.`
        : "";


    if (
      result.mode ===
      "draw"
    ) {
      return new Response(
        `🛠️ ADM | PvP entre @${result.player1.user} e @${result.player2.user} encerrado em empate administrativo. ` +
        `Sem alteração de Elo/estatísticas. | ${mentalidadeText}${nextQueuedBattleText}`
      );
    }


    return new Response(
      `🛠️ ADM | PvP encerrado. @${result.winner} definido como vencedor administrativo sobre @${result.loser}. ` +
      `Sem alteração de Elo/estatísticas. | ${mentalidadeText}${nextQueuedBattleText}`
    );
  }


  /*
   * ==========================
   * SKILL
   * ==========================
   *
   * !adm skill @user add Chama Devastadora
   *
   * !adm skill @user rem Chama Devastadora
   */
  if (
    command === "skill"
  ) {
    const target =
      args[1];

    const operation =
      normalizeCommand(
        args[2]
      );

    const skillName =
      args
        .slice(3)
        .join(" ");


    if (
      !target ||
      !operation ||
      !skillName
    ) {
      return new Response(
        `@${actor}, uso: !adm skill @usuário add/rem habilidade`
      );
    }


    const result =
      await adminSkill(
        env,
        target,
        operation,
        skillName
      );


    if (!result.ok) {
      if (
        result.error ===
        "INVALID_SKILL_OPERATION"
      ) {
        return new Response(
          `@${actor}, use "add" para adicionar ou "rem" para remover.`
        );
      }


      if (
        result.error ===
        "SKILL_NOT_FOUND"
      ) {
        return new Response(
          `@${actor}, essa habilidade não existe no catálogo.`
        );
      }


      if (
        result.error ===
        "SKILL_ALREADY_OWNED"
      ) {
        return new Response(
          `@${result.user} já possui ${result.skill.nome}.`
        );
      }


      if (
        result.error ===
        "SKILL_NOT_OWNED"
      ) {
        return new Response(
          `@${result.user} não possui ${result.skill.nome}.`
        );
      }


      return new Response(
        `@${actor}, não foi possível alterar a habilidade.`
      );
    }


    if (
      result.operation ===
      "add"
    ) {
      return new Response(
        `✅ ADM | ${result.skill.nome} foi adicionada a @${result.user}.`
      );
    }


    return new Response(
      `✅ ADM | ${result.skill.nome} foi removida de @${result.user}.`
    );
  }


return new Response(
  `@${actor}, comando ADM desconhecido. Use level, raça, elemento, status, pontos, skill ou pvp.`
);
}