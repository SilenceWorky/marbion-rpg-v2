import {
  adminRoute
} from "./admin.js";

import {
  adminMaxResourceRoute
} from "./admin-max-resource.js";

import {
  adminEloResetRoute
} from "./admin-elo-reset.js";

import {
  adminSeasonRoute
} from "./admin-season.js";


function normalizeCommand(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


const MAX_RESOURCE_COMMANDS =
  new Set([
    "maxhp",
    "hpmax",
    "maxvida",
    "vidamax",
    "maxmentalidade",
    "mentalidademax",
    "maxmental",
    "mentalmax"
  ]);


export async function adminDispatcherRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const rawArgs =
    String(
      url.searchParams.get("args") ?? ""
    ).trim();

  const command =
    normalizeCommand(
      rawArgs.split(/\s+/)[0]
    );


  if (
    MAX_RESOURCE_COMMANDS.has(
      command
    )
  ) {
    return adminMaxResourceRoute(
      request,
      env
    );
  }


  if (
    command === "elo"
  ) {
    return adminEloResetRoute(
      request,
      env
    );
  }


  if (
    command === "temporada"
  ) {
    return adminSeasonRoute(
      request,
      env
    );
  }


  return adminRoute(
    request,
    env
  );
}
