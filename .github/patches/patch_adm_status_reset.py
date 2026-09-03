from pathlib import Path

# ============================================================
# src/systems/admin.js
# ============================================================
path = Path("src/systems/admin.js")
text = path.read_text(encoding="utf-8")

anchor = '''export async function adminAddStatusPoints(\n  env,\n  user,\n  amount\n) {\n'''

block = '''export const ADMIN_STATUS_RESET_VALUES = {\n  strength: 5,\n  magicStrength: 5,\n  speed: 5,\n  evasion: 5,\n  accuracy: 90,\n  defense: 5,\n  statusPoints: 0\n};\n\n\nexport function resetProfileStatus(\n  profile\n) {\n  if (\n    !profile ||\n    typeof profile !== \"object\"\n  ) {\n    return {\n      ok: false,\n      error: \"INVALID_PROFILE\"\n    };\n  }\n\n\n  const before = {\n    strength:\n      Number(profile.strength) || 0,\n\n    magicStrength:\n      Number(profile.magicStrength) || 0,\n\n    speed:\n      Number(profile.speed) || 0,\n\n    evasion:\n      Number(profile.evasion) || 0,\n\n    accuracy:\n      Number(profile.accuracy) || 0,\n\n    defense:\n      Number(profile.defense) || 0,\n\n    statusPoints:\n      Math.max(\n        0,\n        Number(profile.statusPoints) || 0\n      )\n  };\n\n\n  profile.strength =\n    ADMIN_STATUS_RESET_VALUES.strength;\n\n  profile.magicStrength =\n    ADMIN_STATUS_RESET_VALUES.magicStrength;\n\n  profile.speed =\n    ADMIN_STATUS_RESET_VALUES.speed;\n\n  profile.evasion =\n    ADMIN_STATUS_RESET_VALUES.evasion;\n\n  profile.accuracy =\n    ADMIN_STATUS_RESET_VALUES.accuracy;\n\n  profile.defense =\n    ADMIN_STATUS_RESET_VALUES.defense;\n\n  profile.statusPoints =\n    ADMIN_STATUS_RESET_VALUES.statusPoints;\n\n\n  return {\n    ok: true,\n    before,\n    after: {\n      ...ADMIN_STATUS_RESET_VALUES\n    }\n  };\n}\n\n\nexport async function adminResetStatus(\n  env,\n  user\n) {\n  const targetUser =\n    normalizeUser(\n      user\n    );\n\n\n  if (!targetUser) {\n    return {\n      ok: false,\n      error: \"INVALID_USER\"\n    };\n  }\n\n\n  const profile =\n    await getProfile(\n      env,\n      targetUser\n    );\n\n\n  if (\n    !profile ||\n    !profile.race\n  ) {\n    return {\n      ok: false,\n      error: \"CHARACTER_NOT_FOUND\",\n      user: targetUser\n    };\n  }\n\n\n  const reset =\n    resetProfileStatus(\n      profile\n    );\n\n\n  if (!reset.ok) {\n    return {\n      ...reset,\n      user: targetUser\n    };\n  }\n\n\n  await saveProfile(\n    env,\n    targetUser,\n    profile\n  );\n\n\n  return {\n    ok: true,\n    user: targetUser,\n    before: reset.before,\n    after: reset.after\n  };\n}\n\n\n'''

if block not in text:
    if anchor not in text:
        raise SystemExit("Anchor adminAddStatusPoints não encontrado")
    text = text.replace(anchor, block + anchor, 1)

path.write_text(text, encoding="utf-8")


# ============================================================
# src/routes/admin.js
# ============================================================
path = Path("src/routes/admin.js")
text = path.read_text(encoding="utf-8")

old_import = '''  adminSetElements,\n  adminAddStatusPoints,\n  adminSkill\n} from \"../systems/admin.js\";\n'''
new_import = '''  adminSetElements,\n  adminAddStatusPoints,\n  adminResetStatus,\n  adminSkill\n} from \"../systems/admin.js\";\n'''

if new_import not in text:
    if old_import not in text:
        raise SystemExit("Import de admin.js não encontrado")
    text = text.replace(old_import, new_import, 1)

