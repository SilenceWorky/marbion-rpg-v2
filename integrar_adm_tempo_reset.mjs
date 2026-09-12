import fs from "node:fs";

const files = {
  admin: "src/routes/admin.js",
  coordinator: "src/durable/PvpCoordinator.js",
  system: "src/systems/admin-time-reset.js"
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) {
    console.log(`✅ ${label} já integrado`);
    return source;
  }

  const index = source.indexOf(before);

  if (index === -1) {
    throw new Error(`Não encontrei o ponto de integração: ${label}`);
  }

  console.log(`✅ ${label} integrado`);

  return (
    source.slice(0, index) +
    after +
    source.slice(index + before.length)
  );
}

const systemContent = `import {
  getProfile,
  saveProfile
} from "../core/database.js";


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
      .replace(/[\\u0300-\\u036f]/g, "")
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

    resetFields.push(`skillCooldowns.slot${slot}`);
  }

  else if (normalizedScope === "meditar") {
    /*
     * A Meditação usa cooldown vivo no PvP.
     * Não existe timestamp persistente próprio
     * no perfil para limpar aqui.
     */
  }

  else if (normalizedScope === "pvp") {
    zeroField("lastCombat");
    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");
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
`;

write(files.system, systemContent);
console.log("✅ src/systems/admin-time-reset.js criado");

let admin = read(files.admin);

admin = replaceOnce(
  admin,
  `import {\n  adminModifyProfileResource,\n  parseAdminResourceChange\n} from "../systems/admin-resources.js";`,
  `import {\n  adminModifyProfileResource,\n  parseAdminResourceChange\n} from "../systems/admin-resources.js";\n\nimport {\n  adminResetProfileTime,\n  normalizeAdminTimeScope\n} from "../systems/admin-time-reset.js";`,
  "import do reset administrativo de tempo"
);

admin = replaceOnce(
  admin,
  `      \`@\${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp/hp/mentalidade ...\``,
  `      \`@\${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp/hp/mentalidade/tempo ...\``,
  "ajuda geral do !adm"
);

const statusMarker = `  /*\n   * ==========================\n   * STATUS RESET`;

const timeBlock = `  /*\n   * ==========================\n   * RESET ADMINISTRATIVO DE TEMPO\n   * ==========================\n   *\n   * Sintaxes equivalentes:\n   * !adm tempo reset @user escopo [extra]\n   * !adm reset tempo @user escopo [extra]\n   */\n  const isTempoReset =\n    command === "tempo" &&\n    normalizeCommand(args[1]) === "reset";\n\n  const isResetTempo =\n    command === "reset" &&\n    normalizeCommand(args[1]) === "tempo";\n\n\n  if (\n    isTempoReset ||\n    isResetTempo\n  ) {\n    const target =\n      args[2];\n\n    const rawScope =\n      args[3];\n\n    const scope =\n      normalizeAdminTimeScope(\n        rawScope\n      );\n\n    const extra =\n      args[4] ?? null;\n\n\n    if (\n      !target ||\n      !scope\n    ) {\n      return new Response(\n        \`@\${actor}, uso: !adm tempo reset @usuário tudo|pvp|habilidades|habilidade 1-4|meditar|antifarm @oponente|daily|checkin|xpchest|reroll|cura\`\n      );\n    }\n\n\n    if (\n      scope === "habilidade" &&\n      (\n        !extra ||\n        !Number.isInteger(Number(extra)) ||\n        Number(extra) < 1 ||\n        Number(extra) > 4\n      )\n    ) {\n      return new Response(\n        \`@\${actor}, uso: !adm tempo reset @usuário habilidade 1-4\`\n      );\n    }\n\n\n    if (\n      scope === "antifarm" &&\n      !extra\n    ) {\n      return new Response(\n        \`@\${actor}, uso: !adm tempo reset @usuário antifarm @oponente\`\n      );\n    }\n\n\n    const profileResult =\n      await adminResetProfileTime(\n        env,\n        target,\n        scope,\n        extra\n      );\n\n\n    if (!profileResult.ok) {\n      if (\n        profileResult.error ===\n        "CHARACTER_NOT_FOUND"\n      ) {\n        return new Response(\n          \`@\${actor}, @\${normalizeUser(target)} ainda não possui personagem.\`\n        );\n      }\n\n\n      if (\n        profileResult.error ===\n        "OPPONENT_NOT_FOUND"\n      ) {\n        return new Response(\n          \`@\${actor}, o oponente @\${normalizeUser(extra)} não possui perfil.\`\n        );\n      }\n\n\n      return new Response(\n        \`@\${actor}, não foi possível resetar esse tempo de @\${normalizeUser(target)}.\`\n      );\n    }\n\n\n    const battleScopes =\n      new Set([\n        "tudo",\n        "pvp",\n        "habilidades",\n        "habilidade",\n        "meditar"\n      ]);\n\n    let battleResult =\n      null;\n\n\n    if (\n      battleScopes.has(scope)\n    ) {\n      const coordinator =\n        getCoordinator(\n          env\n        );\n\n      const internalUrl =\n        new URL(\n          "https://pvp.internal/admin-reset-time"\n        );\n\n      internalUrl.searchParams.set(\n        "user",\n        normalizeUser(target)\n      );\n\n      internalUrl.searchParams.set(\n        "scope",\n        scope\n      );\n\n\n      if (extra) {\n        internalUrl.searchParams.set(\n          "extra",\n          String(extra)\n        );\n      }\n\n\n      const response =\n        await coordinator.fetch(\n          new Request(\n            internalUrl.toString()\n          )\n        );\n\n      battleResult =\n        await response.json();\n\n\n      if (!battleResult.ok) {\n        return new Response(\n          \`@\${actor}, o perfil foi resetado, mas não foi possível resetar o temporizador vivo do PvP.\`\n        );\n      }\n    }\n\n\n    if (scope === "antifarm") {\n      return new Response(\n        \`🕒 ADM | Anti-farm entre @\${profileResult.user} e @\${profileResult.opponent} resetado.\`\n      );\n    }\n\n\n    if (scope === "habilidade") {\n      return new Response(\n        \`🕒 ADM | Cooldown do slot \${Number(extra)} de @\${profileResult.user} resetado.\`\n      );\n    }\n\n\n    const activeBattleText =\n      battleResult?.inBattle\n        ? " | PvP ativo atualizado"\n        : "";\n\n\n    return new Response(\n      \`🕒 ADM | Tempo de @\${profileResult.user} resetado: \${scope.toUpperCase()}\${activeBattleText}.\`\n    );\n  }\n\n\n${statusMarker}`;

