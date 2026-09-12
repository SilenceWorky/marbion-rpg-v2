import fs from "node:fs";

const coordinatorPath = "src/durable/PvpCoordinator.js";
const attackPath = "src/routes/attack.js";
const timeoutSystemPath = "src/systems/pvp-timeout.js";

function fail(message) {
  throw new Error(message);
}

function replaceOnce(source, oldText, newText, label) {
  if (!source.includes(oldText)) {
    fail(`Trecho não encontrado: ${label}`);
  }

  return source.replace(oldText, newText);
}

const timeoutSystemContent = String.raw`export const TURN_TIMEOUT_MS =
  90 * 1000;

export const MAX_TURN_TIMEOUTS =
  3;

export const TIMEOUT_PASS_SLOT =
  -1;

export const TIMEOUT_PASS_SKILL =
  Object.freeze({
    id: "Sistema:Timeout_Pass",
    group: "Sistema",
    key: "Timeout_Pass",
    nome: "Tempo esgotado",
    tipo: "Timeout",
    raridade: "Sistema",
    elemento: "Universal",
    custoMentalidade: 0,
    cooldown: 0,
    escala: null,
    dano: 0,
    precisao: 100,
    prioridade: -999,
    efeito: "Ação perdida por timeout do turno."
  });


function normalizeTimeoutCount(value) {
  return Math.max(
    0,
    Math.floor(
      Number(value) || 0
    )
  );
}


export function ensureBattleTimeoutState(
  battle
) {
  if (
    !battle ||
    typeof battle !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_BATTLE"
    };
  }

  if (
    !battle.timeoutCounts ||
    typeof battle.timeoutCounts !== "object" ||
    Array.isArray(battle.timeoutCounts)
  ) {
    battle.timeoutCounts = {};
  }

  const users = [
    battle.player1?.user,
    battle.player2?.user
  ].filter(Boolean);

  for (const user of users) {
    battle.timeoutCounts[user] =
      normalizeTimeoutCount(
        battle.timeoutCounts[user]
      );
  }

  if (!Array.isArray(battle.timeoutEvents)) {
    battle.timeoutEvents = [];
  }

  return {
    ok: true,
    users,
    timeoutCounts:
      battle.timeoutCounts
  };
}


export function startBattleTurnClock(
  battle,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const turn =
    Math.max(
      1,
      Math.floor(
        Number(battle.turn) || 1
      )
    );

  battle.turnClockTurn =
    turn;

  battle.turnStartedAt =
    safeNow;

  battle.turnDeadline =
    safeNow +
    TURN_TIMEOUT_MS;

  return {
    ok: true,
    turn,
    turnStartedAt:
      battle.turnStartedAt,
    turnDeadline:
      battle.turnDeadline
  };
}


export function ensureBattleTurnClock(
  battle,
  now = Date.now()
) {
  const state =
    ensureBattleTimeoutState(
      battle
    );

  if (!state.ok) {
    return state;
  }

  const turn =
    Math.max(
      1,
      Math.floor(
        Number(battle.turn) || 1
      )
    );

  const clockTurn =
    Math.floor(
      Number(battle.turnClockTurn) || 0
    );

  const deadline =
    Number(battle.turnDeadline);

  if (
    clockTurn !== turn ||
    !Number.isFinite(deadline) ||
    deadline <= 0
  ) {
    return startBattleTurnClock(
      battle,
      now
    );
  }

  return {
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


export function getMissingActionUsers(
  battle
) {
  if (!battle) {
    return [];
  }

  return [
    battle.player1,
    battle.player2
  ]
    .filter(
      player =>
        player?.user &&
        player.action == null
    )
    .map(
      player =>
        player.user
    );
}


export function registerTurnTimeouts(
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
          .filter(Boolean)
      )
    ];

  const counts = {};
  const reachedLimit = [];

  for (const user of uniqueUsers) {
    if (!state.users.includes(user)) {
      continue;
    }

    const nextCount =
      normalizeTimeoutCount(
        battle.timeoutCounts[user]
      ) + 1;

    battle.timeoutCounts[user] =
      nextCount;

    counts[user] =
      nextCount;

    if (
      nextCount >=
      MAX_TURN_TIMEOUTS
    ) {
      reachedLimit.push(
        user
      );
    }
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
      uniqueUsers,
    counts,
    reachedLimit
  };

  battle.timeoutEvents.push(
    event
  );

  if (
    battle.timeoutEvents.length > 20
  ) {
    battle.timeoutEvents =
      battle.timeoutEvents.slice(-20);
  }

  return {
    ok: true,
    event,
    counts,
    reachedLimit
  };
}
`;

