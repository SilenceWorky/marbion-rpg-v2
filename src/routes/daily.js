import {
  claimDaily
} from "../systems/daily.js";


function formatRemainingTime(ms) {
  const totalMinutes =
    Math.ceil(
      ms / 60000
    );

  const hours =
    Math.floor(
      totalMinutes / 60
    );

  const minutes =
    totalMinutes % 60;


  if (hours <= 0) {
    return `${minutes} min`;
  }


  if (minutes === 0) {
    return `${hours}h`;
  }


  return `${hours}h ${minutes}min`;
}


export async function dailyRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const user =
    url.searchParams.get("user");


  const result =
    await claimDaily(
      env,
      user
    );


  if (!result.ok) {
    if (
      result.error ===
      "INVALID_USER"
    ) {
      return new Response(
        "❌ Usuário não informado.",
        {
          status: 400
        }
      );
    }


    if (
      result.error ===
      "CHARACTER_NOT_FOUND"
    ) {
      return new Response(
        `@${result.user}, você ainda não possui um personagem. Use !raça primeiro.`
      );
    }


    if (
      result.error ===
      "DAILY_COOLDOWN"
    ) {
      const remaining =
        formatRemainingTime(
          result.remainingMs
        );


      return new Response(
        `@${result.user}, você já coletou sua recompensa diária. Tente novamente em ${remaining}.`
      );
    }


    return new Response(
      "❌ Não foi possível coletar a recompensa diária.",
      {
        status: 400
      }
    );
  }


  if (result.levelsGained > 0) {
    return new Response(
      `@${result.user}, recompensa diária coletada: +${result.xpGained} XP! Você subiu ${result.levelsGained} nível(is) e agora está no nível ${result.level}. XP: ${result.xp}/${result.xpNeeded} | Pontos de status: ${result.statusPoints}`
    );
  }


  return new Response(
    `@${result.user}, recompensa diária coletada: +${result.xpGained} XP! XP: ${result.xp}/${result.xpNeeded}`
  );
}