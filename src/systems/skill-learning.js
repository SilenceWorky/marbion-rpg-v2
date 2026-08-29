import {
  findSkill,
  ensureSkillLoadout
} from "./skills.js";

import {
  canLearnSkillByLevel,
  canLearnSkillFromScroll
} from "./element-compatibility.js";


function hasSkill(
  profile,
  skillId
) {
  ensureSkillLoadout(
    profile
  );

  return profile.skills.includes(
    skillId
  );
}


function addSkill(
  profile,
  skill
) {
  if (
    hasSkill(
      profile,
      skill.id
    )
  ) {
    return {
      ok: false,
      error: "ALREADY_LEARNED",
      skill
    };
  }


  profile.skills.push(
    skill.id
  );


  return {
    ok: true,
    skill,
    skills:
      [...profile.skills]
  };
}


/*
 * APRENDIZADO POR LEVEL
 *
 * Somente habilidades do elemento
 * NATURAL do personagem.
 *
 * Exemplo:
 *
 * Fogo + Terra
 *
 * pode receber por level:
 * - Fogo
 * - Terra
 *
 * não pode receber por level:
 * - Lava
 * - Vidro
 * - Luz por afinidade
 */
export function learnSkillByLevel(
  profile,
  skillsData,
  skillQuery
) {
  const skill =
    findSkill(
      skillsData,
      skillQuery
    );


  if (!skill) {
    return {
      ok: false,
      error: "SKILL_NOT_FOUND"
    };
  }


  if (
    hasSkill(
      profile,
      skill.id
    )
  ) {
    return {
      ok: false,
      error: "ALREADY_LEARNED",
      skill
    };
  }


  if (
    !canLearnSkillByLevel(
      profile,
      skill.elemento
    )
  ) {
    return {
      ok: false,
      error:
        "ELEMENT_NOT_NATIVE",
      skill
    };
  }


  return addSkill(
    profile,
    skill
  );
}


/*
 * APRENDIZADO POR PERGAMINHO
 *
 * Permite:
 *
 * - elemento natural;
 * - elemento de fusão;
 * - elemento por afinidade;
 * - Universal.
 */
export function learnSkillFromScroll(
  profile,
  skillsData,
  skillQuery
) {
  const skill =
    findSkill(
      skillsData,
      skillQuery
    );


  if (!skill) {
    return {
      ok: false,
      error: "SKILL_NOT_FOUND"
    };
  }


  if (
    hasSkill(
      profile,
      skill.id
    )
  ) {
    return {
      ok: false,
      error: "ALREADY_LEARNED",
      skill
    };
  }


  if (
    !canLearnSkillFromScroll(
      profile,
      skill.elemento
    )
  ) {
    return {
      ok: false,
      error:
        "INCOMPATIBLE_ELEMENT",
      skill
    };
  }


  return addSkill(
    profile,
    skill
  );
}


/*
 * Consulta simples.
 *
 * Útil futuramente para:
 * !habilidades
 * pergaminhos
 * recompensas
 * PvP
 */
export function playerHasSkill(
  profile,
  skillId
) {
  return hasSkill(
    profile,
    skillId
  );
}