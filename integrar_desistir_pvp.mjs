import fs from "node:fs";

const files = {
  ranking: "src/systems/pvp-ranking.js",
  coordinator: "src/durable/PvpCoordinator.js",
  router: "src/router.js",
  route: "src/routes/forfeit.js"
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) {
    console.log(`✅ ${label} já integrado`);
    return source;
  }

  const index = source.indexOf(before);

  if (index === -1) {
    throw new Error(`Não encontrei o ponto de integração: ${label}`);
  }

  console.log(`✅ ${label} integrado`);

  return (
    source.slice(0, index) +
    after +
    source.slice(index + before.length)
  );
}

let ranking = read(files.ranking);

const rankingMarker = `  const friendly =\n    pair.friendly === true;\n\n\n  if (friendly) {`;

const rankingForfeit = `  const friendly =\n    pair.friendly === true;\n\n  const forfeit =\n    options?.forfeit === true;\n\n  const earlyForfeit =\n    options?.earlyForfeit === true;\n\n\n  /*\n   * ==============================\n   * DESISTÊNCIA / FORFEIT\n   * ==============================\n   *\n   * O desistente sempre recebe a penalidade\n   * de 2x da perda normal, limitada pelo cap\n   * global de forfeit. A proteção anti-farm\n   * pode bloquear a recompensa do vencedor,\n   * mas não remove a punição de quem desistiu.\n   *\n   * Antes do Turno 3:\n   * - vencedor recebe +0 rating;\n   * - não recebe vitória nem streak;\n   * - ambos registram participação no PvP.\n   *\n   * A partir do Turno 3:\n   * - vencedor recebe resultado normal se a\n   *   dupla ainda for elegível para ranqueada;\n   * - se o anti-farm estiver ativo, o vencedor\n   *   não recebe rating nem estatísticas para\n   *   impedir farming por desistência.\n   */\n  if (forfeit) {\n    const calculation =\n      calculateDynamicRatingResult(\n        winnerBefore,\n        loserBefore,\n        {\n          ...options,\n          forfeit: true,\n          earlyForfeit\n        }\n      );\n\n\n    const winnerGain =\n      earlyForfeit ||\n      friendly\n        ? 0\n        : calculation.winnerGain;\n\n    const loserLoss =\n      calculation.loserLoss;\n\n\n    winnerPvp.rating =\n      winnerBefore +\n      winnerGain;\n\n    loserPvp.rating =\n      Math.max(\n        0,\n        loserBefore -\n        loserLoss\n      );\n\n\n    /*\n     * O desistente sempre recebe derrota.\n     */\n    loserPvp.losses += 1;\n    loserPvp.duels += 1;\n    loserPvp.streak = 0;\n\n\n    if (earlyForfeit) {\n      /*\n       * Participação registrada, mas sem\n       * vitória/streak para o adversário.\n       */\n      winnerPvp.duels += 1;\n    }\n\n    else if (!friendly) {\n      winnerPvp.wins += 1;\n      winnerPvp.duels += 1;\n      winnerPvp.streak += 1;\n\n      winnerPvp.bestStreak =\n        Math.max(\n          winnerPvp.bestStreak,\n          winnerPvp.streak\n        );\n    }\n\n\n    winnerPvp.peakRating =\n      Math.max(\n        winnerPvp.peakRating,\n        winnerPvp.rating\n      );\n\n    loserPvp.peakRating =\n      Math.max(\n        loserPvp.peakRating,\n        loserPvp.rating\n      );\n\n\n    const winnerRank =\n      getRankFromRating(\n        winnerPvp.rating\n      );\n\n    const loserRank =\n      getRankFromRating(\n        loserPvp.rating\n      );\n\n\n    winnerPvp.rank =\n      winnerRank.label;\n\n    loserPvp.rank =\n      loserRank.label;\n\n\n    return {\n      rated: true,\n      friendly: false,\n      antiFarm:\n        friendly,\n      winnerRewardSuppressed:\n        earlyForfeit ||\n        friendly,\n      pairTracked:\n        pair.tracked,\n      previousPairMatchesInWindow:\n        pair.previousMatchesInWindow,\n      pairMatchesInWindow:\n        pair.matchesInWindow,\n      windowMs:\n        PVP_PAIR_WINDOW_MS,\n      forfeit: true,\n      earlyForfeit,\n      change:\n        winnerGain,\n\n      winner: {\n        before:\n          winnerBefore,\n        after:\n          winnerPvp.rating,\n        gain:\n          winnerGain,\n        rank:\n          winnerRank.label,\n        wins:\n          winnerPvp.wins,\n        duels:\n          winnerPvp.duels,\n        streak:\n          winnerPvp.streak,\n        difficulty:\n          calculation.winnerDifficulty\n      },\n\n      loser: {\n        before:\n          loserBefore,\n        after:\n          loserPvp.rating,\n        loss:\n          loserLoss,\n        requestedLoss:\n          calculation.requestedLoserLoss,\n        rank:\n          loserRank.label,\n        losses:\n          loserPvp.losses,\n        duels:\n          loserPvp.duels,\n        difficulty:\n          calculation.loserDifficulty\n      }\n    };\n  }\n\n\n  if (friendly) {`;

