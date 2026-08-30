import {
  getProfile
} from "../core/database.js";

import {
  getDisplayRank
} from "../systems/pvp-ranking.js";


export async function rankRoute(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );


  const rawUser =
    url.searchParams.get(
      "user"
    );


  const user =
    String(
      rawUser ?? ""
    )
      .trim()
      .replace(
        /^@/,
        ""
      )
      .toLowerCase();


  if (!user) {
    return new Response(
      "❌ Usuário não informado."
    );
  }


  const profile =
    await getProfile(
      env,
      user
    );


  if (
    !profile?.race
  ) {
    return new Response(
      `@${user}, você ainda não possui um personagem.`
    );
  }


  const pvp =
    profile.pvp;


  const rank =
    getDisplayRank(
      profile
    );


  return new Response(
    `⚔️ @${user} | Elo: ${rank} | ` +
    `XP de Combate: ${pvp.rating} | ` +
    `Vitórias: ${pvp.wins} | ` +
    `Derrotas: ${pvp.losses} | ` +
    `PvPs: ${pvp.duels} | ` +
    `Sequência: ${pvp.streak} | ` +
    `Melhor sequência: ${pvp.bestStreak}`
  );
}