fs.mkdirSync(
  "src/systems",
  { recursive: true }
);

fs.writeFileSync(
  timeoutSystemPath,
  timeoutSystemContent,
  "utf8"
);

let source =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

if (!source.includes("../systems/pvp-timeout.js")) {
  source = replaceOnce(
    source,
    "const CHALLENGE_TIMEOUT =\n  2 * 60 * 1000;",
    `import {\n  TURN_TIMEOUT_MS,\n  MAX_TURN_TIMEOUTS,\n  TIMEOUT_PASS_SLOT,\n  TIMEOUT_PASS_SKILL,\n  ensureBattleTurnClock,\n  startBattleTurnClock,\n  getMissingActionUsers,\n  registerTurnTimeouts\n} from \"../systems/pvp-timeout.js\";\n\nconst CHALLENGE_TIMEOUT =\n  2 * 60 * 1000;`,
    "import do sistema de timeout"
  );
}

if (!source.includes("slot === TIMEOUT_PASS_SLOT")) {
  source = replaceOnce(
    source,
    "  /*\n  * Slot 0 não existe para o jogador.",
    `  /*\n   * Slot interno usado somente pelo Alarm\n   * quando o jogador perde a ação por timeout.\n   */\n  if (\n    slot === TIMEOUT_PASS_SLOT\n  ) {\n    return {\n      skillId: null,\n      skill: TIMEOUT_PASS_SKILL,\n      fallback: false,\n      timeoutPass: true\n    };\n  }\n\n  /*\n  * Slot 0 não existe para o jogador.`,
    "slot interno de timeout"
  );
}

if (!source.includes("function createTimeoutSkipExecution")) {
  source = replaceOnce(
    source,
    "export class PvpCoordinator {",
    `function createTimeoutSkipExecution(\n  player\n) {\n  return {\n    kind: \"timeout_skip\",\n    attacker: player.user,\n    skill: TIMEOUT_PASS_SKILL.nome,\n    timedOut: true,\n    damage: 0\n  };\n}\n\n\nexport class PvpCoordinator {`,
    "execução de ação perdida por timeout"
  );
}

if (!source.includes("async scheduleBattleTurnAlarm")) {
  const saveDataBlock = `  async saveData(data) {\n    await this.state.storage.put(\n      \"pvp\",\n      data\n    );\n  }`;

  source = replaceOnce(
    source,
    saveDataBlock,
    `${saveDataBlock}\n\n\n  async scheduleBattleTurnAlarm(\n    battle\n  ) {\n    const clock =\n      ensureBattleTurnClock(\n        battle\n      );\n\n    if (!clock.ok) {\n      return clock;\n    }\n\n    await this.state.storage.setAlarm(\n      clock.turnDeadline\n    );\n\n    return {\n      ok: true,\n      turn: clock.turn,\n      turnDeadline: clock.turnDeadline\n    };\n  }\n\n\n  async clearBattleTurnAlarm() {\n    await this.state.storage.deleteAlarm();\n\n    return {\n      ok: true\n    };\n  }`,
    "métodos de Alarm"
  );
}

if (!source.includes("timeoutCounts: {")) {
  source = replaceOnce(
    source,
    "      createdAt:\n        Date.now()\n    };",
    `      createdAt:\n        battleStartedAt,\n\n      timeoutCounts: {\n        [challenge.challenger]: 0,\n        [challenge.target]: 0\n      },\n\n      timeoutEvents: [],\n\n      turnClockTurn: 1,\n\n      turnStartedAt:\n        battleStartedAt,\n\n      turnDeadline:\n        battleStartedAt +\n        TURN_TIMEOUT_MS\n    };`,
    "estado inicial do timeout"
  );
}

