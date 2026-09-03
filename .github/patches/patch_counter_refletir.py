from pathlib import Path


path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")


# ------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------
sleep_import = '''import {
  applySleepEffect,
  consumeSleepBlock,
  wakeSleepOnDirectDamage
} from "../systems/sleep.js";
'''

reaction_import = '''import {
  getReactionType,
  getReflectableElements,
  matchReaction,
  splitReactionDamage,
  PHYSICAL_COUNTER_TYPE,
  ELEMENTAL_REFLECT_TYPE,
  REACTION_DAMAGE_TAKEN_MULTIPLIER
} from "../systems/reactions.js";
'''

if reaction_import not in text:
    if sleep_import not in text:
        raise SystemExit("Import de sleep não encontrado")
    text = text.replace(
        sleep_import,
        sleep_import + "\n" + reaction_import,
        1
    )


# ------------------------------------------------------------
# EXECUÇÃO OFENSIVA COM MULTIPLICADOR DE DANO DIRETO
# ------------------------------------------------------------
start = text.index("function executeOffensiveAction(")
end = text.index("function executeDebuffAction(", start)

new_offensive = '''function executeOffensiveAction(
  attacker,
  defender,
  action
) {
  const result =
    resolveOffensiveSkill(
      attacker,
      defender,
      action.skill
    );


  if (!result.hit) {
    return {
      kind: "damage",

      attacker:
        attacker.user,

      defender:
        defender.user,

      skill:
        action.skill.nome,

      hit:
        false,

      hitChance:
        result.hitChance,

      rawDamage:
        0,

      damage:
        0,

      defenderHp:
        defender.hp
    };
  }


  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          result.damage
        ) || 0
      )
    );


  const incomingMultiplier =
    Number.isFinite(
      Number(
        defender?.__directDamageMultiplier
      )
    )
      ? Math.max(
          0,
          Number(
            defender.__directDamageMultiplier
          )
        )
      : 1;


  const damage =
    Math.max(
      0,
      Math.ceil(
        rawDamage *
        incomingMultiplier
      )
    );


  defender.hp =
    Math.max(
      0,
      defender.hp -
      damage
    );


  const sleepWake =
    wakeSleepOnDirectDamage(
      defender,
      damage
    );


  return {
    kind: "damage",

    attacker:
      attacker.user,

    defender:
      defender.user,

    skill:
      action.skill.nome,

    hit:
      true,

    hitChance:
      result.hitChance,

    rawDamage,

    damage,

    defenderHp:
      defender.hp,

    sleepWake
  };
}


'''

text = text[:start] + new_offensive + text[end:]


start = text.index("function executeDebuffAction(")
end = text.index("function executeBlindnessAction(", start)

new_debuff = '''function executeDebuffAction(
  attacker,
  defender,
  action,
  currentTurn
) {
  const offensive =
    resolveOffensiveSkill(
      attacker,
      defender,
      action.skill
    );


  if (!offensive.hit) {
    return {
      kind:
        "debuff",

      attacker:
        attacker.user,

      defender:
        defender.user,

      skill:
        action.skill.nome,

      hit:
        false,

      hitChance:
        offensive.hitChance,

      rawDamage:
        0,

      damage:
        0,

      debuffApplied:
        false,

      defenderHp:
        defender.hp
    };
  }


  const rawDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          offensive.damage
        ) || 0
      )
    );


  const incomingMultiplier =
    Number.isFinite(
      Number(
        defender?.__directDamageMultiplier
      )
    )
      ? Math.max(
          0,
          Number(
            defender.__directDamageMultiplier
          )
        )
      : 1;


  const damage =
    Math.max(
      0,
      Math.ceil(
        rawDamage *
        incomingMultiplier
      )
    );


  defender.hp =
    Math.max(
      0,
      defender.hp -
      damage
    );


  const sleepWake =
    wakeSleepOnDirectDamage(
      defender,
      damage
    );


  const debuff =
    applyDebuffSkill(
      defender,
      action.skill,
      currentTurn
    );


  return {
    kind:
      "debuff",

    attacker:
      attacker.user,

    defender:
      defender.user,

    skill:
      action.skill.nome,

    hit:
      true,

    hitChance:
      offensive.hitChance,

    rawDamage,

    damage,

    defenderHp:
      defender.hp,

    sleepWake,

    debuffApplied:
      debuff.ok,

    debuff
  };
}

'''

text = text[:start] + new_debuff + text[end:]


# ------------------------------------------------------------
# REACTION TYPE NO DISPATCH
# ------------------------------------------------------------
restriction_block = '''  const restrictionType =
    String(
      action?.skill?.restrictionType ?? ""
    )
      .trim()
      .toLowerCase();
'''

reaction_type_block = '''
  const reactionType =
    getReactionType(
      action?.skill
    );
'''

if reaction_type_block not in text:
    if restriction_block not in text:
        raise SystemExit("restrictionType não encontrado")
    text = text.replace(
        restriction_block,
        restriction_block + reaction_type_block,
        1
    )

