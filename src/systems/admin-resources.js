import {
  getProfile,
  saveProfile
} from "../core/database.js";


const RESOURCE_CONFIG = Object.freeze({
  hp: Object.freeze({
    field: "hp",
    maxField: "maxHp",
    label: "HP",
    icon: "❤️"
  }),

  mentalidade: Object.freeze({
    field: "mentalidade",
    maxField: "maxMentalidade",
    label: "Mentalidade",
    icon: "🧠"
  })
});


function normalizeUser(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


export function normalizeAdminResource(
  value
) {
  const normalized =
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();


  if (
    normalized === "hp" ||
    normalized === "vida"
  ) {
    return "hp";
  }


  if (
    normalized === "mentalidade" ||
    normalized === "mental"
  ) {
    return "mentalidade";
  }


  return null;
}


function parseUnsignedInteger(
  value
) {
  const text =
    String(value ?? "")
      .trim();


  if (!/^\d+$/.test(text)) {
    return null;
  }


  const number =
    Number(text);


  if (
    !Number.isSafeInteger(number) ||
    number < 0
  ) {
    return null;
  }


  return number;
}


export function parseAdminResourceChange(
  rawTokens
) {
  const tokens =
    Array.isArray(rawTokens)
      ? rawTokens
          .map(
            token =>
              String(token ?? "").trim()
          )
          .filter(Boolean)
      : String(rawTokens ?? "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);


  if (tokens.length === 1) {
    const token =
      tokens[0];


    const signed =
      token.match(/^([+-])(\d+)$/);


    if (signed) {
      const magnitude =
        parseUnsignedInteger(
          signed[2]
        );


      if (magnitude === null) {
        return {
          ok: false,
          error: "INVALID_RESOURCE_VALUE"
        };
      }


      return {
        ok: true,
        mode: "delta",
        amount:
          signed[1] === "+"
            ? magnitude
            : -magnitude
      };
    }


    const value =
      parseUnsignedInteger(
        token
      );


    if (value === null) {
      return {
        ok: false,
        error: "INVALID_RESOURCE_VALUE"
      };
    }


    return {
      ok: true,
      mode: "set",
      amount: value
    };
  }


  if (tokens.length === 2) {
    const operator =
      String(tokens[0])
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const magnitude =
      parseUnsignedInteger(
        tokens[1]
      );


    if (magnitude === null) {
      return {
        ok: false,
        error: "INVALID_RESOURCE_VALUE"
      };
    }


    if (
      operator === "+" ||
      operator === "mais"
    ) {
      return {
        ok: true,
        mode: "delta",
        amount: magnitude
      };
    }


    if (
      operator === "-" ||
      operator === "menos"
    ) {
      return {
        ok: true,
        mode: "delta",
        amount: -magnitude
      };
    }
  }


  return {
    ok: false,
    error: "INVALID_RESOURCE_VALUE"
  };
}


export function createAdminResourceChange(
  mode,
  amount
) {
  const normalizedMode =
    String(mode ?? "")
      .trim()
      .toLowerCase();

  const numericAmount =
    Number(amount);


  if (
    !Number.isSafeInteger(
      numericAmount
    )
  ) {
    return {
      ok: false,
      error: "INVALID_RESOURCE_VALUE"
    };
  }


  if (
    normalizedMode === "set"
  ) {
    if (numericAmount < 0) {
      return {
        ok: false,
        error: "INVALID_RESOURCE_VALUE"
      };
    }


    return {
      ok: true,
      mode: "set",
      amount:
        numericAmount
    };
  }


  if (
    normalizedMode === "delta"
  ) {
    return {
      ok: true,
      mode: "delta",
      amount:
        numericAmount
    };
  }


  return {
    ok: false,
    error: "INVALID_RESOURCE_MODE"
  };
}


export function applyAdminResourceChange(
  holder,
  resource,
  change
) {
  const normalizedResource =
    normalizeAdminResource(
      resource
    );


  if (!normalizedResource) {
    return {
      ok: false,
      error: "INVALID_RESOURCE"
    };
  }


  if (
    !holder ||
    typeof holder !== "object"
  ) {
    return {
      ok: false,
      error: "INVALID_RESOURCE_HOLDER"
    };
  }


  if (
    !change?.ok ||
    (
      change.mode !== "set" &&
      change.mode !== "delta"
    ) ||
    !Number.isSafeInteger(
      Number(change.amount)
    )
  ) {
    return {
      ok: false,
      error: "INVALID_RESOURCE_VALUE"
    };
  }


  const config =
    RESOURCE_CONFIG[
      normalizedResource
    ];

  const max =
    Math.max(
      0,
      Math.floor(
        Number(
          holder[
            config.maxField
          ]
        ) || 0
      )
    );

  const before =
    Math.min(
      max,
      Math.max(
        0,
        Math.floor(
          Number(
            holder[
              config.field
            ]
          ) || 0
        )
      )
    );


  const requested =
    change.mode === "set"
      ? Number(change.amount)
      : before +
        Number(change.amount);


  const after =
    Math.min(
      max,
      Math.max(
        0,
        Math.floor(
          requested
        )
      )
    );


  holder[
    config.field
  ] =
    after;


  return {
    ok: true,
    resource:
      normalizedResource,
    label:
      config.label,
    icon:
      config.icon,
    field:
      config.field,
    maxField:
      config.maxField,
    mode:
      change.mode,
    requestedAmount:
      Number(change.amount),
    before,
    after,
    max,
    deltaApplied:
      after - before,
    clamped:
      after !== requested
  };
}


export async function adminModifyProfileResource(
  env,
  user,
  resource,
  change
) {
  const targetUser =
    normalizeUser(
      user
    );


  if (!targetUser) {
    return {
      ok: false,
      error: "INVALID_USER"
    };
  }


  const profile =
    await getProfile(
      env,
      targetUser
    );


  if (
    !profile ||
    !profile.race
  ) {
    return {
      ok: false,
      error: "CHARACTER_NOT_FOUND",
      user: targetUser
    };
  }


  const result =
    applyAdminResourceChange(
      profile,
      resource,
      change
    );


  if (!result.ok) {
    return {
      ...result,
      user: targetUser
    };
  }


  if (
    result.resource ===
    "mentalidade"
  ) {
    profile.lastMentalidadeRegenAt =
      Date.now();
  }


  await saveProfile(
    env,
    targetUser,
    profile
  );


  return {
    ...result,
    user: targetUser,
    inBattle: false,
    source: "profile"
  };
}
