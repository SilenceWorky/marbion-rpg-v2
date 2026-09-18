import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  getChestGroups
} from "../systems/chest-inventory.js";

import {
  attemptChestOpen
} from "../systems/chest-open-service.js";

import {
  applyResolvedAtomicChestRewards
} from "../systems/atomic-chest-reward-apply.js";


const CHESTS_PER_PAGE =
  5;


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeCommand(
  value
) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function parsePage(
  rawArgs
) {
  const args =
    String(rawArgs ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (args.length === 0) {
    return {
      ok: true,
      page: 1
    };
  }

  let rawPage =
    args[0];

  if (
    normalizeCommand(
      args[0]
    ) === "pagina"
  ) {
    rawPage =
      args[1];

    if (
      args.length !== 2
    ) {
      return {
        ok: false
      };
    }
  }
  else if (
    args.length !== 1
  ) {
    return {
      ok: false
    };
  }

  const page =
    Number(
      rawPage
    );

  if (
    !Number.isSafeInteger(page) ||
    page <= 0
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    page
  };
}




function formatAtomicAtoms(
  atoms
) {
  const count =
    Math.max(
      1,
      Math.floor(
        Number(atoms) || 1
      )
    );

  return "⚛".repeat(
    count
  );
}


async function handleOpenCommand(
  env,
  user,
  profile,
  args
) {
  if (
    args.length !== 2
  ) {
    return new Response(
      `@${user}, uso: !baú abrir <número>`
    );
  }

  const selection =
    Number(
      args[1]
    );

  if (
    !Number.isSafeInteger(
      selection
    ) ||
    selection <= 0
  ) {
    return new Response(
      `@${user}, informe um número de baú válido. Ex.: !baú abrir 1`
    );
  }

  const result =
    attemptChestOpen(
      profile,
      selection
    );

  if (!result.ok) {
    if (
      result.error ===
        "CHEST_GROUP_NOT_FOUND"
    ) {
      return new Response(
        `@${user}, esse número de baú não existe na sua lista.`
      );
    }

    if (
      result.error ===
        "CHEST_OPEN_NOT_IMPLEMENTED"
    ) {
      return new Response(
        `@${user}, a abertura desse tipo de baú ainda não está implementada.`
      );
    }

    return new Response(
      `@${user}, não foi possível tentar abrir esse baú.`
    );
  }

  if (
    result.action === "open" &&
    result.pending
  ) {
    const applied =
      applyResolvedAtomicChestRewards(
        profile,
        result.chestId
      );

    /*
     * Mesmo se a aplicação falhar, o pendingOpen já contém o
     * plano congelado e precisa ser persistido para impedir
     * qualquer reroll posterior.
     */
    await saveProfile(
      env,
      user,
      profile
    );

    if (!applied.ok) {
      return new Response(
        `@${user}, a abertura foi registrada, mas não foi possível aplicar as recompensas resolvidas agora.`
      );
    }

    return new Response(
      `📦 @${user}, o Baú Atômico ${formatAtomicAtoms(result.currentAtoms)} abriu! As recompensas disponíveis foram aplicadas e a abertura ficou registrada com segurança.`
    );
  }

  /*
   * Tentativas sem resultado e evoluções alteram o estado
   * interno do baú e também precisam ser persistidas.
   */
  await saveProfile(
    env,
    user,
    profile
  );

  if (
    result.action === "nothing"
  ) {
    return new Response(
      `📦 @${user}, o Baú Atômico ${formatAtomicAtoms(result.currentAtoms)} não abriu nem evoluiu nesta tentativa. Tentativa ${result.attemptNumber}/3.`
    );
  }

  if (
    result.action === "evolve"
  ) {
    return new Response(
      `⚛️ @${user}, seu Baú Atômico evoluiu de ${formatAtomicAtoms(result.fromAtoms)} para ${formatAtomicAtoms(result.currentAtoms)}.`
    );
  }

  return new Response(
    `@${user}, resultado de abertura não reconhecido.`
  );
}


function formatChestGroup(
  group,
  number
) {
  const atomicMarker =
    group.type === "atomic"
      ? " ⚛"
      : "";

  return (
    `${number}. ${group.label}${atomicMarker} ×${group.quantity}`
  );
}


export async function chestRoute(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const user =
    normalizeUser(
      url.searchParams.get(
        "user"
      )
    );

  if (!user) {
    return new Response(
      "❌ Usuário não informado.",
      {
        status: 400
      }
    );
  }

  const profile =
    await getProfile(
      env,
      user
    );

  if (
    !profile ||
    !profile.race
  ) {
    return new Response(
      `@${user}, você ainda não possui um personagem. Use !raça primeiro.`
    );
  }

  const rawArgs =
    String(
      url.searchParams.get(
        "args"
      ) ?? ""
    ).trim();

  const args =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  if (
    args.length > 0 &&
    normalizeCommand(
      args[0]
    ) === "abrir"
  ) {
    return handleOpenCommand(
      env,
      user,
      profile,
      args
    );
  }

  const parsedPage =
    parsePage(
      rawArgs
    );

  if (!parsedPage.ok) {
    return new Response(
      `@${user}, uso: !baú | !baú página 2 | !baú abrir <número>`
    );
  }

  const result =
    getChestGroups(
      profile
    );

  if (!result.ok) {
    return new Response(
      `@${user}, não foi possível consultar seus baús.`
    );
  }

  if (
    result.groups.length === 0
  ) {
    return new Response(
      `📦 @${user}, você não possui baús.`
    );
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        result.groups.length /
        CHESTS_PER_PAGE
      )
    );

  if (
    parsedPage.page >
      totalPages
  ) {
    return new Response(
      `@${user}, página inexistente. Seus baús possuem ${totalPages} página(s).`
    );
  }

  const start =
    (
      parsedPage.page - 1
    ) *
    CHESTS_PER_PAGE;

  const pageGroups =
    result.groups.slice(
      start,
      start +
      CHESTS_PER_PAGE
    );

  const entries =
    pageGroups.map(
      (group, index) =>
        formatChestGroup(
          group,
          start + index + 1
        )
    );

  return new Response(
    `📦 Baús de @${user} ┃ ${entries.join(" ┃ ")} ┃ Página ${parsedPage.page}/${totalPages}`
  );
}
