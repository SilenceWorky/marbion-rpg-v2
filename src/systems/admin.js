import {
  createBaseProfile
} from "../core/profile.js";

import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  RACES_URL,
  ELEMENTS_URL,
  SKILLS_URL
} from "../config/urls.js";

import {
  findSkill,
  ensureSkillLoadout
} from "./skills.js";


function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function normalizeUser(user) {
  return String(user ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function findCatalogKey(
  catalog,
  query
) {
  const target =
    normalizeText(query);

  return Object.keys(
    catalog || {}
  ).find(
    key =>
      normalizeText(key) ===
      target
  ) || null;
}


async function getOrCreateProfile(
  env,
  user
) {
  let profile =
    await getProfile(
      env,
      user
    );

  if (!profile) {
    profile =
      createBaseProfile(
        user
      );
  }

  return profile;
}


export async function adminSetLevel(
  env,
  user,
  level
) {
  const targetUser =
    normalizeUser(user);

  const newLevel =
    Number(level);


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  if (
    !Number.isInteger(newLevel) ||
    newLevel < 1
  ) {
    return {
      ok: false,
      error: "INVALID_LEVEL"
    };
  }


  const profile =
    await getOrCreateProfile(
      env,
      targetUser
    );


  profile.level =
    newLevel;

  /*
   * Ao definir level manualmente,
   * zeramos apenas o XP atual.
   *
   * Não damos Status Points
   * automaticamente.
   */
  profile.xp = 0;


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,
    user: targetUser,
    level: newLevel
  };
}


export async function adminSetRace(
  env,
  user,
  raceQuery
) {
  const targetUser =
    normalizeUser(user);


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  const races =
    await fetchJson(
      RACES_URL
    );


  const race =
    findCatalogKey(
      races,
      raceQuery
    );


  if (!race) {
    return {
      ok: false,
      error: "RACE_NOT_FOUND"
    };
  }


  const profile =
    await getOrCreateProfile(
      env,
      targetUser
    );


  profile.race =
    race;


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,
    user: targetUser,
    race
  };
}


export async function adminSetElements(
  env,
  user,
  elementQueries
) {
  const targetUser =
    normalizeUser(user);


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  if (
    !Array.isArray(
      elementQueries
    ) ||
    elementQueries.length < 1 ||
    elementQueries.length > 2
  ) {
    return {
      ok: false,
      error: "INVALID_ELEMENT_COUNT"
    };
  }


  const elementsData =
    await fetchJson(
      ELEMENTS_URL
    );


  const selectedElements = [];


  for (
    const query
    of elementQueries
  ) {
    const element =
      findCatalogKey(
        elementsData,
        query
      );


    if (!element) {
      return {
        ok: false,
        error: "ELEMENT_NOT_FOUND",
        element: query
      };
    }


    if (
      !selectedElements.includes(
        element
      )
    ) {
      selectedElements.push(
        element
      );
    }
  }


  if (
    selectedElements.length < 1 ||
    selectedElements.length > 2
  ) {
    return {
      ok: false,
      error: "INVALID_ELEMENT_COUNT"
    };
  }


  const hasNeutral =
    selectedElements.some(
      element =>
        normalizeText(element) ===
        "neutro"
    );


  if (
    hasNeutral &&
    selectedElements.length > 1
  ) {
    return {
      ok: false,
      error: "NEUTRAL_EXCLUSIVE"
    };
  }


  const profile =
    await getOrCreateProfile(
      env,
      targetUser
    );


  const newElementXp = {};
  const newElementLevels = {};


  for (
    const element
    of selectedElements
  ) {
    newElementXp[element] =
      Number(
        profile.elementXp?.[
          element
        ]
      ) || 0;

    newElementLevels[element] =
      Math.max(
        1,
        Number(
          profile.elementLevels?.[
            element
          ]
        ) || 1
      );
  }


  profile.elements =
    selectedElements;

  profile.elementXp =
    newElementXp;

  profile.elementLevels =
    newElementLevels;


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,
    user: targetUser,
    elements:
      selectedElements
  };
}

export const ADMIN_STATUS_RESET_VALUES = {
  strength: 5,
  magicStrength: 5,
  speed: 5,
  evasion: 5,
  accuracy: 90,
  defense: 5,
  statusPoints: 0
};


