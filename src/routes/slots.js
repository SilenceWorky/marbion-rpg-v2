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
  getEquippedSkills
} from "../systems/skills.js";


export async function slotsRoute(
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


  const slots =
    getEquippedSkills(
      profile,
      skillsData
    );


  const display =
    slots
      .map(
        entry => {
          let name =
            entry.skill.nome;


          const metadata =
            entry.skillId
              ? profile.skillMeta?.[
                  entry.skillId
                ]
              : null;


          if (
            metadata?.temporary === true
          ) {
            const uses =
              Number(
                metadata.usesRemaining
              ) || 1;

            name +=
              ` [${uses} uso(s)]`;
          }


          return (
            `${entry.slot}. ${name}`
          );
        }
      )
      .join(" | ");


  return new Response(
    `@${user} | Slots: ${display}`
  );
}