const RARITY_MULTIPLIERS = {
  comum: 1,
  incomum: 1.15,
  raro: 1.35,
  epico: 1.7,
  lendario: 2.2
};


function normalizeRarity(rarity) {
  return String(rarity ?? "comum")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function getRandomVariation() {
  /*
   * Variação entre 90% e 110%.
   * Faz o XP parecer menos mecânico
   * sem causar grandes diferenças.
   */
  return (
    0.9 +
    Math.random() * 0.2
  );
}


export function calculateCombatXp({
  playerLevel,
  enemyLevel,
  rarity = "comum"
}) {
  const safePlayerLevel =
    Math.max(
      1,
      Math.floor(
        Number(playerLevel) || 1
      )
    );


  const safeEnemyLevel =
    Math.max(
      1,
      Math.floor(
        Number(enemyLevel) || 1
      )
    );


  const normalizedRarity =
    normalizeRarity(rarity);


  const rarityMultiplier =
    RARITY_MULTIPLIERS[
      normalizedRarity
    ] ?? 1;


  /*
   * XP base do inimigo.
   *
   * Cresce com o nível,
   * mas não de forma linear.
   */
  const baseXp =
    22 +
    11 *
    Math.pow(
      safeEnemyLevel,
      0.82
    );


  /*
   * Diferença de nível.
   *
   * Inimigo acima:
   * bônus.
   *
   * Inimigo muito abaixo:
   * penalidade.
   */
  const levelDifference =
    safeEnemyLevel -
    safePlayerLevel;


  const levelMultiplier =
    Math.min(
      1.5,
      Math.max(
        0.25,
        1 +
        levelDifference * 0.08
      )
    );


  const randomVariation =
    getRandomVariation();


  const xp =
    Math.max(
      1,
      Math.round(
        baseXp *
        rarityMultiplier *
        levelMultiplier *
        randomVariation
      )
    );


  return {
    xp,

    playerLevel:
      safePlayerLevel,

    enemyLevel:
      safeEnemyLevel,

    rarity:
      normalizedRarity,

    baseXp:
      Math.round(baseXp),

    rarityMultiplier,

    levelMultiplier
  };
}