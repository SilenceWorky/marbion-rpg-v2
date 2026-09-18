import {
  PvpCoordinator as CatalogPvpCoordinator
} from "./PvpCoordinatorCatalogEntry.js";

import {
  findNextScheduledPvpSeason
} from "../systems/pvp-season-next-schedule.js";

import {
  getCurrentMonthlyPvpSeasonEndCandidate
} from "../systems/pvp-season-expiration.js";

import {
  executeBankPixProfileStoreSide
} from "../systems/bank-pix-profile-store.js";


const PVP_TRANSIENT_RETRY_MS =
  1000;


function toPresentFiniteNumber(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


/*
 * Camada final de hardening do alarm compartilhado.
 *
 * JavaScript converte Number(null) para 0. Em um retry PvP
 * transitório isso podia transformar um candidato de temporada
 * ausente em alarm 0 e vencer indevidamente o retry de 1 segundo.
 *
 * A classe base continua responsável por todo o processamento.
 * Aqui apenas recalculamos o alarm quando a batalha retorna
 * `deferred`, descartando explicitamente candidatos ausentes.
 */
export class PvpCoordinator extends CatalogPvpCoordinator {
  async fetch(
    request
  ) {
    const url =
      new URL(
        request.url
      );

    if (
      url.pathname ===
        "/profile-store/pix-side"
    ) {
      let transaction = null;

      try {
        transaction =
          await request.json();
      }
      catch {
        return Response.json(
          {
            profileStore: true,
            pixSide: true,
            ok: false,
            error:
              "INVALID_JSON"
          },
          {
            status: 400
          }
        );
      }

      const result =
        await executeBankPixProfileStoreSide(
          this.state.storage,
          this.env,
          {
            side:
              url.searchParams.get(
                "side"
              ),
            user:
              url.searchParams.get(
                "user"
              ),
            transaction
          }
        );

      return Response.json(
        {
          profileStore: true,
          pixSide: true,
          ...result
        },
        {
          status:
            result.ok
              ? 200
              : 409
        }
      );
    }

    return super.fetch(
      request
    );
  }


  async alarm() {
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
      nextSeason?.entry
        ? toPresentFiniteNumber(
            nextSeason.alarmAt
          )
        : null;

    const currentEnd =
      await getCurrentMonthlyPvpSeasonEndCandidate(
        this.state.storage,
        now
      );

    const rawSeasonEndAlarmAt =
      currentEnd?.ok &&
      currentEnd?.candidate
        ? toPresentFiniteNumber(
            currentEnd.candidate.alarmAt
          )
        : null;

    const seasonEndAlarmAt =
      rawSeasonEndAlarmAt === null
        ? null
        : Math.max(
            now + 1,
            rawSeasonEndAlarmAt
          );

    const lifecycleCandidates =
      [
        seasonStartAlarmAt,
        seasonEndAlarmAt
      ].filter(
        value => value !== null
      );

    const lifecycleAlarmAt =
      lifecycleCandidates.length > 0
        ? Math.min(
            ...lifecycleCandidates
          )
        : null;

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
}
