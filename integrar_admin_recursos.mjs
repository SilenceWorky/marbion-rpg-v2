import fs from "node:fs";


function replaceOnce(
  text,
  search,
  replacement,
  label
) {
  if (
    text.includes(
      replacement
    )
  ) {
    console.log(
      `↪ ${label}: já integrado.`
    );
    return text;
  }


  const index =
    text.indexOf(
      search
    );


  if (index < 0) {
    throw new Error(
      `Não encontrei o ponto de integração: ${label}`
    );
  }


  console.log(
    `✅ ${label}`
  );


  return (
    text.slice(0, index) +
    replacement +
    text.slice(
      index + search.length
    )
  );
}


const adminPath =
  "src/routes/admin.js";

let admin =
  fs.readFileSync(
    adminPath,
    "utf8"
  );


admin = replaceOnce(
  admin,
`import {
  adminSetLevel,
  adminSetRace,
  adminSetElements,
  adminAddStatusPoints,
  adminResetStatus,
  adminSkill
} from "../systems/admin.js";
`,
`import {
  adminSetLevel,
  adminSetRace,
  adminSetElements,
  adminAddStatusPoints,
  adminResetStatus,
  adminSkill
} from "../systems/admin.js";

import {
  adminModifyProfileResource,
  parseAdminResourceChange
} from "../systems/admin-resources.js";
`,
  "Admin importa motor de HP/Mentalidade"
);


admin = replaceOnce(
  admin,
`      \`@\${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp ...\`
`,
`      \`@\${actor}, uso: !adm level/raça/elemento/status/pontos/skill/pvp/hp/mentalidade ...\`
`,
  "Ajuda ADM lista HP e Mentalidade"
);


const statusAnchor =
`  /*
   * ==========================
   * STATUS RESET
`;


const resourceBlock =
`  /*
   * ==========================
   * HP / MENTALIDADE
   * ==========================
   *
   * SET absoluto:
   * !adm hp @user 5
   * !adm mentalidade @user 20
   *
   * Ajuste relativo:
   * !adm hp @user +5
   * !adm hp @user -5
   * !adm hp @user + 5
   * !adm hp @user - 5
   * !adm mentalidade @user mais 10
   * !adm mentalidade @user menos 10
   */
  if (
    command === "hp" ||
    command === "mentalidade" ||
    command === "mental"
  ) {
    const target =
      args[1];

    const resource =
      command === "hp"
        ? "hp"
        : "mentalidade";

    const change =
      parseAdminResourceChange(
        args.slice(2)
      );


    if (
      !target ||
      !change.ok
    ) {
      const resourceName =
        resource === "hp"
          ? "hp"
          : "mentalidade";


      return new Response(
        \`@\${actor}, uso: !adm \${resourceName} @usuário 5 | +5 | -5 | + 5 | - 5\`
      );
    }


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
      normalizeUser(target)
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


    const battleResponse =
      await coordinator.fetch(
        new Request(
          internalUrl.toString()
        )
      );

    const battleResult =
      await battleResponse.json();


    if (!battleResult.ok) {
      return new Response(
        \`@\${actor}, não foi possível alterar \${resource === "hp" ? "o HP" : "a Mentalidade"}.\`
      );
    }


    let result =
      battleResult;


    if (!battleResult.inBattle) {
      result =
        await adminModifyProfileResource(
          env,
          target,
          resource,
          change
        );
    }


    if (!result.ok) {
      if (
        result.error ===
        "CHARACTER_NOT_FOUND"
      ) {
        return new Response(
          \`@\${actor}, @\${normalizeUser(target)} ainda não possui personagem.\`
        );
      }


      return new Response(
        \`@\${actor}, não foi possível alterar \${resource === "hp" ? "o HP" : "a Mentalidade"}.\`
      );
    }


    const operationText =
      result.mode === "set"
        ? \`SET \${result.requestedAmount}\`
        : result.requestedAmount >= 0
          ? \`+\${result.requestedAmount}\`
          : String(
              result.requestedAmount
            );

    const scopeText =
      result.inBattle
        ? "PvP"
        : "perfil";

    const clampText =
      result.clamped
        ? " | limitado ao intervalo válido"
        : "";


    return new Response(
      \`🛠️ ADM | @\${result.user} | \${result.icon} \${result.label}: \${result.before} → \${result.after}/\${result.max} | \${operationText} | \${scopeText}\${clampText}.\`
    );
  }


`;


admin = replaceOnce(
  admin,
  statusAnchor,
  resourceBlock +
    statusAnchor,
  "Adiciona comandos !adm hp e !adm mentalidade"
);


fs.writeFileSync(
  adminPath,
  admin
);


const pvpPath =
  "src/durable/PvpCoordinator.js";

let pvp =
  fs.readFileSync(
    pvpPath,
    "utf8"
  );


pvp = replaceOnce(
  pvp,
`import {
  resolveElementalCombo
} from "../systems/elemental-combos.js";
`,
`import {
  resolveElementalCombo
} from "../systems/elemental-combos.js";

import {
  applyAdminResourceChange,
  createAdminResourceChange
} from "../systems/admin-resources.js";
`,
  "PvP importa motor ADM de recursos"
);


const playerStateAnchor =
`  async getPlayerState(
    user
  ) {
`;


const battleResourceMethod =
`  async adminModifyBattleResource(
    user,
    resource,
    mode,
    amount
  ) {
    user =
      normalizeUser(
        user
      );


    if (!user) {
      return {
        ok: false,
        error: "INVALID_USER"
      };
    }


    const change =
      createAdminResourceChange(
        mode,
        amount
      );


    if (!change.ok) {
      return change;
    }


    const data =
      await this.getData();

    const battle =
      this.findBattleByUser(
        data,
        user
      );


    if (!battle) {
      return {
        ok: true,
        inBattle: false,
        user
      };
    }


    const player =
      battle.player1.user === user
        ? battle.player1
        : battle.player2;


    const result =
      applyAdminResourceChange(
        player,
        resource,
        change
      );


    if (!result.ok) {
      return {
        ...result,
        user
      };
    }


    await this.saveData(
      data
    );


    return {
      ...result,
      user,
      inBattle: true,
      source: "battle"
    };
  }


`;


pvp = replaceOnce(
  pvp,
  playerStateAnchor,
  battleResourceMethod +
    playerStateAnchor,
  "PvP permite alterar HP/Mentalidade vivos"
);


const finishRouteAnchor =
`    if (
      url.pathname ===
      "/admin-finish"
    ) {
`;


const resourceRoute =
`    if (
      url.pathname ===
      "/admin-resource"
    ) {
      const result =
        await this.adminModifyBattleResource(
          url.searchParams.get(
            "user"
          ),
          url.searchParams.get(
            "resource"
          ),
          url.searchParams.get(
            "mode"
          ),
          url.searchParams.get(
            "amount"
          )
        );


      return Response.json(
        result
      );
    }


`;


pvp = replaceOnce(
  pvp,
  finishRouteAnchor,
  resourceRoute +
    finishRouteAnchor,
  "Durable Object expõe rota interna /admin-resource"
);


fs.writeFileSync(
  pvpPath,
  pvp
);


console.log(
  "\n🛠️ Integração ADM de HP/Mentalidade aplicada."
);
