from pathlib import Path
import re


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"Trecho não encontrado: {label}")
    return text.replace(old, new, 1)


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")
    print(f"✅ {path} atualizado")


# ============================================================
# PROFILE DEFAULTS
# ============================================================
path = "src/core/profile.js"
s = Path(path).read_text(encoding="utf-8")

old = '''      recentOpponents: {},

      /*
      * null = não é Prodígio.'''
new = '''      recentOpponents: {},

      /*
       * Disciplina de AFK do PvP.
       *
       * O primeiro incidente abre uma janela de 30 min.
       * Reincidência dentro da janela gera bloqueio progressivo.
       */
      afkPenaltyLevel: 0,
      afkBlockedUntil: 0,
      afkProbationUntil: 0,
      afkLastIncidentAt: 0,

      /*
      * null = não é Prodígio.'''
s = replace_once(s, old, new, "defaults AFK do perfil")
write(path, s)


# ============================================================
# TIMEOUT: aviso aos 60s + timeout aos 90s
# ============================================================
path = "src/systems/pvp-timeout.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''export const TURN_TIMEOUT_MS =
  90 * 1000;''',
    '''export const TURN_WARNING_MS =
  60 * 1000;

export const TURN_TIMEOUT_MS =
  90 * 1000;''',
    "constante de aviso aos 60s"
)

s = replace_once(
    s,
    '''  battle.turnStartedAt =
    safeNow;

  battle.turnDeadline =''',
    '''  battle.turnStartedAt =
    safeNow;

  battle.turnWarningAt =
    safeNow +
    TURN_WARNING_MS;

  battle.turnWarningProcessed =
    false;

  battle.turnWarningUsers =
    [];

  battle.turnDeadline =''',
    "relógio de aviso"
)

s = replace_once(
    s,
    '''  return {
    ok: true,
    turn,
    turnStartedAt:
      battle.turnStartedAt,
    turnDeadline:
      battle.turnDeadline
  };
}


export function ensureBattleTurnClock''',
    '''  return {
    ok: true,
    turn,
    turnStartedAt:
      battle.turnStartedAt,
    turnWarningAt:
      battle.turnWarningAt,
    turnWarningProcessed:
      battle.turnWarningProcessed === true,
    turnDeadline:
      battle.turnDeadline
  };
}


export function ensureBattleTurnClock''',
    "retorno do relógio inicial"
)

s = replace_once(
    s,
    '''  const deadline =
    Number(battle.turnDeadline);

  if (
    clockTurn !== turn ||''',
    '''  const deadline =
    Number(battle.turnDeadline);

  if (
    clockTurn !== turn ||''',
    "âncora do ensure"
)

old = '''  return {
    ok: true,
    turn,
    turnStartedAt:
      Number(battle.turnStartedAt) ||
      Math.max(
        0,
        deadline - TURN_TIMEOUT_MS
      ),
    turnDeadline:
      deadline
  };
}


export function getMissingActionUsers'''
new = '''  const startedAt =
    Number(battle.turnStartedAt) ||
    Math.max(
      0,
      deadline - TURN_TIMEOUT_MS
    );

  const rawWarningAt =
    Number(battle.turnWarningAt);

  const warningAt =
    Number.isFinite(rawWarningAt) &&
    rawWarningAt > 0
      ? rawWarningAt
      : startedAt + TURN_WARNING_MS;

  battle.turnStartedAt =
    startedAt;

  battle.turnWarningAt =
    warningAt;

  if (
    typeof battle.turnWarningProcessed !==
    "boolean"
  ) {
    battle.turnWarningProcessed =
      false;
  }

  if (!Array.isArray(battle.turnWarningUsers)) {
    battle.turnWarningUsers = [];
  }

  return {
    ok: true,
    turn,
    turnStartedAt:
      startedAt,
    turnWarningAt:
      warningAt,
    turnWarningProcessed:
      battle.turnWarningProcessed === true,
    turnDeadline:
      deadline
  };
}


