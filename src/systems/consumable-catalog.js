export const SPECIAL_CONSUMABLE_BASE_CHANCE =
  0.001;


export const ATOMIC_CONSUMABLE_TIER_POOLS =
  Object.freeze({
    1: Object.freeze([
      Object.freeze({
        tier: "simples",
        weight: 1
      })
    ]),
    2: Object.freeze([
      Object.freeze({
        tier: "simples",
        weight: 0.75
      }),
      Object.freeze({
        tier: "comum",
        weight: 0.25
      })
    ]),
    3: Object.freeze([
      Object.freeze({
        tier: "simples",
        weight: 0.55
      }),
      Object.freeze({
        tier: "comum",
        weight: 0.30
      }),
      Object.freeze({
        tier: "melhorada",
        weight: 0.149
      }),
      Object.freeze({
        tier: "especial",
        weight:
          SPECIAL_CONSUMABLE_BASE_CHANCE
      })
    ]),

    4: Object.freeze([
      Object.freeze({
        tier: "comum",
        weight: 0.70
      }),
      Object.freeze({
        tier: "melhorada",
        weight: 0.299
      }),
      Object.freeze({
        tier: "especial",
        weight:
          SPECIAL_CONSUMABLE_BASE_CHANCE
      })
    ]),

    5: Object.freeze([
      Object.freeze({
        tier: "comum",
        weight: 0.499
      }),
      Object.freeze({
        tier: "melhorada",
        weight: 0.50
      }),
      Object.freeze({
        tier: "especial",
        weight:
          SPECIAL_CONSUMABLE_BASE_CHANCE
      })
    ])
  });


export const CONSUMABLE_CATALOG =
  Object.freeze({
    vida_simples: Object.freeze({
      key: "vida_simples",
      name: "Poção de Vida Simples",
      resource: "hp",
      restorePercent: 0.30,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 5,
        gold: 0,
        platinum: 0
      })
    }),

    vida_comum: Object.freeze({
      key: "vida_comum",
      name: "Poção de Vida Comum",
      resource: "hp",
      restorePercent: 0.50,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 1,
        platinum: 0
      })
    }),

    vida_melhorada: Object.freeze({
      key: "vida_melhorada",
      name: "Poção de Vida Melhorada",
      resource: "hp",
      restorePercent: 0.80,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 3,
        platinum: 0
      })
    }),

    vida_especial: Object.freeze({
      key: "vida_especial",
      name: "Poção de Vida Especial",
      resource: "hp",
      restorePercent: 1.00,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 5
      })
    }),

    mentalidade_simples: Object.freeze({
      key: "mentalidade_simples",
      name: "Poção de Mentalidade Simples",
      resource: "mentalidade",
      restorePercent: 0.30,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 5,
        gold: 0,
        platinum: 0
      })
    }),

    mentalidade_comum: Object.freeze({
      key: "mentalidade_comum",
      name: "Poção de Mentalidade Comum",
      resource: "mentalidade",
      restorePercent: 0.50,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 1,
        platinum: 0
      })
    }),

    mentalidade_melhorada: Object.freeze({
      key: "mentalidade_melhorada",
      name: "Poção de Mentalidade Melhorada",
      resource: "mentalidade",
      restorePercent: 0.80,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 3,
        platinum: 0
      })
    }),

    mentalidade_especial: Object.freeze({
      key: "mentalidade_especial",
      name: "Poção de Mentalidade Especial",
      resource: "mentalidade",
      restorePercent: 1.00,
      usableOutOfCombat: true,
      usableInCombat: true,
      consumesTurnInCombat: true,
      price: Object.freeze({
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 5
      })
    })
  });


export function getConsumableDefinition(
  key
) {
  const normalized =
    String(key ?? "")
      .trim();

  const consumable =
    CONSUMABLE_CATALOG[
      normalized
    ] || null;

  return consumable
    ? {
        ok: true,
        consumable
      }
    : {
        ok: false,
        error:
          "UNKNOWN_CONSUMABLE"
      };
}


export function listConsumableDefinitions() {
  return Object.values(
    CONSUMABLE_CATALOG
  );
}


export function getAtomicConsumableTierPool(
  atoms
) {
  const normalized =
    Math.floor(
      Number(atoms)
    );

  return (
    ATOMIC_CONSUMABLE_TIER_POOLS[
      normalized
    ] ||
    null
  );
}
