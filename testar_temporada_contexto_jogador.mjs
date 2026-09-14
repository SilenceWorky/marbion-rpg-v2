import assert from "node:assert/strict";

import {
  handleRequest
} from "./src/router.js";


function createProfile({
  user = "teste",
  rating = 1500,
  prodigyPosition = null
} = {}) {
  return {
    user,
    race: "Metamorfo",
    pvp: {
      rating,
      peakRating: rating,
      wins: 0,
      losses: 0,
      duels: 0,
      streak: 0,
      bestStreak: 0,
      recentOpponents: {},
      eloGeneration: 0,
      prodigyPosition
    }
  };
}


function createEnv(
  profile
) {
  const now =
    Date.now();

  const season = {
    version: 1,
    id: "S1",
    name: "Temporada 1",
    status: "ACTIVE",
    startsAt: now - 60_000,
    endsAt: now + 24 * 60 * 60 * 1000,
    endedAt: null
  };

  const globalStub = {
    async fetch(request) {
      const url =
        new URL(request.url);

      if (
        url.pathname ===
        "/season/current"
      ) {
        return Response.json({
          ok: true,
          season,
          lifecycle: "ACTIVE",
          active: true,
          remainingMs:
            season.endsAt - Date.now()
        });
      }

      return new Response(
        "not found",
        { status: 404 }
      );
    }
  };

  const profileStub = {
    async fetch(request) {
      const url =
        new URL(request.url);

      if (
        url.pathname ===
        "/profile-store/get"
      ) {
        return Response.json({
          profileStore: true,
          ok: true,
          profile:
            structuredClone(profile)
        });
      }

      return new Response(
        "not found",
        { status: 404 }
      );
    }
  };

  return {
    MARBION_USERS_V2: {
      async get(key) {
        if (
          key ===
          "__pvp_elo_generation__"
        ) {
          return "0";
        }

        return null;
      },

      async put() {}
    },

    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },

      get(id) {
        if (
          id ===
          "marbion-global-pvp"
        ) {
          return globalStub;
        }

        if (
          String(id).startsWith(
            "marbion-profile:"
          )
        ) {
          return profileStub;
        }

        return null;
      }
    }
  };
}


async function requestSeason(
  env,
  user = "teste"
) {
  const response =
    await handleRequest(
      new Request(
        `https://worker.test/temporada?user=${encodeURIComponent(user)}`
      ),
      env,
      {}
    );

  return {
    response,
    text:
      await response.text()
  };
}


console.log("=== !TEMPORADA + CONTEXTO DO JOGADOR ===");


{
  const result =
    await requestSeason(
      createEnv(
        createProfile({
          rating: 1500
        })
      )
    );

  assert.equal(
    result.response.status,
    200
  );

  assert.match(
    result.text,
    /Temporada 1 \[S1\]/
  );

  assert.match(
    result.text,
    /@teste: Ouro I/
  );

  assert.match(
    result.text,
    /Rating: 1500/
  );

  console.log("✅ !temporada mostra rank e rating atuais do jogador.");
}


{
  const result =
    await requestSeason(
      createEnv(
        createProfile({
          rating: 2900,
          prodigyPosition: 2
        })
      )
    );

  assert.match(
    result.text,
    /@teste: Prodígio II/
  );

  assert.match(
    result.text,
    /Rating: 2900/
  );

  console.log("✅ Posição de Prodígio tem prioridade na exibição da temporada.");
}


console.log("\n🏆 TODOS OS TESTES DE CONTEXTO DO JOGADOR EM !TEMPORADA PASSARAM.");
