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
  adminSetLevel,
  adminSetRace,
  adminSetElements,
  adminSkill
} from "../systems/admin.js";

import {
  isAdminUser
} from "../config/admins.js";

import {
  ensureSkillLoadout,
  getOwnedSkills,
  equipSkill,
  clearSkillSlot
} from "../systems/skills.js";


const INDEX_PREFIX =
  "__character_index__:";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function authorized(url, env) {
  const actor =
    normalizeUser(
      url.searchParams.get("actor")
    );

  const key =
    String(
      url.searchParams.get("key") ?? ""
    );

  return Boolean(
    actor &&
    isAdminUser(actor) &&
    key &&
    env?.MARBION_ADMIN_KEY &&
    key === env.MARBION_ADMIN_KEY
  );
}
function adminSnapshot(
  user,
  profile
) {
  return {
    user,
    level:
      Number(profile.level) || 1,
    xp:
      Math.max(
        0,
        Number(profile.xp) || 0
      ),
    race:
      profile.race ?? null,
    elements:
      Array.isArray(profile.elements)
        ? profile.elements
        : [],
    resources: {
      hp:
        Number(profile.hp) || 0,
      maxHp:
        Number(profile.maxHp) || 0,
      mentalidade:
        Number(profile.mentalidade) || 0,
      maxMentalidade:
        Number(profile.maxMentalidade) || 0
    },
    stats: {
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
    },
    skills: {
      learned:
        Array.isArray(profile.skills)
          ? profile.skills
          : [],
      equipped:
        Array.isArray(
          profile.equippedSkills
        )
          ? profile.equippedSkills
          : [null, null, null, null]
    },
    money: {
      bronze:
        Math.max(
          0,
          Number(profile?.money?.bronze) || 0
        ),
      silver:
        Math.max(
          0,
          Number(profile?.money?.silver) || 0
        ),
      gold:
        Math.max(
          0,
          Number(profile?.money?.gold) || 0
        ),
      platinum:
        Math.max(
          0,
          Number(profile?.money?.platinum) || 0
        )
    },
    pvp: {
      wins:
        Number(profile?.pvp?.wins) || 0,
      losses:
        Number(profile?.pvp?.losses) || 0,
      rating:
        Number(profile?.pvp?.rating) || 1000,
      rank:
        profile?.pvp?.rank ?? "Prata III"
    },
    state: {
      dead:
        profile.dead === true,
      deaths:
        Number(profile.deaths) || 0,
      cycles:
        Number(profile.cycles) || 0,
      rebuffs:
        Number(profile.rebuffs) || 0,
      reincarnations:
        Number(profile.reincarnations) || 0
    },
    updatedAt:
      Number(profile.updatedAt) || 0
  };
}
async function listAllKeys(kv) {
  const keys = [];
  let cursor = undefined;

  for (
    let page = 0;
    page < 20;
    page += 1
  ) {
    const result =
      await kv.list({
        limit: 1000,
        ...(cursor
          ? { cursor }
          : {})
      });

    keys.push(
      ...(
        Array.isArray(result?.keys)
          ? result.keys
          : []
      )
    );

    if (
      result?.list_complete === true ||
      !result?.cursor
    ) {
      break;
    }

    cursor =
      result.cursor;
  }

  return keys;
}


async function listCharacters(
  env
) {
  const kv =
    env?.MARBION_USERS_V2;

  if (
    !kv ||
    typeof kv.list !== "function"
  ) {
    return [];
  }

  const keys =
    await listAllKeys(kv);

  const usernames =
    new Set();

  for (const entry of keys) {
    const name =
      String(entry?.name ?? "");

    if (!name) {
      continue;
    }

    if (
      name.startsWith(
        INDEX_PREFIX
      )
    ) {
      const user =
        normalizeUser(
          name.slice(
            INDEX_PREFIX.length
          )
        );

      if (user) {
        usernames.add(user);
      }

      continue;
    }

    if (!name.startsWith("__")) {
      usernames.add(
        normalizeUser(name)
      );
    }
  }
  const names =
    Array.from(usernames)
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
      );

  const characters = [];

  for (
    let index = 0;
    index < names.length;
    index += 20
  ) {
    const batch =
      names.slice(
        index,
        index + 20
      );

    const profiles =
      await Promise.all(
        batch.map(async user => {
          try {
            const profile =
              await getProfile(
                env,
                user
              );

            if (
              !profile ||
              !profile.race
            ) {
              return null;
            }

            return adminSnapshot(
              user,
              profile
            );
          }
          catch {
            return null;
          }
        })
      );

    characters.push(
      ...profiles.filter(Boolean)
    );
  }

  return characters;
}


function toNonNegativeInteger(
  value
) {
  const number =
    Number(value);

  return (
    Number.isSafeInteger(number) &&
    number >= 0
  )
    ? number
    : null;
}


function toPositiveInteger(
  value
) {
  const number =
    Number(value);

  return (
    Number.isSafeInteger(number) &&
    number >= 1
  )
    ? number
    : null;
}

