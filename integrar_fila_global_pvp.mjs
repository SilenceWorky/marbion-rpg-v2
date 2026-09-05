import fs from "node:fs";


function read(path) {
  return fs.readFileSync(path, "utf8");
}


function write(path, text) {
  fs.writeFileSync(path, text, "utf8");
}


function replaceRequired(
  text,
  search,
  replacement,
  label
) {
  if (!text.includes(search)) {
    throw new Error(`❌ ${label}: padrão não encontrado.`);
  }

  console.log(`✅ ${label}`);
  return text.replace(search, replacement);
}


function insertBeforeRequired(
  text,
  marker,
  block,
  alreadyMarker,
  label
) {
  if (
    alreadyMarker &&
    text.includes(alreadyMarker)
  ) {
    console.log(`↪ ${label}: já integrado.`);
    return text;
  }

  if (!text.includes(marker)) {
    throw new Error(`❌ ${label}: marcador não encontrado.`);
  }

  console.log(`✅ ${label}`);
  return text.replace(
    marker,
    `${block}${marker}`
  );
}


/* =========================================================
 * PVP COORDINATOR
 * ========================================================= */
const pvpPath =
  "src/durable/PvpCoordinator.js";

let pvp =
  read(pvpPath);


if (
  !pvp.includes(
    'from "../systems/pvp-queue.js";'
  )
) {
  const importMarker = `import {
  ensurePlayerSkillCooldowns,
  getSkillCooldownStatus,
  startSkillCooldown
} from "../systems/cooldown.js";
`;

  const queueImport = `${importMarker}
import {
  ensureGlobalPvpQueue,
  getGlobalActivePvpBattle,
  findQueuedPvpByUser,
  enqueueAcceptedPvp,
  dequeueNextPvp
} from "../systems/pvp-queue.js";
`;

  pvp =
    replaceRequired(
      pvp,
      importMarker,
      queueImport,
      "PvP importa motor da fila global"
    );
}
else {
  console.log("↪ PvP importa motor da fila global: já integrado.");
}


if (
  !pvp.includes(
    "ensureGlobalPvpQueue(\n      data\n    );"
  )
) {
  const oldGetData = `  async getData() {
    const data =
      await this.state.storage.get(
        "pvp"
      );

    return data || {
      challenges: [],
      battles: []
    };
  }
`;

  const newGetData = `  async getData() {
    const data =
      await this.state.storage.get(
        "pvp"
      ) || {
        challenges: [],
        battles: [],
        queue: []
      };


    if (!Array.isArray(data.challenges)) {
      data.challenges = [];
    }

    if (!Array.isArray(data.battles)) {
      data.battles = [];
    }

    ensureGlobalPvpQueue(
      data
    );


    return data;
  }
`;

  pvp =
    replaceRequired(
      pvp,
      oldGetData,
      newGetData,
      "Estado antigo do PvP recebe queue automaticamente"
    );
}
else {
  console.log("↪ Estado do PvP já normaliza queue.");
}


const challengeMarker = `    if (
      this.findChallengeByUser(
        data,
        challenger
      )
    ) {
`;

const queueChallengeChecks = `    if (
      findQueuedPvpByUser(
        data,
        challenger
      )
    ) {
      return {
        ok: false,
        error: "CHALLENGER_IN_QUEUE"
      };
    }


    if (
      findQueuedPvpByUser(
        data,
        target
      )
    ) {
      return {
        ok: false,
        error: "TARGET_IN_QUEUE"
      };
    }


`;

pvp =
  insertBeforeRequired(
    pvp,
    challengeMarker,
    queueChallengeChecks,
    "CHALLENGER_IN_QUEUE",
    "Desafio bloqueia jogadores que já aguardam na fila"
  );


const acceptMarker = `    /*
     * ==============================
     * REGENERAÇÃO PRÉ-PvP
     * ==============================
`;