export function getNextBattleTurnAlarmAt(
  battle,
  now = Date.now()
) {
  const clock =
    ensureBattleTurnClock(
      battle,
      now
    );

  if (!clock.ok) {
    return clock;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const desiredAt =
    !clock.turnWarningProcessed
      ? clock.turnWarningAt
      : clock.turnDeadline;

  return {
    ok: true,
    turn: clock.turn,
    stage:
      !clock.turnWarningProcessed
        ? "WARNING"
        : "TIMEOUT",
    alarmAt:
      Math.max(
        safeNow + 1,
        desiredAt
      ),
    turnWarningAt:
      clock.turnWarningAt,
    turnDeadline:
      clock.turnDeadline
  };
}


export function registerTurnWarning(
  battle,
  users,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const uniqueUsers =
    [
      ...new Set(
        (Array.isArray(users) ? users : [])
          .filter(
            user =>
              user &&
              state.users.includes(user)
          )
      )
    ];

  battle.turnWarningProcessed =
    true;

  battle.turnWarningUsers =
    uniqueUsers;

  if (!Array.isArray(battle.timeoutWarningEvents)) {
    battle.timeoutWarningEvents = [];
  }

  const event = {
    turn:
      Math.max(
        1,
        Number(battle.turn) || 1
      ),
    at:
      Math.max(
        0,
        Number(now) || Date.now()
      ),
    users:
      uniqueUsers
  };

  battle.timeoutWarningEvents.push(
    event
  );

  if (
    battle.timeoutWarningEvents.length > 20
  ) {
    battle.timeoutWarningEvents =
      battle.timeoutWarningEvents.slice(-20);
  }

  return {
    ok: true,
    event,
    users:
      uniqueUsers
  };
}


export function getMissingActionUsers'''
s = replace_once(s, old, new, "helpers do aviso de 60s")
write(path, s)


# ============================================================
# ADMIN TIME RESET
# ============================================================
path = "src/systems/admin-time-reset.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''import {
  getProfile,
  saveProfile
} from "../core/database.js";
''',
    '''import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  resetPvpAfkDiscipline
} from "./pvp-afk.js";
''',
    "import reset AFK"
)

s = replace_once(
    s,
    '''    antifarm: "antifarm",
    anti_farm: "antifarm",
    daily: "daily",''',
    '''    antifarm: "antifarm",
    anti_farm: "antifarm",
    afk: "afk",
    fk: "afk",
    timeout: "afk",
    inatividade: "afk",
    daily: "daily",''',
    "aliases AFK"
)

s = replace_once(
    s,
    '''  else if (normalizedScope === "meditar") {
    /*
     * A Meditação usa cooldown vivo no PvP.
     * Não existe timestamp persistente próprio
     * no perfil para limpar aqui.
     */
  }

  else if (normalizedScope === "pvp") {''',
    '''  else if (normalizedScope === "meditar") {
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

  else if (normalizedScope === "pvp") {''',
    "scope AFK"
)

s = replace_once(
    s,
    '''  else if (normalizedScope === "pvp") {
    zeroField("lastCombat");
    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");
  }

  else if (normalizedScope === "tudo") {''',
    '''  else if (normalizedScope === "pvp") {
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

  else if (normalizedScope === "tudo") {''',
    "AFK dentro do reset PVP"
)

s = replace_once(
    s,
    '''    profile.skillCooldowns = {};
    resetFields.push("skillCooldowns");
  }


  return {
    ok: true,''',
    '''    profile.skillCooldowns = {};
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
    ok: true,''',
    "AFK dentro do reset TUDO"
)
write(path, s)


# ============================================================
# ADMIN ROUTE
# ============================================================
path = "src/routes/admin.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''tudo|pvp|habilidades|habilidade 1-4|meditar|antifarm @oponente|daily|checkin|xpchest|reroll|cura''',
    '''tudo|pvp|afk|habilidades|habilidade 1-4|meditar|antifarm @oponente|daily|checkin|xpchest|reroll|cura''',
    "ajuda do reset de tempo"
)