if (!source.includes("await this.scheduleBattleTurnAlarm(\n      battle\n    );")) {
  source = replaceOnce(
    source,
    "    await this.saveData(\n      data\n    );\n\n\n    return {\n      ok: true,\n      battle\n    };\n  }\n\n    async chooseAction(",
    `    await this.saveData(\n      data\n    );\n\n    await this.scheduleBattleTurnAlarm(\n      battle\n    );\n\n\n    return {\n      ok: true,\n      battle\n    };\n  }\n\n    async chooseAction(`,
    "agendamento ao iniciar batalha"
  );
}

source = source.replace(
  "    async chooseAction(\n    user,\n    slot\n    ) {",
  "    async chooseAction(\n    user,\n    slot,\n    options = {}\n    ) {"
);

if (!source.includes("const isInternalTimeout")) {
  source = replaceOnce(
    source,
    "    const isPunch =\n      rawSlot === \"soco\";",
    `    const isPunch =\n      rawSlot === \"soco\";\n\n\n    const isInternalTimeout =\n      options?.internalTimeout === true &&\n      rawSlot === \"__timeout__\";`,
    "flag interna de timeout"
  );

  source = replaceOnce(
    source,
    "    const normalizedSlot =\n      isMeditation\n        ? 0\n        : isPunch\n          ? 5\n          : Number(slot);",
    `    const normalizedSlot =\n      isInternalTimeout\n        ? TIMEOUT_PASS_SLOT\n        : isMeditation\n          ? 0\n          : isPunch\n            ? 5\n            : Number(slot);`,
    "normalização do slot de timeout"
  );

  source = replaceOnce(
    source,
    "      !isMeditation &&\n      !isPunch &&",
    "      !isMeditation &&\n      !isPunch &&\n      !isInternalTimeout &&",
    "validação de slot interno"
  );
}

if (!source.includes("error: \"TURN_EXPIRED\"")) {
  source = replaceOnce(
    source,
    "    if (!battle) {\n        return {\n        ok: false,\n        error: \"NOT_IN_BATTLE\"\n        };\n    }",
    `    if (!battle) {\n        return {\n        ok: false,\n        error: \"NOT_IN_BATTLE\"\n        };\n    }\n\n\n    const turnClock =\n      ensureBattleTurnClock(\n        battle\n      );\n\n\n    if (\n      !isInternalTimeout &&\n      turnClock.ok &&\n      Date.now() >= turnClock.turnDeadline\n    ) {\n      await this.saveData(\n        data\n      );\n\n      await this.scheduleBattleTurnAlarm(\n        battle\n      );\n\n      return {\n        ok: false,\n        error: \"TURN_EXPIRED\",\n        turn: battle.turn,\n        turnDeadline: turnClock.turnDeadline\n      };\n    }`,
    "bloqueio de ação após deadline"
  );
}

if (!source.includes("timeoutPass:\n          isInternalTimeout")) {
  source = replaceOnce(
    source,
    "        selectedAt:\n        Date.now()\n    };",
    `        selectedAt:\n        Date.now(),\n\n        timeoutPass:\n          isInternalTimeout\n    };`,
    "marcação da ação de timeout"
  );
}

