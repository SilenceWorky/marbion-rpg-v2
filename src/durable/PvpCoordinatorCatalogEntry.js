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
  closeExpiredMonthlyPvpSeason,
  getCurrentMonthlyPvpSeasonEndCandidate
} from "../systems/pvp-season-expiration.js";

import {
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
   * inserimos o fim da temporada mensal atual na mesma disputa.
   * Assim uma temporada encerra à meia-noite mesmo quando não há
   * outra temporada futura autorizada para assumir em seguida.
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
   * Sem uma temporada seguinte autorizada, apenas o passo 1
   * acontece. Nenhuma temporada é inventada automaticamente.
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
   * silenciosamente um início ou encerramento já agendado.
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
