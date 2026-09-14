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
      "NO_CURRENT_SEASON"
  ) {
    return 404;
  }

  if (
    String(result?.error || "")
      .startsWith("SEASON_STORAGE_") ||
    result?.error ===
      "INVALID_STORED_SEASON"
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
