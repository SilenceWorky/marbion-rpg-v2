import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  resetPvpAfkDiscipline
} from "./pvp-afk.js";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export function normalizeAdminTimeScope(value) {
  const normalized =
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();


  const aliases = {
    tudo: "tudo",
    all: "tudo",
    pvp: "pvp",
    habilidades: "habilidades",
    skills: "habilidades",
    cooldowns: "habilidades",
    habilidade: "habilidade",
    skill: "habilidade",
    meditar: "meditar",
    meditacao: "meditar",
    meditation: "meditar",
    antifarm: "antifarm",
    anti_farm: "antifarm",
    afk: "afk",
    fk: "afk",
    timeout: "afk",
    inatividade: "afk",
    daily: "daily",
    checkin: "checkin",
    xpchest: "xpchest",
    bau: "xpchest",
    reroll: "reroll",
    reload: "reroll",
    hpheal: "hpheal",
    cura: "hpheal"
  };


  return aliases[normalized] || null;
}


function ensurePvp(profile) {
  if (
    !profile.pvp ||
    typeof profile.pvp !== "object" ||
    Array.isArray(profile.pvp)
  ) {
    profile.pvp = {};
  }


  if (
    !profile.pvp.recentOpponents ||
    typeof profile.pvp.recentOpponents !== "object" ||
    Array.isArray(profile.pvp.recentOpponents)
  ) {
    profile.pvp.recentOpponents = {};
  }


  return profile.pvp;
}


function ensureProfileCooldowns(profile) {
  if (
    !profile.skillCooldowns ||
    typeof profile.skillCooldowns !== "object" ||
    Array.isArray(profile.skillCooldowns)
  ) {
    profile.skillCooldowns = {};
  }


  return profile.skillCooldowns;
}


export function applyProfileTimeReset(
  profile,
  scope,
  extra = null
) {
  const normalizedScope =
    normalizeAdminTimeScope(scope);


  if (!normalizedScope) {
    return {
      ok: false,
      error: "INVALID_SCOPE"
    };
  }


  if (!profile || typeof profile !== "object") {
    return {
      ok: false,
      error: "INVALID_PROFILE"
    };
  }


  const resetFields = [];
  let skillId = null;
  let slot = null;


  const zeroField =
    field => {
      profile[field] = 0;
      resetFields.push(field);
    };


  if (normalizedScope === "daily") {
    zeroField("lastDaily");
  }

  else if (normalizedScope === "checkin") {
    zeroField("lastCheckin");
  }

  else if (normalizedScope === "xpchest") {
    zeroField("lastXpChest");
  }

  else if (normalizedScope === "reroll") {
    zeroField("lastReroll");
  }

  else if (normalizedScope === "hpheal") {
    zeroField("lastHpHeal");
  }

  else if (normalizedScope === "habilidades") {
    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");
  }

  else if (normalizedScope === "habilidade") {
    slot =
      Number(extra);


    if (
      !Number.isInteger(slot) ||
      slot < 1 ||
      slot > 4
    ) {
      return {
        ok: false,
        error: "INVALID_SLOT"
      };
    }


    const cooldowns =
      ensureProfileCooldowns(profile);

    skillId =
      Array.isArray(profile.equippedSkills)
        ? profile.equippedSkills[slot - 1] || null
        : null;


    if (skillId) {
      delete cooldowns[skillId];
    }

    resetFields.push("skillCooldowns.slot" + slot);
  }

  else if (normalizedScope === "meditar") {
    /*
     * A Meditação usa cooldown vivo no PvP.
     * Não existe timestamp persistente próprio
     * no perfil para limpar aqui.
     */
  }

  else if (normalizedScope === "afk") {
    const afkReset =
      resetPvpAfkDiscipline(
        profile
      );

    if (!afkReset.ok) {
      return afkReset;
    }

    resetFields.push(
      ...afkReset.resetFields
    );
  }

  else if (normalizedScope === "pvp") {
    zeroField("lastCombat");
    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");

    const afkReset =
      resetPvpAfkDiscipline(
        profile
      );

    if (!afkReset.ok) {
      return afkReset;
    }

    resetFields.push(
      ...afkReset.resetFields
    );
  }

  else if (normalizedScope === "tudo") {
    for (
      const field of [
        "lastCombat",
        "lastCheckin",
        "lastDaily",
        "lastXpChest",
        "lastReroll",
        "lastHpHeal"
      ]
    ) {
      zeroField(field);
    }

    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");

    const afkReset =
      resetPvpAfkDiscipline(
        profile
      );

    if (!afkReset.ok) {
      return afkReset;
    }

    resetFields.push(
      ...afkReset.resetFields
    );
  }


  return {
    ok: true,
    scope: normalizedScope,
    resetFields,
    slot,
    skillId
  };
}