async function applyEquippedSkillsPatch(
  env,
  profile,
  rawSlots
) {
  if (
    !Array.isArray(rawSlots) ||
    rawSlots.length !== 4
  ) {
    return {
      ok: false,
      error:
        "INVALID_EQUIPPED_SKILLS"
    };
  }

  const desiredSlots =
    rawSlots.map(value => {
      if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
      ) {
        return null;
      }

      return String(value).trim();
    });

  const equippedIds =
    desiredSlots.filter(Boolean);

  if (
    new Set(equippedIds).size !==
    equippedIds.length
  ) {
    return {
      ok: false,
      error:
        "DUPLICATE_EQUIPPED_SKILL"
    };
  }

  const skillsData =
    await fetchJson(
      SKILLS_URL
    );

  ensureSkillLoadout(
    profile
  );

  const ownedSkills =
    getOwnedSkills(
      profile,
      skillsData
    );

  const ownedIndexById =
    new Map(
      ownedSkills.map(
        (skill, index) => [
          skill.id,
          index + 1
        ]
      )
    );

  for (const skillId of equippedIds) {
    if (
      !ownedIndexById.has(
        skillId
      )
    ) {
      return {
        ok: false,
        error:
          "SKILL_NOT_OWNED"
      };
    }
  }

  for (
    let slot = 1;
    slot <= 4;
    slot += 1
  ) {
    clearSkillSlot(
      profile,
      slot
    );
  }

  for (
    let index = 0;
    index <
    desiredSlots.length;
    index += 1
  ) {
    const skillId =
      desiredSlots[index];

    if (!skillId) {
      continue;
    }

    const ownedNumber =
      ownedIndexById.get(
        skillId
      );

    const result =
      equipSkill(
        profile,
        skillsData,
        index + 1,
        ownedNumber
      );

    if (!result.ok) {
      return {
        ok: false,
        error:
          result.error ||
          "INVALID_EQUIPPED_SKILLS"
      };
    }
  }

  return {
    ok: true,
    equippedSkills:
      [...profile.equippedSkills]
  };
}

