export const ELEMENTAL_MULTIPLIERS = Object.freeze({
  IMMUNE: 0,
  RESISTED: 0.75,
  NEUTRAL: 1,
  STRONG: 1.5,
  IMMUNITY_COUNTER: 2
});


export const ELEMENTAL_TYPES = Object.freeze([
  "Fogo",
  "Água",
  "Vento",
  "Terra",
  "Eletricidade",
  "Fluxo",
  "Cristal",
  "Som",
  "Natureza",
  "Gelo",
  "Psíquico",
  "Lava",
  "Sombra",
  "Luz",
  "Veneno",
  "Metal",
  "Tempo",
  "Espaço",
  "Gravidade",
  "Matéria",
  "Neutro",
  "Vidro",
  "Vapor",
  "Magnetismo",
  "Obsidiana",
  "Ilusão",
  "Ácido",
  "Plasma",
  "Radiação",
  "Singularidade"
]);


function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


const ALIASES = Object.freeze({
  ar: "vento",
  eletrico: "eletricidade",
  eletrica: "eletricidade",
  sombras: "sombra",
  pedra: "terra",
  universal: "universal",
  universais: "universal"
});


export function normalizeElement(value) {
  const normalized =
    normalize(value);

  return ALIASES[normalized] ||
    normalized;
}


/*
 * Matriz ofensiva do Marbion.
 *
 * Somente relações diferentes de 1x
 * precisam aparecer aqui.
 *
 * Regra especial de imunidade:
 * se A é imune a B, então:
 *   B -> A = 0x
 *   A -> B = 2x
 *
 * Singularidade e Neutro permanecem
 * totalmente neutros nesta versão.
 */
const RELATIONS = Object.freeze({
  fogo: Object.freeze({
    natureza: 1.5,
    gelo: 1.5,
    metal: 1.5,
    agua: 0.75,
    terra: 0.75,
    vento: 0.75,
    obsidiana: 0
  }),

  agua: Object.freeze({
    fogo: 1.5,
    lava: 1.5,
    veneno: 1.5,
    natureza: 0.75,
    gelo: 0.75
  }),

  vento: Object.freeze({
    natureza: 1.5,
    som: 1.5,
    fogo: 1.5,
    terra: 0.75,
    gravidade: 0.75
  }),

  terra: Object.freeze({
    fogo: 1.5,
    metal: 1.5,
    eletricidade: 2,
    agua: 0.75,
    natureza: 0.75
  }),

  eletricidade: Object.freeze({
    agua: 1.5,
    metal: 1.5,
    terra: 0,
    cristal: 0.75
  }),

  fluxo: Object.freeze({
    tempo: 1.5,
    psiquico: 1.5,
    espaco: 0.75,
    gravidade: 0.75
  }),

  cristal: Object.freeze({
    luz: 1.5,
    psiquico: 1.5,
    som: 0.75,
    metal: 0.75
  }),

  som: Object.freeze({
    cristal: 1.5,
    psiquico: 1.5,
    gelo: 1.5,
    sombra: 1.5,
    vento: 0.75,
    espaco: 0
  }),

  natureza: Object.freeze({
    agua: 1.5,
    terra: 1.5,
    fogo: 0.75,
    gelo: 0.75
  }),

  gelo: Object.freeze({
    agua: 1.5,
    natureza: 1.5,
    fogo: 0.75,
    lava: 0.75
  }),

  psiquico: Object.freeze({
    gravidade: 1.5,
    som: 1.5,
    luz: 0.75,
    sombra: 0
  }),

  lava: Object.freeze({
    gelo: 1.5,
    metal: 1.5,
    obsidiana: 1.5,
    agua: 0.75,
    gravidade: 0.75
  }),

  sombra: Object.freeze({
    psiquico: 2,
    luz: 1.5,
    som: 0.75
  }),

  luz: Object.freeze({
    sombra: 1.5,
    veneno: 1.5,
    materia: 2,
    cristal: 0.75,
    psiquico: 0.75
  }),

  veneno: Object.freeze({
    natureza: 1.5,
    psiquico: 1.5,
    metal: 0,
    luz: 0.75,
    plasma: 0
  }),

  metal: Object.freeze({
    cristal: 1.5,
    natureza: 1.5,
    veneno: 2,
    eletricidade: 0.75,
    lava: 0.75
  }),

  tempo: Object.freeze({
    materia: 1.5,
    natureza: 1.5,
    fluxo: 0.75,
    espaco: 0.75
  }),

  espaco: Object.freeze({
    som: 2,
    tempo: 1.5,
    gravidade: 0.75,
    materia: 0.75
  }),

  gravidade: Object.freeze({
    vento: 1.5,
    espaco: 1.5,
    psiquico: 0.75,
    materia: 0.75
  }),

  materia: Object.freeze({
    gravidade: 1.5,
    espaco: 1.5,
    tempo: 0.75,
    fluxo: 0.75,
    luz: 0
  }),

  neutro: Object.freeze({}),

  vidro: Object.freeze({
    luz: 1.5,
    veneno: 1.5,
    som: 0.75,
    metal: 0.75
  }),

  vapor: Object.freeze({
    gelo: 1.5,
    natureza: 1.5,
    vento: 0.75,
    eletricidade: 0.75
  }),

  magnetismo: Object.freeze({
    metal: 1.5,
    eletricidade: 1.5,
    gravidade: 0.75,
    terra: 0.75
  }),

  obsidiana: Object.freeze({
    fogo: 2,
    cristal: 1.5,
    natureza: 1.5,
    som: 0.75,
    metal: 0.75,
    lava: 0.75
  }),

  ilusao: Object.freeze({
    psiquico: 1.5,
    luz: 1.5,
    som: 0.75,
    sombra: 0.75
  }),

  acido: Object.freeze({
    metal: 1.5,
    natureza: 1.5,
    cristal: 0.75,
    agua: 0.75
  }),

  plasma: Object.freeze({
    metal: 1.5,
    gelo: 1.5,
    veneno: 2,
    gravidade: 0.75,
    agua: 0.75
  }),

  radiacao: Object.freeze({
    natureza: 1.5,
    sombra: 1.5,
    materia: 0.75,
    espaco: 0.75
  }),

  singularidade: Object.freeze({})
});


