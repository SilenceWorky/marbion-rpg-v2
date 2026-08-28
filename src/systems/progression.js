export function getXpNeeded(level) {
  const safeLevel =
    Math.max(
      1,
      Math.floor(
        Number(level) || 1
      )
    );

  return Math.round(
    200 *
    Math.pow(
      safeLevel,
      1.18
    )
  );
}


export function addXp(
  profile,
  amount
) {
  const xpGained =
    Math.max(
      0,
      Number(amount) || 0
    );

  profile.level =
    Math.max(
      1,
      Number(profile.level) || 1
    );

  profile.xp =
    Math.max(
      0,
      Number(profile.xp) || 0
    );

  profile.statusPoints =
    Math.max(
      0,
      Number(profile.statusPoints) || 0
    );


  profile.xp += xpGained;

  let levelsGained = 0;


  while (
    profile.xp >=
    getXpNeeded(profile.level)
  ) {
    const requiredXp =
      getXpNeeded(
        profile.level
      );

    profile.xp -=
      requiredXp;

    profile.level += 1;

    profile.statusPoints += 1;

    levelsGained += 1;
  }


  return {
    xpGained,
    levelsGained,

    level:
      profile.level,

    xp:
      profile.xp,

    xpNeeded:
      getXpNeeded(
        profile.level
      ),

    statusPoints:
      profile.statusPoints
  };
}