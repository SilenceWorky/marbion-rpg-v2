import {
  getProfile
} from "../core/database.js";


function normalizeUser(
  value
) {
  return String(
    value ?? ""
  )
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}


function getCoordinator(
  env
) {
  const id =
    env.PVP_COORDINATOR.idFromName(
      "marbion-global-pvp"
    );


  return env.PVP_COORDINATOR.get(
    id
  );
}


const STAT_LABELS = {
  strength: "Força",
  magicStrength: "Magia",
  speed: "Velocidade",
  evasion: "Evasão",
  accuracy: "Precisão",
  defense: "Defesa"
};


function formatBattleEffect(
  effect,
  turn
) {
  if (!effect) {
    return null;
  }


  if (
    typeof effect ===
    "string"
  ) {
    return effect;
  }


  const type =
    String(
      effect.type ??
      effect.tipo ??
      ""
    ).toLowerCase();


  const name =
    effect.name ??
    effect.nome ??
    effect.source ??
    effect.fonte ??
    null;


  let text =
    name ||
    type ||
    "Efeito";


  /*
   * Buff/debuff de atributo.
   */
  if (
    effect.stat &&
    Number.isFinite(
      Number(
        effect.amount
      )
    )
  ) {
    const statName =
      STAT_LABELS[
        effect.stat
      ] ||
      effect.stat;


    const amount =
      Number(
        effect.amount
      );

  let displayedAmount =
    amount;


  if (
    type === "debuff"
  ) {
    displayedAmount =
      -Math.abs(
        amount
      );
  }

  else if (
    type === "buff"
  ) {
    displayedAmount =
      Math.abs(
        amount
      );
  }


  const signal =
    displayedAmount >= 0
      ? "+"
      : "";


  text =
    `${statName} ${signal}${displayedAmount}`;
  
  }


  /*
   * Identificação visual.
   */
  if (
    type === "buff"
  ) {
    text =
      `⬆️ ${text}`;
  }

  else if (
    type === "debuff"
  ) {
    text =
      `⬇️ ${text}`;
  }

  else if (
    type === "poison" ||
    type === "veneno"
  ) {
    text =
      `☠️ ${text}`;
  }

  else if (
    type === "paralysis" ||
    type === "paralisia"
  ) {
    text =
      `⚡ ${text}`;
  }


  /*
   * Turnos restantes.
   */
  if (
    Number.isFinite(
      Number(
        effect.expiresAtTurn
      )
    )
  ) {
    const remaining =
      Math.max(
        0,
        Number(
          effect.expiresAtTurn
        ) -
        Number(
          turn
        )
      );


    text +=
      ` (${remaining}T)`;
  }


  return text;
}


function formatPersistentEffects(
  statusEffects
) {
  if (!statusEffects) {
    return [];
  }


  /*
   * Compatibilidade caso no futuro
   * statusEffects vire array.
   */
  if (
    Array.isArray(
      statusEffects
    )
  ) {
    return statusEffects
      .map(
        effect => {
          if (
            typeof effect ===
            "string"
          ) {
            return effect;
          }


          return (
            effect?.name ??
            effect?.nome ??
            effect?.label ??
            effect?.tipo ??
            effect?.type ??
            null
          );
        }
      )
      .filter(Boolean);
  }


  if (
    typeof statusEffects !==
    "object"
  ) {
    return [];
  }


  const result = [];


  for (
    const [key, value]
    of Object.entries(
      statusEffects
    )
  ) {
    if (
      value === false ||
      value === null ||
      value === undefined
    ) {
      continue;
    }


    if (
      value === true
    ) {
      result.push(
        key
      );

      continue;
    }


    if (
      typeof value ===
      "string"
    ) {
      result.push(
        value
      );

      continue;
    }


    if (
      typeof value ===
      "object"
    ) {
      result.push(
        value.name ??
        value.nome ??
        value.label ??
        key
      );
    }
  }


  return result;
}


export async function estadoRoute(
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


  /*
   * Consulta o estado da batalha.
   */
  const coordinator =
    getCoordinator(
      env
    );


  const internalUrl =
    new URL(
      "https://pvp.internal/player-state"
    );


  internalUrl.searchParams.set(
    "user",
    user
  );


  const response =
    await coordinator.fetch(
      new Request(
        internalUrl.toString()
      )
    );


  const battleState =
    await response.json();


  /*
   * Efeitos persistentes:
   * poções, sorte, maldições etc.
   */
  const persistentEffects =
    formatPersistentEffects(
      profile.statusEffects
    );


  /*
   * Fora do PvP.
   */
  if (
    !battleState.ok ||
    !battleState.inBattle
  ) {
    const effects =
      persistentEffects.length
        ? persistentEffects.join(", ")
        : "Nenhum";


    return new Response(
      `@${user} | ` +
      `❤️ HP: ${profile.hp}/${profile.maxHp} | ` +
      `🧠 Mentalidade: ${profile.mentalidade}/${profile.maxMentalidade} | ` +
      `Efeitos: ${effects}`
    );
  }


  /*
   * Dentro do PvP:
   * usa HP e Mentalidade reais
   * armazenados no Durable Object.
   */
  const battleEffects =
    (
      battleState.effects || []
    )
      .map(
        effect =>
          formatBattleEffect(
            effect,
            battleState.turn
          )
      )
      .filter(Boolean);


  const allEffects = [
    ...persistentEffects,
    ...battleEffects
  ];


  const effects =
    allEffects.length
      ? allEffects.join(", ")
      : "Nenhum";


  return new Response(
    `@${user} | ` +
    `⚔️ PvP T${battleState.turn} vs @${battleState.opponent} | ` +
    `❤️ HP: ${battleState.hp}/${battleState.maxHp} | ` +
    `🧠 Mentalidade: ${battleState.mentalidade}/${battleState.maxMentalidade} | ` +
    `Efeitos: ${effects}`
  );
}