export const ELEMENTAL_IMMUNITIES = Object.freeze({
  terra: Object.freeze(["eletricidade"]),
  metal: Object.freeze(["veneno"]),
  sombra: Object.freeze(["psiquico"]),
  luz: Object.freeze(["materia"]),
  obsidiana: Object.freeze(["fogo"]),
  espaco: Object.freeze(["som"]),
  plasma: Object.freeze(["veneno"])
});


export function getSingleElementMultiplier(
  attackElement,
  defenderElement
) {
  const attack =
    normalizeElement(
      attackElement
    );

  const defender =
    normalizeElement(
      defenderElement
    );


  if (
    !attack ||
    !defender ||
    attack === "universal" ||
    attack === "neutro" ||
    defender === "neutro"
  ) {
    return ELEMENTAL_MULTIPLIERS.NEUTRAL;
  }


  return Number(
    RELATIONS?.[attack]?.[defender]
  ) ||
    ELEMENTAL_MULTIPLIERS.NEUTRAL;
}


export function getElementalMatchup(
  attackElement,
  defenderElements
) {
  const attack =
    normalizeElement(
      attackElement
    );

  const rawDefenders =
    Array.isArray(
      defenderElements
    )
      ? defenderElements
      : defenderElements
        ? [defenderElements]
        : [];

  const defenders = [
    ...new Set(
      rawDefenders
        .map(
          normalizeElement
        )
        .filter(Boolean)
    )
  ];


  if (
    !attack ||
    attack === "universal" ||
    attack === "neutro" ||
    defenders.length === 0
  ) {
    return {
      attackElement:
        attack || null,
      defenderElements:
        defenders,
      multiplier:
        1,
      immune:
        false,
      effectiveness:
        "neutral",
      relations: []
    };
  }


  const relations =
    defenders.map(
      defender => ({
        defender,
        multiplier:
          getSingleElementMultiplier(
            attack,
            defender
          )
      })
    );


  const immune =
    relations.some(
      relation =>
        relation.multiplier === 0
    );

  const multiplier =
    immune
      ? 0
      : relations.reduce(
          (
            total,
            relation
          ) =>
            total *
            relation.multiplier,
          1
        );


  let effectiveness =
    "neutral";

  if (immune) {
    effectiveness =
      "immune";
  }
  else if (
    multiplier > 1
  ) {
    effectiveness =
      "strong";
  }
  else if (
    multiplier < 1
  ) {
    effectiveness =
      "resisted";
  }


  return {
    attackElement:
      attack,
    defenderElements:
      defenders,
    multiplier,
    immune,
    effectiveness,
    relations
  };
}


export function applyElementalDamage(
  damage,
  multiplier
) {
  const normalizedDamage =
    Math.max(
      0,
      Number(damage) || 0
    );

  const normalizedMultiplier =
    Math.max(
      0,
      Number(multiplier)
    );


  if (
    normalizedDamage <= 0 ||
    normalizedMultiplier <= 0
  ) {
    return 0;
  }


  return Math.max(
    1,
    Math.round(
      normalizedDamage *
      normalizedMultiplier
    )
  );
}
