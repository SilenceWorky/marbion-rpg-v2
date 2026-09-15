import {
  PvpCoordinator as SeasonPvpCoordinator
} from "./PvpCoordinatorEntry.js";

import {
  syncPvpSeasonCatalog
} from "../systems/pvp-season-catalog-sync.js";

import {
  findNextScheduledPvpSeason
} from "../systems/pvp-season-next-schedule.js";

import {
  getSeasonCalendarPartsAt
} from "../systems/pvp-season-calendar.js";

import {
  getPvpSeasonScheduledMonth
} from "../systems/pvp-season-schedule.js";

import {
  closeExpiredMonthlyPvpSeason,
  getCurrentMonthlyPvpSeasonEndCandidate
} from "../systems/pvp-season-expiration.js";

import {
  readPvpSeasonYearSchedule,
  syncScheduledPvpSeasonYearMonthName
} from "../systems/pvp-season-schedule-store.js";

import {
  getGlobalActivePvpBattle
} from "../systems/pvp-queue.js";

import {
  getNextBattleTurnAlarmAt
} from "../systems/pvp-timeout.js";


const PVP_TRANSIENT_RETRY_MS =
  1000;

const PVP_SEASON_ACTIVATION_RETRY_MS =
  60 * 60 * 1000;


function readSyncTimestamp(
  searchParams
) {
  const raw =
    searchParams.get("now");

  if (
    raw === null ||
    String(raw).trim() === ""
  ) {
    return Date.now();
  }

  const timestamp =
    Number(raw);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return null;
  }

  return Math.round(timestamp);
}


function getCatalogSyncStatus(
  result
) {
  if (result?.ok) {
    return 200;
  }

  const error =
    String(result?.error || "");

  if (
    error.includes("STORAGE") ||
    error.includes("LIST_FAILED")
  ) {
    return 500;
  }

  return 400;
}


function getBattleAlarmCandidate(
  data,
  preferredBattle,
  now
) {
  const battle =
    preferredBattle?.status === "ACTIVE"
      ? preferredBattle
      : getGlobalActivePvpBattle(
          data
        );

  if (!battle) {
    return null;
  }

  const next =
    getNextBattleTurnAlarmAt(
      battle,
      now
    );

  if (
    !next?.ok ||
    !Number.isFinite(
      Number(next.alarmAt)
    )
  ) {
    return null;
  }

  return {
    ok: true,
    scheduled: true,
    kind: "battle",
    stage:
      next.stage,
    alarmAt:
      Number(next.alarmAt)
  };
}


function getResultAlarmAt(
  result
) {
  if (
    result?.scheduled !== true ||
    !Number.isFinite(
      Number(result?.alarmAt)
    )
  ) {
    return null;
  }

  return Number(result.alarmAt);
}


async function getDueSeasonActivationRetryCandidate(
  storage,
  now
) {
  const calendar =
    getSeasonCalendarPartsAt(now);

  if (!calendar) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_ACTIVATION_RETRY_TIME"
    };
  }

  const scheduleResult =
    await readPvpSeasonYearSchedule(
      storage,
      calendar.year
    );

  if (!scheduleResult.ok) {
    return scheduleResult;
  }

  if (!scheduleResult.schedule) {
    return {
      ok: true,
      candidate: null
    };
  }

  const entry =
    getPvpSeasonScheduledMonth(
      scheduleResult.schedule,
      calendar.month
    );

  if (
    !entry ||
    now < entry.startsAt ||
    now >= entry.endsAt
  ) {
    return {
      ok: true,
      candidate: null
    };
  }

  /*
   * O retry fica ancorado nas horas civis da própria temporada.
   * Ex.: uma falha às 00:00 tenta novamente às 01:00. Se algum
   * outro fluxo recalcular o alarm às 00:30, o retry continua
   * sendo 01:00 em vez de escorregar para 01:30.
   *
   * O último horário possível é sempre anterior ao endsAt. O
   * retry nunca atravessa a virada nem prolonga a temporada.
   */
  const elapsed =
    Math.max(
      0,
      Number(now) -
        Number(entry.startsAt)
    );

  const completedIntervals =
    Math.floor(
      elapsed /
        PVP_SEASON_ACTIVATION_RETRY_MS
    );

  const alarmAt =
    Number(entry.startsAt) +
    (
      (completedIntervals + 1) *
      PVP_SEASON_ACTIVATION_RETRY_MS
    );

  if (
    !Number.isFinite(alarmAt) ||
    alarmAt >= Number(entry.endsAt)
  ) {
    return {
      ok: true,
      candidate: null,
      entry,
      reason:
        "SEASON_ACTIVATION_RETRY_WINDOW_CLOSED"
    };
  }

  return {
    ok: true,
    candidate: {
      ok: true,
      scheduled: true,
      kind: "season",
      stage:
        "SEASON_ACTIVATION_RETRY",
      alarmAt,
      seasonId:
        entry.id,
      entry
    }
  };
}


