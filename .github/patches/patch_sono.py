from pathlib import Path


# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")


marker = '''import {
  applyConfusionEffect,
  consumeConfusionAction
} from "../systems/confusion.js";'''
addition = '''import {
  applyConfusionEffect,
  consumeConfusionAction
} from "../systems/confusion.js";

import {
  applySleepEffect,
  consumeSleepBlock,
  wakeSleepOnDirectDamage
} from "../systems/sleep.js";'''

if marker not in text:
    raise SystemExit("Import de confusion.js nao encontrado")

text = text.replace(
    marker,
    addition,
    1
)


# Dano ofensivo direto acorda um alvo que ja estava dormindo.
old = '''  defender.hp =
    Math.max(
      0,
      defender.hp -
      result.damage
    );


  return {
    kind: "damage",'''
new = '''  defender.hp =
    Math.max(
      0,
      defender.hp -
      result.damage
    );


  const sleepWake =
    wakeSleepOnDirectDamage(
      defender,
      result.damage
    );


  return {
    kind: "damage",'''

if old not in text:
    raise SystemExit("Bloco de dano direto nao encontrado")

text = text.replace(
    old,
    new,
    1
)

old = '''    damage:
      result.damage,

    defenderHp:
      defender.hp
  };
}'''
new = '''    damage:
      result.damage,

    defenderHp:
      defender.hp,

    sleepWake
  };
}'''

if old not in text:
    raise SystemExit("Retorno de dano direto nao encontrado")

text = text.replace(
    old,
    new,
    1
)


# Debuffs genericos tambem causam dano direto e devem acordar.
old = '''  defender.hp =
    Math.max(
      0,
      defender.hp -
      offensive.damage
    );


  /*
   * Depois aplica o Debuff.
   */'''
new = '''  defender.hp =
    Math.max(
      0,
      defender.hp -
      offensive.damage
    );


  const sleepWake =
    wakeSleepOnDirectDamage(
      defender,
      offensive.damage
    );


  /*
   * Depois aplica o Debuff.
   */'''

if old not in text:
    raise SystemExit("Dano de Debuff nao encontrado")

text = text.replace(
    old,
    new,
    1
)

old = '''    defenderHp:
      defender.hp,

    debuffApplied:
      debuff.ok,'''
new = '''    defenderHp:
      defender.hp,

    sleepWake,

    debuffApplied:
      debuff.ok,'''

if old not in text:
    raise SystemExit("Retorno de Debuff nao encontrado")

text = text.replace(
    old,
    new,
    1
)


# Acao que aplica Sono. O dano da propria habilidade acontece antes
# de o efeito ser criado, portanto esse dano nao acorda o Sono novo.
marker = "\n\nfunction executeConfusionAction("
sleep_function = r'''

function executeSleepAction(
  attacker,
  defender,
  action,
  currentTurn
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
      kind: "sleep",
      sleepApplied: false,
      sleep: null
    };
  }


  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,
      kind: "sleep",
      sleepApplied: false,
      sleep: null
    };
  }


  const sleep =
    applySleepEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,
    kind: "sleep",
    sleepApplied:
      sleep.ok,
    sleep
  };
}
'''

if marker not in text:
    raise SystemExit("Ponto de executeConfusionAction nao encontrado")

text = text.replace(
    marker,
    sleep_function + marker,
    1
)


# Roteamento por controlType.
marker = '''  if (
    controlType ===
    "paralisia"
  ) {'''
sleep_branch = '''  /*
   * ==============================
   * SONO
   * ==============================
   */
  if (
    controlType ===
    "sono"
  ) {
    return executeSleepAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }


'''

if marker not in text:
    raise SystemExit("Branch de Paralisia nao encontrado")

text = text.replace(
    marker,
    sleep_branch + marker,
    1
)


# Execucao bloqueada pelo Sono.
marker = "\n\nfunction createConfusionSelfHitExecution("
helper = r'''

function createSleepBlockedExecution(
  player,
  action,
  sleepResult
) {
  return {
    kind:
      "sleep_blocked",

    attacker:
      player.user,

    skill:
      action.skill.nome,

    blocked:
      true,

    sleep:
      sleepResult?.effect ??
      null,

    remainingBlocks:
      sleepResult?.remainingBlocks ??
      0
  };
}
'''

if marker not in text:
    raise SystemExit("Helper de Confusao nao encontrado")

text = text.replace(
    marker,
    helper + marker,
    1
)


# Primeiro jogador: Sono e verificado depois de Controle e antes de Silencio.
old = '''    const firstSilence =
      checkSilenceRestriction(
        first.player,
        first.action.skill,
        battle.turn
      );'''
