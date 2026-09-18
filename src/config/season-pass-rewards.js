function freezeReward(
  reward
) {
  return Object.freeze(
    reward
  );
}


function freezeTier(
  tier,
  rewards
) {
  return Object.freeze({
    tier,
    rewards:
      Object.freeze(
        rewards.map(
          freezeReward
        )
      )
  });
}


const money = (
  bronze = 0,
  silver = 0,
  gold = 0,
  platinum = 0
) => ({
  type: "money",
  bronze,
  silver,
  gold,
  platinum
});


const normalXp = amount => ({
  type: "normal_xp",
  amount
});


const consumable = (
  quality = "common",
  quantity = 1,
  seasonal = false
) => ({
  type: "consumable",
  quality,
  quantity,
  seasonal
});


const scroll = (
  rarity,
  {
    elemental = true,
    guaranteed = false
  } = {}
) => ({
  type: "scroll",
  rarity,
  elemental,
  guaranteed
});


const seasonalChest =
  quantity => ({
    type: "seasonal_chest",
    quantity
  });


const atomicChest = (
  atoms,
  behavior
) => ({
  type: "atomic_chest",
  atoms,
  behavior
});


const cosmetic = slot => ({
  type: "season_cosmetic",
  slot
});


const seasonalSpecial =
  key => ({
    type: "season_special",
    key
  });


/*
 * Catálogo canônico dos 100 patamares.
 *
 * Este arquivo descreve O QUE cada patamar concede.
 * A entrega efetiva de dinheiro, XP, baús, itens e cosméticos
 * será feita pelos respectivos sistemas quando existirem.
 */
