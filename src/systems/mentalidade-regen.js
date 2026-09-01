export const MENTALIDADE_REGEN_AMOUNT =
  1;

export const MENTALIDADE_REGEN_INTERVAL_MS =
  5 * 60 * 1000;


function getFiniteNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


export function applyNaturalMentalidadeRegen(
  profile,
  now = Date.now()
) {
  const safeNow =
    Math.max(
      0,
      getFiniteNumber(
        now,
        Date.now()
      )
    );


  const maxMentalidade =
    Math.max(
      0,
      getFiniteNumber(
        profile?.maxMentalidade
      )
    );


  const before =
    Math.min(
      maxMentalidade,
      Math.max(
        0,
        getFiniteNumber(
          profile?.mentalidade
        )
      )
    );


  profile.mentalidade =
    before;


  const lastRegenAt =
    getFiniteNumber(
      profile?.lastMentalidadeRegenAt,
      NaN
    );


  /*
   * Perfil antigo ou timestamp inválido.
   *
   * Inicializa a contagem sem conceder
   * recuperação retroativa infinita.
   */
  if (
    !Number.isFinite(
      lastRegenAt
    ) ||
    lastRegenAt <= 0 ||
    lastRegenAt > safeNow
  ) {
    profile.lastMentalidadeRegenAt =
      safeNow;

    return {
      changed: true,
      initialized: true,
      restored: 0,
      before,
      after: before,
      maxMentalidade,
      intervals: 0,
      nextRegenAt:
        safeNow +
        MENTALIDADE_REGEN_INTERVAL_MS
    };
  }


  /*
   * Mentalidade cheia não acumula
   * "créditos" de regeneração.
   *
   * Isso impede o jogador de ficar
   * horas em 50/50 e recuperar tudo
   * instantaneamente após gastar.
   */
  if (
    before >=
    maxMentalidade
  ) {
    const changed =
      lastRegenAt !==
      safeNow;

    profile.lastMentalidadeRegenAt =
      safeNow;

    return {
      changed,
      initialized: false,
      restored: 0,
      before,
      after: before,
      maxMentalidade,
      intervals: 0,
      nextRegenAt:
        safeNow +
        MENTALIDADE_REGEN_INTERVAL_MS
    };
  }


  const elapsed =
    Math.max(
      0,
      safeNow -
      lastRegenAt
    );


  const intervals =
    Math.floor(
      elapsed /
      MENTALIDADE_REGEN_INTERVAL_MS
    );


  if (
    intervals <= 0
  ) {
    return {
      changed: false,
      initialized: false,
      restored: 0,
      before,
      after: before,
      maxMentalidade,
      intervals: 0,
      nextRegenAt:
        lastRegenAt +
        MENTALIDADE_REGEN_INTERVAL_MS
    };
  }


  const theoreticalRestore =
    intervals *
    MENTALIDADE_REGEN_AMOUNT;


  const restored =
    Math.min(
      maxMentalidade -
      before,
      theoreticalRestore
    );


  const after =
    Math.min(
      maxMentalidade,
      before +
      restored
    );


  profile.mentalidade =
    after;


  /*
   * Enquanto ainda não chegou ao máximo,
   * preservamos a fração do intervalo que
   * ainda não completou.
   *
   * Ao chegar no máximo, zeramos a contagem
   * para impedir acúmulo enquanto cheio.
   */
  if (
    after >=
    maxMentalidade
  ) {
    profile.lastMentalidadeRegenAt =
      safeNow;
  }

  else {
    profile.lastMentalidadeRegenAt =
      lastRegenAt +
      intervals *
      MENTALIDADE_REGEN_INTERVAL_MS;
  }


  return {
    changed: true,
    initialized: false,
    restored,
    before,
    after,
    maxMentalidade,
    intervals,
    nextRegenAt:
      profile.lastMentalidadeRegenAt +
      MENTALIDADE_REGEN_INTERVAL_MS
  };
}