if (!source.includes("const firstIsTimeoutPass")) {
  source = replaceOnce(
    source,
    `    const firstControl =\n      consumeControlBlock(\n        first.player\n      );\n\n\n    const firstSleep =\n      consumeSleepBlock(\n        first.player\n      );\n\n\n    const firstSilence =\n      checkSilenceRestriction(\n        first.player,\n        first.action.skill,\n        battle.turn\n      );`,
    `    const firstIsTimeoutPass =\n      first.action.timeoutPass === true;\n\n\n    const firstControl =\n      firstIsTimeoutPass\n        ? { blocked: false }\n        : consumeControlBlock(\n            first.player\n          );\n\n\n    const firstSleep =\n      firstIsTimeoutPass\n        ? { blocked: false }\n        : consumeSleepBlock(\n            first.player\n          );\n\n\n    const firstSilence =\n      firstIsTimeoutPass\n        ? { blocked: false }\n        : checkSilenceRestriction(\n            first.player,\n            first.action.skill,\n            battle.turn\n          );`,
    "proteção de efeitos no timeout do primeiro jogador"
  );

  source = replaceOnce(
    source,
    "    if (\n      firstControl.blocked\n    ) {",
    `    if (\n      firstIsTimeoutPass\n    ) {\n      firstExecution =\n        createTimeoutSkipExecution(\n          first.player\n        );\n    }\n\n\n    else if (\n      firstControl.blocked\n    ) {`,
    "execução perdida do primeiro jogador"
  );
}

if (!source.includes("const secondIsTimeoutPass")) {
  source = replaceOnce(
    source,
    `    const secondControl =\n      consumeControlBlock(\n        second.player\n      );\n\n\n    const secondSleep =\n      consumeSleepBlock(\n        second.player\n      );\n\n\n    const secondSilence =\n      checkSilenceRestriction(\n        second.player,\n        second.action.skill,\n        battle.turn\n      );`,
    `    const secondIsTimeoutPass =\n      second.action.timeoutPass === true;\n\n\n    const secondControl =\n      secondIsTimeoutPass\n        ? { blocked: false }\n        : consumeControlBlock(\n            second.player\n          );\n\n\n    const secondSleep =\n      secondIsTimeoutPass\n        ? { blocked: false }\n        : consumeSleepBlock(\n            second.player\n          );\n\n\n    const secondSilence =\n      secondIsTimeoutPass\n        ? { blocked: false }\n        : checkSilenceRestriction(\n            second.player,\n            second.action.skill,\n            battle.turn\n          );`,
    "proteção de efeitos no timeout do segundo jogador"
  );

  source = replaceOnce(
    source,
    "      firstExecution?.kind ===\n        \"reaction_stance\"\n        ? matchReaction(",
    "      !secondIsTimeoutPass &&\n      firstExecution?.kind ===\n        \"reaction_stance\"\n        ? matchReaction(",
    "reação não dispara contra timeout"
  );

  source = replaceOnce(
    source,
    "    if (\n      secondControl.blocked\n    ) {",
    `    if (\n      secondIsTimeoutPass\n    ) {\n      secondExecution =\n        createTimeoutSkipExecution(\n          second.player\n        );\n    }\n\n\n    else if (\n      secondControl.blocked\n    ) {`,
    "execução perdida do segundo jogador"
  );
}

if (!source.includes("startBattleTurnClock(\n          battle")) {
  source = replaceOnce(
    source,
    "      else {\n        battle.state =\n          \"WAITING_ACTIONS\";\n      }",
    `      else {\n        battle.state =\n          \"WAITING_ACTIONS\";\n\n        startBattleTurnClock(\n          battle\n        );\n      }`,
    "novo relógio ao abrir próximo turno"
  );
}

if (!source.includes("await this.clearBattleTurnAlarm();\n    }\n    else {\n      await this.scheduleBattleTurnAlarm")) {
  source = replaceOnce(
    source,
    "    await this.saveData(\n    data\n    );\n\n    /*\n     * ==============================\n     * MENTALIDADE PÓS-PvP",
    `    await this.saveData(\n    data\n    );\n\n    if (\n      battleOver\n    ) {\n      await this.clearBattleTurnAlarm();\n    }\n    else {\n      await this.scheduleBattleTurnAlarm(\n        battle\n      );\n    }\n\n    /*\n     * ==============================\n     * MENTALIDADE PÓS-PvP`,
    "reagendamento após resolução"
  );
}

source = source.replace(
  "  async forfeitBattle(\n    user\n  ) {",
  "  async forfeitBattle(\n    user,\n    options = {}\n  ) {"
);

