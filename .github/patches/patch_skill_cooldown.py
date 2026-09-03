from pathlib import Path

# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

# Import do motor de cooldown.
anchor = '''} from "../systems/reactions.js";\n\nconst CHALLENGE_TIMEOUT =\n'''
insert = '''} from "../systems/reactions.js";\n\nimport {\n  ensurePlayerSkillCooldowns,\n  getSkillCooldownStatus,\n  startSkillCooldown\n} from "../systems/cooldown.js";\n\nconst CHALLENGE_TIMEOUT =\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor de import reactions nao encontrado")
    text = text.replace(anchor, insert, 1)

# Compatibilidade com batalhas criadas antes da atualização.
anchor = '''    async ensurePlayerSnapshot(\n        player\n    ) {\n    const requiredStats = [\n'''
insert = '''    async ensurePlayerSnapshot(\n        player\n    ) {\n    ensurePlayerSkillCooldowns(\n        player\n    );\n\n    const requiredStats = [\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor ensurePlayerSnapshot nao encontrado")
    text = text.replace(anchor, insert, 1)

# Snapshot de cooldown do Player 1.
anchor = '''        reflectElements:\n            getReflectableElements(\n            challengerProfile\n            ),\n\n        action:\n            null\n'''
insert = '''        reflectElements:\n            getReflectableElements(\n            challengerProfile\n            ),\n\n        skillCooldowns:\n            {},\n\n        action:\n            null\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor skillCooldowns player1 nao encontrado")
    text = text.replace(anchor, insert, 1)

# Snapshot de cooldown do Player 2.
anchor = '''    reflectElements:\n        getReflectableElements(\n        targetProfile\n        ),\n\n    action:\n        null\n'''
insert = '''    reflectElements:\n        getReflectableElements(\n        targetProfile\n        ),\n\n    skillCooldowns:\n        {},\n\n    action:\n        null\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor skillCooldowns player2 nao encontrado")
    text = text.replace(anchor, insert, 1)

# Validação antes de registrar a escolha do slot.
anchor = '''    const mentalidadeCheck =\n      canPaySkillCost(\n        player,\n        selectedAction.skill\n      );\n'''
insert = '''    const cooldownCheck =\n      getSkillCooldownStatus(\n        player,\n        selectedAction,\n        battle.turn\n      );\n\n\n    if (\n      !cooldownCheck.ready\n    ) {\n      return {\n        ok: false,\n        error:\n          "SKILL_COOLDOWN",\n        slot:\n          normalizedSlot,\n        skill:\n          selectedAction.skill.nome,\n        currentTurn:\n          battle.turn,\n        availableAtTurn:\n          cooldownCheck.availableAtTurn,\n        turnsRemaining:\n          cooldownCheck.turnsRemaining\n      };\n    }\n\n\n    const mentalidadeCheck =\n      canPaySkillCost(\n        player,\n        selectedAction.skill\n      );\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor mentalidadeCheck nao encontrado")
    text = text.replace(anchor, insert, 1)

# O primeiro jogador só entra em cooldown depois de executar de verdade.
anchor = '''        /*\n         * Só consumimos a habilidade\n         * porque ela realmente executou.\n         */\n        await this.consumeExecutedSkill(\n          first.player,\n          first.action\n        );\n'''
insert = '''        startSkillCooldown(\n          first.player,\n          first.action,\n          battle.turn\n        );\n\n\n        /*\n         * Só consumimos a habilidade\n         * porque ela realmente executou.\n         */\n        await this.consumeExecutedSkill(\n          first.player,\n          first.action\n        );\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor cooldown do primeiro jogador nao encontrado")
    text = text.replace(anchor, insert, 1)

# O segundo jogador só entra em cooldown depois de executar de verdade.
anchor = '''        await this.consumeExecutedSkill(\n          second.player,\n          second.action\n        );\n'''
insert = '''        startSkillCooldown(\n          second.player,\n          second.action,\n          battle.turn\n        );\n\n\n        await this.consumeExecutedSkill(\n          second.player,\n          second.action\n        );\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor cooldown do segundo jogador nao encontrado")
    text = text.replace(anchor, insert, 1)

path.write_text(text, encoding="utf-8")

# ============================================================
# attack.js
# ============================================================
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")

anchor = '''    if (\n      result.error ===\n      "INSUFFICIENT_MENTALIDADE"\n    ) {\n'''
insert = '''    if (\n      result.error ===\n      "SKILL_COOLDOWN"\n    ) {\n      return new Response(\n        `@${user}, ${result.skill || `a habilidade ${result.slot}`} ainda está em cooldown. ` +\n        `Aguarde ${result.turnsRemaining} turno(s).`\n      );\n    }\n\n\n    if (\n      result.error ===\n      "INSUFFICIENT_MENTALIDADE"\n    ) {\n'''
if insert not in text:
    if anchor not in text:
        raise SystemExit("Anchor erro de Mentalidade nao encontrado em attack.js")
    text = text.replace(anchor, insert, 1)

path.write_text(text, encoding="utf-8")
