import {
  PvpCoordinator as CatalogPvpCoordinator
} from "./PvpCoordinatorCatalogEntry.js";

import {
  findNextScheduledPvpSeason
} from "../systems/pvp-season-next-schedule.js";

import {
  getCurrentMonthlyPvpSeasonEndCandidate
} from "../systems/pvp-season-expiration.js";


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
