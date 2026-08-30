export const BASIC_PUNCH_SKILL = {
  id: "Universais:Soco",

  group: "Universais",
  key: "Soco",

  nome: "Soco",

  tipo: "Fisica",
  raridade: "Basica",
  elemento: "Universal",

  custoMentalidade: 0,
  cooldown: 0,

  escala: "strength",

  dano: 12,
  precisao: 95,
  prioridade: 0,

  efeito:
    "Um soco simples que qualquer personagem pode executar."
};


function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


export function createSkillId(
  group,
  key
) {
  return `${group}:${key}`;
}


export function flattenSkills(
  skillsData
) {
  const result = [];


  if (
    !skillsData ||
    typeof skillsData !== "object"
  ) {
    return result;
  }


  for (
    const [group, skills]
    of Object.entries(skillsData)
  ) {
    if (
      !skills ||
      typeof skills !== "object"
    ) {
      continue;
    }


    for (
      const [key, data]
      of Object.entries(skills)
    ) {
      result.push({
        id:
          createSkillId(
            group,
            key
          ),

        group,
        key,

        ...data
      });
    }
  }


  return result;
}


export function ensureSkillLoadout(
  profile
) {
  if (
    !Array.isArray(
      profile.skills
    )
  ) {
    profile.skills = [];
  }


  if (
    !profile.skillMeta ||
    typeof profile.skillMeta !== "object" ||
    Array.isArray(profile.skillMeta)
  ) {
    profile.skillMeta = {};
  }


  if (
    !Array.isArray(
      profile.equippedSkills
    )
  ) {
    profile.equippedSkills = [
      null,
      null,
      null,
      null
    ];
  }


  profile.equippedSkills =
    profile.equippedSkills
      .slice(0, 4);


  while (
    profile.equippedSkills.length < 4
  ) {
    profile.equippedSkills.push(
      null
    );
  }


  return profile;
}


export function getOwnedSkills(
  profile,
  skillsData
) {
  ensureSkillLoadout(
    profile
  );


  const catalog =
    flattenSkills(
      skillsData
    );


  const byId =
    new Map(
      catalog.map(
        skill => [
          skill.id,
          skill
        ]
      )
    );


  /*
   * A ordem das habilidades deve
   * seguir profile.skills.
   *
   * Assim:
   * - habilidade 1 continua sendo 1;
   * - habilidade 2 continua sendo 2;
   * - novas habilidades entram no final;
   * - mudanças no skills.json não
   *   reorganizam o inventário.
   */
  return profile.skills
    .map(
      skillId =>
        byId.get(
          String(skillId)
        ) || null
    )
    .filter(Boolean);
}


export function getEquippedSkills(
  profile,
  skillsData
) {
  ensureSkillLoadout(
    profile
  );


  const catalog =
    flattenSkills(
      skillsData
    );


  const byId =
    new Map(
      catalog.map(
        skill => [
          skill.id,
          skill
        ]
      )
    );


  return profile.equippedSkills
    .map(
      (skillId, index) => {
        const equippedSkill =
          skillId
            ? byId.get(skillId) || null
            : null;


        return {
          slot:
            index + 1,

          skillId:
            skillId || null,

          skill:
            equippedSkill ||
            BASIC_PUNCH_SKILL,

          fallback:
            !equippedSkill
        };
      }
    );
}


export function equipSkill(
  profile,
  skillsData,
  slot,
  ownedSkillNumber
) {
  ensureSkillLoadout(
    profile
  );


  const normalizedSlot =
    Number(slot);

  const normalizedNumber =
    Number(ownedSkillNumber);


  if (
    !Number.isInteger(
      normalizedSlot
    ) ||
    normalizedSlot < 1 ||
    normalizedSlot > 4
  ) {
    return {
      ok: false,
      error: "INVALID_SLOT"
    };
  }


  if (
    !Number.isInteger(
      normalizedNumber
    ) ||
    normalizedNumber < 1
  ) {
    return {
      ok: false,
      error: "INVALID_SKILL_NUMBER"
    };
  }


  const ownedSkills =
    getOwnedSkills(
      profile,
      skillsData
    );


  const selectedSkill =
    ownedSkills[
      normalizedNumber - 1
    ];


  if (!selectedSkill) {
    return {
      ok: false,
      error: "SKILL_NOT_OWNED",
      available:
        ownedSkills.length
    };
  }


  /*
   * A mesma habilidade não pode
   * ocupar dois slots.
   *
   * Se ela já estiver equipada,
   * removemos do slot anterior
   * e movemos para o novo.
   */
  for (
    let index = 0;
    index <
    profile.equippedSkills.length;
    index += 1
  ) {
    if (
      profile.equippedSkills[index] ===
      selectedSkill.id
    ) {
      profile.equippedSkills[index] =
        null;
    }
  }


  profile.equippedSkills[
    normalizedSlot - 1
  ] =
    selectedSkill.id;


  return {
    ok: true,

    slot:
      normalizedSlot,

    skill:
      selectedSkill,

    equippedSkills:
      [...profile.equippedSkills]
  };
}

export function clearSkillSlot(
  profile,
  slot
) {
  ensureSkillLoadout(
    profile
  );


  const normalizedSlot =
    Number(slot);


  if (
    !Number.isInteger(
      normalizedSlot
    ) ||
    normalizedSlot < 1 ||
    normalizedSlot > 4
  ) {
    return {
      ok: false,
      error: "INVALID_SLOT"
    };
  }


  profile.equippedSkills[
    normalizedSlot - 1
  ] = null;


  return {
    ok: true,
    slot:
      normalizedSlot,
    skill:
      BASIC_PUNCH_SKILL
  };
}

export function findSkill(
  skillsData,
  query
) {
  const normalizedQuery =
    normalizeText(
      query
    );


  if (!normalizedQuery) {
    return null;
  }


  const catalog =
    flattenSkills(
      skillsData
    );


  return (
    catalog.find(
      skill =>
        normalizeText(skill.id) ===
        normalizedQuery
    ) ||

    catalog.find(
      skill =>
        normalizeText(skill.nome) ===
        normalizedQuery
    ) ||

    null
  );
}