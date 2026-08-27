import {
  getProfile
} from "../core/database.js";


export async function profileRoute(
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


  const profile =
    await getProfile(
      env,
      user
    );


  if (!profile || !profile.race) {
    return new Response(
      `@${user}, você ainda não possui um personagem. Use !raça primeiro.`
    );
  }


  const elements =
    Array.isArray(profile.elements) &&
    profile.elements.length > 0
      ? profile.elements.join(" + ")
      : "Não despertado";


  return new Response(
    `@${user} | Raça: ${profile.race} | Elemento: ${elements} | Nível: ${profile.level} | XP: ${profile.xp}`
  );
}