const queueOnAccept = `    const activeGlobalBattle =
      getGlobalActivePvpBattle(
        data
      );


    if (activeGlobalBattle) {
      const queued =
        enqueueAcceptedPvp(
          data,
          {
            challenger:
              challenge.challenger,

            target:
              challenge.target,

            acceptedAt:
              Date.now()
          }
        );


      if (!queued.ok) {
        data.challenges.splice(
          challengeIndex,
          1
        );

        await this.saveData(
          data
        );

        return {
          ok: false,
          error:
            queued.error ||
            "PLAYER_ALREADY_QUEUED"
        };
      }


      data.challenges.splice(
        challengeIndex,
        1
      );

      await this.saveData(
        data
      );


      return {
        ok: true,
        queued: true,
        position:
          queued.position,
        challenger:
          challenge.challenger,
        target:
          challenge.target,
        activeBattle: {
          player1:
            activeGlobalBattle.player1?.user,
          player2:
            activeGlobalBattle.player2?.user
        }
      };
    }


`;

pvp =
  insertBeforeRequired(
    pvp,
    acceptMarker,
    queueOnAccept,
    "const activeGlobalBattle =",
    "!aceitar envia a dupla para a fila quando já existe PvP ativo"
  );


const startNextMethod = `  async startNextQueuedBattle() {
    while (true) {
      const data =
        await this.getData();


      if (
        getGlobalActivePvpBattle(
          data
        )
      ) {
        return {
          started: false,
          reason: "ACTIVE_BATTLE"
        };
      }


      const next =
        dequeueNextPvp(
          data
        );


      if (!next) {
        await this.saveData(
          data
        );

        return {
          started: false,
          reason: "QUEUE_EMPTY"
        };
      }


      /*
       * Remove qualquer desafio antigo envolvendo
       * os jogadores antes de promover a dupla.
       */
      data.challenges =
        data.challenges.filter(
          challenge =>
            challenge.challenger !== next.challenger &&
            challenge.target !== next.challenger &&
            challenge.challenger !== next.target &&
            challenge.target !== next.target
        );


      const now =
        Date.now();


      data.challenges.push({
        challenger:
          next.challenger,
        target:
          next.target,
        createdAt:
          now,
        expiresAt:
          now + CHALLENGE_TIMEOUT,
        promotedFromQueue:
          true
      });


      await this.saveData(
        data
      );


      const result =
        await this.acceptChallenge(
          next.target
        );


      if (
        result.ok &&
        result.battle
      ) {
        return {
          started: true,
          battle:
            result.battle,
          queueEntry:
            next
        };
      }

      /*
       * Entrada inválida (perfil removido etc.).
       * Ela já saiu da fila; tentamos a próxima.
       */
    }
  }


`;

pvp =
  insertBeforeRequired(
    pvp,
    "  async acceptChallenge(\n",
    startNextMethod,
    "async startNextQueuedBattle()",
    "Coordenador promove automaticamente a próxima dupla FIFO"
  );


/* Admin finish -> promoção da fila. */
{
  const start =
    pvp.indexOf(
      "  async adminFinishBattle("
    );

  const end =
    pvp.indexOf(
      "  cleanExpiredChallenges(",
      start
    );

  if (
    start < 0 ||
    end < 0
  ) {
    throw new Error(
      "❌ Não foi possível localizar adminFinishBattle."
    );
  }

  let section =
    pvp.slice(start, end);


  if (
    !section.includes(
      "adminQueuePromotion"
    )
  ) {
    const marker = `    await this.saveData(
      data
    );


    return {
`;

    const replacement = `    await this.saveData(
      data
    );


    const adminQueuePromotion =
      await this.startNextQueuedBattle();

    const nextQueuedBattle =
      adminQueuePromotion?.started
        ? adminQueuePromotion.battle
        : null;


    return {
`;

    section =
      replaceRequired(
        section,
        marker,
        replacement,
        "Fim ADM promove próxima luta da fila"
      );

    section =
      replaceRequired(
        section,
        `      finishedAt,

      player1: {`,
        `      finishedAt,
      nextQueuedBattle,

      player1: {`,
        "Resultado ADM devolve próxima batalha promovida"
      );

    pvp =
      pvp.slice(0, start) +
      section +
      pvp.slice(end);
  }
  else {
    console.log("↪ Fim ADM já promove a fila.");
  }
}


