import {
  isAdminUser
} from "../config/admins.js";

import {
  MONEY_DENOMINATIONS,
  MONEY_VALUES_IN_BRONZE
} from "../systems/money.js";

import {
  BANK_PIX_TTL_MS
} from "../systems/bank-pix-state.js";

const LABELS = Object.freeze({
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina"
});
function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function authorized(url, env) {
  const actor =
    normalizeUser(
      url.searchParams.get("actor")
    );

  const key =
    String(
      url.searchParams.get("key") ?? ""
    );

  return Boolean(
    actor &&
    isAdminUser(actor) &&
    key &&
    env?.MARBION_ADMIN_KEY &&
    key === env.MARBION_ADMIN_KEY
  );
}
function buildCurrencies() {
  return MONEY_DENOMINATIONS.map(
    (key, index) => {
      const next =
        MONEY_DENOMINATIONS[
          index + 1
        ] ?? null;

      const previous =
        MONEY_DENOMINATIONS[
          index - 1
        ] ?? null;

      return {
        key,
        label:
          LABELS[key] ?? key,
        valueInBronze:
          MONEY_VALUES_IN_BRONZE[
            key
          ],
        fuseTo:
          next
            ? {
                key: next,
                label:
                  LABELS[next] ?? next,
                sourceAmount: 10,
                targetAmount: 1
              }
            : null,
        splitTo:
          previous
            ? {
                key: previous,
                label:
                  LABELS[previous] ??
                  previous,
                sourceAmount: 1,
                targetAmount: 10
              }
            : null
      };
    }
  );
}
export async function adminEconomyApiRoute(
  request,
  env
) {
  const url =
    new URL(request.url);

  if (!authorized(url, env)) {
    return Response.json(
      {
        ok: false,
        error: "FORBIDDEN"
      },
      { status: 403 }
    );
  }

  if (
    String(
      request.method ?? "GET"
    ).toUpperCase() !== "GET"
  ) {
    return Response.json(
      {
        ok: false,
        error: "METHOD_NOT_ALLOWED"
      },
      { status: 405 }
    );
  }
  return Response.json({
    ok: true,
    currencies:
      buildCurrencies(),
    baseCurrency: "bronze",
    banking: {
      fusionRatio: 10,
      splitRatio: 10,
      earningsAutoConverted: false,
      spendingUsesCanonicalChange: true,
      fuseAllSupported: true,
      pix: {
        enabled: true,
        ttlMs:
          BANK_PIX_TTL_MS,
        selfTransferAllowed: false,
        onePendingPerSender: true,
        requiresConfirmation: true,
        retrySafeDistributedSaga: true
      }
    },
    capabilities: {
      storeIntegrated: false,
      itemPricingIntegrated: false,
      economyHistoryIntegrated: false
    }
  });
}
