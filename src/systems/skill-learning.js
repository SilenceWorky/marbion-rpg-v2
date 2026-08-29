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
  skill,
  metadata = {}
) {
  ensureSkillLoadout(
    profile
  );


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


  profile.skillMeta[
    skill.id
  ] = {
    source:
      metadata.source ||
      "unknown",

    temporary:
      metadata.temporary === true,

    ...(metadata.usesRemaining !== undefined
      ? {
          usesRemaining:
            metadata.usesRemaining
        }
      : {})
  };


  return {
    ok: true,

    skill,

    metadata:
      profile.skillMeta[
        skill.id
      ],

    skills:
      [...profile.skills]
  };
}

function normalizeElement(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function isNeutralCharacter(
  profile
) {
  return (
    Array.isArray(profile?.elements) &&
    profile.elements.some(
      element =>
        normalizeElement(element) ===
        "neutro"
    )
  );
}


function isPermanentForNeutral(
  skill
) {
  const element =
    normalizeElement(
      skill?.elemento
    );

  return (
    element === "neutro" ||
    element === "universal"
  );
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
    skill,
    {
        source: "level",
        temporary: false
    }
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


  const temporaryNeutralSkill =
    isNeutralCharacter(
        profile
    ) &&
    !isPermanentForNeutral(
        skill
    );


    return addSkill(
    profile,
    skill,
    temporaryNeutralSkill
        ? {
            source: "scroll",
            temporary: true,
            usesRemaining: 1
        }
        : {
            source: "scroll",
            temporary: false
        }
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