/* Fim natural -> promoção da fila. */
{
  const start =
    pvp.indexOf(
      "    async chooseAction("
    );

  const end =
    pvp.indexOf(
      "  async getPlayerState(\n",
      start
    );

  if (
    start < 0 ||
    end < 0
  ) {
    throw new Error(
      "❌ Não foi possível localizar chooseAction."
    );
  }

  let section =
    pvp.slice(start, end);


  if (
    !section.includes(
      "naturalQueuePromotion"
    )
  ) {
    const oldPersistence = `    if (
      battleOver
    ) {
      await this.persistBattleMentalidade(
        battle,
        battle.finishedAt ||
        Date.now()
      );
    }

    return {
`;

    const newPersistence = `    let nextQueuedBattle =
      null;


    if (
      battleOver
    ) {
      await this.persistBattleMentalidade(
        battle,
        battle.finishedAt ||
        Date.now()
      );


      const naturalQueuePromotion =
        await this.startNextQueuedBattle();

      nextQueuedBattle =
        naturalQueuePromotion?.started
          ? naturalQueuePromotion.battle
          : null;
    }

    return {
`;

    section =
      replaceRequired(
        section,
        oldPersistence,
        newPersistence,
        "Fim natural promove próxima luta da fila"
      );

    section =
      replaceRequired(
        section,
        `        draw,

        nextTurn:`,
        `        draw,

        nextQueuedBattle,

        nextTurn:`,
        "Resultado do turno devolve próxima batalha promovida"
      );

    pvp =
      pvp.slice(0, start) +
      section +
      pvp.slice(end);
  }
  else {
    console.log("↪ Fim natural já promove a fila.");
  }
}


write(
  pvpPath,
  pvp
);


/* =========================================================
 * PVP ROUTE
 * ========================================================= */
const challengeRoutePath =
  "src/routes/pvp.js";

let challengeRoute =
  read(challengeRoutePath);


if (
  !challengeRoute.includes(
    '"CHALLENGER_IN_QUEUE"'
  )
) {
  const marker = `    if (
      result.error ===
      "CHALLENGER_HAS_CHALLENGE"
    ) {
`;

  const block = `    if (
      result.error ===
      "CHALLENGER_IN_QUEUE"
    ) {
      return new Response(
        \`@\${challenger}, você já está aguardando um PvP na fila global.\`
      );
    }


    if (
      result.error ===
      "TARGET_IN_QUEUE"
    ) {
      return new Response(
        \`@\${challenger}, esse jogador já está aguardando um PvP na fila global.\`
      );
    }


`;

  challengeRoute =
    insertBeforeRequired(
      challengeRoute,
      marker,
      block,
      null,
      "!pvp informa quando alguém já está na fila"
    );
}
else {
  console.log("↪ !pvp já trata jogadores na fila.");
}

write(
  challengeRoutePath,
  challengeRoute
);


/* =========================================================
 * ACCEPT ROUTE
 * ========================================================= */
const acceptPath =
  "src/routes/accept.js";

let accept =
  read(acceptPath);


if (
  !accept.includes(
    "result.queued === true"
  )
) {
  const marker = `  const battle =
    result.battle;
`;

  const block = `  if (
    result.queued === true
  ) {
    const current =
      result.activeBattle;

    const currentText =
      current?.player1 &&
      current?.player2
        ? \` | PvP atual: @\${current.player1} VS @\${current.player2}.\`
        : "";


    return new Response(
      \`🎟️ @\${result.target} aceitou o desafio de @\${result.challenger}. \` +
      \`Dupla adicionada à fila global na posição \${result.position}.\` +
      currentText
    );
  }


`;

  accept =
    insertBeforeRequired(
      accept,
      marker,
      block,
      null,
      "!aceitar informa posição da dupla na fila"
    );
}
else {
  console.log("↪ !aceitar já informa fila.");
}

