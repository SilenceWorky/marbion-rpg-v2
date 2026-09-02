from pathlib import Path


# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

marker = '''  MEDITATION_SKILL
} from "../systems/skill-effects.js";'''
addition = '''  MEDITATION_SKILL
} from "../systems/skill-effects.js";

import {
  applySilenceEffect,
  checkSilenceRestriction
} from "../systems/silence.js";'''
if marker not in text:
    raise SystemExit("Import de skill-effects nao encontrado")
text = text.replace(marker, addition, 1)

marker = "\n\nfunction executePoisonAction("
silence_function = '''

function executeSilenceAction(
  attacker,
  defender,
  action,
  currentTurn,
  defenderAlreadyActed = false
) {
  const base =
    executeOffensiveAction(
      attacker,
      defender,
      action
    );


  if (!base.hit) {
    return {
      ...base,
      kind: "silence",
      silenceApplied: false,
      silence: null
    };
  }


  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,
      kind: "silence",
      silenceApplied: false,
      silence: null
    };
  }


  const silence =
    applySilenceEffect(
      defender,
      action.skill,
      currentTurn,
      {
        targetAlreadyActed:
          defenderAlreadyActed
      }
    );


  return {
    ...base,
    kind: "silence",
    silenceApplied:
      silence.ok,
    silence
  };
}
'''
if marker not in text:
    raise SystemExit("Ponto de insercao de executeSilenceAction nao encontrado")
text = text.replace(marker, silence_function + marker, 1)

marker = '''  const controlType =
    String(
      action?.skill?.controlType ?? ""
    )
      .trim()
      .toLowerCase();'''
addition = marker + '''

  const restrictionType =
    String(
      action?.skill?.restrictionType ?? ""
    )
      .trim()
      .toLowerCase();'''
