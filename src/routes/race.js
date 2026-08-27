import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  createBaseProfile
} from "../core/profile.js";

import {
  fetchJson
} from "../core/content.js";

import {
  weightedRandom
} from "../utils/random.js";

import {
  RACES_URL
} from "../config/urls.js";


export async function raceRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const rawUser =
    url.searchParams.get("user");

  if (!rawUser) {
    return new Response(
      "❌ Usuário não informado.",
      {
        status: 400
      }
    );
  }

  const user =
    rawUser
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  if (!user) {
    return new Response(
      "❌ Usuário inválido.",
      {
        status: 400
      }
    );
  }


  // Procura perfil existente
  let profile =
    await getProfile(
      env,
      user
    );


  // Se já possui raça,
  // não sorteia novamente
  if (profile?.race) {
    return new Response(
      `@${user}, sua raça já é ${profile.race}.`
    );
  }


  // Carrega as raças
  const races =
    await fetchJson(
      RACES_URL
    );


  // Sorteio ponderado
  const selectedRace =
    weightedRandom(
      races
    );


  if (!selectedRace) {
    return new Response(
      "❌ Não foi possível sortear uma raça.",
      {
        status: 500
      }
    );
  }


  const raceData =
    races[selectedRace];


  // Se o jogador ainda não existe,
  // cria o perfil oficial
  if (!profile) {
    profile =
      createBaseProfile(
        user
      );
  }


  // Salva a raça
  profile.race =
    selectedRace;


  await saveProfile(
    env,
    user,
    profile
  );


  return new Response(
    `@${user}, sua raça é ${raceData.emoji} ${selectedRace} | ${raceData.raridade}`
  );
}