cura_marker = '''  /*
   * CURA
   */
'''

stance_block = '''  /*
   * ==============================
   * COUNTER / REFLETIR
   * ==============================
   *
   * A postura é preparada antes do
   * ataque adversário por prioridade.
   */
  if (
    reactionType ===
      PHYSICAL_COUNTER_TYPE ||
    reactionType ===
      ELEMENTAL_REFLECT_TYPE
  ) {
    return {
      kind:
        "reaction_stance",

      user:
        attacker.user,

      skill:
        action.skill.nome,

      reactionType,

      activated:
        false
    };
  }


'''

if stance_block not in text:
    if cura_marker not in text:
        raise SystemExit("Marcador CURA não encontrado")
    text = text.replace(
        cura_marker,
        stance_block + cura_marker,
        1
    )


# ------------------------------------------------------------
# SNAPSHOT DOS ELEMENTOS QUE PODEM SER REFLETIDOS
# ------------------------------------------------------------
needs_old = '''    const needsProfile =
        !Array.isArray(
        player.loadout
        ) ||
        requiredStats.some(
'''

needs_new = '''    const needsProfile =
        !Array.isArray(
        player.loadout
        ) ||
        !Array.isArray(
        player.reflectElements
        ) ||
        requiredStats.some(
'''

if needs_new not in text:
    if needs_old not in text:
        raise SystemExit("needsProfile não encontrado")
    text = text.replace(
        needs_old,
        needs_new,
        1
    )

loadout_fill = '''    if (
        !Array.isArray(
        player.loadout
        )
    ) {
        player.loadout =
        snapshotLoadout(
            profile
        );
    }
'''

reflect_fill = '''

    if (
        !Array.isArray(
        player.reflectElements
        )
    ) {
        player.reflectElements =
        getReflectableElements(
            profile
        );
    }
'''

if reflect_fill not in text:
    if loadout_fill not in text:
        raise SystemExit("Preenchimento de loadout não encontrado")
    text = text.replace(
        loadout_fill,
        loadout_fill + reflect_fill,
        1
    )

# Adiciona reflectElements nos dois snapshots novos.
challenger_loadout = '''        loadout:
            snapshotLoadout(
            challengerProfile
            ),

        action:
'''
challenger_new = '''        loadout:
            snapshotLoadout(
            challengerProfile
            ),

        reflectElements:
            getReflectableElements(
            challengerProfile
            ),

        action:
'''
if challenger_new not in text:
    if challenger_loadout not in text:
        raise SystemExit("Loadout do challenger não encontrado")
    text = text.replace(challenger_loadout, challenger_new, 1)

target_loadout = '''    loadout:
        snapshotLoadout(
        targetProfile
        ),

    action:
'''
target_new = '''    loadout:
        snapshotLoadout(
        targetProfile
        ),

    reflectElements:
        getReflectableElements(
        targetProfile
        ),

    action:
'''
if target_new not in text:
    if target_loadout not in text:
        raise SystemExit("Loadout do target não encontrado")
    text = text.replace(target_loadout, target_new, 1)


# ------------------------------------------------------------
# VARIÁVEL DE REAÇÃO
# ------------------------------------------------------------
second_decl = '''    let secondExecution =
    null;

    let battleOver =
'''
second_new = '''    let secondExecution =
    null;

    let reaction =
    null;

    let battleOver =
'''
if second_new not in text:
    if second_decl not in text:
        raise SystemExit("Declaração secondExecution não encontrada")
    text = text.replace(second_decl, second_new, 1)


# ------------------------------------------------------------
# MATCH DA POSTURA ANTES DA SEGUNDA AÇÃO
# ------------------------------------------------------------
second_silence_block = '''    const secondSilence =
      checkSilenceRestriction(
        second.player,
        second.action.skill,
        battle.turn
      );
'''

match_block = '''

    const reactionMatch =
      firstExecution?.kind ===
        "reaction_stance"
        ? matchReaction(
            first.action.skill,
            second.action.skill,
            first.player
          )
        : {
            matched: false,
            reactionType: null,
            reason: "NO_STANCE"
          };
'''

if match_block not in text:
    if second_silence_block not in text:
        raise SystemExit("secondSilence não encontrado")
    # Há uma ocorrência para o segundo jogador no chooseAction.
    pos = text.index(second_silence_block, text.index("* SEGUNDO ATAQUE"))
    insert_at = pos + len(second_silence_block)
    text = text[:insert_at] + match_block + text[insert_at:]


# ------------------------------------------------------------
# EXECUÇÃO REAL DO SEGUNDO ATAQUE COM REDUÇÃO E DEVOLUÇÃO
# ------------------------------------------------------------
old_exec = '''        spendSkillMentalidade(
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
'''

