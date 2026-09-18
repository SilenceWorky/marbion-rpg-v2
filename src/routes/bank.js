import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fuseAllMoney,
  fuseMoney,
  splitMoney
} from "../systems/bank-exchange.js";

import {
  createPendingBankPix
} from "../systems/bank-pix-state.js";

import {
  moneyToBronze
} from "../systems/money.js";


function normalizeUser(
  value
) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function normalizeCommand(
  value
) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function normalizeCoin(
  value
) {
  const coin =
    normalizeCommand(
      value
    );

  const aliases = {
    bronze: "bronze",

    prata: "silver",
    silver: "silver",

    ouro: "gold",
    gold: "gold",

    platina: "platinum",
    platinum: "platinum"
  };

  return (
    aliases[coin] ||
    coin
  );
}


function formatMoney(
  user,
  money
) {
  return (
    `🏦 Banco de @${user} ┃ ` +
    `Bronze: ${money.bronze} ┃ ` +
    `Prata: ${money.silver} ┃ ` +
    `Ouro: ${money.gold} ┃ ` +
    `Platina: ${money.platinum}`
  );
}


function formatExchangeError(
  user,
  result
) {
  if (
    result.error ===
      "PLATINUM_CANNOT_FUSE"
  ) {
    return (
      `@${user}, Platina é a maior moeda e não pode ser unida.`
    );
  }

  if (
    result.error ===
      "BRONZE_CANNOT_SPLIT"
  ) {
    return (
      `@${user}, Bronze é a menor moeda e não pode ser separado.`
    );
  }

  if (
    result.error ===
      "INSUFFICIENT_FUNDS_FOR_FUSION"
  ) {
    return (
      `@${user}, saldo insuficiente para unir essa quantidade.`
    );
  }

  if (
    result.error ===
      "INSUFFICIENT_FUNDS_FOR_SPLIT"
  ) {
    return (
      `@${user}, saldo insuficiente para separar essa quantidade.`
    );
  }

  if (
    result.error ===
      "INVALID_FUSION_AMOUNT" ||
    result.error ===
      "INVALID_SPLIT_AMOUNT"
  ) {
    return (
      `@${user}, informe uma quantidade inteira maior que zero.`
    );
  }

  return (
    `@${user}, operação bancária inválida.`
  );
}


export async function bankRoute(
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

  const rawArgs =
    String(
      url.searchParams.get(
        "args"
      ) ?? ""
    ).trim();

  if (!rawArgs) {
    return new Response(
      formatMoney(
        user,
        profile.money
      )
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

  if (command === "unir") {
    const coin =
      normalizeCoin(
        args[1]
      );

    if (!coin) {
      return new Response(
        `@${user}, uso: !banco unir bronze/prata/ouro [quantidade] | !banco unir tudo`
      );
    }

    let result;

    if (coin === "tudo") {
      if (args[2]) {
        return new Response(
          `@${user}, uso: !banco unir tudo`
        );
      }

      result =
        fuseAllMoney(
          profile.money
        );
    }
    else {
      result =
        fuseMoney(
          profile.money,
          coin,
          args[2] ?? null
        );
    }

    if (!result.ok) {
      return new Response(
        formatExchangeError(
          user,
          result
        )
      );
    }

    profile.money =
      result.money;

    await saveProfile(
      env,
      user,
      profile
    );

    return new Response(
      `✅ @${user}, moedas unidas. ` +
      formatMoney(
        user,
        profile.money
      )
    );
  }

  if (
    command === "separar" ||
    command === "dividir"
  ) {
    const coin =
      normalizeCoin(
        args[1]
      );

    if (!coin) {
      return new Response(
        `@${user}, uso: !banco separar platina/ouro/prata [quantidade]`
      );
    }

    const result =
      splitMoney(
        profile.money,
        coin,
        args[2] ?? null
      );

    if (!result.ok) {
      return new Response(
        formatExchangeError(
          user,
          result
        )
      );
    }

    profile.money =
      result.money;

    await saveProfile(
      env,
      user,
      profile
    );

    return new Response(
      `✅ @${user}, moedas separadas. ` +
      formatMoney(
        user,
        profile.money
      )
    );
  }

  if (command === "pix") {
    const amount =
      Math.floor(
        Number(
          args[1]
        )
      );

    const coin =
      normalizeCoin(
        args[2]
      );

    const recipientUser =
      normalizeUser(
        args[3]
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !coin ||
      !recipientUser
    ) {
      return new Response(
        `@${user}, uso: !banco pix quantidade bronze/prata/ouro/platina @usuário`
      );
    }

    if (
      recipientUser ===
      user
    ) {
      return new Response(
        `@${user}, você não pode enviar Pix para si mesmo.`
      );
    }

    const recipientProfile =
      await getProfile(
        env,
        recipientUser
      );

    if (
      !recipientProfile ||
      !recipientProfile.race
    ) {
      return new Response(
        `@${user}, o destinatário @${recipientUser} ainda não possui um personagem.`
      );
    }

    const valueByCoin = {
      bronze: 1,
      silver: 10,
      gold: 100,
      platinum: 1000
    };

    const totalBronze =
      amount *
      valueByCoin[coin];

    if (
      moneyToBronze(
        profile.money
      ) <
      totalBronze
    ) {
      return new Response(
        `@${user}, saldo insuficiente para criar esse Pix.`
      );
    }

    const result =
      createPendingBankPix(
        profile,
        {
          sender:
            user,
          recipient:
            recipientUser,
          amount,
          coin
        }
      );

    if (!result.ok) {
      if (
        result.error ===
        "PIX_ALREADY_PENDING"
      ) {
        return new Response(
          `@${user}, você já possui um Pix pendente. Aguarde a expiração antes de criar outro.`
        );
      }

      if (
        result.error ===
        "PIX_SELF_TRANSFER"
      ) {
        return new Response(
          `@${user}, você não pode enviar Pix para si mesmo.`
        );
      }

      return new Response(
        `@${user}, não foi possível criar o Pix pendente.`
      );
    }

    await saveProfile(
      env,
      user,
      profile
    );

    return new Response(
      `💸 @${user}, Pix pendente: ${amount} ${args[2]} para @${recipientUser}. Confirme em até 2 minutos.`
    );
  }

  return new Response(
    `@${user}, uso: !banco | !banco unir ... | !banco separar ...`
  );
}
