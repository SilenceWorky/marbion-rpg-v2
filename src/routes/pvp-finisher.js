import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  equipPvpFinisher,
  getPvpFinisherCollection,
  unequipPvpFinisher
} from "../systems/pvp-finisher-collection.js";


const FINISHERS_PER_PAGE = 5;


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


function parsePositiveInteger(
  value
) {
  const number =
    Number(value);

  return (
    Number.isSafeInteger(number) &&
    number > 0
  )
    ? number
    : null;
}


function sameIdentity(
  entry,
  identity
) {
  return (
    String(entry?.seasonId ?? "") ===
      String(identity?.seasonId ?? "") &&
    String(entry?.finisherId ?? "") ===
      String(identity?.finisherId ?? "")
  );
}


function formatFinisher(
  finisher,
  number,
  equipped
) {
  const active =
    sameIdentity(
      finisher,
      equipped
    )
      ? " [ATIVO]"
      : "";

  const name =
    String(
      finisher?.name ??
      finisher?.finisherId ??
      "Finalizador"
    ).trim();

  const seasonId =
    String(
      finisher?.seasonId ??
      ""
    ).trim();

  return (
    number + ". " + name +
    (
      seasonId
        ? " (" + seasonId + ")"
        : ""
    ) +
    active
  );
}


export async function pvpFinisherRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

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
      "@" + user +
      ", você ainda não possui um personagem. Use !raça primeiro."
    );
  }

  const collection =
    getPvpFinisherCollection(
      profile
    );

  if (!collection.ok) {
    return new Response(
      "@" + user +
      ", não foi possível consultar seus Finalizadores PvP."
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

  const action =
    normalizeCommand(
      args[0] ?? ""
    );

  if (action === "equipar") {
    if (
      args.length !== 2
    ) {
      return new Response(
        "@" + user +
        ", uso: !finalizador equipar <número>"
      );
    }

    const selection =
      parsePositiveInteger(
        args[1]
      );

    if (
      !selection ||
      selection >
        collection.owned.length
    ) {
      return new Response(
        "@" + user +
        ", informe o número de um Finalizador que você possui. Use !finalizador para listar."
      );
    }

    const selected =
      collection.owned[
        selection - 1
      ];

    const equipped =
      equipPvpFinisher(
        profile,
        selected.seasonId,
        selected.finisherId
      );

    if (!equipped.ok) {
      return new Response(
        "@" + user +
        ", não foi possível equipar esse Finalizador PvP."
      );
    }

    await saveProfile(
      env,
      user,
      profile
    );

    return new Response(
      "🏁 @" + user +
      ", Finalizador PvP ativo: " +
      equipped.finisher.name + "."
    );
  }

  if (action === "desequipar") {
    if (
      args.length !== 1
    ) {
      return new Response(
        "@" + user +
        ", uso: !finalizador desequipar"
      );
    }

    const unequipped =
      unequipPvpFinisher(
        profile
      );

    if (!unequipped.ok) {
      return new Response(
        "@" + user +
        ", não foi possível desequipar seu Finalizador PvP."
      );
    }

    await saveProfile(
      env,
      user,
      profile
    );

    return new Response(
      unequipped.changed
        ? "🏁 @" + user +
          ", Finalizador PvP desequipado."
        : "@" + user +
          ", você não possui Finalizador PvP equipado."
    );
  }

  let page = 1;

  if (args.length > 0) {
    if (
      action === "pagina" &&
      args.length === 2
    ) {
      page =
        parsePositiveInteger(
          args[1]
        );
    }
    else if (
      args.length === 1
    ) {
      page =
        parsePositiveInteger(
          args[0]
        );
    }
    else {
      page = null;
    }

    if (!page) {
      return new Response(
        "@" + user +
        ", uso: !finalizador | !finalizador página 2 | !finalizador equipar <número> | !finalizador desequipar"
      );
    }
  }

  if (
    collection.owned.length === 0
  ) {
    return new Response(
      "🏁 @" + user +
      ", você ainda não possui Finalizadores PvP."
    );
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        collection.owned.length /
        FINISHERS_PER_PAGE
      )
    );

  if (page > totalPages) {
    return new Response(
      "@" + user +
      ", página inexistente. Seus Finalizadores possuem " +
      totalPages + " página(s)."
    );
  }

  const start =
    (
      page - 1
    ) *
    FINISHERS_PER_PAGE;

  const entries =
    collection.owned
      .slice(
        start,
        start +
          FINISHERS_PER_PAGE
      )
      .map(
        (finisher, index) =>
          formatFinisher(
            finisher,
            start + index + 1,
            collection.equipped
          )
      );

  return new Response(
    "🏁 Finalizadores PvP de @" +
    user + " ┃ " +
    entries.join(" ┃ ") +
    " ┃ Página " +
    page + "/" +
    totalPages
  );
}
