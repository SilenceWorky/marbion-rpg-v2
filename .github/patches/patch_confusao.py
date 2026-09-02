from pathlib import Path


# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")


marker = '''import {
  applySlowEffect
} from "../systems/slowdown.js";'''
addition = '''import {
  applySlowEffect
} from "../systems/slowdown.js";

import {
  applyConfusionEffect,
  consumeConfusionAction
} from "../systems/confusion.js";'''

if marker not in text:
    raise SystemExit("Import de slowdown.js nao encontrado")

text = text.replace(
    marker,
    addition,
    1
)


marker = "\n\nfunction executeSlowAction("
confusion_function = r'''

function executeConfusionAction(
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
      kind: "confusion",
      confusionApplied: false,
      confusion: null
    };
  }


  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,
      kind: "confusion",
      confusionApplied: false,
      confusion: null
    };
  }


  const confusion =
    applyConfusionEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,
    kind: "confusion",
    confusionApplied:
      confusion.ok,
    confusion
  };
}
'''

if marker not in text:
    raise SystemExit("Ponto de executeSlowAction nao encontrado")

text = text.replace(
    marker,
    confusion_function + marker,
    1
)


marker = '''  /*
   * ==============================
   * LENTIDAO
   * =============================='''
confusion_branch = '''  /*
   * ==============================
   * CONFUSAO
   * ==============================
   *
   * Dano direto + efeito que verifica
   * as proximas acoes do alvo.
   */
  if (
    debuffType ===
    "confusao"
  ) {
    return executeConfusionAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

'''

if marker not in text:
    raise SystemExit("Bloco LENTIDAO nao encontrado")

text = text.replace(
    marker,
    confusion_branch + marker,
    1
)


marker = "\nexport class PvpCoordinator {"
helper = r'''

function createConfusionSelfHitExecution(
  player,
  action,
  confusionResult
) {
  return {
    kind:
      "confusion_self_hit",

    attacker:
      player.user,

    defender:
      player.user,

    skill:
      action.skill.nome,

    hit:
      true,

    blocked:
      true,

    damage:
      confusionResult.damage,

    hpAfter:
      confusionResult.hpAfter,

    confusion:
      confusionResult.effect,

    remainingActions:
      confusionResult.remainingActions
  };
}
'''

if marker not in text:
    raise SystemExit("Classe PvpCoordinator nao encontrada")

text = text.replace(
    marker,
    helper + marker,
    1
)


old = '''    else {
      spendSkillMentalidade(
        first.player,
        first.action.skill
      );


      firstExecution =
        executeBattleAction(
          first.player,
          second.player,
          first.action,
          battle.turn
        );


      /*
       * Só consumimos a habilidade
       * porque ela realmente executou.
       */
      await this.consumeExecutedSkill(
        first.player,
        first.action
      );
    }'''

new = '''    else {
      const firstConfusion =
        consumeConfusionAction(
          first.player
        );


      if (
        firstConfusion.selfHit
      ) {
        firstExecution =
          createConfusionSelfHitExecution(
            first.player,
            first.action,
            firstConfusion
          );
      }

      else {
        spendSkillMentalidade(
          first.player,
          first.action.skill
        );


        firstExecution =
          executeBattleAction(
            first.player,
            second.player,
            first.action,
            battle.turn
          );


        /*
         * Só consumimos a habilidade
         * porque ela realmente executou.
         */
        await this.consumeExecutedSkill(
          first.player,
          first.action
        );
      }
    }'''

if old not in text:
    raise SystemExit("Bloco de execucao do primeiro jogador nao encontrado")

text = text.replace(
    old,
    new,
    1
)


old = '''    else {
      spendSkillMentalidade(
        second.player,
        second.action.skill
      );


      secondExecution =
        executeBattleAction(
          second.player,
          first.player,
          second.action,
          battle.turn,
          {
            defenderAlreadyActed:
              true
          }
        );


      await this.consumeExecutedSkill(
        second.player,
        second.action
      );
    }'''

