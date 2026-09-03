from pathlib import Path

# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

old = '''    let reaction =\n    null;\n\n    let battleOver =\n'''
new = '''    let reaction =\n    null;\n\n    let reactionAttempt =\n    null;\n\n    let battleOver =\n'''
if new not in text:
    if old not in text:
        raise SystemExit("Declaracao reaction nao encontrada")
    text = text.replace(old, new, 1)

anchor = '''    const reactionMatch =\n      firstExecution?.kind ===\n        "reaction_stance"\n        ? matchReaction(\n            first.action.skill,\n            second.action.skill,\n            first.player\n          )\n        : {\n            matched: false,\n            reactionType: null,\n            reason: "NO_STANCE"\n          };\n'''
block = '''\n\n    if (\n      firstExecution?.kind ===\n        "reaction_stance"\n    ) {\n      reactionAttempt = {\n        attempted: true,\n        activated: false,\n        type:\n          reactionMatch.reactionType,\n        user:\n          first.player.user,\n        skill:\n          first.action.skill.nome,\n        incomingUser:\n          second.player.user,\n        incomingSkill:\n          second.action.skill.nome,\n        incomingType:\n          second.action.skill.tipo ?? null,\n        element:\n          second.action.skill.elemento ?? null,\n        matched:\n          reactionMatch.matched,\n        reason:\n          reactionMatch.reason\n      };\n    }\n'''
if block not in text:
    if anchor not in text:
        raise SystemExit("reactionMatch nao encontrado")
    text = text.replace(anchor, anchor + block, 1)

try_anchor = '''        finally {\n          delete first.player.__directDamageMultiplier;\n        }\n\n\n        if (\n          reactionMatch.matched &&\n'''
try_block = '''        finally {\n          delete first.player.__directDamageMultiplier;\n        }\n\n\n        if (reactionAttempt) {\n          if (\n            secondExecution?.kind === "control_blocked" ||\n            secondExecution?.kind === "sleep_blocked" ||\n            secondExecution?.kind === "silence_blocked" ||\n            secondExecution?.kind === "confusion_self_hit"\n          ) {\n            reactionAttempt.reason =\n              "INCOMING_NOT_EXECUTED";\n          }\n          else if (\n            reactionMatch.matched &&\n            secondExecution?.hit === false\n          ) {\n            reactionAttempt.reason =\n              "INCOMING_MISSED";\n          }\n          else if (\n            reactionMatch.matched &&\n            Number(\n              secondExecution?.rawDamage\n            ) <= 0\n          ) {\n            reactionAttempt.reason =\n              "NO_DAMAGE_DEALT";\n          }\n        }\n\n\n        if (\n          reactionMatch.matched &&\n'''
if try_block not in text:
    if try_anchor not in text:
        raise SystemExit("Bloco try/finally da reacao nao encontrado")
    text = text.replace(try_anchor, try_block, 1)

activate_anchor = '''          firstExecution.activated =\n            true;\n\n          firstExecution.triggerSkill =\n            second.action.skill.nome;\n'''
activate_new = '''          firstExecution.activated =\n            true;\n\n          if (reactionAttempt) {\n            reactionAttempt.activated =\n              true;\n\n            reactionAttempt.reason =\n              null;\n          }\n\n          firstExecution.triggerSkill =\n            second.action.skill.nome;\n'''
if activate_new not in text:
    if activate_anchor not in text:
        raise SystemExit("Ativacao da reacao nao encontrada")
    text = text.replace(activate_anchor, activate_new, 1)

return_anchor = '''    reaction,\n\n    hp: {\n'''
return_new = '''    reaction,\n\n    reactionAttempt,\n\n    hp: {\n'''
if return_new not in text:
    if return_anchor not in text:
        raise SystemExit("Retorno reaction nao encontrado")
    text = text.replace(return_anchor, return_new, 1)

path.write_text(text, encoding="utf-8")

# ============================================================
# attack.js
# ============================================================
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")

old_stance = ''': `🪞 @${execution.user} preparou ${execution.skill} contra um golpe Elemental compatível.`;'''
new_stance = ''': `🪞 @${execution.user} preparou ${execution.skill} para tentar devolver um golpe Elemental do próprio elemento.`;'''
if new_stance not in text:
    if old_stance not in text:
        raise SystemExit("Mensagem de stance do Refletir nao encontrada")
    text = text.replace(old_stance, new_stance, 1)

