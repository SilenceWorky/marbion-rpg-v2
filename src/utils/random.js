export function weightedRandom(data) {
  const entries =
    Object.entries(data);

  let totalWeight = 0;

  for (const [, item] of entries) {
    totalWeight +=
      Number(item.peso || 0);
  }

  if (totalWeight <= 0) {
    return null;
  }

  let roll =
    Math.random() * totalWeight;

  for (const [name, item] of entries) {
    roll -=
      Number(item.peso || 0);

    if (roll < 0) {
      return name;
    }
  }

  return entries.at(-1)?.[0] || null;
}