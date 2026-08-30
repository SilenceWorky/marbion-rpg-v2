import {
  isAdminUser
} from "../config/admins.js";

import {
  adminSetLevel,
  adminSetRace,
  adminSetElements,
  adminAddStatusPoints,
  adminSkill
} from "../systems/admin.js";


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
      `@${actor}, uso: !adm level/raça/elemento/skill ...`
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
  `@${actor}, comando ADM desconhecido. Use level, raça, elemento, pontos ou skill.`
);
}