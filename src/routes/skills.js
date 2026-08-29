import {
  getProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  SKILLS_URL
} from "../config/urls.js";

import {
  getOwnedSkills
} from "../systems/skills.js";


const SKILLS_PER_PAGE = 8;


export async function skillsRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const rawUser =
    url.searchParams.get("user");

  const rawPage =
    url.searchParams.get("page");


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


  if (
    !profile ||
    !profile.race
  ) {
    return new Response(
      `@${user}, você ainda não possui um personagem. Use !raça primeiro.`
    );
  }


  const skillsData =
    await fetchJson(
      SKILLS_URL
    );


  const ownedSkills =
    getOwnedSkills(
      profile,
      skillsData
    );


  if (
    ownedSkills.length === 0
  ) {
    return new Response(
      `@${user}, você ainda não possui nenhuma habilidade.`
    );
  }


  const requestedPage =
    Math.max(
      1,
      Math.floor(
        Number(rawPage) || 1
      )
    );


  const totalPages =
    Math.ceil(
      ownedSkills.length /
      SKILLS_PER_PAGE
    );


  const page =
    Math.min(
      requestedPage,
      totalPages
    );


  const start =
    (page - 1) *
    SKILLS_PER_PAGE;


  const pageSkills =
    ownedSkills.slice(
      start,
      start +
      SKILLS_PER_PAGE
    );


  const display =
    pageSkills
      .map(
        (skill, index) => {
          const number =
            start +
            index +
            1;

          return (
            `${number}. ${skill.nome}` +
            ` [${skill.elemento}]`
          );
        }
      )
      .join(" | ");


  let response =
    `@${user} | Habilidades ` +
    `(${page}/${totalPages}): ` +
    display;


  if (
    page < totalPages
  ) {
    response +=
      ` | Use !habilidades ${page + 1}`;
  }


  return new Response(
    response
  );
}