/*
 * Camada final do Durable Object global para o catálogo
 * oficial de temporadas.
 *
 * PvpCoordinatorEntry.js continua concentrando a integração
 * de planejamento, agendamento, alarm e ativação. Esta classe
 * acrescenta sincronização do catálogo e as proteções finais do
 * alarm compartilhado, mantendo o motor PvP original isolado.
 */
export class PvpCoordinator extends SeasonPvpCoordinator {
  /*
   * O coordenador PvP legado possui uma condição antiga em que
   * `null` de desafio pode ser convertido para 0 e aparecer como
   * um candidato fantasma de alarm. A camada de temporada já
   * descarta esse falso desafio, porém isso poderia esconder um
   * alarm real de batalha que estava em segundo lugar.
   *
   * Depois de preservar esse candidato real de batalha, também
   * inserimos dois candidatos do ciclo mensal:
   * - retry horário de um mês autorizado que ainda não ativou;
   * - encerramento da temporada mensal atual.
   *
   * Assim uma falha de ativação não abandona o mês e uma
   * temporada ativa encerra à meia-noite mesmo sem sucessora.
   */
  async scheduleCoordinatorAlarm(
    data = null,
    preferredBattle = null
  ) {
    const currentData =
      data ||
      await this.getData();

    const now =
      Date.now();

    let result =
      await super.scheduleCoordinatorAlarm(
        currentData,
        preferredBattle
      );

    const battleAlarm =
      getBattleAlarmCandidate(
        currentData,
        preferredBattle,
        now
      );

    if (
      battleAlarm &&
      result?.kind !== "battle"
    ) {
      const resultAlarmAt =
        getResultAlarmAt(result);

      if (
        resultAlarmAt === null ||
        battleAlarm.alarmAt <=
          resultAlarmAt
      ) {
        if (
          typeof this.state.storage.setAlarm ===
          "function"
        ) {
          await this.state.storage.setAlarm(
            battleAlarm.alarmAt
          );

          result =
            battleAlarm;
        }
      }
    }

    const activationRetry =
      await getDueSeasonActivationRetryCandidate(
        this.state.storage,
        now
      );

    if (!activationRetry.ok) {
      console.error(
        "[PVP_SEASON_ACTIVATION_RETRY_ALARM]",
        activationRetry.error
      );
    }
    else if (activationRetry.candidate) {
      const retryCandidate =
        activationRetry.candidate;

      const selectedAlarmAt =
        getResultAlarmAt(result);

      if (
        selectedAlarmAt === null ||
        retryCandidate.alarmAt <
          selectedAlarmAt
      ) {
        if (
          typeof this.state.storage.setAlarm ===
          "function"
        ) {
          await this.state.storage.setAlarm(
            retryCandidate.alarmAt
          );

          result =
            retryCandidate;
        }
      }
    }

    const expiration =
      await getCurrentMonthlyPvpSeasonEndCandidate(
        this.state.storage,
        now
      );

    if (!expiration.ok) {
      console.error(
        "[PVP_SEASON_EXPIRATION_ALARM]",
        expiration.error
      );

      return result;
    }

    const endCandidate =
      expiration.candidate;

    if (!endCandidate) {
      return result;
    }

    const endAlarmAt =
      Math.max(
        now + 1,
        Number(endCandidate.alarmAt)
      );

    const selectedAlarmAt =
      getResultAlarmAt(result);

    if (
      selectedAlarmAt !== null &&
      selectedAlarmAt <= endAlarmAt
    ) {
      return result;
    }

    if (
      typeof this.state.storage.setAlarm !==
      "function"
    ) {
      return result;
    }

    await this.state.storage.setAlarm(
      endAlarmAt
    );

    return {
      ok: true,
      scheduled: true,
      kind: "season",
      stage: "SEASON_END",
      alarmAt:
        endAlarmAt,
      seasonId:
        endCandidate.season?.id ||
        null
    };
  }