export const SEASON_PASS_REWARDS =
  Object.freeze([
    freezeTier(1,  [money(25)]),
    freezeTier(2,  [normalXp(50)]),
    freezeTier(3,  [consumable("common")]),
    freezeTier(4,  [atomicChest(1, "evolutive")]),
    freezeTier(5,  [seasonalChest(1)]),
    freezeTier(6,  [money(0, 5)]),
    freezeTier(7,  [normalXp(75)]),
    freezeTier(8,  [scroll("R1")]),
    freezeTier(9,  [atomicChest(1, "standard")]),
    freezeTier(10, [
      cosmetic("accessory"),
      seasonalSpecial("exclusive_insignia")
    ]),

    freezeTier(11, [money(0, 8)]),
    freezeTier(12, [seasonalChest(1)]),
    freezeTier(13, [consumable("common", 2)]),
    freezeTier(14, [atomicChest(1, "evolutive")]),
    freezeTier(15, [scroll("R1")]),
    freezeTier(16, [normalXp(100)]),
    freezeTier(17, [money(0, 0, 1)]),
    freezeTier(18, [consumable("common", 1, true)]),
    freezeTier(19, [atomicChest(1, "hidden_behavior")]),
    freezeTier(20, [seasonalChest(1)]),

    freezeTier(21, [money(0, 12)]),
    freezeTier(22, [normalXp(125)]),
    freezeTier(23, [scroll("R1")]),
    freezeTier(24, [atomicChest(2, "evolutive")]),
    freezeTier(25, [
      cosmetic("shoes"),
      seasonalSpecial("level_up_message")
    ]),

    freezeTier(26, [money(0, 5, 1)]),
    freezeTier(27, [consumable("better")]),
    freezeTier(28, [seasonalChest(1)]),
    freezeTier(29, [atomicChest(2, "locked")]),
    freezeTier(30, [scroll("R2")]),
    freezeTier(31, [normalXp(150)]),
    freezeTier(32, [money(0, 0, 2)]),
    freezeTier(33, [consumable("common", 2)]),
    freezeTier(34, [atomicChest(2, "evolutive")]),
    freezeTier(35, [seasonalChest(1)]),

    freezeTier(36, [scroll("R2")]),
    freezeTier(37, [normalXp(200)]),
    freezeTier(38, [money(0, 5, 2)]),
    freezeTier(39, [atomicChest(2, "evolutive")]),
    freezeTier(40, [seasonalSpecial("victory_message")]),
    freezeTier(41, [consumable("better")]),
    freezeTier(42, [normalXp(250)]),
    freezeTier(43, [scroll("R2")]),
    freezeTier(44, [atomicChest(2, "evolutive")]),
    freezeTier(45, [seasonalChest(1)]),

    freezeTier(46, [money(0, 0, 3)]),
    freezeTier(47, [consumable("seasonal", 2, true)]),
    freezeTier(48, [normalXp(300)]),
    freezeTier(49, [atomicChest(3, "locked")]),
    freezeTier(50, [
      cosmetic("bottom"),
      seasonalSpecial("pass_pvp_finisher")
    ]),

    freezeTier(51, [scroll("R2")]),
    freezeTier(52, [money(0, 5, 3)]),
    freezeTier(53, [normalXp(300)]),
    freezeTier(54, [atomicChest(3, "evolutive")]),
    freezeTier(55, [seasonalChest(1)]),
    freezeTier(56, [consumable("rare")]),
    freezeTier(57, [scroll("R3")]),
    freezeTier(58, [normalXp(350)]),
    freezeTier(59, [atomicChest(3, "locked")]),
    freezeTier(60, [seasonalSpecial("exclusive_relic")]),

    freezeTier(61, [money(0, 0, 4)]),
    freezeTier(62, [consumable("seasonal", 2, true)]),
    freezeTier(63, [scroll("R3")]),
    freezeTier(64, [atomicChest(3, "evolutive")]),
    freezeTier(65, [seasonalChest(1)]),
    freezeTier(66, [normalXp(400)]),
    freezeTier(67, [money(0, 0, 5)]),
    freezeTier(68, [consumable("rare")]),
    freezeTier(69, [atomicChest(3, "evolutive")]),
    freezeTier(70, [seasonalSpecial("pass_exclusive_item")]),

    freezeTier(71, [scroll("R3")]),
    freezeTier(72, [normalXp(450)]),
    freezeTier(73, [money(0, 5, 5)]),
    freezeTier(74, [atomicChest(3, "evolutive")]),
    freezeTier(75, [
      cosmetic("top"),
      seasonalChest(2)
    ]),

    freezeTier(76, [consumable("rare", 2)]),
    freezeTier(77, [scroll("R3")]),
    freezeTier(78, [normalXp(500)]),
    freezeTier(79, [atomicChest(3, "evolutive")]),
    freezeTier(80, [seasonalSpecial("advanced_insignia")]),
    freezeTier(81, [money(0, 0, 6)]),
    freezeTier(82, [normalXp(550)]),
    freezeTier(83, [consumable("rare_seasonal", 1, true)]),
    freezeTier(84, [atomicChest(3, "evolutive")]),
    freezeTier(85, [seasonalChest(1)]),

    freezeTier(86, [scroll("R3")]),
    freezeTier(87, [normalXp(600)]),
    freezeTier(88, [money(0, 0, 7)]),
    freezeTier(89, [atomicChest(4, "locked")]),
    freezeTier(90, [seasonalSpecial("rare_pass_item")]),
    freezeTier(91, [seasonalChest(1)]),
    freezeTier(92, [consumable("rare", 2)]),
    freezeTier(93, [normalXp(650)]),
    freezeTier(94, [atomicChest(4, "evolutive")]),
    freezeTier(95, [seasonalChest(2)]),

    freezeTier(96, [money(0, 0, 8)]),
    freezeTier(97, [
      scroll(
        "R4",
        {
          guaranteed: true
        }
      )
    ]),
    freezeTier(98, [normalXp(750)]),
    freezeTier(99, [
      cosmetic("hair"),
      atomicChest(4, "evolutive")
    ]),
    freezeTier(100, [
      seasonalSpecial("annual_season_title"),
      seasonalChest(3)
    ])
  ]);


export function getSeasonPassRewards(
  tier
) {
  const normalizedTier =
    Math.floor(
      Number(tier)
    );

  if (
    !Number.isFinite(normalizedTier) ||
    normalizedTier < 1 ||
    normalizedTier >
      SEASON_PASS_REWARDS.length
  ) {
    return null;
  }

  return (
    SEASON_PASS_REWARDS[
      normalizedTier - 1
    ] || null
  );
}