pontos_marker = '''  /*\n  * ==========================\n  * PONTOS\n  * ==========================\n'''

status_block = '''  /*\n   * ==========================\n   * STATUS RESET\n   * ==========================\n   *\n   * !adm status reset @user\n   *\n   * Zera todos os Status Points guardados\n   * e restaura os atributos de teste/base\n   * definidos pelo ADM.\n   */\n  if (\n    command === \"status\"\n  ) {\n    const operation =\n      normalizeCommand(\n        args[1]\n      );\n\n    const target =\n      args[2];\n\n\n    if (\n      operation !== \"reset\" ||\n      !target\n    ) {\n      return new Response(\n        `@${actor}, uso: !adm status reset @usuário`\n      );\n    }\n\n\n    const result =\n      await adminResetStatus(\n        env,\n        target\n      );\n\n\n    if (!result.ok) {\n      if (\n        result.error ===\n        \"CHARACTER_NOT_FOUND\"\n      ) {\n        return new Response(\n          `@${actor}, @${normalizeUser(target)} ainda não possui personagem.`\n        );\n      }\n\n\n      return new Response(\n        `@${actor}, não foi possível resetar os Status de @${normalizeUser(target)}.`\n      );\n    }\n\n\n    return new Response(\n      `🛠️ ADM | Status de @${result.user} resetados. ` +\n      `Pontos: 0 | Força: ${result.after.strength} | ` +\n      `Força Mágica: ${result.after.magicStrength} | ` +\n      `Velocidade: ${result.after.speed} | ` +\n      `Evasão: ${result.after.evasion} | ` +\n      `Precisão: ${result.after.accuracy} | ` +\n      `Defesa: ${result.after.defense}.`\n    );\n  }\n\n\n'''

if status_block not in text:
    if pontos_marker not in text:
        raise SystemExit("Marcador PONTOS não encontrado")
    text = text.replace(pontos_marker, status_block + pontos_marker, 1)

text = text.replace(
    '`@${actor}, uso: !adm level/raça/elemento/pontos/skill/pvp ...`',
    '`@${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp ...`'
)

text = text.replace(
    '`@${actor}, comando ADM desconhecido. Use level, raça, elemento, pontos, skill ou pvp.`',
    '`@${actor}, comando ADM desconhecido. Use level, raça, elemento, status, pontos, skill ou pvp.`'
)

path.write_text(text, encoding="utf-8")


# ============================================================
# teste puro
# ============================================================
Path("testar_adm_status_reset.mjs").write_text('''import assert from "node:assert/strict";\n\nimport {\n  ADMIN_STATUS_RESET_VALUES,\n  resetProfileStatus\n} from "./src/systems/admin.js";\n\n\nconst profile = {\n  strength: 500,\n  magicStrength: 700,\n  speed: 525,\n  evasion: 300,\n  accuracy: 190,\n  defense: 10010,\n  statusPoints: 999999884\n};\n\n\nconst result =\n  resetProfileStatus(\n    profile\n  );\n\n\nassert.equal(\n  result.ok,\n  true\n);\n\nassert.deepEqual(\n  profile,\n  ADMIN_STATUS_RESET_VALUES\n);\n\nassert.equal(\n  profile.statusPoints,\n  0\n);\n\nassert.equal(\n  profile.strength,\n  5\n);\n\nassert.equal(\n  profile.magicStrength,\n  5\n);\n\nassert.equal(\n  profile.speed,\n  5\n);\n\nassert.equal(\n  profile.evasion,\n  5\n);\n\nassert.equal(\n  profile.accuracy,\n  90\n);\n\nassert.equal(\n  profile.defense,\n  5\n);\n\nconsole.log(\n  "✅ Status Points guardados foram zerados."\n);\n\nconsole.log(\n  "✅ Atributos distribuídos voltaram aos valores de reset ADM."\n);\n\nconsole.log(\n  "✅ Defesa voltou para 5 conforme a regra definida."\n);\n\nconsole.log(\n  "\\n🛠️ TODOS OS TESTES DE RESET ADM DE STATUS PASSARAM."\n);\n''', encoding="utf-8")
