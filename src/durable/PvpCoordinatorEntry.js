import {
  PvpCoordinator as BasePvpCoordinator
} from "./PvpCoordinator.js";

import {
  getPvpSeasonState,
  startPvpSeason,
  startMonthlyPvpSeason,
  endCurrentPvpSeason
} from "../systems/pvp-season-service.js";

import {
  activateDueScheduledPvpSeason
} from "../systems/pvp-season-activation.js";

import {
  findNextScheduledPvpSeason
} from "../systems/pvp-season-next-schedule.js";

import {
  definePvpSeasonYearMonth,
  readPvpSeasonYearPlan
} from "../systems/pvp-season-plan-store.js";

import {
  schedulePvpSeasonYearMonth,
  cancelScheduledPvpSeasonYearMonth,
  readPvpSeasonYearSchedule
} from "../systems/pvp-season-schedule-store.js";

import {
  getNextChallengeExpiry
} from "../systems/pvp-challenge-timeout.js";


function readOptionalNumber(
  searchParams,
  key
) {
  const raw =
    searchParams.get(key);

  if (
    raw === null ||
    String(raw).trim() === ""
  ) {
    return undefined;
  }

  return Number(raw);
}


function getSeasonErrorStatus(
  result
) {
  if (result?.ok) {
    return 200;
  }

  if (
    result?.error ===
      "SEASON_ALREADY_EXISTS"
  ) {
    return 409;
  }

  if (
    result?.error ===
      "NO_CURRENT_SEASON" ||
    result?.error ===
      "SEASON_YEAR_PLAN_NOT_FOUND" ||
    result?.error ===
      "SEASON_MONTH_DEFINITION_NOT_FOUND"
  ) {
    return 404;
  }

  const error =
    String(result?.error || "");

  if (
    error.startsWith("SEASON_STORAGE_") ||
    error.startsWith("SEASON_PLAN_STORAGE_") ||
    error.startsWith("SEASON_SCHEDULE_STORAGE_") ||
    result?.error ===
      "INVALID_STORED_SEASON" ||
    result?.error ===
      "INVALID_STORED_SEASON_PLAN" ||
    result?.error ===
      "INVALID_STORED_SEASON_SCHEDULE"
  ) {
    return 500;
  }

  return 400;
}


function getValidatedBaseAlarmAt(
  baseResult,
  data,
  now
) {
  const rawAlarmAt =
    baseResult?.alarmAt;

  if (
    rawAlarmAt === null ||
    rawAlarmAt === undefined ||
    !Number.isFinite(
      Number(rawAlarmAt)
    )
  ) {
    return null;
  }

  if (
    baseResult?.kind ===
      "challenge"
  ) {
    const nextChallengeAt =
      getNextChallengeExpiry(
        data?.challenges,
        now
      );

    if (
      nextChallengeAt === null ||
      nextChallengeAt === undefined ||
      !Number.isFinite(
        Number(nextChallengeAt)
      )
    ) {
      return null;
    }
  }

  return Number(rawAlarmAt);
}


/*
 * Entrada do Durable Object global.
 *
 * Mantemos o motor PvP original isolado em
 * PvpCoordinator.js e interceptamos aqui apenas
 * as rotas internas de temporada. Assim a etapa
 * de temporadas pode evoluir sem alterar o fluxo
 * já validado de combate, fila, AFK e ranking.
 */
export class PvpCoordinator extends BasePvpCoordinator {
  /*
   * O coordenador já possui um único alarm
   * compartilhado por desafio pendente e timeout
   * de batalha. A temporada entra como mais um
   * candidato, sem substituir um evento PvP que
   * precise acontecer antes dela.
   */
  async scheduleCoordinatorAlarm(
    data = null,
    preferredBattle = null
  ) {
    const currentData =
      data ||
      await this.getData();

    const baseResult =
      await super.scheduleCoordinatorAlarm(
        currentData,
        preferredBattle
      );

    const now =
      Date.now();

    const baseAlarmAt =
      getValidatedBaseAlarmAt(
        baseResult,
        currentData,
        now
      );

    const nextSeason =
      await findNextScheduledPvpSeason(
        this.state.storage,
        now
      );

    const hasSeasonAlarm =
      nextSeason.ok &&
      nextSeason.entry &&
      nextSeason.alarmAt !== null &&
      nextSeason.alarmAt !== undefined &&
      Number.isFinite(
        Number(nextSeason.alarmAt)
      );

    if (!hasSeasonAlarm) {
      if (
        baseAlarmAt === null &&
        baseResult?.kind ===
          "challenge" &&
        typeof this.state.storage.deleteAlarm ===
          "function"
      ) {
        await this.state.storage.deleteAlarm();

        return {
          ok: true,
          scheduled: false
        };
      }

      return baseResult;
    }

    const seasonAlarmAt =
      Number(
        nextSeason.alarmAt
      );

    if (
      baseAlarmAt !== null &&
      baseAlarmAt <= seasonAlarmAt
    ) {
      return baseResult;
    }

    if (
      typeof this.state.storage.setAlarm !==
      "function"
    ) {
      return baseResult;
    }

    await this.state.storage.setAlarm(
      seasonAlarmAt
    );

    return {
      ok: true,
      scheduled: true,
      kind: "season",
      stage: "SEASON_START",
      alarmAt:
        seasonAlarmAt,
      seasonId:
        nextSeason.entry.id
    };
  }