if (!source.includes("const forceLateForfeit")) {
  source = replaceOnce(
    source,
    "    const earlyForfeit =\n      turn < 3;",
    `    const forceLateForfeit =\n      options?.forceLateForfeit === true;\n\n    const earlyForfeit =\n      forceLateForfeit\n        ? false\n        : turn < 3;`,
    "forfeit de timeout sem early forfeit"
  );

  source = replaceOnce(
    source,
    "    battle.forfeit =\n      true;",
    `    battle.forfeit =\n      true;\n\n    battle.timeoutForfeit =\n      options?.timeoutForfeit === true;`,
    "flag de timeout forfeit"
  );

  source = replaceOnce(
    source,
    "    battle.finishReason =\n      \"FORFEIT\";",
    `    battle.finishReason =\n      options?.finishReason ||\n      \"FORFEIT\";`,
    "motivo configurável de forfeit"
  );
}

if (!source.includes("await this.clearBattleTurnAlarm();\n\n\n    const queuePromotion")) {
  source = replaceOnce(
    source,
    "    await this.saveData(\n      data\n    );\n\n\n    const queuePromotion =",
    `    await this.saveData(\n      data\n    );\n\n    await this.clearBattleTurnAlarm();\n\n\n    const queuePromotion =`,
    "limpeza do alarm no forfeit"
  );
}

if (!source.includes("await this.clearBattleTurnAlarm();\n\n\n    const adminQueuePromotion")) {
  source = replaceOnce(
    source,
    "    await this.saveData(\n      data\n    );\n\n\n    const adminQueuePromotion =",
    `    await this.saveData(\n      data\n    );\n\n    await this.clearBattleTurnAlarm();\n\n\n    const adminQueuePromotion =`,
    "limpeza do alarm no encerramento ADM"
  );
}

