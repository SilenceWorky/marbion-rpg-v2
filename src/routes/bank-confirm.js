import {
  getProfile
} from "../core/database.js";

import {
  confirmBankPixDistributed
} from "../systems/bank-pix-confirm-service.js";


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function formatCoin(
  coin
) {
  const labels = {
    bronze: "Bronze",
    silver: "Prata",
    gold: "Ouro",
    platinum: "Platina"
  };

  return (
    labels[coin] ||
    coin
  );
}


export async function confirmBankPixForProfile(
  env,
  user,
  profile,
  {
    confirmFn =
      confirmBankPixDistributed,
    now =
      Date.now()
  } = {}
) {
  const normalizedUser =
    normalizeUser(
      user
    );

  if (
    !normalizedUser ||
    !profile ||
    !profile.race
  ) {
    return new Response(
      normalizedUser
        ? `@${normalizedUser}, você ainda não possui um personagem. Use !raça primeiro.`
        : "❌ Usuário não informado."
    );
  }

  const result =
    await confirmFn(
      env,
      profile,
      {
        now
      }
    );

  if (!result.ok) {
    if (
      result.error ===
        "PIX_NOT_FOUND"
    ) {
      return new Response(
        `@${normalizedUser}, você não possui um Pix pendente.`
      );
    }

    if (
      result.error ===
        "PIX_EXPIRED"
    ) {
      return new Response(
        `@${normalizedUser}, seu Pix pendente expirou. Crie um novo Pix.`
      );
    }

    if (
      result.error ===
        "PIX_INSUFFICIENT_FUNDS"
    ) {
      return new Response(
        `@${normalizedUser}, saldo insuficiente para confirmar esse Pix.`
      );
    }

    if (
      result.retrySafe === true ||
      result.stage === "credit" ||
      result.stage === "finalize"
    ) {
      return new Response(
        `⚠️ @${normalizedUser}, o Pix não foi concluído por inteiro. Use !confirmar novamente para retomar com segurança.`
      );
    }

    return new Response(
      `@${normalizedUser}, não foi possível confirmar esse Pix.`
    );
  }

  return new Response(
    `✅ @${normalizedUser}, Pix confirmado: ${result.amount} ${formatCoin(result.coin)} para @${result.recipient}.`
  );
}


export async function confirmRoute(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  const user =
    normalizeUser(
      url.searchParams.get(
        "user"
      )
    );

  if (!user) {
    return new Response(
      "❌ Usuário não informado.",
      {
        status: 400
      }
    );
  }

  const profile =
    await getProfile(
      env,
      user
    );

  if (
    !profile ||
    !profile.race
  ) {
    return new Response(
      `@${user}, você ainda não possui um personagem. Use !raça primeiro.`
    );
  }

  return confirmBankPixForProfile(
    env,
    user,
    profile
  );
}