ranking = replaceOnce(
  ranking,
  rankingMarker,
  rankingForfeit,
  "regra ranqueada de desistência"
);

write(files.ranking, ranking);

let coordinator = read(files.coordinator);

coordinator = replaceOnce(
  coordinator,
  `    async applyRankedBattleResult(\n    winnerUser,\n    loserUser\n    ) {`,
  `    async applyRankedBattleResult(\n    winnerUser,\n    loserUser,\n    options = {}\n    ) {`,
  "opções do resultado ranqueado"
);

coordinator = replaceOnce(
  coordinator,
  `    const result =\n        applyRankedResult(\n        winnerProfile,\n        loserProfile\n        );\n\n\n    const now =\n        Date.now();`,
  `    const now =\n        Date.now();\n\n\n    const result =\n        applyRankedResult(\n        winnerProfile,\n        loserProfile,\n        {\n            ...options,\n            winnerUser,\n            loserUser,\n            now\n        }\n        );`,
  "identidade explícita no ranking"
);

const forfeitMethodMarker = `  async adminModifyBattleResource(\n    user,\n    resource,\n    mode,\n    amount\n  ) {`;

const forfeitMethod = `  async forfeitBattle(\n    user\n  ) {\n    user =\n      normalizeUser(\n        user\n      );\n\n\n    if (!user) {\n      return {\n        ok: false,\n        error: \"INVALID_USER\"\n      };\n    }\n\n\n    const data =\n      await this.getData();\n\n    const battle =\n      this.findBattleByUser(\n        data,\n        user\n      );\n\n\n    if (!battle) {\n      return {\n        ok: false,\n        error: \"NOT_IN_BATTLE\"\n      };\n    }\n\n\n    const winner =\n      battle.player1.user === user\n        ? battle.player2.user\n        : battle.player1.user;\n\n    const loser =\n      user;\n\n    const turn =\n      Math.max(\n        1,\n        Number(\n          battle.turn\n        ) || 1\n      );\n\n    const earlyForfeit =\n      turn < 3;\n\n\n    const rankedResult =\n      await this.applyRankedBattleResult(\n        winner,\n        loser,\n        {\n          forfeit: true,\n          earlyForfeit\n        }\n      );\n\n\n    if (!rankedResult?.ok) {\n      return {\n        ok: false,\n        error:\n          rankedResult?.error ||\n          \"RANKED_RESULT_FAILED\"\n      };\n    }\n\n\n    const finishedAt =\n      Date.now();\n\n    const persistence =\n      await this.persistBattleMentalidade(\n        battle,\n        finishedAt\n      );\n\n\n    if (!persistence.ok) {\n      return {\n        ok: false,\n        error:\n          \"MENTALIDADE_PERSIST_FAILED\"\n      };\n    }\n\n\n    battle.status =\n      \"FINISHED\";\n\n    battle.state =\n      \"FINISHED\";\n\n    battle.draw =\n      false;\n\n    battle.forfeit =\n      true;\n\n    battle.forfeitedBy =\n      loser;\n\n    battle.finishReason =\n      \"FORFEIT\";\n\n    battle.winner =\n      winner;\n\n    battle.loser =\n      loser;\n\n    battle.rankedResult =\n      rankedResult;\n\n    battle.finishedAt =\n      finishedAt;\n\n    battle.player1.action =\n      null;\n\n    battle.player2.action =\n      null;\n\n\n    await this.saveData(\n      data\n    );\n\n\n    const queuePromotion =\n      await this.startNextQueuedBattle();\n\n    const nextQueuedBattle =\n      queuePromotion?.started\n        ? queuePromotion.battle\n        : null;\n\n\n    return {\n      ok: true,\n      forfeit: true,\n      earlyForfeit,\n      turn,\n      winner,\n      loser,\n      finishedAt,\n      rankedResult,\n      nextQueuedBattle,\n\n      player1: {\n        user:\n          battle.player1.user,\n        mentalidade:\n          persistence.player1.mentalidade,\n        maxMentalidade:\n          battle.player1.maxMentalidade\n      },\n\n      player2: {\n        user:\n          battle.player2.user,\n        mentalidade:\n          persistence.player2.mentalidade,\n        maxMentalidade:\n          battle.player2.maxMentalidade\n      }\n    };\n  }\n\n\n${forfeitMethodMarker}`;

coordinator = replaceOnce(
  coordinator,
  forfeitMethodMarker,
  forfeitMethod,
  "método forfeitBattle"
);

const endpointMarker = `    if (\n      url.pathname ===\n      \"/admin-resource\"\n    ) {`;