anchor = '''    const reactionText =\n      formatReaction(\n        result.reaction\n      );\n'''
block = '''\n\n    function formatReactionAttempt(\n      attempt\n    ) {\n      if (\n        !attempt?.attempted ||\n        attempt.activated\n      ) {\n        return "";\n      }\n\n\n      const physical =\n        attempt.type ===\n        "counter_physical";\n\n      const icon =\n        physical\n          ? "⚔️"\n          : "🪞";\n\n      const label =\n        physical\n          ? "Contra-ataque"\n          : "Refletir";\n\n      const incoming =\n        attempt.incomingSkill ||\n        "a ação adversária";\n\n\n      if (\n        attempt.reason ===\n        "ELEMENT_NOT_OWNED"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} falhou: ` +\n          `${attempt.element || "esse elemento"} não pertence aos elementos refletíveis do personagem. ` +\n          `${incoming} foi recebido normalmente.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "NOT_ELEMENTAL"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} não ativou: ` +\n          `${incoming} não é um golpe Elemental.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "NOT_PHYSICAL"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} não ativou: ` +\n          `${incoming} não é um golpe Físico.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "NOT_DIRECT_DAMAGE"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} não ativou porque ` +\n          `${incoming} não causa dano direto compatível.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "INCOMING_MISSED"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} estava preparado, ` +\n          `mas ${incoming} errou e nada precisou ser devolvido.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "INCOMING_NOT_EXECUTED"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} não ativou porque ` +\n          `${incoming} não chegou a ser executado.`\n        );\n      }\n\n\n      if (\n        attempt.reason ===\n        "NO_DAMAGE_DEALT"\n      ) {\n        return (\n          `${icon} ${label} de @${attempt.user} não ativou porque ` +\n          `${incoming} não causou dano direto para devolver.`\n        );\n      }\n\n\n      return (\n        `${icon} ${label} de @${attempt.user} foi preparado, ` +\n        `mas não encontrou um golpe compatível para devolver.`\n      );\n    }\n\n\n    const reactionAttemptText =\n      reactionText\n        ? ""\n        : formatReactionAttempt(\n            result.reactionAttempt\n          );\n'''
if block not in text:
    if anchor not in text:
        raise SystemExit("reactionText nao encontrado")
    text = text.replace(anchor, anchor + block, 1)

append_anchor = '''    if (reactionText) {\n      message +=\n        ` ${reactionText}`;\n    }\n'''
append_new = '''    if (reactionText) {\n      message +=\n        ` ${reactionText}`;\n    }\n\n    if (reactionAttemptText) {\n      message +=\n        ` ${reactionAttemptText}`;\n    }\n'''
if append_new not in text:
    if append_anchor not in text:
        raise SystemExit("Append reactionText nao encontrado")
    text = text.replace(append_anchor, append_new, 1)

path.write_text(text, encoding="utf-8")

# ============================================================
# teste existente
# ============================================================
path = Path("testar_counter_refletir_pvp.mjs")
text = path.read_text(encoding="utf-8")

insert_anchor = '''assert.ok(\n  attackRoute.includes(\n    "formatReaction"\n  ),\n  "A rota de ataque precisa informar redução e devolução de dano."\n);\n'''
insert = '''\n\nassert.ok(\n  coordinator.includes(\n    "reactionAttempt"\n  ),\n  "PvP precisa expor quando uma postura foi preparada mas não ativou."\n);\n\nassert.ok(\n  attackRoute.includes(\n    "ELEMENT_NOT_OWNED"\n  ),\n  "A rota precisa explicar quando Refletir falha por elemento incompatível."\n);\n\nassert.ok(\n  attackRoute.includes(\n    "foi recebido normalmente"\n  ),\n  "A mensagem deve deixar explícito que o golpe incompatível não foi refletido."\n);\n'''
if insert not in text:
    if insert_anchor not in text:
        raise SystemExit("Anchor do teste nao encontrado")
    text = text.replace(insert_anchor, insert_anchor + insert, 1)

log_anchor = '''console.log(\n  "✅ Integração do PvP contém snapshot, redução e devolução de dano."\n);\n'''
log_new = '''console.log(\n  "✅ Integração do PvP contém snapshot, redução e devolução de dano."\n);\nconsole.log(\n  "✅ Falhas de Counter/Refletir agora informam o motivo no chat."\n);\n'''
if log_new not in text:
    if log_anchor not in text:
        raise SystemExit("Log final do teste nao encontrado")
    text = text.replace(log_anchor, log_new, 1)

path.write_text(text, encoding="utf-8")
