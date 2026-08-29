function normalizeElement(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


/*
 * FUSÕES DE MENTALIDADE
 *
 * IMPORTANTE:
 * Apenas os elementos NATIVOS do personagem
 * participam das fusões.
 *
 * Um elemento obtido por fusão NÃO pode ser usado
 * para gerar outra fusão em cadeia.
 */
const ELEMENT_FUSIONS = [
  {
    requires: [
      "Fogo",
      "Terra"
    ],
    unlocks: [
      "Lava",
      "Vidro"
    ]
  },

  {
    requires: [
      "Água",
      "Terra"
    ],
    unlocks: [
      "Natureza"
    ]
  },

  {
    requires: [
      "Fogo",
      "Vento"
    ],
    unlocks: [
      "Eletricidade"
    ]
  },

  {
    requires: [
      "Terra",
      "Luz"
    ],
    unlocks: [
      "Cristal"
    ]
  },

  {
    requires: [
      "Terra",
      "Metal"
    ],
    unlocks: [
      "Cristal"
    ]
  },

  {
    requires: [
      "Terra",
      "Eletricidade"
    ],
    unlocks: [
      "Metal"
    ]
  },

  {
    requires: [
      "Água",
      "Fogo"
    ],
    unlocks: [
      "Vapor"
    ]
  },

  {
    requires: [
      "Água",
      "Veneno"
    ],
    unlocks: [
      "Ácido"
    ]
  },

  {
    requires: [
      "Metal",
      "Eletricidade"
    ],
    unlocks: [
      "Magnetismo"
    ]
  },

  {
    requires: [
      "Lava",
      "Água"
    ],
    unlocks: [
      "Obsidiana"
    ]
  },

  {
    requires: [
      "Cristal",
      "Fogo"
    ],
    unlocks: [
      "Vidro"
    ]
  },

  {
    requires: [
      "Espaço",
      "Gravidade"
    ],
    unlocks: [
      "Singularidade"
    ]
  },

  {
    requires: [
      "Psíquico",
      "Luz"
    ],
    unlocks: [
      "Ilusão"
    ]
  },

  {
    requires: [
      "Fogo",
      "Eletricidade"
    ],
    unlocks: [
      "Plasma"
    ]
  },

  {
    requires: [
      "Luz",
      "Veneno"
    ],
    unlocks: [
      "Radiação"
    ]
  }
];


/*
 * AFINIDADES DE PERGAMINHO
 *
 * Não são fusões.
 *
 * Um personagem com o elemento da esquerda
 * pode aprender habilidades dos elementos
 * da direita através de pergaminhos.
 *
 * Isso NÃO faz essas habilidades aparecerem
 * naturalmente ao subir de nível.
 */
const SCROLL_AFFINITIES = {
  agua: [
    "Gelo"
  ],

  fluxo: [
    "Som",
    "Vento",
    "Água",
    "Tempo"
  ],

  fogo: [
    "Luz"
  ],

  eletricidade: [
    "Luz"
  ],

  vento: [
    "Gravidade",
    "Vapor"
  ]
};


function getNativeElements(
  profile
) {
  if (
    !Array.isArray(
      profile?.elements
    )
  ) {
    return [];
  }

  return profile.elements
    .filter(Boolean);
}


export function isNativeElement(
  profile,
  element
) {
  const target =
    normalizeElement(
      element
    );

  return getNativeElements(
    profile
  ).some(
    nativeElement =>
      normalizeElement(
        nativeElement
      ) === target
  );
}


export function getFusionElements(
  profile
) {
  const nativeElements =
    getNativeElements(
      profile
    );

  const nativeSet =
    new Set(
      nativeElements.map(
        normalizeElement
      )
    );

  const fusionElements =
    new Map();


  for (
    const fusion
    of ELEMENT_FUSIONS
  ) {
    const hasRequirements =
      fusion.requires.every(
        element =>
          nativeSet.has(
            normalizeElement(
              element
            )
          )
      );


    if (!hasRequirements) {
      continue;
    }


    for (
      const unlockedElement
      of fusion.unlocks
    ) {
      fusionElements.set(
        normalizeElement(
          unlockedElement
        ),
        unlockedElement
      );
    }
  }


  return [
    ...fusionElements.values()
  ];
}


export function isFusionElement(
  profile,
  element
) {
  const target =
    normalizeElement(
      element
    );

  return getFusionElements(
    profile
  ).some(
    fusionElement =>
      normalizeElement(
        fusionElement
      ) === target
  );
}


export function getScrollAffinityElements(
  profile
) {
  const nativeElements =
    getNativeElements(
      profile
    );

  const affinityElements =
    new Map();


  for (
    const nativeElement
    of nativeElements
  ) {
    const affinities =
      SCROLL_AFFINITIES[
        normalizeElement(
          nativeElement
        )
      ] || [];


    for (
      const affinity
      of affinities
    ) {
      affinityElements.set(
        normalizeElement(
          affinity
        ),
        affinity
      );
    }
  }


  return [
    ...affinityElements.values()
  ];
}


export function getCompatibleElements(
  profile
) {
  const elements =
    new Map();


  for (
    const element
    of getNativeElements(profile)
  ) {
    elements.set(
      normalizeElement(element),
      element
    );
  }


  for (
    const element
    of getFusionElements(profile)
  ) {
    elements.set(
      normalizeElement(element),
      element
    );
  }


  for (
    const element
    of getScrollAffinityElements(
      profile
    )
  ) {
    elements.set(
      normalizeElement(element),
      element
    );
  }


  return [
    ...elements.values()
  ];
}


/*
 * HABILIDADES POR LEVEL
 *
 * Apenas o elemento natural do personagem.
 */
export function canLearnSkillByLevel(
  profile,
  skillElement
) {
  return isNativeElement(
    profile,
    skillElement
  );
}


/*
 * HABILIDADES POR PERGAMINHO
 *
 * Pode aprender:
 * - elemento natural;
 * - elemento de fusão;
 * - elemento por afinidade;
 * - habilidade Universal.
 */
export function canLearnSkillFromScroll(
  profile,
  skillElement
) {
  const target =
    normalizeElement(
      skillElement
    );


  if (
    target === "universal"
  ) {
    return true;
  }


  return getCompatibleElements(
    profile
  ).some(
    element =>
      normalizeElement(
        element
      ) === target
  );
}


/*
 * Verificação usada futuramente
 * para equipar/utilizar uma habilidade.
 */
export function canUseSkillElement(
  profile,
  skillElement
) {
  return canLearnSkillFromScroll(
    profile,
    skillElement
  );
}