const endpointBlock = `    if (\n      url.pathname ===\n      \"/forfeit\"\n    ) {\n      const result =\n        await this.forfeitBattle(\n          url.searchParams.get(\n            \"user\"\n          )\n        );\n\n\n      return Response.json(\n        result\n      );\n    }\n\n\n${endpointMarker}`;

coordinator = replaceOnce(
  coordinator,
  endpointMarker,
  endpointBlock,
  "endpoint interno /forfeit"
);

write(files.coordinator, coordinator);

const routeContent = `function getCoordinator(\n  env\n) {\n  const id =\n    env.PVP_COORDINATOR.idFromName(\n      \"marbion-global-pvp\"\n    );\n\n  return env.PVP_COORDINATOR.get(\n    id\n  );\n}\n\n\nexport async function forfeitRoute(\n  request,\n  env\n) {\n  const url =\n    new URL(request.url);\n\n  const user =\n    url.searchParams.get(\n      \"user\"\n    );\n\n\n  if (!user) {\n    return new Response(\n      \"❌ Usuário não informado.\"\n    );\n  }\n\n\n  const coordinator =\n    getCoordinator(\n      env\n    );\n\n  const internalUrl =\n    new URL(\n      \"https://pvp.internal/forfeit\"\n    );\n\n  internalUrl.searchParams.set(\n    \"user\",\n    user\n  );\n\n\n  const response =\n    await coordinator.fetch(\n      new Request(\n        internalUrl.toString()\n      )\n    );\n\n  const result =\n    await response.json();\n\n\n  if (!result.ok) {\n    if (\n      result.error ===\n      \"NOT_IN_BATTLE\"\n    ) {\n      return new Response(\n        \\`@\\${user}, você não está em uma batalha PvP ativa.\\`\n      );\n    }\n\n    return new Response(\n      \"❌ Não foi possível desistir do PvP.\"\n    );\n  }\n\n\n  const ranked =\n    result.rankedResult;\n\n  const winnerGain =\n    Number(\n      ranked?.winner?.gain\n    ) || 0;\n\n  const loserLoss =\n    Number(\n      ranked?.loser?.loss\n    ) || 0;\n\n\n  let message =\n    \\`🏳️ @\\${result.loser} desistiu no Turno \\${result.turn}. \\` +\n    \\`🏆 @\\${result.winner} venceu.\\`;\n\n\n  if (\n    result.earlyForfeit === true\n  ) {\n    message +=\n      \\` | Desistência antes do Turno 3: @\\${result.winner} +0 XP de Combate \\` +\n      \\`→ \\${ranked.winner.after} [\\${ranked.winner.rank}] | \\` +\n      \\`@\\${result.loser} -\\${loserLoss} → \\${ranked.loser.after} [\\${ranked.loser.rank}].\\`;\n  }\n\n  else if (\n    ranked?.antiFarm === true\n  ) {\n    message +=\n      \\` | 🤝 Anti-farm: recompensa de @\\${result.winner} bloqueada (+0). \\` +\n      \\`@\\${result.loser} ainda recebe a penalidade de desistência: \\` +\n      \\`-\\${loserLoss} → \\${ranked.loser.after} [\\${ranked.loser.rank}].\\`;\n  }\n\n  else {\n    message +=\n      \\` | XP de Combate: @\\${result.winner} +\\${winnerGain} → \\${ranked.winner.after} [\\${ranked.winner.rank}] | \\` +\n      \\`@\\${result.loser} -\\${loserLoss} → \\${ranked.loser.after} [\\${ranked.loser.rank}].\\`;\n  }\n\n\n  const next =\n    result.nextQueuedBattle;\n\n  if (\n    next?.player1?.user &&\n    next?.player2?.user\n  ) {\n    message +=\n      \\` | ▶️ Próximo PvP iniciado: @\\${next.player1.user} VS @\\${next.player2.user}.\\`;\n  }\n\n\n  return new Response(\n    message\n  );\n}\n`;

if (!fs.existsSync(files.route)) {
  write(files.route, routeContent);
  console.log("✅ rota pública /desistir criada");
}
else {
  console.log("✅ rota pública /desistir já existe");
}

let router = read(files.router);

router = replaceOnce(
  router,
  `import { refuseRoute } from "./routes/refuse.js";\nimport { acceptRoute } from "./routes/accept.js";`,
  `import { refuseRoute } from "./routes/refuse.js";\nimport { forfeitRoute } from "./routes/forfeit.js";\nimport { acceptRoute } from "./routes/accept.js";`,
  "import da rota forfeit"
);

router = replaceOnce(
  router,
  `  if (path === "/aceitar") {\n    return acceptRoute(\n      request,\n      env\n    );\n  }`,
  `  if (path === "/desistir") {\n    return forfeitRoute(\n      request,\n      env\n    );\n  }\n\n  if (path === "/aceitar") {\n    return acceptRoute(\n      request,\n      env\n    );\n  }`,
  "rota pública /desistir"
);

write(files.router, router);

console.log("\n🏳️ !desistir integrado localmente.");
