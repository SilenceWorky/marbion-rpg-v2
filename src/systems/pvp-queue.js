function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export function ensureGlobalPvpQueue(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  if (!Array.isArray(data.queue)) {
    data.queue = [];
  }

  return data.queue;
}


export function getActivePvpBattles(data) {
  const battles =
    Array.isArray(data?.battles)
      ? data.battles
      : [];

  return battles.filter(
    battle =>
      battle?.status === "ACTIVE"
  );
}


export function getGlobalActivePvpBattle(data) {
  return getActivePvpBattles(data)[0] || null;
}


export function findQueuedPvpByUser(
  data,
  user
) {
  const target =
    normalizeUser(user);

  if (!target) {
    return null;
  }

  const queue =
    ensureGlobalPvpQueue(data);

  return queue.find(
    entry =>
      entry?.challenger === target ||
      entry?.target === target
  ) || null;
}


export function enqueueAcceptedPvp(
  data,
  {
    challenger,
    target,
    acceptedAt = Date.now()
  } = {}
) {
  const normalizedChallenger =
    normalizeUser(challenger);

  const normalizedTarget =
    normalizeUser(target);

  if (
    !normalizedChallenger ||
    !normalizedTarget ||
    normalizedChallenger === normalizedTarget
  ) {
    return {
      ok: false,
      error: "INVALID_QUEUE_PLAYERS"
    };
  }

  if (
    findQueuedPvpByUser(
      data,
      normalizedChallenger
    ) ||
    findQueuedPvpByUser(
      data,
      normalizedTarget
    )
  ) {
    return {
      ok: false,
      error: "PLAYER_ALREADY_QUEUED"
    };
  }

  const queue =
    ensureGlobalPvpQueue(data);

  const safeAcceptedAt =
    Math.max(
      0,
      Number(acceptedAt) || Date.now()
    );

  const entry = {
    id:
      crypto.randomUUID(),

    challenger:
      normalizedChallenger,

    target:
      normalizedTarget,

    acceptedAt:
      safeAcceptedAt
  };

  queue.push(entry);

  return {
    ok: true,
    entry,
    position:
      queue.length
  };
}


export function dequeueNextPvp(data) {
  const queue =
    ensureGlobalPvpQueue(data);

  if (queue.length === 0) {
    return null;
  }

  return queue.shift() || null;
}


export function getQueuedPvpPosition(
  data,
  user
) {
  const target =
    normalizeUser(user);

  if (!target) {
    return 0;
  }

  const queue =
    ensureGlobalPvpQueue(data);

  const index =
    queue.findIndex(
      entry =>
        entry?.challenger === target ||
        entry?.target === target
    );

  return index >= 0
    ? index + 1
    : 0;
}