new_exec = '''        spendSkillMentalidade(
          second.player,
          second.action.skill
        );


        if (
          reactionMatch.matched
        ) {
          first.player.__directDamageMultiplier =
            REACTION_DAMAGE_TAKEN_MULTIPLIER;
        }


        try {
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
        }
        finally {
          delete first.player.__directDamageMultiplier;
        }


        if (
          reactionMatch.matched &&
          secondExecution?.hit === true &&
          Number(
            secondExecution.rawDamage
          ) > 0
        ) {
          const split =
            splitReactionDamage(
              secondExecution.rawDamage
            );


          let returnedDamage =
            0;


          const counterDefeated =
            Number(
              first.player.hp
            ) <= 0;


          if (!counterDefeated) {
            returnedDamage =
              split.returned;

            second.player.hp =
              Math.max(
                0,
                Number(
                  second.player.hp
                ) -
                returnedDamage
              );
          }


          reaction = {
            activated: true,

            type:
              reactionMatch.reactionType,

            user:
              first.player.user,

            skill:
              first.action.skill.nome,

            attacker:
              second.player.user,

            incomingSkill:
              second.action.skill.nome,

            element:
              second.action.skill.elemento ??
              null,

            rawDamage:
              split.rawDamage,

            damageTaken:
              Number(
                secondExecution.damage
              ) || 0,

            returnedDamage,

            userHpAfter:
              first.player.hp,

            attackerHpAfter:
              second.player.hp,

            counterDefeated
          };


          firstExecution.activated =
            true;

          firstExecution.triggerSkill =
            second.action.skill.nome;
        }


        await this.consumeExecutedSkill(
          second.player,
          second.action
        );
'''

if new_exec not in text:
    if old_exec not in text:
        raise SystemExit("Execução do segundo ataque não encontrada")
    text = text.replace(old_exec, new_exec, 1)


# ------------------------------------------------------------
# RETORNO DA API
# ------------------------------------------------------------
return_anchor = '''    secondExecution,

    hp: {
'''
return_new = '''    secondExecution,

    reaction,

    hp: {
'''
if return_new not in text:
    if return_anchor not in text:
        raise SystemExit("Retorno secondExecution não encontrado")
    text = text.replace(return_anchor, return_new, 1)


path.write_text(text, encoding="utf-8")


# ============================================================
# attack.js - mensagens
# ============================================================
path = Path("src/routes/attack.js")
text = path.read_text(encoding="utf-8")

format_marker = '''    if (
      execution.kind ===
      "sleep_blocked"
    ) {
'''

stance_format = '''    if (
      execution.kind ===
      "reaction_stance"
    ) {
      const physical =
        execution.reactionType ===
        "counter_physical";

      return physical
        ? `⚔️ @${execution.user} preparou ${execution.skill} contra um golpe Físico.`
        : `🪞 @${execution.user} preparou ${execution.skill} contra um golpe Elemental compatível.`;
    }


'''

if stance_format not in text:
    if format_marker not in text:
        raise SystemExit("Marcador de formatExecution não encontrado")
    text = text.replace(
        format_marker,
        stance_format + format_marker,
        1
    )

second_text_anchor = '''    const secondText =
    formatExecution(
        result.secondExecution,
        result.hp
    );
'''

reaction_format = '''

    function formatReaction(
      reaction
    ) {
      if (
        !reaction?.activated
      ) {
        return "";
      }


      const physical =
        reaction.type ===
        "counter_physical";

      const icon =
        physical
          ? "⚔️"
          : "🪞";

      const label =
        physical
          ? "Contra-ataque"
          : `Refletir${reaction.element ? ` ${reaction.element}` : ""}`;


      if (
        reaction.counterDefeated
      ) {
        return (
          `${icon} ${label} de @${reaction.user} reduziu o dano de ` +
          `${reaction.rawDamage} para ${reaction.damageTaken}, ` +
          `mas @${reaction.user} foi derrotado antes de devolver o golpe.`
        );
      }


      return (
        `${icon} ${label} de @${reaction.user} reduziu o dano de ` +
        `${reaction.rawDamage} para ${reaction.damageTaken} e devolveu ` +
        `${reaction.returnedDamage} de dano para @${reaction.attacker}. ` +
        `HP de @${reaction.attacker}: ${reaction.attackerHpAfter}.`
      );
    }


    const reactionText =
      formatReaction(
        result.reaction
      );
'''

if reaction_format not in text:
    if second_text_anchor not in text:
        raise SystemExit("secondText não encontrado")
    text = text.replace(
        second_text_anchor,
        second_text_anchor + reaction_format,
        1
    )

append_anchor = '''    if (secondText) {
    message +=
        ` ${secondText}`;
    }

    if (dotText) {
'''
append_new = '''    if (secondText) {
    message +=
        ` ${secondText}`;
    }

    if (reactionText) {
      message +=
        ` ${reactionText}`;
    }

    if (dotText) {
'''

if append_new not in text:
    if append_anchor not in text:
        raise SystemExit("Ponto de append da mensagem não encontrado")
    text = text.replace(append_anchor, append_new, 1)


path.write_text(text, encoding="utf-8")
