import {
  getProfile
} from "../core/database.js";


function normalizeUser(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export async function characterApiV1Route(
  request,
  env
) {
  const url =
    new URL(request.url);

  const user =
    normalizeUser(
      url.searchParams.get("user")
    );

  if (!user) {
    return Response.json(
      {
        ok: false,
        error: "INVALID_USER"
      },
      {
        status: 400
      }
    );
  }


  try {
    const profile =
      await getProfile(
        env,
        user
      );

    if (!profile) {
      return Response.json(
        {
          ok: false,
          error: "USER_NOT_FOUND"
        },
        {
          status: 404
        }
      );
    }


    if (!profile.race) {
      return Response.json(
        {
          ok: false,
          error: "CHARACTER_NOT_CREATED"
        },
        {
          status: 404
        }
      );
    }


    return Response.json(
      {
        ok: true,
        character: {
          schemaVersion: 1,

          identity: {
            legacyUsername:
              user
          },

          progression: {
            level:
              profile.level,
            xp:
              profile.xp
          },

          character: {
            race:
              profile.race,
            elements:
              Array.isArray(
                profile.elements
              )
                ? profile.elements
                : []
          },

          resources: {
            hp:
              profile.hp,
            maxHp:
              profile.maxHp,
            mentalidade:
              profile.mentalidade,
            maxMentalidade:
              profile.maxMentalidade
          },

          stats: {
            strength:
              profile.strength,
            magicStrength:
              profile.magicStrength,
            speed:
              profile.speed,
            evasion:
              profile.evasion,
            accuracy:
              profile.accuracy,
            defense:
              profile.defense,
            statusPoints:
              profile.statusPoints
          },

          skills: {
            learned:
              Array.isArray(
                profile.skills
              )
                ? profile.skills
                : [],
            equipped:
              Array.isArray(
                profile.equippedSkills
              )
                ? profile.equippedSkills
                : [
                    null,
                    null,
                    null,
                    null
                  ]
          },

          pvp: {
            wins:
              profile?.pvp?.wins ?? 0,
            losses:
              profile?.pvp?.losses ?? 0,
            duels:
              profile?.pvp?.duels ?? 0,
            streak:
              profile?.pvp?.streak ?? 0,
            bestStreak:
              profile?.pvp?.bestStreak ?? 0,
            rating:
              profile?.pvp?.rating ?? 1000,
            rank:
              profile?.pvp?.rank ?? "Prata III",
            prodigyPosition:
              profile?.pvp?.prodigyPosition ?? null
          },

          state: {
            dead:
              profile.dead,
            deaths:
              profile.deaths,
            cycles:
              profile.cycles,
            rebuffs:
              profile.rebuffs,
            reincarnations:
              profile.reincarnations
          },

          updatedAt:
            profile.updatedAt
        }
      }
    );
  }
  catch (error) {
    console.error(
      "CHARACTER_API_V1_ERROR",
      error
    );

    return Response.json(
      {
        ok: false,
        error: "INTERNAL_ERROR"
      },
      {
        status: 500
      }
    );
  }
}
