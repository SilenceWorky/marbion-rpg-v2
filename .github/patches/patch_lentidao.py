from pathlib import Path


# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

marker = '''import {
  applySilenceEffect,
  checkSilenceRestriction
} from "../systems/silence.js";'''
addition = '''import {
  applySilenceEffect,
  checkSilenceRestriction
} from "../systems/silence.js";

import {
  applySlowEffect
} from "../systems/slowdown.js";'''

if marker not in text:
    raise SystemExit("Import de silence.js nao encontrado")

text = text.replace(
    marker,
    addition,
    1
)

marker = "\n\nfunction executeSilenceAction("
slow_function = r'''

function executeSlowAction(
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
      kind: "slow",
      slowApplied: false,
      slow: null
    };
  }


  if (
    Number(
      defender.hp
    ) <= 0
  ) {
    return {
      ...base,
      kind: "slow",
      slowApplied: false,
      slow: null
    };
  }


  const slow =
    applySlowEffect(
      defender,
      action.skill,
      currentTurn
    );


  return {
    ...base,
    kind: "slow",
    slowApplied:
      slow.ok,
    slow
  };
}
'''

if marker not in text:
    raise SystemExit("Ponto de insercao de executeSlowAction nao encontrado")

text = text.replace(
    marker,
    slow_function + marker,
    1
)

marker = '''  /*
   * ==============================
   * CEGUEIRA
   * =============================='''
slow_branch = '''  /*
   * ==============================
   * LENTIDAO
   * ==============================
   *
   * Dano direto + reducao temporaria
   * de Velocidade. A ordem do turno
   * atual ja foi decidida; o efeito
   * altera os turnos seguintes.
   */
  if (
    debuffType ===
    "lentidao"
  ) {
    return executeSlowAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }

'''

if marker not in text:
    raise SystemExit("Bloco CEGUEIRA nao encontrado")

text = text.replace(
    marker,
    slow_branch + marker,
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
      "blindness"
    ) {'''
slow_message = r'''    if (
      execution.kind ===
      "slow"
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
        execution.slowApplied &&
        execution.slow
      ) {
        text +=
          ` 🐌 @${execution.defender} ficou Lento: ` +
          `Velocidade -${execution.slow.amount} ` +
          `por ${execution.slow.duration} turnos.`;
      }


      return text;
    }


'''

if marker not in text:
    raise SystemExit("Bloco blindness de attack.js nao encontrado")

text = text.replace(
    marker,
    slow_message + marker,
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
   * CEGUEIRA
   * =============================='''
slow_state = r'''  /*
   * ==============================
   * LENTIDAO
   * ==============================
   */
  if (
    type === "debuff" &&
    subtype ===
      "lentidao" &&
    effect.stat ===
      "speed" &&
    Number.isFinite(
      Number(
        effect.amount
      )
    )
  ) {
    const amount =
      Math.abs(
        Number(
          effect.amount
        )
      );


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
      `🐌 ${name || "Lentidão"} — ` +
      `Velocidade -${amount} (${remaining}T)`
    );
  }


'''

if marker not in text:
    raise SystemExit("Bloco CEGUEIRA de estado.js nao encontrado")

text = text.replace(
    marker,
    slow_state + marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)
