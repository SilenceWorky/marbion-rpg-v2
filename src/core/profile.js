export function createBaseProfile(user) {
  const now = Date.now();

  return {
    version: 2,

    user,

    // PROGRESSÃO
    xp: 0,
    level: 1,

    // RAÇA E ELEMENTOS
    race: null,
    elements: [],

    elementXp: {},
    elementLevels: {},

    // VIDA
    hp: 100,
    maxHp: 100,

    // MENTALIDADE
    mentalidade: 50,
    maxMentalidade: 50,
    lastMentalidadeRegenAt: now,

    // STATUS
    strength: 5,
    magicStrength: 5,
    speed: 5,
    evasion: 5,
    accuracy: 90,
    defense: 0,

    statusPoints: 0,

    // EFEITOS
    statusEffects: {},

    // SKILLS
    skills: [],

    skillMeta: {},

    equippedSkills: [
      null,
      null,
      null,
      null
    ],

    skillCooldowns: {},

    // ARMAS
    weapon: null,
    weapons: {},

    soulWeapon: null,
    soulWeaponDurability: null,

    adminWeapon: null,
    adminWeaponDurability: null,

    // INVENTÁRIO
    inventory: {},

    // MORTE / REBUFF
    dead: false,
    deaths: 0,
    cycles: 0,
    rebuffs: 0,
    reincarnations: 0,

    deathReason: null,
    diedAt: null,

    rebuffBonus: {
      damageBonus: 0,
      xpBonus: 0,
      criticalBonus: 0
    },

    pendingFinalRebuff: false,

    // PVP
    pvp: {
      wins: 0,
      losses: 0,
      duels: 0,

      accepted: 0,
      refused: 0,

      streak: 0,
      bestStreak: 0,

      /*
      * Sistema ranqueado.
      *
      * "rating" é mostrado para
      * o jogador como XP de Combate.
      */
      rating: 1000,
      peakRating: 1000,

      rank: "Prata III",

      /*
      * null = não é Prodígio.
      *
      * 1 até 7 representa sua
      * posição entre os Prodígios.
      */
      prodigyPosition: null,

      /*
      * Campo antigo.
      * Mantido por compatibilidade.
      */
      points: 0
    },

    // TAGS / RECOMPENSAS
    tag: null,
    unlockedTags: [],
    rewardsClaimed: {},
    elementRewardsClaimed: {},

    // COOLDOWNS / TEMPOS
    lastCombat: 0,
    lastCheckin: 0,
    lastDaily: 0,
    lastXpChest: 0,
    lastReroll: 0,
    lastHpHeal: 0,

    createdAt: now,
    updatedAt: now
  };
}

export function ensureProfileDefaults(profile, user = null) {
  const defaults =
    createBaseProfile(
      user || profile.user || null
    );

  return {
    ...defaults,
    ...profile,

    rebuffBonus: {
      ...defaults.rebuffBonus,
      ...(profile.rebuffBonus || {})
    },

    pvp: {
      ...defaults.pvp,
      ...(profile.pvp || {})
    }
  };
}