admin = replaceOnce(
  admin,
  statusMarker,
  timeBlock,
  "comando !adm tempo reset"
);

write(files.admin, admin);

let coordinator = read(files.coordinator);

const methodMarker = `  async adminModifyBattleResource(\n    user,\n    resource,\n    mode,\n    amount\n  ) {`;

const methodBlock = `  async adminResetBattleTime(\n    user,\n    scope,\n    extra = null\n  ) {\n    user =\n      normalizeUser(\n        user\n      );\n\n    scope =\n      String(scope ?? "")\n        .trim()\n        .toLowerCase();\n\n\n    if (!user) {\n      return {\n        ok: false,\n        error: "INVALID_USER"\n      };\n    }\n\n\n    const validScopes =\n      new Set([\n        "tudo",\n        "pvp",\n        "habilidades",\n        "habilidade",\n        "meditar"\n      ]);\n\n\n    if (!validScopes.has(scope)) {\n      return {\n        ok: false,\n        error: "INVALID_SCOPE"\n      };\n    }\n\n\n    const data =\n      await this.getData();\n\n    const battle =\n      this.findBattleByUser(\n        data,\n        user\n      );\n\n\n    if (!battle) {\n      return {\n        ok: true,\n        inBattle: false,\n        user,\n        scope\n      };\n    }\n\n\n    const player =\n      battle.player1.user === user\n        ? battle.player1\n        : battle.player2;\n\n\n    const cooldowns =\n      ensurePlayerSkillCooldowns(\n        player\n      );\n\n    let cooldownsCleared = 0;\n    let meditationCleared = false;\n    let slot = null;\n    let skillId = null;\n\n\n    if (scope === "habilidade") {\n      slot =\n        Number(extra);\n\n\n      if (\n        !Number.isInteger(slot) ||\n        slot < 1 ||\n        slot > 4\n      ) {\n        return {\n          ok: false,\n          error: "INVALID_SLOT"\n        };\n      }\n\n\n      skillId =\n        Array.isArray(player.loadout)\n          ? player.loadout[slot - 1] || null\n          : null;\n\n\n      if (\n        skillId &&\n        Object.prototype.hasOwnProperty.call(\n          cooldowns,\n          skillId\n        )\n      ) {\n        delete cooldowns[skillId];\n        cooldownsCleared = 1;\n      }\n    }\n\n\n    if (\n      scope === "habilidades" ||\n      scope === "pvp" ||\n      scope === "tudo"\n    ) {\n      cooldownsCleared =\n        Object.keys(cooldowns).length;\n\n      player.skillCooldowns = {};\n    }\n\n\n    if (\n      scope === "meditar" ||\n      scope === "pvp" ||\n      scope === "tudo"\n    ) {\n      meditationCleared =\n        Number.isFinite(\n          Number(\n            player.meditationAvailableAtTurn\n          )\n        );\n\n      delete player.meditationAvailableAtTurn;\n    }\n\n\n    await this.saveData(\n      data\n    );\n\n\n    return {\n      ok: true,\n      inBattle: true,\n      user,\n      scope,\n      slot,\n      skillId,\n      cooldownsCleared,\n      meditationCleared,\n      turn:\n        battle.turn\n    };\n  }\n\n\n${methodMarker}`;

coordinator = replaceOnce(
  coordinator,
  methodMarker,
  methodBlock,
  "reset de tempo vivo no PvP"
);

const endpointMarker = `    if (\n      url.pathname ===\n      "/admin-resource"\n    ) {`;

const endpointBlock = `    if (\n      url.pathname ===\n      "/admin-reset-time"\n    ) {\n      const result =\n        await this.adminResetBattleTime(\n          url.searchParams.get(\n            "user"\n          ),\n          url.searchParams.get(\n            "scope"\n          ),\n          url.searchParams.get(\n            "extra"\n          )\n        );\n\n\n      return Response.json(\n        result\n      );\n    }\n\n\n${endpointMarker}`;

coordinator = replaceOnce(
  coordinator,
  endpointMarker,
  endpointBlock,
  "endpoint interno /admin-reset-time"
);

write(files.coordinator, coordinator);

console.log("\n🕒 RESET ADMINISTRATIVO DE TEMPO INTEGRADO LOCALMENTE.");
