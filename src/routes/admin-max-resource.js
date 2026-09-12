import {
  isAdminUser
} from "../config/admins.js";

import {
  adminModifyProfileResource,
  parseAdminResourceChange,
  normalizeAdminResource
} from "../systems/admin-resources.js";


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeCommand(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function getCoordinator(env) {
  const id =
    env.PVP_COORDINATOR.idFromName(
      "marbion-global-pvp"
    );

  return env.PVP_COORDINATOR.get(
    id
  );
}


function getResourceFromCommand(command) {
  const normalized =
    normalizeAdminResource(
      command
    );

  if (
    normalized === "maxhp" ||
    normalized === "maxmentalidade"
  ) {
    return normalized;
  }

  return null;
}


async function modifyBattleMaximum(
  env,
  user,
  resource,
  change
) {
  const coordinator =
    getCoordinator(
      env
    );

  const internalUrl =
    new URL(
      "https://pvp.internal/admin-resource"
    );

  internalUrl.searchParams.set(
    "user",
    normalizeUser(user)
  );

  internalUrl.searchParams.set(
    "resource",
    resource
  );

  internalUrl.searchParams.set(
    "mode",
    change.mode
  );

  internalUrl.searchParams.set(
    "amount",
    String(change.amount)
  );


  const response =
    await coordinator.fetch(
      new Request(
        internalUrl.toString()
      )
    );

  return response.json();
}


export async function adminMaxResourceRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  const actor =
    normalizeUser(
      url.searchParams.get("actor")
    );

  const adminKey =
    url.searchParams.get("key");

  const rawArgs =
    String(
      url.searchParams.get("args") ?? ""
    ).trim();


  if (
    !isAdminUser(
      actor
    )
  ) {
    return new Response(
      "❌ Você não possui permissão para usar comandos de ADM.",
      {
        status: 403
      }
    );
  }


  if (
    !env.MARBION_ADMIN_KEY ||
    adminKey !==
      env.MARBION_ADMIN_KEY
  ) {
    return new Response(
      "❌ Chave administrativa inválida.",
      {
        status: 403
      }
    );
  }


  const args =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  const command =
    normalizeCommand(
      args[0]
    );

  const resource =
    getResourceFromCommand(
      command
    );

  const target =
    args[1];

  const change =
    parseAdminResourceChange(
      args.slice(2)
    );


  if (
    !resource ||
    !target ||
    !change.ok
  ) {
    return new Response(
      `@${actor}, uso: !adm maxhp @usuário 250 | !adm maxmentalidade @usuário 120`
    );
  }


  /*
   * Primeiro alteramos o snapshot vivo, caso exista PvP.
   * Depois persistimos o mesmo máximo no perfil.
   *
   * Se a persistência falhar, tentamos restaurar o snapshot
   * para evitar divergência entre batalha e perfil.
   */
  const battleResult =
    await modifyBattleMaximum(
      env,
      target,
      resource,
      change
    );


  if (!battleResult.ok) {
    return new Response(
      `@${actor}, não foi possível alterar o recurso máximo dentro do PvP.`
    );
  }


  const profileResult =
    await adminModifyProfileResource(
      env,
      target,
      resource,
      change
    );


  if (!profileResult.ok) {
    if (
      battleResult.inBattle === true &&
      Number.isSafeInteger(
        Number(
          battleResult.before
        )
      )
    ) {
      await modifyBattleMaximum(
        env,
        target,
        resource,
        {
          ok: true,
          mode: "set",
          amount:
            Number(
              battleResult.before
            )
        }
      );
    }


    if (
      profileResult.error ===
      "CHARACTER_NOT_FOUND"
    ) {
      return new Response(
        `@${actor}, @${normalizeUser(target)} ainda não possui personagem.`
      );
    }


    return new Response(
      `@${actor}, não foi possível persistir o novo máximo no perfil.`
    );
  }


  const result =
    battleResult.inBattle === true
      ? battleResult
      : profileResult;

  const operationText =
    result.mode === "set"
      ? `SET ${result.requestedAmount}`
      : result.requestedAmount >= 0
        ? `+${result.requestedAmount}`
        : String(
            result.requestedAmount
          );

  const scopeText =
    battleResult.inBattle === true
      ? "PvP + perfil"
      : "perfil";

  const clampText =
    result.clamped
      ? " | mínimo permitido: 1"
      : "";

  const currentText =
    Number.isFinite(
      Number(
        result.currentBefore
      )
    ) &&
    Number.isFinite(
      Number(
        result.currentAfter
      )
    )
      ? ` | ${result.currentLabel}: ${result.currentBefore} → ${result.currentAfter}/${result.after}`
      : "";


  return new Response(
    `🛠️ ADM | @${normalizeUser(target)} | ${result.icon} ${result.label}: ` +
    `${result.before} → ${result.after}${currentText} | ${operationText} | ${scopeText}${clampText}.`
  );
}