if (!source.includes("  async alarm() {")) {
  source = replaceOnce(
    source,
    "  async fetch(\n    request\n  ) {",
    `  async alarm() {\n    const data =\n      await this.getData();\n\n    const battle =\n      getGlobalActivePvpBattle(\n        data\n      );\n\n    if (!battle) {\n      await this.clearBattleTurnAlarm();\n\n      return {\n        ok: true,\n        activeBattle: false\n      };\n    }\n\n    const now =\n      Date.now();\n\n    const clock =\n      ensureBattleTurnClock(\n        battle,\n        now\n      );\n\n    if (!clock.ok) {\n      await this.clearBattleTurnAlarm();\n      return clock;\n    }\n\n    if (\n      now < clock.turnDeadline\n    ) {\n      await this.scheduleBattleTurnAlarm(\n        battle\n      );\n\n      return {\n        ok: true,\n        earlyAlarm: true,\n        turn: battle.turn,\n        turnDeadline: clock.turnDeadline\n      };\n    }\n\n    if (\n      battle.state !== \"WAITING_ACTIONS\"\n    ) {\n      await this.state.storage.setAlarm(\n        now + 1000\n      );\n\n      return {\n        ok: true,\n        deferred: true,\n        state: battle.state\n      };\n    }\n\n    const missingUsers =\n      getMissingActionUsers(\n        battle\n      );\n\n    if (\n      missingUsers.length === 0\n    ) {\n      await this.state.storage.setAlarm(\n        now + 1000\n      );\n\n      return {\n        ok: true,\n        deferred: true,\n        reason: \"NO_MISSING_ACTION\"\n      };\n    }\n\n    const timeoutResult =\n      registerTurnTimeouts(\n        battle,\n        missingUsers,\n        now\n      );\n\n    const reachedLimit =\n      timeoutResult.reachedLimit || [];
\n    /*\n     * Os dois atingiram o terceiro timeout\n     * no mesmo turno: empate por abandono mútuo.\n     */\n    if (\n      reachedLimit.length === 2\n    ) {\n      const finishedAt =\n        Date.now();\n\n      const persistence =\n        await this.persistBattleMentalidade(\n          battle,\n          finishedAt\n        );\n\n      if (!persistence.ok) {\n        await this.state.storage.setAlarm(\n          Date.now() + 5000\n        );\n\n        return {\n          ok: false,\n          error: \"MENTALIDADE_PERSIST_FAILED\"\n        };\n      }\n\n      battle.status = \"FINISHED\";\n      battle.state = \"FINISHED\";\n      battle.draw = true;\n      battle.timeoutDraw = true;\n      battle.finishReason = \"DOUBLE_TIMEOUT\";\n      battle.winner = null;\n      battle.loser = null;\n      battle.rankedResult = null;\n      battle.finishedAt = finishedAt;\n      battle.player1.action = null;\n      battle.player2.action = null;\n\n      await this.saveData(\n        data\n      );\n\n      await this.clearBattleTurnAlarm();\n\n      const promotion =\n        await this.startNextQueuedBattle();\n\n      return {\n        ok: true,\n        battleOver: true,\n        draw: true,\n        finishReason: \"DOUBLE_TIMEOUT\",\n        timeoutResult,\n        nextQueuedBattle:\n          promotion?.started\n            ? promotion.battle\n            : null\n      };\n    }\n\n    /*\n     * Terceiro timeout de apenas um jogador:\n     * derrota automática tratada como forfeit normal,\n     * sem a proteção de early forfeit.\n     */\n    if (\n      reachedLimit.length === 1\n    ) {\n      await this.saveData(\n        data\n      );\n\n      return this.forfeitBattle(\n        reachedLimit[0],\n        {\n          forceLateForfeit: true,\n          timeoutForfeit: true,\n          finishReason: \"TIMEOUT_FORFEIT\"\n        }\n      );\n    }\n\n    /*\n     * Primeiro/segundo timeout: quem não escolheu\n     * recebe uma ação interna de PASS e perde a ação.\n     * O motor normal resolve o turno, portanto DoTs,\n     * efeitos, KO e abertura do próximo turno continuam\n     * passando pelo fluxo já existente.\n     */\n    await this.saveData(\n      data\n    );\n\n    let resolution =\n      null;\n\n    for (\n      const timedOutUser\n      of missingUsers\n    ) {\n      resolution =\n        await this.chooseAction(\n          timedOutUser,\n          \"__timeout__\",\n          {\n            internalTimeout: true\n          }\n        );\n    }\n\n    return {\n      ok: true,\n      timeout: true,\n      timeoutResult,\n      resolution\n    };\n  }\n\n\n  async fetch(\n    request\n  ) {`,
    "handler do Durable Object Alarm"
  );
}

fs.writeFileSync(
  coordinatorPath,
  source,
  "utf8"
);

let attack =
  fs.readFileSync(
    attackPath,
    "utf8"
  );

if (!attack.includes("TURN_EXPIRED")) {
  attack = replaceOnce(
    attack,
    "    if (\n      result.error ===\n      \"NOT_IN_BATTLE\"\n    ) {",
    `    if (\n      result.error ===\n      \"TURN_EXPIRED\"\n    ) {\n      return new Response(\n        \`⏱️ @\${user}, o tempo do Turno \${result.turn} terminou. O timeout está sendo processado.\`\n      );\n    }\n\n\n    if (\n      result.error ===\n      \"NOT_IN_BATTLE\"\n    ) {`,
    "mensagem de turno expirado"
  );
}

fs.writeFileSync(
  attackPath,
  attack,
  "utf8"
);

console.log("✅ src/systems/pvp-timeout.js criado");
console.log("✅ relógio de 90s integrado ao início e aos novos turnos");
console.log("✅ Durable Object Alarm integrado");
console.log("✅ ação perdida por timeout integrada sem consumir efeitos");
console.log("✅ 3º timeout integrado como derrota automática");
console.log("✅ timeout duplo no limite integrado como empate");
console.log("✅ alarm limpo em KO, desistência e encerramento ADM");
console.log("✅ mensagem TURN_EXPIRED integrada");
console.log("\n⏱️ TIMEOUT DE TURNO INTEGRADO LOCALMENTE.");