new = '''    else {
      const secondConfusion =
        consumeConfusionAction(
          second.player
        );


      if (
        secondConfusion.selfHit
      ) {
        secondExecution =
          createConfusionSelfHitExecution(
            second.player,
            second.action,
            secondConfusion
          );
      }

      else {
        spendSkillMentalidade(
          second.player,
          second.action.skill
        );


        secondExecution =
          executeBattleAction(
            second.player,
            first.player,
            second.action,
            battle.turn,
            {
              defenderAlreadyActed:
                true
            }
          );


        await this.consumeExecutedSkill(
          second.player,
          second.action
        );
      }
    }'''

if old not in text:
    raise SystemExit("Bloco de execucao do segundo jogador nao encontrado")

text = text.replace(
    old,
    new,
    1
)


# Se o primeiro jogador se auto-derrotar por Confusao,
# a luta precisa terminar antes da segunda acao.
old = '''    if (
    second.player.hp <= 0
    ) {
    battleOver =
        true;

    winner =
        first.player.user;

    loser =
        second.player.user;
    }'''

new = '''    if (
    first.player.hp <= 0
    ) {
    battleOver =
        true;

    winner =
        second.player.user;

    loser =
        first.player.user;
    }

    else if (
    second.player.hp <= 0
    ) {
    battleOver =
        true;

    winner =
        first.player.user;

    loser =
        second.player.user;
    }'''

if old not in text:
    raise SystemExit("Bloco de KO depois da primeira acao nao encontrado")

text = text.replace(
    old,
    new,
    1
)


# Se o segundo jogador se auto-derrotar por Confusao,
# o primeiro deve vencer.
old = '''    if (
        first.player.hp <= 0
    ) {
        battleOver =
        true;

        winner =
        second.player.user;

        loser =
        first.player.user;
    }'''

new = '''    if (
        second.player.hp <= 0
    ) {
        battleOver =
        true;

        winner =
        first.player.user;

        loser =
        second.player.user;
    }

    else if (
        first.player.hp <= 0
    ) {
        battleOver =
        true;

        winner =
        second.player.user;

        loser =
        first.player.user;
    }'''

if old not in text:
    raise SystemExit("Bloco de KO depois da segunda acao nao encontrado")

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

marker = '''    if (
      execution.kind ===
      "silence_blocked"
    ) {'''
self_hit_message = r'''    if (
      execution.kind ===
      "confusion_self_hit"
    ) {
      const playerHpData =
        hpData.player1.user ===
        execution.attacker
          ? hpData.player1
          : hpData.player2;


      const source =
        execution.confusion?.source
          ? ` por ${execution.confusion.source}`
          : "";


      return (
        `😵 @${execution.attacker} se confundiu${source}, ` +
        `se feriu em ${execution.damage} de dano e perdeu a ação ` +
        `que usaria ${execution.skill}. ` +
        `HP: ${execution.hpAfter}/${playerHpData.max}.`
      );
    }


'''

if marker not in text:
    raise SystemExit("Bloco silence_blocked de attack.js nao encontrado")

text = text.replace(
    marker,
    self_hit_message + marker,
    1
)


marker = '''    if (
      execution.kind ===
      "slow"
    ) {'''
confusion_message = r'''    if (
      execution.kind ===
      "confusion"
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
        execution.confusionApplied &&
        execution.confusion
      ) {
        text +=
          ` 😵 @${execution.defender} ficou Confuso por ` +
          `${execution.confusion.duration} ações: ` +
          `50% de chance de agir normalmente e 50% de chance ` +
          `de se ferir e perder a ação.`;
      }


      return text;
    }


'''

if marker not in text:
    raise SystemExit("Bloco slow de attack.js nao encontrado")

text = text.replace(
    marker,
    confusion_message + marker,
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
   * LENTIDAO
   * =============================='''
confusion_state = r'''  /*
   * ==============================
   * CONFUSAO
   * ==============================
   */
  if (
    type === "confusao" &&
    effect.effectCategory ===
      "disruption"
  ) {
    const remaining =
      Math.max(
        0,
        Number(
          effect.remainingActions
        ) || 0
      );


    return (
      `😵 ${name || "Confusão"} — ` +
      `Confusão (${remaining} ação(ões))`
    );
  }


'''

if marker not in text:
    raise SystemExit("Bloco LENTIDAO de estado.js nao encontrado")

text = text.replace(
    marker,
    confusion_state + marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)
