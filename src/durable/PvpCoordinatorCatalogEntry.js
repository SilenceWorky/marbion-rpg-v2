import {
  PvpCoordinator as SeasonPvpCoordinator
} from "./PvpCoordinatorEntry.js";

import {
  syncPvpSeasonCatalog
} from "../systems/pvp-season-catalog-sync.js";

import {
  getGlobalActivePvpBattle
} from "../systems/pvp-queue.js";

import {
  getNextBattleTurnAlarmAt
} from "../systems/pvp-timeout.js";


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
  /*
   * O coordenador PvP legado possui uma condição antiga em que
   * `null` de desafio pode ser convertido para 0 e aparecer como
   * um candidato fantasma de alarm. A camada de temporada já
   * descarta esse falso desafio, porém isso poderia esconder um
   * alarm real de batalha que estava em segundo lugar.
   *
   * Recalculamos somente o candidato real de batalha depois do
   * coordenador completo e o restauramos quando ele ocorrer antes
   * do resultado escolhido. Não alteramos o motor PvP legado nem
   * a ordem normal entre desafios e batalhas reais.
   */
  async scheduleCoordinatorAlarm(
    data = null,
    preferredBattle = null
  ) {
    const currentData =
      data ||
      await this.getData();

    const result =
      await super.scheduleCoordinatorAlarm(
        currentData,
        preferredBattle
      );

    const battleAlarm =
      getBattleAlarmCandidate(
        currentData,
        preferredBattle,
        Date.now()
      );

    if (!battleAlarm) {
      return result;
    }

    if (
      result?.kind === "battle"
    ) {
      return result;
    }

    const resultAlarmAt =
      Number(result?.alarmAt);

    const hasResultAlarm =
      result?.scheduled === true &&
      Number.isFinite(
        resultAlarmAt
      );

    if (
      hasResultAlarm &&
      resultAlarmAt <
        battleAlarm.alarmAt
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
      battleAlarm.alarmAt
    );

    return battleAlarm;
  }


  /*
   * O motor PvP legado limpa o alarm quando uma batalha acaba,
   * é desistida ou deixa de precisar do timeout de turno.
   *
   * Como agora o mesmo Durable Object também usa esse único
   * alarm para a próxima temporada, uma limpeza PvP não pode
   * apagar silenciosamente um início mensal já agendado.
   *
   * Primeiro preservamos exatamente a limpeza original; em
   * seguida, recalculamos o alarm compartilhado. Assim desafios
   * ou batalhas que ainda existirem continuam tendo prioridade,
   * e a temporada volta a ocupar o alarm quando for o próximo
   * evento real.
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