  /*
   * A virada mensal precisa obedecer esta ordem:
   *
   * 1. encerrar a temporada anterior exatamente no endsAt;
   * 2. permitir que a camada herdada ative o novo mês, se ele
   *    estiver previamente autorizado/agendado;
   * 3. processar normalmente o alarm PvP que compartilha o DO.
   *
   * Se a ativação falhar e o snapshot do mês continuar agendado,
   * scheduleCoordinatorAlarm() preserva um novo intento por hora.
   * Sem uma temporada seguinte autorizada, nenhuma é inventada.
   */
  async alarm() {
    const alarmNow =
      Date.now();

    const expiration =
      await closeExpiredMonthlyPvpSeason(
        this.state.storage,
        alarmNow
      );

    if (!expiration.ok) {
      console.error(
        "[PVP_SEASON_EXPIRATION]",
        expiration.error
      );
    }

    const result =
      await super.alarm();

    if (
      result?.deferred !== true ||
      typeof this.state.storage.setAlarm !==
        "function"
    ) {
      return result;
    }

    const now =
      Date.now();

    const retryAt =
      now +
      PVP_TRANSIENT_RETRY_MS;

    const nextSeason =
      await findNextScheduledPvpSeason(
        this.state.storage,
        now
      );

    const seasonStartAlarmAt =
      nextSeason?.ok &&
      nextSeason?.entry &&
      Number.isFinite(
        Number(nextSeason.alarmAt)
      )
        ? Number(nextSeason.alarmAt)
        : null;

    const currentEnd =
      await getCurrentMonthlyPvpSeasonEndCandidate(
        this.state.storage,
        now
      );

    const seasonEndAlarmAt =
      currentEnd?.ok &&
      currentEnd?.candidate &&
      Number.isFinite(
        Number(currentEnd.candidate.alarmAt)
      )
        ? Math.max(
            now + 1,
            Number(
              currentEnd.candidate.alarmAt
            )
          )
        : null;

    const lifecycleAlarmAt =
      [
        seasonStartAlarmAt,
        seasonEndAlarmAt
      ]
        .filter(
          value =>
            Number.isFinite(
              Number(value)
            )
        )
        .map(Number)
        .sort(
          (a, b) => a - b
        )[0] ?? null;

    const alarmAt =
      lifecycleAlarmAt !== null &&
      lifecycleAlarmAt < retryAt
        ? lifecycleAlarmAt
        : retryAt;

    await this.state.storage.setAlarm(
      alarmAt
    );

    return result;
  }


  /*
   * O motor PvP legado limpa o alarm quando uma batalha acaba,
   * é desistida ou deixa de precisar do timeout de turno.
   *
   * Como agora o mesmo Durable Object também usa esse único
   * alarm para o ciclo mensal, uma limpeza PvP não pode apagar
   * silenciosamente um início, retry ou encerramento agendado.
   */
  async clearBattleTurnAlarm() {
    const result =
      await super.clearBattleTurnAlarm();

    await this.scheduleCoordinatorAlarm();

    return result;
  }


  async fetch(
    request
  ) {
    const url =
      new URL(request.url);

    /*
     * Editar o nome de um mês ainda agendado deve refletir no
     * snapshot do agendamento sem recriá-lo nem alterar seu
     * scheduledAt. Depois que a temporada é ativada, o snapshot
     * já foi consumido, então a temporada ACTIVE permanece com
     * o nome que possuía no momento da ativação.
     */
    if (
      url.pathname ===
      "/season/plan/define"
    ) {
      const baseResponse =
        await super.fetch(request);

      const result =
        await baseResponse.json();

      if (!result?.ok) {
        return Response.json(
          result,
          { status: baseResponse.status }
        );
      }

      const scheduleSync =
        await syncScheduledPvpSeasonYearMonthName(
          this.state.storage,
          {
            year:
              result.definition?.year ??
              url.searchParams.get("year"),
            month:
              result.definition?.month ??
              url.searchParams.get("month"),
            name:
              result.definition?.name ??
              url.searchParams.get("name")
          }
        );

      if (!scheduleSync.ok) {
        return Response.json(
          {
            ok: false,
            error:
              scheduleSync.error,
            definition:
              result.definition,
            plan:
              result.plan,
            scheduleSync
          },
          {
            status:
              getCatalogSyncStatus(
                scheduleSync
              )
          }
        );
      }

      return Response.json(
        {
          ...result,
          scheduleSync
        },
        { status: baseResponse.status }
      );
    }

    if (
      url.pathname ===
      "/season/catalog/sync"
    ) {
      const now =
        readSyncTimestamp(
          url.searchParams
        );

      if (now === null) {
        return Response.json(
          {
            ok: false,
            error:
              "INVALID_SEASON_CATALOG_SYNC_TIME"
          },
          { status: 400 }
        );
      }

      const result =
        await syncPvpSeasonCatalog(
          this.state.storage,
          { now }
        );

      let alarm = null;

      if (result.ok) {
        alarm =
          await this.scheduleCoordinatorAlarm();
      }

      return Response.json(
        {
          ...result,
          alarm
        },
        {
          status:
            getCatalogSyncStatus(
              result
            )
        }
      );
    }

    return super.fetch(
      request
    );
  }
}