export function resetProfileStatus(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }


  const before = {
    strength:
      Number(profile.strength) || 0,

    magicStrength:
      Number(profile.magicStrength) || 0,

    speed:
      Number(profile.speed) || 0,

    evasion:
      Number(profile.evasion) || 0,

    accuracy:
      Number(profile.accuracy) || 0,

    defense:
      Number(profile.defense) || 0,

    statusPoints:
      Math.max(
        0,
        Number(profile.statusPoints) || 0
      )
  };


  profile.strength =
    ADMIN_STATUS_RESET_VALUES.strength;

  profile.magicStrength =
    ADMIN_STATUS_RESET_VALUES.magicStrength;

  profile.speed =
    ADMIN_STATUS_RESET_VALUES.speed;

  profile.evasion =
    ADMIN_STATUS_RESET_VALUES.evasion;

  profile.accuracy =
    ADMIN_STATUS_RESET_VALUES.accuracy;

  profile.defense =
    ADMIN_STATUS_RESET_VALUES.defense;

  profile.statusPoints =
    ADMIN_STATUS_RESET_VALUES.statusPoints;


  return {
    ok: true,
    before,
    after: {
      ...ADMIN_STATUS_RESET_VALUES
    }
  };
}


export async function adminResetStatus(
  env,
  user
) {
  const targetUser =
    normalizeUser(
      user
    );


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  const profile =
    await getProfile(
      env,
      targetUser
    );


  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      error: "CHARACTER_NOT_FOUND",
      user: targetUser
    };
  }


  const reset =
    resetProfileStatus(
      profile
    );


  if (!reset.ok) {
    return {
      ...reset,
      user: targetUser
    };
  }


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,
    user: targetUser,
    before: reset.before,
    after: reset.after
  };
}


export async function adminAddStatusPoints(
  env,
  user,
  amount
) {
  const targetUser =
    normalizeUser(
      user
    );


  const points =
    Number(
      amount
    );


  if (!targetUser) {
    return {
      ok: false,
      error:
        "INVALID_USER"
    };
  }


  if (
    !Number.isInteger(
      points
    ) ||
    points < 1
  ) {
    return {
      ok: false,
      error:
        "INVALID_STATUS_POINTS"
    };
  }


  const profile =
    await getOrCreateProfile(
      env,
      targetUser
    );


  const current =
    Math.max(
      0,
      Number(
        profile.statusPoints
      ) || 0
    );


  profile.statusPoints =
    current +
    points;


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,

    user:
      targetUser,

    added:
      points,

    statusPoints:
      profile.statusPoints
  };
}

export async function adminSkill(
  env,
  user,
  operation,
  skillQuery
) {
  const targetUser =
    normalizeUser(user);

  const normalizedOperation =
    normalizeText(
      operation
    );


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  if (
    normalizedOperation !== "add" &&
    normalizedOperation !== "rem"
  ) {
    return {
      ok: false,
      error: "INVALID_SKILL_OPERATION"
    };
  }


  const skillsData =
    await fetchJson(
      SKILLS_URL
    );


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


  const profile =
    await getOrCreateProfile(
      env,
      targetUser
    );


  ensureSkillLoadout(
    profile
  );


  if (
    normalizedOperation === "add"
  ) {
    if (
      profile.skills.includes(
        skill.id
      )
    ) {
      return {
        ok: false,
        error: "SKILL_ALREADY_OWNED",
        skill,
        user: targetUser
      };
    }


    profile.skills.push(
      skill.id
    );


    await saveProfile(
      env,
      targetUser,
      profile
    );


    return {
      ok: true,
      operation: "add",
      user: targetUser,
      skill
    };
  }


  if (
    !profile.skills.includes(
      skill.id
    )
  ) {
    return {
      ok: false,
      error: "SKILL_NOT_OWNED",
      skill,
      user: targetUser
    };
  }


  profile.skills =
    profile.skills.filter(
      skillId =>
        skillId !== skill.id
    );


  /*
   * Se a habilidade removida estiver
   * equipada, limpa o slot também.
   */
  profile.equippedSkills =
    profile.equippedSkills.map(
      skillId =>
        skillId === skill.id
          ? null
          : skillId
    );


  /*
   * Remove cooldown persistente
   * relacionado à habilidade.
   */
  if (
    profile.skillCooldowns &&
    typeof profile.skillCooldowns ===
      "object"
  ) {
    delete profile.skillCooldowns[
      skill.id
    ];
  }


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ok: true,
    operation: "rem",
    user: targetUser,
    skill
  };
}