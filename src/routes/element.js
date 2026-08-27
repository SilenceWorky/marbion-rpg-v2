import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  ELEMENTS_URL
} from "../config/urls.js";

import {
  rollElements
} from "../systems/elements.js";


export async function elementRoute(
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


  // Precisa ter usado !raça primeiro
  if (!profile || !profile.race) {
    return new Response(
      `@${user}, use !raça antes de despertar seu elemento.`
    );
  }


  // Não permite sortear novamente
  if (
    Array.isArray(profile.elements) &&
    profile.elements.length > 0
  ) {
    return new Response(
      `@${user}, seu elemento já é ${profile.elements.join(" + ")}.`
    );
  }


  const elementsData =
    await fetchJson(
      ELEMENTS_URL
    );


  const selectedElements =
    rollElements(
      elementsData
    );


  if (
    !selectedElements ||
    selectedElements.length === 0
  ) {
    return new Response(
      "❌ Não foi possível despertar um elemento.",
      {
        status: 500
      }
    );
  }


  profile.elements =
    selectedElements;


  // Inicializa a progressão elemental
  for (
    const element of selectedElements
  ) {
    profile.elementXp[element] = 0;
    profile.elementLevels[element] = 1;
  }


  await saveProfile(
    env,
    user,
    profile
  );


  const displayElements =
    selectedElements
      .map(
        element => {
          const data =
            elementsData[element];

          return `${data.emoji} ${element} | ${data.raridade}`;
        }
      )
      .join(" + ");


  return new Response(
    `@${user}, você despertou ${displayElements}`
  );
}