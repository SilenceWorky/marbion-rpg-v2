import {
  getProfile
} from "../core/database.js";

import {
  spendPlayerStatusPoints
} from "../systems/stat-points.js";


const STAT_NAMES = {
  strength: "Força",
  magicStrength: "Força Mágica",
  speed: "Velocidade",
  evasion: "Evasão",
  accuracy: "Precisão",
  defense: "Defesa"
};


function normalizeUser(user) {
  return String(user ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function formatStats(
  user,
  profile
) {
  return (
    `@${user} | ` +
    `Pontos: ${profile.statusPoints} | ` +
    `Força: ${profile.strength} | ` +
    `Força Mágica: ${profile.magicStrength} | ` +
    `Velocidade: ${profile.speed} | ` +
    `Evasão: ${profile.evasion} | ` +
    `Precisão: ${profile.accuracy} | ` +
    `Defesa: ${profile.defense}`
  );
}


export async function statusRoute(
  request,
  env
) {
  const url =
    new URL(request.url);


  const user =
    normalizeUser(
      url.searchParams.get("user")
    );


  if (!user) {
    return new Response(
      "❌ Usuário não informado.",
      {
        status: 400
      }
    );
  }


  const stat =
    url.searchParams.get("stat");

  const isQuery =
    !stat ||
    stat.toLowerCase() === "consulta";

  /*
   * Sem atributo:
   * apenas consulta o status.
   */
  if (isQuery) {
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


    return new Response(
      formatStats(
        user,
        profile
      )
    );
  }


  /*
   * Com atributo:
   * tenta gastar pontos.
   *
   * Se amount não existir,
   * o padrão é 1.
   */
  const rawAmount =
    url.searchParams.get("amount");

  const amount =
    rawAmount === null ||
    rawAmount.trim() === ""
      ? 1
      : Number(rawAmount);


  const result =
    await spendPlayerStatusPoints(
      env,
      user,
      stat,
      amount
    );


  if (!result.ok) {
    if (
      result.error ===
      "CHARACTER_NOT_FOUND"
    ) {
      return new Response(
        `@${user}, você ainda não possui um personagem. Use !raça primeiro.`
      );
    }


    if (
      result.error ===
      "INVALID_STAT"
    ) {
      return new Response(
        `@${user}, atributo inválido. Use: força, força mágica, velocidade, evasão, precisão ou defesa.`
      );
    }


    if (
      result.error ===
      "INVALID_AMOUNT"
    ) {
      return new Response(
        `@${user}, informe uma quantidade válida de pontos.`
      );
    }


    if (
      result.error ===
      "NOT_ENOUGH_POINTS"
    ) {
      return new Response(
        `@${user}, você possui apenas ${result.available} ponto(s) de status.`
      );
    }


    return new Response(
      "❌ Não foi possível distribuir os pontos de status.",
      {
        status: 400
      }
    );
  }


  const statName =
    STAT_NAMES[result.stat] ??
    result.stat;


  return new Response(
    `@${user}, +${result.amountSpent} em ${statName}. ${statName}: ${result.newValue} | Pontos restantes: ${result.statusPoints}`
  );
}