new = '''    const firstSleep =
      consumeSleepBlock(
        first.player
      );


    const firstSilence =
      checkSilenceRestriction(
        first.player,
        first.action.skill,
        battle.turn
      );'''

if old not in text:
    raise SystemExit("firstSilence nao encontrado")

text = text.replace(
    old,
    new,
    1
)

old = '''    else if (
      firstSilence.blocked
    ) {
      firstExecution =
        createSilenceBlockedExecution(
          first.player,
          first.action,
          firstSilence
        );
    }


    else {'''
new = '''    else if (
      firstSleep.blocked
    ) {
      firstExecution =
        createSleepBlockedExecution(
          first.player,
          first.action,
          firstSleep
        );
    }


    else if (
      firstSilence.blocked
    ) {
      firstExecution =
        createSilenceBlockedExecution(
          first.player,
          first.action,
          firstSilence
        );
    }


    else {'''

if old not in text:
    raise SystemExit("Condicao firstSilence nao encontrada")

text = text.replace(
    old,
    new,
    1
)


# Segundo jogador: este check ocorre DEPOIS da primeira execucao.
# Assim, se o primeiro causar dano direto, wakeSleepOnDirectDamage remove
# o Sono e o segundo pode agir normalmente no mesmo turno.
old = '''    const secondSilence =
      checkSilenceRestriction(
        second.player,
        second.action.skill,
        battle.turn
      );'''
new = '''    const secondSleep =
      consumeSleepBlock(
        second.player
      );


    const secondSilence =
      checkSilenceRestriction(
        second.player,
        second.action.skill,
        battle.turn
      );'''

if old not in text:
    raise SystemExit("secondSilence nao encontrado")

text = text.replace(
    old,
    new,
    1
)

old = '''    else if (
      secondSilence.blocked
    ) {
      secondExecution =
        createSilenceBlockedExecution(
          second.player,
          second.action,
          secondSilence
        );
    }


    else {'''
new = '''    else if (
      secondSleep.blocked
    ) {
      secondExecution =
        createSleepBlockedExecution(
          second.player,
          second.action,
          secondSleep
        );
    }


    else if (
      secondSilence.blocked
    ) {
      secondExecution =
        createSilenceBlockedExecution(
          second.player,
          second.action,
          secondSilence
        );
    }


    else {'''

if old not in text:
    raise SystemExit("Condicao secondSilence nao encontrada")

text = text.replace(
    old,
    new,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# attack.js
# ============================================================
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")


# Mensagem de acao bloqueada.
marker = '''    if (
      execution.kind ===
      "confusion_self_hit"
    ) {'''
sleep_blocked = r'''    if (
      execution.kind ===
      "sleep_blocked"
    ) {
      const source =
        execution.sleep?.source
          ? ` por ${execution.sleep.source}`
          : "";


      return (
        `💤 @${execution.attacker} tentou usar ${execution.skill}, ` +
        `mas está Dormindo${source} e perdeu a ação.`
      );
    }


'''

if marker not in text:
    raise SystemExit("Bloco confusion_self_hit nao encontrado")

text = text.replace(
    marker,
    sleep_blocked + marker,
    1
)


# Mensagem da habilidade que aplica Sono.
marker = '''    if (
      execution.kind ===
      "confusion"
    ) {'''
sleep_message = r'''    if (
      execution.kind ===
      "sleep"
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
        execution.sleepApplied &&
        execution.sleep
      ) {
        text +=
          ` 💤 @${execution.defender} adormeceu por até ` +
          `${execution.sleep.duration} ações. ` +
          `Dano direto recebido depois da aplicação o acorda.`;
      }


      return text;
    }


'''

if marker not in text:
    raise SystemExit("Bloco confusion de attack.js nao encontrado")

text = text.replace(
    marker,
    sleep_message + marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# estado.js
# ============================================================
path = Path("src/routes/estado.js")
text = path.read_text(encoding="utf-8")

marker = '''  /*
   * ==============================
   * CONFUSAO
   * =============================='''
sleep_state = r'''  /*
   * ==============================
   * SONO
   * ==============================
   */
  if (
    type === "sono" &&
    effect.effectCategory ===
      "sleep"
  ) {
    const remaining =
      Math.max(
        0,
        Number(
          effect.remainingBlocks
        ) || 0
      );


    return (
      `💤 ${name || "Sono"} — ` +
      `Dormindo (${remaining} ação(ões))`
    );
  }


'''

if marker not in text:
    raise SystemExit("Bloco CONFUSAO de estado.js nao encontrado")

text = text.replace(
    marker,
    sleep_state + marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)
