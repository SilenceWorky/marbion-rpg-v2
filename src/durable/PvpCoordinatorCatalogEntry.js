import {
  PvpCoordinator as SeasonPvpCoordinator
} from "./PvpCoordinatorEntry.js";

import {
  syncPvpSeasonCatalog
} from "../systems/pvp-season-catalog-sync.js";


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


/*
 * Camada final do Durable Object global para o catálogo
 * oficial de temporadas.
 *
 * PvpCoordinatorEntry.js continua concentrando a integração
 * de planejamento, agendamento, alarm e ativação. Esta classe
 * apenas acrescenta a sincronização do catálogo de código,
 * mantendo o restante do PvP intacto.
 */
export class PvpCoordinator extends SeasonPvpCoordinator {
  async fetch(
    request
  ) {
    const url =
      new URL(request.url);

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
