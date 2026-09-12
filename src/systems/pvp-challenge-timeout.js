export function partitionExpiredChallenges(
  challenges,
  now = Date.now()
) {
  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  const active = [];
  const expired = [];

  for (const challenge of Array.isArray(challenges) ? challenges : []) {
    const expiresAt =
      Number(challenge?.expiresAt);

    if (!Number.isFinite(expiresAt)) {
      continue;
    }

    if (expiresAt <= safeNow) {
      expired.push(challenge);
    }
    else {
      active.push(challenge);
    }
  }

  return {
    active,
    expired
  };
}


export function getNextChallengeExpiry(
  challenges,
  now = Date.now()
) {
  const safeNow =
    Math.max(
      0,
      Number(now) || Date.now()
    );

  let next =
    null;

  for (const challenge of Array.isArray(challenges) ? challenges : []) {
    const expiresAt =
      Number(challenge?.expiresAt);

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= safeNow
    ) {
      continue;
    }

    if (
      next === null ||
      expiresAt < next
    ) {
      next =
        expiresAt;
    }
  }

  return next;
}


export function formatChallengeTimeoutMessage(
  challenge
) {
  const challenger =
    String(challenge?.challenger ?? "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  const target =
    String(challenge?.target ?? "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  if (!challenger || !target) {
    return null;
  }

  return (
    `⌛ @${target} não respondeu ao desafio de @${challenger} a tempo. ` +
    `O desafio de PvP foi cancelado.`
  );
}
