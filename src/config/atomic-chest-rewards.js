function freezeList(
  values
) {
  return Object.freeze(
    values.map(
      value =>
        typeof value === "object" &&
        value !== null
          ? Object.freeze({
              ...value
            })
          : value
    )
  );
}


function freezeRule(
  rule
) {
  const frozen = {
    ...rule
  };

  if (rule.guaranteed) {
    frozen.guaranteed =
      freezeList(
        rule.guaranteed
      );
  }

  if (rule.optional) {
    frozen.optional =
      freezeList(
        rule.optional
      );
  }

  return Object.freeze(
    frozen
  );
}


export const ATOMIC_CHEST_REWARD_RULES =
  Object.freeze({
    1: freezeRule({
      atoms: 1,

      /*
       * O valor exato de XP/dinheiro ainda não foi definido.
       * A regra aprovada até aqui só estabelece que a recompensa
       * principal é XP normal OU dinheiro.
       */
      primaryChoice: Object.freeze({
        choices:
          freezeList([
            "normal_xp",
            "money"
          ]),
        weights:
          null
      }),

      optional:
        freezeList([
          {
            type:
              "consumable",
            chance:
              0.20
          }
        ])
    }),

    2: freezeRule({
      atoms: 2,

      guaranteed:
        freezeList([
          {
            type:
              "normal_xp",
            amount:
              null
          },
          {
            type:
              "money",
            amount:
              null
          }
        ]),

      optional:
        freezeList([
          {
            type:
              "consumable",
            chance:
              0.30
          },
          {
            type:
              "scroll",
            chance:
              0.08,
            compatibleElement:
              true,
            rarities:
              freezeList([
                {
                  rarity:
                    "R1",
                  weight:
                    1
                }
              ])
          }
        ])
    }),

    3: freezeRule({
      atoms: 3,

      guaranteed:
        freezeList([
          {
            type:
              "normal_xp",
            amount:
              null
          },
          {
            type:
              "money",
            amount:
              null
          },
          {
            type:
              "consumable",
            quantity:
              1
          }
        ]),

      optional:
        freezeList([
          {
            type:
              "scroll",
            chance:
              0.25,
            compatibleElement:
              true,
            rarities:
              freezeList([
                {
                  rarity:
                    "R1",
                  weight:
                    0.70
                },
                {
                  rarity:
                    "R2",
                  weight:
                    0.30
                }
              ])
          },
          {
            type:
              "consumable",
            chance:
              0.20,
            quantity:
              1,
            label:
              "second_consumable"
          }
        ])
    }),

    4: freezeRule({
      atoms: 4,

      guaranteed:
        freezeList([
          {
            type:
              "normal_xp",
            amount:
              null
          },
          {
            type:
              "money",
            amount:
              null
          },
          {
            type:
              "scroll",
            compatibleElement:
              true,
            rarities:
              freezeList([
                {
                  rarity:
                    "R2",
                  weight:
                    0.75
                },
                {
                  rarity:
                    "R3",
                  weight:
                    0.20
                },
                {
                  rarity:
                    "R4",
                  weight:
                    0.05
                }
              ])
          }
        ]),

      optional:
        freezeList([
          {
            type:
              "bonus",
            chance:
              0.30,
            pool:
              null
          }
        ])
    }),

    5: freezeRule({
      atoms: 5,

      guaranteed:
        freezeList([
          {
            type:
              "normal_xp",
            amount:
              null
          },
          {
            type:
              "money",
            amount:
              null
          },
          {
            type:
              "new_elemental_ability",
            compatibleElement:
              true,
            fallbackWhenExhausted:
              Object.freeze({
                type:
                  "money",
                choices:
                  freezeList([
                    {
                      platinum: 1,
                      weight: 0.75
                    },
                    {
                      platinum: 2,
                      weight: 0.25
                    }
                  ])
              })
          }
        ]),

      optional:
        freezeList([
          {
            type:
              "scroll",
            chance:
              0.40,
            compatibleElement:
              true,
            rarities:
              freezeList([
                {
                  rarity:
                    "R3",
                  weight:
                    0.75
                },
                {
                  rarity:
                    "R4",
                  weight:
                    0.20
                },
                {
                  rarity:
                    "R5",
                  weight:
                    0.05
                }
              ])
          },
          {
            type:
              "bonus",
            chance:
              0.20,
            pool:
              null
          }
        ])
    })
  });


export function getAtomicChestRewardRule(
  atoms
) {
  const normalized =
    Math.floor(
      Number(atoms)
    );

  if (
    !Number.isFinite(normalized) ||
    normalized < 1 ||
    normalized > 5
  ) {
    return null;
  }

  return (
    ATOMIC_CHEST_REWARD_RULES[
      normalized
    ] ||
    null
  );
}


export function getAtomicChestNaturalFiveAtomChance() {
  return (
    0.50 *
    0.25 *
    0.10 *
    0.01
  );
}