write(
  acceptPath,
  accept
);


/* =========================================================
 * ATTACK ROUTE
 * ========================================================= */
const attackPath =
  "src/routes/attack.js";

let attack =
  read(attackPath);


if (
  !attack.includes(
    "const nextQueuedBattleText ="
  )
) {
  const battleOverMarker = `    if (
    result.battleOver
    ) {
`;

  const block = `    const nextQueuedBattleText =
      result.nextQueuedBattle
        ? \` ⚔️ Próximo PvP da fila iniciado: @\${result.nextQueuedBattle.player1.user} VS @\${result.nextQueuedBattle.player2.user} | Turno 1.\`
        : "";


`;

  attack =
    insertBeforeRequired(
      attack,
      battleOverMarker,
      block,
      null,
      "Chat prepara anúncio da próxima batalha da fila"
    );

  attack =
    replaceRequired(
      attack,
      `      message +=
        \` O PvP terminou em empate.\`;
`,
      `      message +=
        \` O PvP terminou em empate.\` +
        nextQueuedBattleText;
`,
      "Empate anuncia próxima batalha da fila"
    );

  const rankedReturnMarker = `    return new Response(
        message
    );
    }
`;

  attack =
    replaceRequired(
      attack,
      rankedReturnMarker,
      `    if (nextQueuedBattleText) {
      message +=
        nextQueuedBattleText;
    }


    return new Response(
        message
    );
    }
`,
      "Vitória anuncia próxima batalha da fila"
    );
}
else {
  console.log("↪ Chat de ataque já anuncia próxima batalha.");
}

write(
  attackPath,
  attack
);


/* =========================================================
 * ADMIN ROUTE
 * ========================================================= */
const adminPath =
  "src/routes/admin.js";

let admin =
  read(adminPath);


if (
  !admin.includes(
    "const nextQueuedBattleText ="
  )
) {
  const marker = `    const mentalidadeText =
      \`@\${result.player1.user}: 🧠 \${result.player1.mentalidade}/\${result.player1.maxMentalidade} | \` +
      \`@\${result.player2.user}: 🧠 \${result.player2.mentalidade}/\${result.player2.maxMentalidade}\`;
`;

  const replacement = `${marker}

    const nextQueuedBattleText =
      result.nextQueuedBattle
        ? \` | ⚔️ Próximo PvP da fila iniciado: @\${result.nextQueuedBattle.player1.user} VS @\${result.nextQueuedBattle.player2.user} | Turno 1.\`
        : "";
`;

  admin =
    replaceRequired(
      admin,
      marker,
      replacement,
      "ADM prepara anúncio da próxima luta da fila"
    );

  admin =
    replaceRequired(
      admin,
      `        \`Sem alteração de Elo/estatísticas. | \${mentalidadeText}\`
`,
      `        \`Sem alteração de Elo/estatísticas. | \${mentalidadeText}\${nextQueuedBattleText}\`
`,
      "Empate ADM anuncia próxima luta"
    );

  admin =
    replaceRequired(
      admin,
      `      \`Sem alteração de Elo/estatísticas. | \${mentalidadeText}\`
`,
      `      \`Sem alteração de Elo/estatísticas. | \${mentalidadeText}\${nextQueuedBattleText}\`
`,
      "Vitória ADM anuncia próxima luta"
    );
}
else {
  console.log("↪ ADM já anuncia próxima batalha.");
}

write(
  adminPath,
  admin
);


console.log();
console.log("🎟️ Integração da fila global de PvP aplicada.");
