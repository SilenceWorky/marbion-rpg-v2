import {
  getProfile
} from "../core/database.js";

import {
  getDisplayRank
} from "../systems/pvp-ranking.js";


function normalizeUser(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .split(/\s+/)[0]
    .replace(
      /^@/,
      ""
    )
    .toLowerCase();
}


export async function rankRoute(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );


  const requester =
    normalizeUser(
      url.searchParams.get(
        "user"
      )
    );

  const target =
    normalizeUser(
      url.searchParams.get(
        "target"
      )
    ) ||
    requester;


  if (!target) {
    return new Response(
      "❌ Usuário não informado."
    );
  }


  const profile =
    await getProfile(
      env,
      target
    );


  if (
    !profile?.race
  ) {
    return new Response(
      `@${target}, você ainda não possui um personagem.`
    );
  }


  const pvp =
    profile.pvp;


  const rank =
    getDisplayRank(
      profile
    );


  return new Response(
    `⚔️ @${target} | Elo: ${rank} | ` +
    `XP de Combate: ${pvp.rating} | ` +
    `Vitórias: ${pvp.wins} | ` +
    `Derrotas: ${pvp.losses} | ` +
    `PvPs: ${pvp.duels} | ` +
    `Sequência: ${pvp.streak} | ` +
    `Melhor sequência: ${pvp.bestStreak}`
  );
}
