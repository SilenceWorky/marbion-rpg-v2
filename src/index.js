import {
  handleRequest
} from "./router.js";


export {
  PvpCoordinator
} from "./durable/PvpCoordinatorFinalEntry.js";


function getGlobalPvpCoordinator(
  env
) {
  const namespace =
    env?.PVP_COORDINATOR;

  if (
    !namespace ||
    typeof namespace.idFromName !== "function" ||
    typeof namespace.get !== "function"
  ) {
    return null;
  }

  const id =
    namespace.idFromName(
      "marbion-global-pvp"
    );

  return namespace.get(id);
}


export async function syncPvpSeasonCatalogFromScheduled(
  env,
  scheduledTime = Date.now()
) {
  const coordinator =
    getGlobalPvpCoordinator(env);

  if (!coordinator) {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  const timestamp =
    Number(scheduledTime);

  if (
    !Number.isFinite(timestamp) ||
    timestamp < 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASON_CATALOG_SYNC_TIME"
    };
  }

  const url =
    new URL(
      "https://pvp.internal/season/catalog/sync"
    );

  url.searchParams.set(
    "now",
    String(
      Math.round(timestamp)
    )
  );

  let response;

  try {
    response =
      await coordinator.fetch(
        new Request(
          url.toString(),
          { method: "POST" }
        )
      );
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  try {
    return await response.json();
  }
  catch {
    return {
      ok: false,
      error:
        "INVALID_COORDINATOR_RESPONSE"
    };
  }
}


export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    return handleRequest(
      request,
      env,
      ctx
    );
  },


  async scheduled(
    controller,
    env,
    ctx
  ) {
    const task =
      syncPvpSeasonCatalogFromScheduled(
        env,
        controller?.scheduledTime ??
          Date.now()
      ).then(
        result => {
          if (!result.ok) {
            console.error(
              "[PVP_SEASON_CATALOG_SYNC]",
              result.error
            );
          }

          return result;
        }
      );

    if (
      ctx &&
      typeof ctx.waitUntil === "function"
    ) {
      ctx.waitUntil(task);
    }

    return task;
  }
};
