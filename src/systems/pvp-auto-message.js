function skillLabel(execution) {
  return String(
    execution?.skill ??
    "habilidade"
  );
}


function hpAfterFor(
  execution,
  result
) {
  const user =
    execution?.defender;

  const p1 =
    result?.hp?.player1;

  const p2 =
    result?.hp?.player2;

  const hp =
    p1?.user === user
      ? p1
      : p2?.user === user
        ? p2
        : null;

  const current =
    Number.isFinite(
      Number(execution?.defenderHp)
    )
      ? Number(execution.defenderHp)
      : Number(hp?.current);

  return {
    current:
      Number.isFinite(current)
        ? current
        : null,
    max:
      Number.isFinite(Number(hp?.max))
        ? Number(hp.max)
        : null
  };
}


export function formatAutomaticExecution(
  execution,
  result
) {
  if (!execution) {
    return "";
  }

  if (
    execution.kind ===
    "timeout_skip"
  ) {
    return "";
  }

  if (
    execution.kind ===
    "meditate"
  ) {
    return (
      `🧘 @${execution.user} meditou e recuperou ` +
      `${execution.recovered} de Mentalidade. ` +
      `Mentalidade: ${execution.after}/${execution.maxMentalidade}.`
    );
  }

  if (
    execution.kind ===
    "heal"
  ) {
    return (
      `💚 @${execution.user} usou ${skillLabel(execution)} e recuperou ` +
      `${execution.healing} de HP. HP: ${execution.hpAfter}/${execution.maxHp}.`
    );
  }

  if (
    execution.kind ===
    "buff"
  ) {
    return (
      `✨ @${execution.user} usou ${skillLabel(execution)}.`
    );
  }

  if (
    execution.kind ===
    "reaction_stance"
  ) {
    return (
      `🛡️ @${execution.user} preparou ${skillLabel(execution)}.`
    );
  }

  if (
    execution.kind ===
      "control_blocked" ||
    execution.kind ===
      "sleep_blocked" ||
    execution.kind ===
      "silence_blocked"
  ) {
    return (
      `⛔ @${execution.attacker} tentou usar ${skillLabel(execution)}, ` +
      `mas perdeu a ação por um efeito de controle.`
    );
  }

  if (
    execution.kind ===
    "confusion_self_hit"
  ) {
    return (
      `😵 @${execution.attacker} se confundiu, sofreu ` +
      `${execution.damage} de dano e perdeu a ação. ` +
      `HP: ${execution.hpAfter}.`
    );
  }

  if (
    execution.hit === false
  ) {
    return (
      `@${execution.attacker} usou ${skillLabel(execution)}, mas errou.`
    );
  }

  if (
    execution.attacker &&
    execution.defender &&
    Number.isFinite(
      Number(execution.damage)
    )
  ) {
    const hp =
      hpAfterFor(
        execution,
        result
      );

    const hpText =
      hp.current != null &&
      hp.max != null
        ? ` HP: ${hp.current}/${hp.max}.`
        : "";

    return (
      `@${execution.attacker} usou ${skillLabel(execution)} e causou ` +
      `${Number(execution.damage)} de dano em @${execution.defender}.` +
      hpText
    );
  }

  const actor =
    execution.user ||
    execution.attacker;

  if (actor) {
    return (
      `@${actor} executou ${skillLabel(execution)}.`
    );
  }

  return "";
}


export function formatAutomaticPvpResolution(
  result
) {
  if (
    !result ||
    result.ok === false ||
    result.waiting === true
  ) {
    return "";
  }

  const parts = [];

  const first =
    formatAutomaticExecution(
      result.firstExecution,
      result
    );

  const second =
    formatAutomaticExecution(
      result.secondExecution,
      result
    );

  if (first) parts.push(first);
  if (second) parts.push(second);

  if (
    result.battleOver === true
  ) {
    if (result.draw === true) {
      parts.push("O PvP terminou em empate.");
    }
    else if (result.winner) {
      parts.push(
        `🏆 @${result.winner} venceu o PvP!`
      );
    }
  }
  else if (
    Number.isFinite(
      Number(result.nextTurn)
    )
  ) {
    parts.push(
      `⚔️ Turno ${Number(result.nextTurn)} iniciado.`
    );
  }

  return parts
    .filter(Boolean)
    .join(" ")
    .trim();
}


export function formatAutomaticForfeitResult(
  result
) {
  if (
    !result?.ok ||
    !result.winner ||
    !result.loser
  ) {
    return "";
  }

  let message =
    `🏆 @${result.winner} venceu o PvP por inatividade de @${result.loser}.`;

  const ranked =
    result.rankedResult;

  if (
    ranked?.ok &&
    ranked.friendly === true
  ) {
    message +=
      " 🤝 Partida amistosa: XP de Combate ±0.";
  }
  else if (
    ranked?.ok
  ) {
    const gain =
      Number(ranked.winner?.gain) || 0;

    const loss =
      Number(ranked.loser?.loss) || 0;

    message +=
      ` XP de Combate: @${result.winner} +${gain} → ${ranked.winner.after} ` +
      `| @${result.loser} -${loss} → ${ranked.loser.after}.`;
  }

  return message;
}
