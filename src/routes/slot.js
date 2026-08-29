import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  SKILLS_URL
} from "../config/urls.js";

import {
  equipSkill,
  clearSkillSlot
} from "../systems/skills.js";


export async function slotRoute(
  request,
  env
) {
  const url =
    new URL(request.url);


  const rawUser =
    url.searchParams.get("user");

  const rawSlot =
    url.searchParams.get("slot");

  const rawSkill =
    url.searchParams.get("skill");


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


  if (
    !rawSlot ||
    !rawSkill
  ) {
    return new Response(
      `@${user}, uso: !slot número-do-slot número-da-habilidade`
    );
  }


  /*
   * Permite limpar o slot:
   *
   * !slot 2 soco
   * !slot 2 0
   *
   * Slot vazio = Soco.
   */
  const normalizedSkill =
    String(rawSkill)
      .trim()
      .toLowerCase();


  if (
    normalizedSkill === "soco" ||
    normalizedSkill === "0"
  ) {
    const result =
      clearSkillSlot(
        profile,
        rawSlot
      );


    if (!result.ok) {
      return new Response(
        `@${user}, o slot precisa ser um número de 1 a 4.`
      );
    }


    await saveProfile(
      env,
      user,
      profile
    );


    return new Response(
      `@${user}, Slot ${result.slot} agora está usando Soco.`
    );
  }


  const skillsData =
    await fetchJson(
      SKILLS_URL
    );


  const result =
    equipSkill(
      profile,
      skillsData,
      rawSlot,
      rawSkill
    );


  if (!result.ok) {
    if (
      result.error ===
      "INVALID_SLOT"
    ) {
      return new Response(
        `@${user}, o slot precisa ser um número de 1 a 4.`
      );
    }


    if (
      result.error ===
      "INVALID_SKILL_NUMBER"
    ) {
      return new Response(
        `@${user}, informe o número da habilidade mostrado em !habilidades.`
      );
    }


    if (
      result.error ===
      "SKILL_NOT_OWNED"
    ) {
      return new Response(
        `@${user}, você não possui uma habilidade com esse número. Use !habilidades.`
      );
    }


    return new Response(
      `@${user}, não foi possível equipar essa habilidade.`
    );
  }


  await saveProfile(
    env,
    user,
    profile
  );


  return new Response(
    `@${user}, Slot ${result.slot} agora é ${result.skill.nome}.`
  );
}