async function applyPatch(
  env,
  user,
  patch
) {
  const beforeProfile =
    await getProfile(
      env,
      user
    );

  if (
    !beforeProfile ||
    !beforeProfile.race
  ) {
    return {
      ok: false,
      status: 404,
      error: "CHARACTER_NOT_FOUND"
    };
  }

  const before =
    adminSnapshot(
      user,
      beforeProfile
    );

  if (
    patch.race !== undefined
  ) {
    const result =
      await adminSetRace(
        env,
        user,
        patch.race
      );

    if (!result.ok) {
      return {
        ok: false,
        status: 400,
        error:
          result.error ||
          "INVALID_RACE"
      };
    }
  }

  if (
    patch.elements !== undefined
  ) {
    const result =
      await adminSetElements(
        env,
        user,
        patch.elements
      );

    if (!result.ok) {
      return {
        ok: false,
        status: 400,
        error:
          result.error ||
          "INVALID_ELEMENTS"
      };
    }
  }
  if (
    patch.level !== undefined
  ) {
    const level =
      toPositiveInteger(
        patch.level
      );

    if (level === null) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_LEVEL"
      };
    }

    const result =
      await adminSetLevel(
        env,
        user,
        level
      );

    if (!result.ok) {
      return {
        ok: false,
        status: 400,
        error:
          result.error ||
          "INVALID_LEVEL"
      };
    }
  }

  let profile =
    await getProfile(
      env,
      user
    );

  if (!profile) {
    return {
      ok: false,
      status: 404,
      error: "CHARACTER_NOT_FOUND"
    };
  }

  let directChanged = false;

  if (
    patch.xp !== undefined
  ) {
    const value =
      toNonNegativeInteger(
        patch.xp
      );

    if (value === null) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_XP"
      };
    }

    profile.xp = value;
    directChanged = true;
  }

  if (
    patch.statusPoints !== undefined
  ) {
    const value =
      toNonNegativeInteger(
        patch.statusPoints
      );

    if (value === null) {
      return {
        ok: false,
        status: 400,
        error:
          "INVALID_STATUS_POINTS"
      };
    }

    profile.statusPoints = value;
    directChanged = true;
  }
  const resourceFields = [
    "hp",
    "maxHp",
    "mentalidade",
    "maxMentalidade"
  ];

  for (
    const field
    of resourceFields
  ) {
    if (
      patch[field] === undefined
    ) {
      continue;
    }

    const value =
      field.startsWith("max")
        ? toPositiveInteger(
            patch[field]
          )
        : toNonNegativeInteger(
            patch[field]
          );

    if (value === null) {
      return {
        ok: false,
        status: 400,
        error:
          `INVALID_${field.toUpperCase()}`
      };
    }

    profile[field] = value;
    directChanged = true;
  }

  if (profile.maxHp < 1) {
    profile.maxHp = 1;
  }

  if (
    profile.hp >
    profile.maxHp
  ) {
    profile.hp =
      profile.maxHp;
  }

  if (
    profile.maxMentalidade < 1
  ) {
    profile.maxMentalidade = 1;
  }

  if (
    profile.mentalidade >
    profile.maxMentalidade
  ) {
    profile.mentalidade =
      profile.maxMentalidade;
  }
  const statFields = [
    "strength",
    "magicStrength",
    "speed",
    "evasion",
    "accuracy",
    "defense"
  ];

  for (
    const field
    of statFields
  ) {
    if (
      patch[field] === undefined
    ) {
      continue;
    }

    const value =
      toNonNegativeInteger(
        patch[field]
      );

    if (value === null) {
      return {
        ok: false,
        status: 400,
        error:
          `INVALID_${field.toUpperCase()}`
      };
    }

    if (
      field === "accuracy" &&
      value > 100
    ) {
      return {
        ok: false,
        status: 400,
        error:
          "INVALID_ACCURACY"
      };
    }

    profile[field] = value;
    directChanged = true;
  }

  if (
    patch.money !== undefined
  ) {
    if (
      !patch.money ||
      typeof patch.money !==
        "object" ||
      Array.isArray(
        patch.money
      )
    ) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_MONEY"
      };
    }

    const coins = [
      "bronze",
      "silver",
      "gold",
      "platinum"
    ];

    profile.money =
      profile.money || {};

    for (const coin of coins) {
      if (
        patch.money[coin] ===
          undefined
      ) {
        continue;
      }

      const value =
        toNonNegativeInteger(
          patch.money[coin]
        );

      if (value === null) {
        return {
          ok: false,
          status: 400,
          error:
            `INVALID_MONEY_${coin.toUpperCase()}`
        };
      }

      profile.money[coin] =
        value;
      directChanged = true;
    }
  }
  if (directChanged) {
    await saveProfile(
      env,
      user,
      profile
    );
  }

  if (
    Array.isArray(
      patch.addSkills
    )
  ) {
    for (
      const skill
      of patch.addSkills
    ) {
      const result =
        await adminSkill(
          env,
          user,
          "add",
          skill
        );

      if (!result.ok) {
        return {
          ok: false,
          status: 400,
          error:
            result.error ||
            "INVALID_SKILL"
        };
      }
    }
  }

  if (
    Array.isArray(
      patch.removeSkills
    )
  ) {
    for (
      const skill
      of patch.removeSkills
    ) {
      const result =
        await adminSkill(
          env,
          user,
          "rem",
          skill
        );

      if (!result.ok) {
        return {
          ok: false,
          status: 400,
          error:
            result.error ||
            "INVALID_SKILL"
        };
      }
    }
  }

  if (
    patch.equippedSkills !==
      undefined
  ) {
    profile =
      await getProfile(
        env,
        user
      );

    if (!profile) {
      return {
        ok: false,
        status: 404,
        error:
          "CHARACTER_NOT_FOUND"
      };
    }

    const result =
      await applyEquippedSkillsPatch(
        env,
        profile,
        patch.equippedSkills
      );

    if (!result.ok) {
      return {
        ok: false,
        status: 400,
        error:
          result.error ||
          "INVALID_EQUIPPED_SKILLS"
      };
    }

    await saveProfile(
      env,
      user,
      profile
    );
  }

  profile =
    await getProfile(
      env,
      user
    );

  return {
    ok: true,
    before,
    character:
      adminSnapshot(
        user,
        profile
      )
  };
}
export async function adminCharactersApiRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  if (
    !authorized(
      url,
      env
    )
  ) {
    return Response.json(
      {
        ok: false,
        error: "UNAUTHORIZED"
      },
      {
        status: 401
      }
    );
  }

  if (
    request.method === "GET"
  ) {
    const user =
      normalizeUser(
        url.searchParams.get(
          "user"
        )
      );

    if (user) {
      const profile =
        await getProfile(
          env,
          user
        );

      if (
        !profile ||
        !profile.race
      ) {
        return Response.json(
          {
            ok: false,
            error:
              "CHARACTER_NOT_FOUND"
          },
          {
            status: 404
          }
        );
      }

      return Response.json({
        ok: true,
        character:
          adminSnapshot(
            user,
            profile
          )
      });
    }

    const characters =
      await listCharacters(
        env
      );

    return Response.json({
      ok: true,
      characters
    });
  }
  if (
    request.method === "PATCH" ||
    request.method === "POST"
  ) {
    let body;

    try {
      body =
        await request.json();
    }
    catch {
      return Response.json(
        {
          ok: false,
          error: "INVALID_JSON"
        },
        {
          status: 400
        }
      );
    }

    const user =
      normalizeUser(
        body?.user
      );

    const patch =
      (
        body?.patch &&
        typeof body.patch === "object" &&
        !Array.isArray(
          body.patch
        )
      )
        ? body.patch
        : null;

    if (
      !user ||
      !patch
    ) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_INPUT"
        },
        {
          status: 400
        }
      );
    }

    const result =
      await applyPatch(
        env,
        user,
        patch
      );

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.error
        },
        {
          status:
            result.status || 400
        }
      );
    }

    return Response.json(
      result
    );
  }

  return Response.json(
    {
      ok: false,
      error: "METHOD_NOT_ALLOWED"
    },
    {
      status: 405
    }
  );
}
