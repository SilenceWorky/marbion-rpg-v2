import assert from "node:assert/strict";

import {
  getProfile
} from "./src/core/database.js";

import {
  adminEloResetRoute
} from "./src/routes/admin-elo-reset.js";

import {
  PvpCoordinator
} from "./src/durable/PvpCoordinator.js";


console.log("=== RESET GERAL DE ELO ===");


function makeStorage(initial = {}) {
  const data = new Map(
    Object.entries(initial)
  );

  return {
    async get(key) {
      return data.get(key);
    },
    async put(key, value) {
      data.set(key, value);
    },
    async delete(key) {
      data.delete(key);
    },
    async deleteAlarm() {},
    async setAlarm() {},
    _data: data
  };
}


{
  let storedProfile = {
    user: "alice",
    race: "Terrariano",
    pvp: {
      rating: 2420,
      peakRating: 2600,
      rank: "Corrompido I",
      prodigyPosition: 3,
      wins: 20,
      losses: 10,
      duels: 30,
      streak: 4,
      bestStreak: 8,
      recentOpponents: {
        bob: [1000, 2000]
      },
      afkPenaltyLevel: 2,
      afkBlockedUntil: 123,
      afkProbationUntil: 456,
      resultLedger: [
        { battleId: "b1" }
      ],
      eloGeneration: 0
    }
  };

  let writes = 0;

  const env = {
    PVP_COORDINATOR: {
      idFromName(name) {
        return name;
      },
      get(id) {
        if (id === "marbion-profile:alice") {
          return {
            async fetch(request) {
              const url = new URL(request.url);

              if (url.pathname === "/profile-store/get") {
                return Response.json({
                  profileStore: true,
                  ok: true,
                  profile: structuredClone(storedProfile)
                });
              }

              if (url.pathname === "/profile-store/put") {
                writes += 1;
                storedProfile = await request.json();

                return Response.json({
                  profileStore: true,
                  ok: true,
                  profile: storedProfile
                });
              }

              throw new Error("unexpected profile route");
            }
          };
        }

        throw new Error(`unexpected durable id: ${id}`);
      }
    },

    MARBION_USERS_V2: {
      async get(key) {
        if (key === "__pvp_elo_generation__") {
          return "1";
        }

        return null;
      },
      async put() {}
    }
  };

  const before = structuredClone(storedProfile.pvp);
  const profile = await getProfile(env, "alice");

  assert.equal(profile.pvp.rating, 1000);
  assert.equal(profile.pvp.rank, "Prata III");
  assert.equal(profile.pvp.prodigyPosition, null);
  assert.equal(profile.pvp.eloGeneration, 1);

  assert.equal(profile.pvp.peakRating, before.peakRating);
  assert.equal(profile.pvp.wins, before.wins);
  assert.equal(profile.pvp.losses, before.losses);
  assert.equal(profile.pvp.duels, before.duels);
  assert.equal(profile.pvp.streak, before.streak);
  assert.equal(profile.pvp.bestStreak, before.bestStreak);
  assert.deepEqual(profile.pvp.recentOpponents, before.recentOpponents);
  assert.equal(profile.pvp.afkPenaltyLevel, before.afkPenaltyLevel);
  assert.equal(profile.pvp.afkBlockedUntil, before.afkBlockedUntil);
  assert.equal(profile.pvp.afkProbationUntil, before.afkProbationUntil);
  assert.deepEqual(profile.pvp.resultLedger, before.resultLedger);
  assert.equal(writes, 1);

  await getProfile(env, "alice");
  assert.equal(writes, 1);

  console.log("✅ perfil é resetado preguiçosamente uma única vez ao entrar em geração nova");
}


{
  const coordinatorStorage = makeStorage({
    elo_generation: 7,
    pvp: {
      challenges: [],
      battles: [],
      queue: []
    }
  });

  let kvGeneration = "7";
  let kvWrites = 0;

  const env = {
    MARBION_USERS_V2: {
      async get(key) {
        assert.equal(
          key,
          "__pvp_elo_generation__"
        );

        return kvGeneration;
      },
      async put(key, value) {
        assert.equal(
          key,
          "__pvp_elo_generation__"
        );

        kvWrites += 1;
        kvGeneration = value;
      }
    }
  };

  const coordinator =
    new PvpCoordinator(
      {
        storage: coordinatorStorage
      },
      env
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, true);
  assert.equal(result.before, 7);
  assert.equal(result.after, 8);
  assert.equal(
    coordinatorStorage._data.get("elo_generation"),
    8
  );
  assert.equal(kvGeneration, "8");
  assert.equal(kvWrites, 1);
  assert.equal(
    coordinatorStorage._data.has("elo_reset_in_progress"),
    false
  );

  console.log("✅ reset geral avança a geração no coordenador e espelha no KV");
}


{
  let kvWrites = 0;

  const coordinator =
    new PvpCoordinator(
      {
        storage: makeStorage({
          pvp: {
            challenges: [],
            battles: [
              {
                id: "battle-active",
                status: "ACTIVE",
                state: "WAITING_ACTIONS",
                player1: { user: "alice" },
                player2: { user: "bob" }
              }
            ],
            queue: []
          }
        })
      },
      {
        MARBION_USERS_V2: {
          async put() {
            kvWrites += 1;
          }
        }
      }
    );

  const result =
    await coordinator.adminResetGeneralElo();

  assert.equal(result.ok, false);
  assert.equal(result.error, "ACTIVE_BATTLE");
  assert.equal(kvWrites, 0);

  console.log("✅ reset geral é recusado enquanto existe batalha PvP ativa");
}


{
  let receivedPath = null;

  const env = {
    MARBION_ADMIN_KEY: "secret",
    PVP_COORDINATOR: {
      idFromName(name) {
        assert.equal(name, "marbion-global-pvp");
        return name;
      },
      get() {
        return {
          async fetch(request) {
            receivedPath = new URL(request.url).pathname;

            return Response.json({
              ok: true,
              before: 3,
              after: 4
            });
          }
        };
      }
    }
  };

  const request =
    new Request(
      "https://worker.test/adm?actor=SilenceWorky&key=secret&args=elo%20reset%20geral"
    );

  const response =
    await adminEloResetRoute(
      request,
      env
    );

  const text =
    await response.text();

  assert.equal(
    receivedPath,
    "/admin-elo-reset-general"
  );
  assert.match(
    text,
    /geração 3 → 4/
  );
  assert.match(
    text,
    /histórico competitivo preservado/i
  );

  console.log("✅ comando ADM geral chama o coordenador global e informa a geração criada");
}


console.log("\n🏆 TODOS OS TESTES DO RESET GERAL DE ELO PASSARAM.");
