import assert from "node:assert/strict";

import {
  PvpCoordinator
} from "./src/index.js";

import {
  definePvpSeasonYearMonth
} from "./src/systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth
} from "./src/systems/pvp-season-schedule-store.js";


function createStorage() {
  const data = new Map();
  let alarmAt = null;

  return {
    data,

    async get(key) {
      return data.get(key);
    },

    async put(key, value) {
      data.set(
        key,
        structuredClone(value)
      );
    },

    async delete(key) {
      data.delete(key);
    },

    async list({ prefix } = {}) {
      const result = new Map();

      for (const [key, value] of data.entries()) {
        if (
          !prefix ||
          String(key).startsWith(prefix)
        ) {
          result.set(
            key,
            structuredClone(value)
          );
        }
      }

      return result;
    },

    async getAlarm() {
      return alarmAt;
    },

    async setAlarm(value) {
      alarmAt = Number(value);
    },

    async deleteAlarm() {
      alarmAt = null;
    }
  };
}


async function prepareSeptemberSeason(
  coordinator,
  storage,
  now
) {
  const defined =
    await definePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9,
        name: "Um Novo Florescer"
      }
    );

  assert.equal(defined.ok, true);

  const scheduled =
    await schedulePvpSeasonYearMonth(
      storage,
      {
        year: 2026,
        month: 9
      },
      now
    );

  assert.equal(scheduled.ok, true);

  const data =
    await coordinator.getData();

  return data;
}


console.log("=== PRIORIDADE DO ALARM: PvP x TEMPORADA ===");


const originalDateNow = Date.now;

try {
  /*
   * Caso 1: um desafio expira antes do início mensal.
   * O desafio deve continuar tendo prioridade; depois que
   * ele deixa de existir, a temporada volta a ser o próximo
   * candidato do mesmo alarm compartilhado.
   */
  {
    const storage = createStorage();
    const coordinator =
      new PvpCoordinator(
        { storage },
        {}
      );

    const now =
      Date.parse(
        "2026-08-20T12:00:00.000-03:00"
      );

    const seasonStart =
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      );

    const challengeAt =
      now + 30_000;

    Date.now = () => now;

    const data =
      await prepareSeptemberSeason(
        coordinator,
        storage,
        now
      );

    data.challenges = [
      {
        challenger: "alice",
        target: "bob",
        expiresAt: challengeAt
      }
    ];

    await coordinator.saveData(data);

    const first =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(first.kind, "challenge");
    assert.equal(first.alarmAt, challengeAt);
    assert.equal(
      await storage.getAlarm(),
      challengeAt
    );

    data.challenges = [];
    await coordinator.saveData(data);

    const second =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(second.kind, "season");
    assert.equal(second.alarmAt, seasonStart);
    assert.equal(
      await storage.getAlarm(),
      seasonStart
    );

    console.log("✅ Desafio que vence antes mantém prioridade e, ao desaparecer, devolve o alarm à temporada.");
  }


  /*
   * Caso 2: uma batalha ativa precisa do aviso de turno antes
   * da temporada. O timeout PvP deve continuar vencendo a
   * disputa pelo único alarm do Durable Object.
   */
  {
    const storage = createStorage();
    const coordinator =
      new PvpCoordinator(
        { storage },
        {}
      );

    const now =
      Date.parse(
        "2026-08-20T12:00:00.000-03:00"
      );

    const warningAt =
      now + 60_000;

    Date.now = () => now;

    const data =
      await prepareSeptemberSeason(
        coordinator,
        storage,
        now
      );

    data.battles = [
      {
        id: "battle-priority-test",
        status: "ACTIVE",
        state: "ACTIVE",
        turn: 1,
        player1: {
          user: "alice",
          action: null
        },
        player2: {
          user: "bob",
          action: null
        },
        turnClockTurn: 1,
        turnStartedAt: now,
        turnWarningAt: warningAt,
        turnWarningProcessed: false,
        turnDeadline: now + 90_000,
        timeoutCounts: {},
        timeoutEvents: []
      }
    ];

    await coordinator.saveData(data);

    const result =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(result.kind, "battle");
    assert.equal(result.alarmAt, warningAt);
    assert.equal(
      await storage.getAlarm(),
      warningAt
    );

    console.log("✅ Aviso/timeout de batalha anterior à temporada continua tendo prioridade no alarm compartilhado.");
  }


  /*
   * Caso 3: estamos a 30 segundos da virada do mês, enquanto
   * desafio e batalha só precisam do alarm depois da meia-noite.
   * A temporada deve ser escolhida primeiro, sem apagar os
   * eventos PvP do estado.
   */
  {
    const storage = createStorage();
    const coordinator =
      new PvpCoordinator(
        { storage },
        {}
      );

    const now =
      Date.parse(
        "2026-08-31T23:59:30.000-03:00"
      );

    const seasonStart =
      Date.parse(
        "2026-09-01T00:00:00.000-03:00"
      );

    Date.now = () => now;

    const data =
      await prepareSeptemberSeason(
        coordinator,
        storage,
        now
      );

    data.challenges = [
      {
        challenger: "alice",
        target: "bob",
        expiresAt: now + 45_000
      }
    ];

    data.battles = [
      {
        id: "battle-after-season-test",
        status: "ACTIVE",
        state: "ACTIVE",
        turn: 1,
        player1: {
          user: "carol",
          action: null
        },
        player2: {
          user: "dave",
          action: null
        },
        turnClockTurn: 1,
        turnStartedAt: now,
        turnWarningAt: now + 60_000,
        turnWarningProcessed: false,
        turnDeadline: now + 90_000,
        timeoutCounts: {},
        timeoutEvents: []
      }
    ];

    await coordinator.saveData(data);

    const result =
      await coordinator.scheduleCoordinatorAlarm();

    assert.equal(result.kind, "season");
    assert.equal(result.alarmAt, seasonStart);
    assert.equal(
      await storage.getAlarm(),
      seasonStart
    );

    const preserved =
      await coordinator.getData();

    assert.equal(preserved.challenges.length, 1);
    assert.equal(preserved.battles.length, 1);
    assert.equal(
      preserved.battles[0].status,
      "ACTIVE"
    );

    console.log("✅ Quando a virada mensal acontece primeiro, a temporada recebe prioridade sem apagar desafio ou batalha futuros.");
  }
}
finally {
  Date.now = originalDateNow;
}


console.log("\n🏆 TODOS OS TESTES DE PRIORIDADE ENTRE PvP E TEMPORADA PASSARAM.");