async function clearMirroredAntiFarm(
  env,
  user,
  opponents
) {
  let mirroredCleared = 0;


  for (const opponent of opponents) {
    const opponentUser =
      normalizeUser(opponent);


    if (
      !opponentUser ||
      opponentUser === user
    ) {
      continue;
    }


    const opponentProfile =
      await getProfile(
        env,
        opponentUser
      );


    if (!opponentProfile) {
      continue;
    }


    const opponentPvp =
      ensurePvp(
        opponentProfile
      );


    if (
      Object.prototype.hasOwnProperty.call(
        opponentPvp.recentOpponents,
        user
      )
    ) {
      delete opponentPvp.recentOpponents[user];

      await saveProfile(
        env,
        opponentUser,
        opponentProfile
      );

      mirroredCleared += 1;
    }
  }


  return mirroredCleared;
}


export async function adminResetProfileTime(
  env,
  user,
  scope,
  extra = null
) {
  const normalizedUser =
    normalizeUser(user);

  const normalizedScope =
    normalizeAdminTimeScope(scope);


  if (!normalizedUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  if (!normalizedScope) {
    return {
      ok: false,
      error: "INVALID_SCOPE",
      user: normalizedUser
    };
  }


  const profile =
    await getProfile(
      env,
      normalizedUser
    );


  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      error: "CHARACTER_NOT_FOUND",
      user: normalizedUser
    };
  }


  const pvp =
    ensurePvp(profile);


  if (normalizedScope === "antifarm") {
    const opponentUser =
      normalizeUser(extra);


    if (!opponentUser) {
      return {
        ok: false,
        error: "OPPONENT_REQUIRED",
        user: normalizedUser
      };
    }


    const opponentProfile =
      await getProfile(
        env,
        opponentUser
      );


    if (!opponentProfile) {
      return {
        ok: false,
        error: "OPPONENT_NOT_FOUND",
        user: normalizedUser,
        opponent: opponentUser
      };
    }


    const opponentPvp =
      ensurePvp(
        opponentProfile
      );


    const userHadHistory =
      Object.prototype.hasOwnProperty.call(
        pvp.recentOpponents,
        opponentUser
      );

    const opponentHadHistory =
      Object.prototype.hasOwnProperty.call(
        opponentPvp.recentOpponents,
        normalizedUser
      );


    delete pvp.recentOpponents[opponentUser];
    delete opponentPvp.recentOpponents[normalizedUser];


    await Promise.all([
      saveProfile(
        env,
        normalizedUser,
        profile
      ),

      saveProfile(
        env,
        opponentUser,
        opponentProfile
      )
    ]);


    return {
      ok: true,
      user: normalizedUser,
      scope: normalizedScope,
      opponent: opponentUser,
      antiFarmCleared:
        userHadHistory ||
        opponentHadHistory
    };
  }


  const previousOpponents =
    normalizedScope === "pvp" ||
    normalizedScope === "tudo"
      ? Object.keys(
          pvp.recentOpponents
        )
      : [];


  const profileReset =
    applyProfileTimeReset(
      profile,
      normalizedScope,
      extra
    );


  if (!profileReset.ok) {
    return {
      ...profileReset,
      user: normalizedUser
    };
  }


  let mirroredAntiFarmCleared = 0;


  if (
    normalizedScope === "pvp" ||
    normalizedScope === "tudo"
  ) {
    pvp.recentOpponents = {};

    mirroredAntiFarmCleared =
      await clearMirroredAntiFarm(
        env,
        normalizedUser,
        previousOpponents
      );
  }


  await saveProfile(
    env,
    normalizedUser,
    profile
  );


  return {
    ok: true,
    user: normalizedUser,
    scope: normalizedScope,
    resetFields:
      profileReset.resetFields,
    slot:
      profileReset.slot,
    skillId:
      profileReset.skillId,
    antiFarmOpponentsCleared:
      previousOpponents.length,
    mirroredAntiFarmCleared
  };
}