if marker not in text:
    raise SystemExit("controlType nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''  /*
   * ==============================
   * CEGUEIRA
   * ==============================
   *
   * Dano direto + reducao temporaria
   * de Precisao.
   */'''
addition = '''  /*
   * ==============================
   * SILÊNCIO
   * ==============================
   *
   * Dano direto + restrição temporária
   * a habilidades não físicas.
   */
  if (
    restrictionType ===
      "silencio"
  ) {
    return executeSilenceAction(
      attacker,
      defender,
      action,
      currentTurn,
      defenderAlreadyActed
    );
  }


''' + marker
if marker not in text:
    raise SystemExit("Bloco de Cegueira nao encontrado")
text = text.replace(marker, addition, 1)

marker = "\nexport class PvpCoordinator {"
helper = '''

function createSilenceBlockedExecution(
  player,
  action,
  silenceResult
) {
  return {
    kind:
      "silence_blocked",

    attacker:
      player.user,

    skill:
      action?.skill?.nome ??
      "Habilidade",

    blocked:
      true,

    silence:
      silenceResult?.effect ??
      null
  };
}
'''
if marker not in text:
    raise SystemExit("Classe PvpCoordinator nao encontrada")
text = text.replace(marker, helper + marker, 1)

marker = '''    const mentalidadeCheck =
      canPaySkillCost(
        player,
        selectedAction.skill
      );'''
addition = '''    const silenceSelection =
      checkSilenceRestriction(
        player,
        selectedAction.skill,
        battle.turn
      );


    if (
      silenceSelection.blocked
    ) {
      return {
        ok: false,
        error:
          "SILENCED_SKILL",
        slot:
          normalizedSlot,
        skill:
          selectedAction.skill.nome,
        source:
          silenceSelection.effect?.source ??
          "Silêncio",
        expiresAtTurn:
          silenceSelection.effect?.expiresAtTurn ??
          null
      };
    }


''' + marker
if marker not in text:
    raise SystemExit("mentalidadeCheck nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''    const firstControl =
      consumeControlBlock(
        first.player
      );


    let firstExecution;'''
addition = '''    const firstControl =
      consumeControlBlock(
        first.player
      );


    const firstSilence =
      checkSilenceRestriction(
        first.player,
        first.action.skill,
        battle.turn
      );


    let firstExecution;'''
if marker not in text:
    raise SystemExit("firstControl nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''    else {
      spendSkillMentalidade(
        first.player,
        first.action.skill
      );'''
addition = '''    else if (
      firstSilence.blocked
    ) {
      firstExecution =
        createSilenceBlockedExecution(
          first.player,
          first.action,
          firstSilence
        );
    }


''' + marker
if marker not in text:
    raise SystemExit("Execucao normal do primeiro jogador nao encontrada")
text = text.replace(marker, addition, 1)

marker = '''    const secondControl =
      consumeControlBlock(
        second.player
      );'''
addition = marker + '''


    const secondSilence =
      checkSilenceRestriction(
        second.player,
        second.action.skill,
        battle.turn
      );'''
if marker not in text:
    raise SystemExit("secondControl nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''    else {
      spendSkillMentalidade(
        second.player,
        second.action.skill
      );'''
addition = '''    else if (
      secondSilence.blocked
    ) {
      secondExecution =
        createSilenceBlockedExecution(
          second.player,
          second.action,
          secondSilence
        );
    }


''' + marker
if marker not in text:
    raise SystemExit("Execucao normal do segundo jogador nao encontrada")
text = text.replace(marker, addition, 1)

path.write_text(text, encoding="utf-8")


# ============================================================
# attack.js
# ============================================================
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")

marker = '''    if (
      result.error ===
      "INVALID_SLOT"
    ) {'''
addition = '''    if (
      result.error ===
      "SILENCED_SKILL"
    ) {
      return new Response(
        `@${user}, você está Silenciado por ${result.source || "Silêncio"}. ` +
        `Enquanto durar, use Soco, uma habilidade Física ou !meditar.`
      );
    }


''' + marker
if marker not in text:
    raise SystemExit("INVALID_SLOT em attack.js nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''    if (
      execution.kind ===
      "control_blocked"
    ) {'''
addition = '''    if (
      execution.kind ===
      "silence_blocked"
    ) {
      const source =
        execution.silence?.source
          ? ` por ${execution.silence.source}`
          : "";

      return (
        `🤐 @${execution.attacker} tentou usar ${execution.skill}, ` +
        `mas está Silenciado${source} e não conseguiu usar a habilidade por causa do Silêncio.`
      );
    }


''' + marker
if marker not in text:
    raise SystemExit("control_blocked em attack.js nao encontrado")
text = text.replace(marker, addition, 1)

marker = '''    if (
      execution.kind ===
      "blindness"
    ) {'''
addition = '''    if (
      execution.kind ===
      "silence"
    ) {
      if (!execution.hit) {
        return (
          `@${execution.attacker} usou ${execution.skill}, ` +
          `mas errou.`
        );
      }


      const defenderHpData =
        hpData.player1.user ===
        execution.defender
          ? hpData.player1
          : hpData.player2;


      const hpAfterExecution =
        Number.isFinite(
          Number(
            execution.defenderHp
          )
        )
          ? Number(
              execution.defenderHp
            )
          : defenderHpData.current;


      let text =
        `@${execution.attacker} usou ${execution.skill} ` +
        `e causou ${execution.damage} de dano em ` +
        `@${execution.defender}. ` +
        `HP: ${hpAfterExecution}/${defenderHpData.max}.`;


      if (
        execution.silenceApplied &&
        execution.silence
      ) {
        text +=
          ` 🤐 @${execution.defender} ficou Silenciado: ` +
          `apenas habilidades Físicas e Meditação ` +
          `por ${execution.silence.duration} turnos.`;
      }


      return text;
    }


''' + marker
if marker not in text:
    raise SystemExit("blindness em attack.js nao encontrado")
text = text.replace(marker, addition, 1)

path.write_text(text, encoding="utf-8")


# ============================================================
# estado.js
# ============================================================
path = Path("src/routes/estado.js")
text = path.read_text(encoding="utf-8")

marker = '''  /*
   * ==============================
   * DANO PERIÓDICO
   * =============================='''
addition = '''  /*
   * ==============================
   * SILÊNCIO
   * ==============================
   */
  if (
    type === "silencio" &&
    effect.effectCategory ===
      "restriction"
  ) {
    const remaining =
      Number.isFinite(
        Number(
          effect.expiresAtTurn
        )
      )
        ? Math.max(
            0,
            Number(
              effect.expiresAtTurn
            ) -
            Number(turn)
          )
        : 0;


    return (
      `🤐 ${name || "Silêncio"} — ` +
      `Silêncio: apenas Físicas/Meditação (${remaining}T)`
    );
  }


''' + marker
if marker not in text:
    raise SystemExit("Ponto de formatacao de efeitos em estado.js nao encontrado")
text = text.replace(marker, addition, 1)

path.write_text(text, encoding="utf-8")