s = replace_once(
    s,
    '''        "tudo",
        "pvp",
        "habilidades",''',
    '''        "tudo",
        "pvp",
        "afk",
        "habilidades",''',
    "scope vivo AFK"
)

s = replace_once(
    s,
    '''    if (scope === "habilidade") {
      return new Response(
        `🕒 ADM | Cooldown do slot ${Number(extra)} de @${profileResult.user} resetado.`
      );
    }


    const activeBattleText =''',
    '''    if (scope === "habilidade") {
      return new Response(
        `🕒 ADM | Cooldown do slot ${Number(extra)} de @${profileResult.user} resetado.`
      );
    }


    if (scope === "afk") {
      const activeText =
        battleResult?.inBattle
          ? " | contador AFK da batalha zerado"
          : "";

      return new Response(
        `🕒 ADM | AFK de @${profileResult.user} resetado: bloqueio, reincidência e janela de 30 min removidos${activeText}.`
      );
    }


    const activeBattleText =''',
    "resposta do reset AFK"
)
write(path, s)


# ============================================================
# PVP ROUTE
# ============================================================
path = "src/routes/pvp.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''function getCoordinator(
  env
) {''',
    '''function formatBlockTime(ms) {
  const totalMinutes =
    Math.max(
      1,
      Math.ceil(
        (Number(ms) || 0) /
        60000
      )
    );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours =
    Math.ceil(
      totalMinutes / 60
    );

  return `${hours}h`;
}


function getCoordinator(
  env
) {''',
    "formatador de bloqueio PvP"
)

s = replace_once(
    s,
    '''    if (
      result.error ===
      "CHALLENGER_IN_BATTLE"
    ) {''',
    '''    if (
      result.error ===
      "CHALLENGER_AFK_BLOCKED"
    ) {
      return new Response(
        `🚫 @${challenger}, você está temporariamente impedido de participar de PvP por reincidência de AFK. Tempo restante: ${formatBlockTime(result.remainingMs)}.`
      );
    }


    if (
      result.error ===
      "TARGET_AFK_BLOCKED"
    ) {
      return new Response(
        `🚫 @${challenger}, @${target} está temporariamente impedido de participar de PvP por reincidência de AFK.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_IN_BATTLE"
    ) {''',
    "mensagens de bloqueio no !pvp"
)
write(path, s)


# ============================================================
# ACCEPT ROUTE
# ============================================================
path = "src/routes/accept.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''function getCoordinator(
  env
) {''',
    '''function formatBlockTime(ms) {
  const totalMinutes =
    Math.max(
      1,
      Math.ceil(
        (Number(ms) || 0) /
        60000
      )
    );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  return `${Math.ceil(totalMinutes / 60)}h`;
}


function getCoordinator(
  env
) {''',
    "formatador de bloqueio no aceitar"
)

s = replace_once(
    s,
    '''    if (
      result.error ===
      "PLAYER_IN_BATTLE"
    ) {''',
    '''    if (
      result.error ===
      "TARGET_AFK_BLOCKED"
    ) {
      return new Response(
        `🚫 @${user}, você está temporariamente impedido de participar de PvP por reincidência de AFK. Tempo restante: ${formatBlockTime(result.remainingMs)}.`
      );
    }


    if (
      result.error ===
      "CHALLENGER_AFK_BLOCKED"
    ) {
      return new Response(
        `🚫 @${user}, o desafiante está temporariamente impedido de participar de PvP por reincidência de AFK.`
      );
    }


    if (
      result.error ===
      "PLAYER_IN_BATTLE"
    ) {''',
    "mensagens de bloqueio no !aceitar"
)
write(path, s)


# ============================================================
# PVP COORDINATOR
# ============================================================
path = "src/durable/PvpCoordinator.js"
s = Path(path).read_text(encoding="utf-8")

s = replace_once(
    s,
    '''  TURN_TIMEOUT_MS,
  MAX_TURN_TIMEOUTS,
  TIMEOUT_PASS_SLOT,
  TIMEOUT_PASS_SKILL,
  ensureBattleTurnClock,
  startBattleTurnClock,
  getMissingActionUsers,
  registerTurnTimeouts
} from "../systems/pvp-timeout.js";
''',
    '''  TURN_TIMEOUT_MS,
  MAX_TURN_TIMEOUTS,
  TIMEOUT_PASS_SLOT,
  TIMEOUT_PASS_SKILL,
  ensureBattleTimeoutState,
  ensureBattleTurnClock,
  startBattleTurnClock,
  getNextBattleTurnAlarmAt,
  registerTurnWarning,
  getMissingActionUsers,
  registerTurnTimeouts
} from "../systems/pvp-timeout.js";

import {
  getPvpAfkAccess,
  registerPvpAfkIncident
} from "../systems/pvp-afk.js";
''',
    "imports AFK/timeout"
)

s = replace_once(
    s,
    '''function createConfusionSelfHitExecution(
  player,
  action,
  confusionResult
) {''',
    '''function formatAfkDuration(ms) {
  const minutes =
    Math.max(
      1,
      Math.round(
        (Number(ms) || 0) /
        60000
      )
    );

  if (minutes < 60) {
    return `${minutes} minutos`;
  }

  const hours =
    Math.max(
      1,
      Math.round(
        minutes / 60
      )
    );

  return hours === 1
    ? "1 hora"
    : `${hours} horas`;
}


function appendBattleSystemMessage(
  battle,
  type,
  text,
  details = {},
  now = Date.now()
) {
  if (!Array.isArray(battle.systemMessages)) {
    battle.systemMessages = [];
  }

  const event = {
    id: crypto.randomUUID(),
    type,
    text,
    at:
      Math.max(
        0,
        Number(now) || Date.now()
      ),
    turn:
      Math.max(
        1,
        Number(battle.turn) || 1
      ),
    ...details
  };

  battle.systemMessages.push(
    event
  );

  if (battle.systemMessages.length > 50) {
    battle.systemMessages =
      battle.systemMessages.slice(-50);
  }

  return event;
}


function createConfusionSelfHitExecution(
  player,
  action,
  confusionResult
) {''',
    "helpers de mensagem AFK"
)

old_schedule = '''    await this.state.storage.setAlarm(
      clock.turnDeadline
    );

    return {
      ok: true,
      turn: clock.turn,
      turnDeadline: clock.turnDeadline
    };'''
new_schedule = '''    const nextAlarm =
      getNextBattleTurnAlarmAt(
        battle
      );

    if (!nextAlarm.ok) {
      return nextAlarm;
    }

    await this.state.storage.setAlarm(
      nextAlarm.alarmAt
    );

    return {
      ok: true,
      turn: clock.turn,
      stage: nextAlarm.stage,
      alarmAt: nextAlarm.alarmAt,
      turnWarningAt: clock.turnWarningAt,
      turnDeadline: clock.turnDeadline
    };'''
s = replace_once(s, old_schedule, new_schedule, "agendamento 60s/90s")

# Bloqueio na criação do desafio
anchor = '''    if (
      !targetProfile?.race
    ) {
      return {
        ok: false,
        error: "TARGET_NOT_FOUND"
      };
    }


    let data ='''
replacement = '''    if (
      !targetProfile?.race
    ) {
      return {
        ok: false,
        error: "TARGET_NOT_FOUND"
      };
    }


    const afkAccessNow =
      Date.now();

    const challengerAfkAccess =
      getPvpAfkAccess(
        challengerProfile,
        afkAccessNow
      );

    const targetAfkAccess =
      getPvpAfkAccess(
        targetProfile,
        afkAccessNow
      );


    if (
      challengerAfkAccess.ok &&
      !challengerAfkAccess.allowed
    ) {
      return {
        ok: false,
        error: "CHALLENGER_AFK_BLOCKED",
        challenger,
        penaltyLevel:
          challengerAfkAccess.penaltyLevel,
        blockedUntil:
          challengerAfkAccess.blockedUntil,
        remainingMs:
          challengerAfkAccess.remainingMs
      };
    }


    if (
      targetAfkAccess.ok &&
      !targetAfkAccess.allowed
    ) {
      return {
        ok: false,
        error: "TARGET_AFK_BLOCKED",
        target,
        penaltyLevel:
          targetAfkAccess.penaltyLevel,
        blockedUntil:
          targetAfkAccess.blockedUntil,
        remainingMs:
          targetAfkAccess.remainingMs
      };
    }


    let data ='''
s = replace_once(s, anchor, replacement, "bloqueio AFK em challenge")

# Bloqueio no aceitar (inclusive promoção de fila)
anchor = '''    if (
      !challengerProfile?.race ||
      !targetProfile?.race
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "PLAYER_NOT_FOUND"
      };
    }


    if (
      this.findBattleByUser('''
replacement = '''    if (
      !challengerProfile?.race ||
      !targetProfile?.race
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "PLAYER_NOT_FOUND"
      };
    }


    const acceptAfkNow =
      Date.now();

    const challengerAfkAccess =
      getPvpAfkAccess(
        challengerProfile,
        acceptAfkNow
      );

    const targetAfkAccess =
      getPvpAfkAccess(
        targetProfile,
        acceptAfkNow
      );


    if (
      challengerAfkAccess.ok &&
      !challengerAfkAccess.allowed
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "CHALLENGER_AFK_BLOCKED",
        challenger:
          challenge.challenger,
        remainingMs:
          challengerAfkAccess.remainingMs,
        blockedUntil:
          challengerAfkAccess.blockedUntil
      };
    }


    if (
      targetAfkAccess.ok &&
      !targetAfkAccess.allowed
    ) {
      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );

      return {
        ok: false,
        error: "TARGET_AFK_BLOCKED",
        target:
          challenge.target,
        remainingMs:
          targetAfkAccess.remainingMs,
        blockedUntil:
          targetAfkAccess.blockedUntil
      };
    }


    if (
      this.findBattleByUser('''
s = replace_once(s, anchor, replacement, "bloqueio AFK em accept")

# Campos do relógio e mensagens na batalha
s = replace_once(
    s,
    '''      timeoutEvents: [],

      turnClockTurn: 1,

      turnStartedAt:
        battleStartedAt,

      turnDeadline:
        battleStartedAt +
        TURN_TIMEOUT_MS''',
    '''      timeoutEvents: [],

      timeoutWarningEvents: [],

      systemMessages: [],

      turnClockTurn: 1,

      turnStartedAt:
        battleStartedAt,

      turnWarningAt:
        battleStartedAt +
        60 * 1000,

      turnWarningProcessed:
        false,

      turnWarningUsers: [],

      turnDeadline:
        battleStartedAt +
        TURN_TIMEOUT_MS''',
    "campos AFK na batalha"
)

# Admin reset vivo
s = replace_once(
    s,
    '''        "tudo",
        "pvp",
        "habilidades",''',
    '''        "tudo",
        "pvp",
        "afk",
        "habilidades",''',
    "scope AFK no coordinator"
)

s = replace_once(
    s,
    '''    let cooldownsCleared = 0;
    let meditationCleared = false;
    let slot = null;''',
    '''    let cooldownsCleared = 0;
    let meditationCleared = false;
    let afkStrikesCleared = 0;
    let slot = null;''',
    "contador reset AFK"
)

s = replace_once(
    s,
    '''      delete player.meditationAvailableAtTurn;
    }


    await this.saveData(''',
    '''      delete player.meditationAvailableAtTurn;
    }


    if (
      scope === "afk" ||
      scope === "pvp" ||
      scope === "tudo"
    ) {
      const timeoutState =
        ensureBattleTimeoutState(
          battle
        );

      if (timeoutState.ok) {
        afkStrikesCleared =
          Math.max(
            0,
            Number(
              battle.timeoutCounts[user]
            ) || 0
          );

        battle.timeoutCounts[user] = 0;
      }
    }


    await this.saveData(''',
    "reset AFK vivo"
)

s = replace_once(
    s,
    '''      cooldownsCleared,
      meditationCleared,
      turn:''',
    '''      cooldownsCleared,
      meditationCleared,
      afkStrikesCleared,
      turn:''',
    "retorno reset AFK vivo"
)

# Substitui o handler alarm inteiro
pattern = re.compile(r'  async alarm\(\) \{.*?\n  \}\n\n\n  async fetch\(', re.S)
match = pattern.search(s)
if not match:
    raise RuntimeError("Trecho não encontrado: handler alarm")

new_alarm = '''  async alarm() {
    const data =
      await this.getData();

    const battle =
      getGlobalActivePvpBattle(
        data
      );

    if (!battle) {
      await this.clearBattleTurnAlarm();

      return {
        ok: true,
        activeBattle: false
      };
    }

    const now =
      Date.now();

    const clock =
      ensureBattleTurnClock(
        battle,
        now
      );

    if (!clock.ok) {
      await this.clearBattleTurnAlarm();
      return clock;
    }

    /*
     * 60 segundos: aviso de que restam 30 segundos.
     * O aviso é registrado no estado da batalha para
     * o bot próprio/saída Twitch publicar quando ligada.
     */
    if (
      !clock.turnWarningProcessed &&
      now >= clock.turnWarningAt &&
      now < clock.turnDeadline
    ) {
      const warningUsers =
        getMissingActionUsers(
          battle
        );

      const warningResult =
        registerTurnWarning(
          battle,
          warningUsers,
          now
        );

      for (const warnedUser of warningUsers) {
        appendBattleSystemMessage(
          battle,
          "AFK_WARNING_30S",
          `⏰ @${warnedUser}, você ainda não escolheu uma ação. Restam 30 segundos.`,
          {
            user: warnedUser,
            remainingSeconds: 30
          },
          now
        );
      }

      await this.saveData(
        data
      );

      await this.state.storage.setAlarm(
        clock.turnDeadline
      );

      return {
        ok: true,
        warning: true,
        warningResult,
        turn: battle.turn,
        turnDeadline: clock.turnDeadline
      };
    }

    if (
      now < clock.turnDeadline
    ) {
      await this.scheduleBattleTurnAlarm(
        battle
      );

      return {
        ok: true,
        earlyAlarm: true,
        turn: battle.turn,
        turnWarningAt: clock.turnWarningAt,
        turnDeadline: clock.turnDeadline
      };
    }

    if (
      battle.state !== "WAITING_ACTIONS"
    ) {
      await this.state.storage.setAlarm(
        now + 1000
      );

      return {
        ok: true,
        deferred: true,
        state: battle.state
      };
    }

    const missingUsers =
      getMissingActionUsers(
        battle
      );

    if (
      missingUsers.length === 0
    ) {
      await this.state.storage.setAlarm(
        now + 1000
      );

      return {
        ok: true,
        deferred: true,
        reason: "NO_MISSING_ACTION"
      };
    }

    const timeoutResult =
      registerTurnTimeouts(
        battle,
        missingUsers,
        now
      );

    const discipline = {};

    for (const timedOutUser of missingUsers) {
      const count =
        Number(
          timeoutResult.counts?.[
            timedOutUser
          ]
        ) || 0;

      appendBattleSystemMessage(
        battle,
        "AFK_TURN_LOST",
        `💤 @${timedOutUser} não executou uma ação a tempo e perdeu a vez. AFK: ${count}/${MAX_TURN_TIMEOUTS}.`,
        {
          user: timedOutUser,
          count,
          max: MAX_TURN_TIMEOUTS
        },
        now
      );

      const profile =
        await getProfile(
          this.env,
          timedOutUser
        );

      if (profile) {
        const disciplineResult =
          registerPvpAfkIncident(
            profile,
            now
          );

        discipline[timedOutUser] =
          disciplineResult;

        if (disciplineResult.ok) {
          await saveProfile(
            this.env,
            timedOutUser,
            profile
          );
        }

        if (
          disciplineResult.action ===
          "WARNING"
        ) {
          appendBattleSystemMessage(
            battle,
            "AFK_DISCIPLINE_WARNING",
            `⚠️ @${timedOutUser}, se você ficar AFK novamente nos próximos 30 minutos, ficará 15 minutos sem poder participar de PvP.`,
            {
              user: timedOutUser,
              probationUntil:
                disciplineResult.probationUntil
            },
            now
          );
        }

        else if (
          disciplineResult.action ===
          "BLOCKED"
        ) {
          appendBattleSystemMessage(
            battle,
            "AFK_PVP_BLOCK",
            `🚫 @${timedOutUser} recebeu bloqueio de PvP por ${formatAfkDuration(disciplineResult.durationMs)} por reincidência de AFK. Após o bloqueio, haverá 30 minutos de observação.`,
            {
              user: timedOutUser,
              penaltyLevel:
                disciplineResult.penaltyLevel,
              blockedUntil:
                disciplineResult.blockedUntil,
              probationUntil:
                disciplineResult.probationUntil
            },
            now
          );
        }
      }
    }

    const reachedLimit =
      timeoutResult.reachedLimit || [];

    if (
      reachedLimit.length === 2
    ) {
      appendBattleSystemMessage(
        battle,
        "AFK_DOUBLE_DEFEAT",
        "💤 Os dois jogadores atingiram 3/3 AFKs no mesmo turno. O PvP foi encerrado em empate por inatividade.",
        {},
        now
      );

      const finishedAt =
        Date.now();

      const persistence =
        await this.persistBattleMentalidade(
          battle,
          finishedAt
        );

      if (!persistence.ok) {
        await this.state.storage.setAlarm(
          Date.now() + 5000
        );

        return {
          ok: false,
          error: "MENTALIDADE_PERSIST_FAILED"
        };
      }

      battle.status = "FINISHED";
      battle.state = "FINISHED";
      battle.draw = true;
      battle.timeoutDraw = true;
      battle.finishReason = "DOUBLE_TIMEOUT";
      battle.winner = null;
      battle.loser = null;
      battle.rankedResult = null;
      battle.finishedAt = finishedAt;
      battle.player1.action = null;
      battle.player2.action = null;

      await this.saveData(
        data
      );

      await this.clearBattleTurnAlarm();

      const promotion =
        await this.startNextQueuedBattle();

      return {
        ok: true,
        battleOver: true,
        draw: true,
        finishReason: "DOUBLE_TIMEOUT",
        timeoutResult,
        discipline,
        nextQueuedBattle:
          promotion?.started
            ? promotion.battle
            : null
      };
    }

    if (
      reachedLimit.length === 1
    ) {
      const defeatedUser =
        reachedLimit[0];

      appendBattleSystemMessage(
        battle,
        "AFK_DEFEAT",
        `💤 @${defeatedUser} ficou AFK por 3 turnos e perdeu o PvP por inatividade.`,
        {
          user: defeatedUser
        },
        now
      );

      await this.saveData(
        data
      );

      const result =
        await this.forfeitBattle(
          defeatedUser,
          {
            forceLateForfeit: true,
            timeoutForfeit: true,
            finishReason: "TIMEOUT_FORFEIT"
          }
        );

      return {
        ...result,
        timeoutResult,
        discipline
      };
    }

    await this.saveData(
      data
    );

    let resolution =
      null;

    for (
      const timedOutUser
      of missingUsers
    ) {
      resolution =
        await this.chooseAction(
          timedOutUser,
          "__timeout__",
          {
            internalTimeout: true
          }
        );
    }

    return {
      ok: true,
      timeout: true,
      timeoutResult,
      discipline,
      resolution
    };
  }


  async fetch('''

s = s[:match.start()] + new_alarm + s[match.end():]
write(path, s)


print("\n🛡️ SISTEMA AFK/PUNIÇÃO INTEGRADO LOCALMENTE.")
print("- aviso interno aos 60s / timeout aos 90s")
print("- 3 strikes na batalha = derrota por AFK")
print("- reincidência global: aviso -> 15min -> 1h -> 4h -> 16h...")
print("- janela de observação: 30min após o bloqueio")
print("- !adm tempo reset @user afk + inclusão em pvp/tudo")
