import {
  getProfile
} from "../core/database.js";

import {
  getChestGroups
} from "../systems/chest-inventory.js";


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

  const parsedPage =
    parsePage(
      url.searchParams.get(
        "args"
      )
    );

  if (!parsedPage.ok) {
    return new Response(
      `@${user}, uso: !baú | !baú página 2`
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