  async alarm() {
    const alarmNow =
      Date.now();

    const seasonActivation =
      await activateDueScheduledPvpSeason(
        this.state.storage,
        alarmNow
      );

    if (!seasonActivation.ok) {
      console.error(
        "[PVP_SEASON_ACTIVATION]",
        seasonActivation.error
      );
    }

    const baseResult =
      await super.alarm();

    /*
     * super.alarm() pode criar, substituir ou
     * remover o alarm ao tratar PvP. Recalculamos
     * ao final para garantir que a próxima
     * temporada futura continue registrada.
     */
    await this.scheduleCoordinatorAlarm();

    return baseResult;
  }


  async fetch(
    request
  ) {
    const url =
      new URL(request.url);


    if (
      url.pathname ===
      "/season/current"
    ) {
      const result =
        await getPvpSeasonState(
          this.state.storage
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    /*
     * Planejamento anual.
     *
     * Definir o nome de um mês não agenda nem ativa
     * temporada alguma. Esta camada existe para o
     * futuro painel/site e para os comandos de ADM.
     */
    if (
      url.pathname ===
      "/season/plan"
    ) {
      const result =
        await readPvpSeasonYearPlan(
          this.state.storage,
          url.searchParams.get("year")
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    if (
      url.pathname ===
      "/season/plan/define"
    ) {
      const result =
        await definePvpSeasonYearMonth(
          this.state.storage,
          {
            year:
              url.searchParams.get("year"),
            month:
              url.searchParams.get("month"),
            name:
              url.searchParams.get("name")
          }
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    /*
     * Agendamento anual.
     *
     * O nome precisa ter sido previamente definido.
     * Ao agendar/cancelar, o alarm compartilhado é
     * recalculado imediatamente.
     */
    if (
      url.pathname ===
      "/season/schedule"
    ) {
      const result =
        await readPvpSeasonYearSchedule(
          this.state.storage,
          url.searchParams.get("year")
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    if (
      url.pathname ===
      "/season/schedule/add"
    ) {
      const result =
        await schedulePvpSeasonYearMonth(
          this.state.storage,
          {
            year:
              url.searchParams.get("year"),
            month:
              url.searchParams.get("month")
          },
          Date.now()
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
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    if (
      url.pathname ===
      "/season/schedule/cancel"
    ) {
      const result =
        await cancelScheduledPvpSeasonYearMonth(
          this.state.storage,
          {
            year:
              url.searchParams.get("year"),
            month:
              url.searchParams.get("month")
          }
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
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    /*
     * Rota mensal canônica.
     *
     * O calendário calcula automaticamente
     * ID, início e fim do mês civil em
     * America/Fortaleza. Tema-base e nome
     * anual permanecem campos distintos.
     */
    if (
      url.pathname ===
      "/season/start-monthly"
    ) {
      const result =
        await startMonthlyPvpSeason(
          this.state.storage,
          {
            year:
              url.searchParams.get("year"),
            month:
              url.searchParams.get("month"),
            baseTheme:
              url.searchParams.get("baseTheme"),
            name:
              url.searchParams.get("name")
          }
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    /*
     * Compatibilidade temporária com o fluxo
     * antigo de duração arbitrária. Não é mais
     * a rota recomendada para novas temporadas.
     */
    if (
      url.pathname ===
      "/season/start"
    ) {
      const options = {
        id:
          url.searchParams.get("id"),
        name:
          url.searchParams.get("name")
      };

      const startsAt =
        readOptionalNumber(
          url.searchParams,
          "startsAt"
        );

      const endsAt =
        readOptionalNumber(
          url.searchParams,
          "endsAt"
        );

      const durationMs =
        readOptionalNumber(
          url.searchParams,
          "durationMs"
        );

      if (startsAt !== undefined) {
        options.startsAt =
          startsAt;
      }

      if (endsAt !== undefined) {
        options.endsAt =
          endsAt;
      }

      if (durationMs !== undefined) {
        options.durationMs =
          durationMs;
      }

      const result =
        await startPvpSeason(
          this.state.storage,
          options
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
              result
            )
        }
      );
    }


    if (
      url.pathname ===
      "/season/end"
    ) {
      const endedAt =
        readOptionalNumber(
          url.searchParams,
          "endedAt"
        );

      const result =
        await endCurrentPvpSeason(
          this.state.storage,
          endedAt === undefined
            ? Date.now()
            : endedAt
        );

      return Response.json(
        result,
        {
          status:
            getSeasonErrorStatus(
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
