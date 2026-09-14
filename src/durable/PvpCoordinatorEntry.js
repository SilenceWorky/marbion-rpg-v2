import {
  PvpCoordinator as BasePvpCoordinator
} from "./PvpCoordinator.js";

import {
  getPvpSeasonState,
  startPvpSeason,
  startMonthlyPvpSeason,
  endCurrentPvpSeason
} from "../systems/pvp-season-service.js";


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
