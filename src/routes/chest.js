import {
  getProfile,
  saveProfile
} from "../core/database.js";

import {
  fetchJson
} from "../core/content.js";

import {
  SKILLS_URL
} from "../config/urls.js";

import {
  getChestGroups
} from "../systems/chest-inventory.js";

import {
  attemptChestOpen
} from "../systems/chest-open-service.js";

import {
  applyResolvedAtomicChestRewards
} from "../systems/atomic-chest-reward-apply.js";

import {
  resolveAtomicChestAbilityRewards
} from "../systems/atomic-chest-ability-resolver.js";

import {
  resolveAtomicChestBonusRewards
} from "../systems/atomic-chest-bonus-resolver.js";

import {
  resolveAtomicChestConsumableRewards
} from "../systems/atomic-chest-consumable-resolver.js";

import {
  resolveAtomicChestScrollRewards
} from "../systems/atomic-chest-scroll-resolver.js";

import {
  finalizeAtomicChestOpen
} from "../systems/atomic-chest-finalizer.js";

import {
  resolveSeasonalChestSkillRewards
} from "../systems/seasonal-chest-skill-resolver.js";

import {
  resolveSeasonalChestConsumableRewards
} from "../systems/seasonal-chest-consumable-resolver.js";

import {
  resolveSeasonalChestPvpFinisherRewards
} from "../systems/seasonal-chest-pvp-finisher-resolver.js";

import {
  applyResolvedSeasonalChestRewards
} from "../systems/seasonal-chest-reward-apply.js";


const CHESTS_PER_PAGE =
  5;


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


function parsePage(
  rawArgs
) {
  const args =
    String(rawArgs ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (args.length === 0) {
    return {
      ok: true,
      page: 1
    };
  }

  let rawPage =
    args[0];

  if (
    normalizeCommand(
      args[0]
    ) === "pagina"
  ) {
    rawPage =
      args[1];

    if (
      args.length !== 2
    ) {
      return {
        ok: false
      };
    }
  }
  else if (
    args.length !== 1
  ) {
    return {
      ok: false
    };
  }

  const page =
    Number(
      rawPage
    );

  if (
    !Number.isSafeInteger(page) ||
    page <= 0
  ) {
    return {
      ok: false
    };
  }

  return {
    ok: true,
    page
  };
}




function getGlobalPvpCoordinator(
  env
) {
  const namespace =
    env?.PVP_COORDINATOR;

  if (
    !namespace ||
    typeof namespace.idFromName !==
      "function" ||
    typeof namespace.get !==
      "function"
  ) {
    return null;
  }

  const id =
    namespace.idFromName(
      "marbion-global-pvp"
    );

  return namespace.get(id);
}


function parseMonthlySeasonId(
  value
) {
  const match =
    String(value ?? "")
      .trim()
      .match(
        /^(\d{4})-(0[1-9]|1[0-2])$/
      );

  if (!match) {
    return null;
  }

  return {
    year:
      Number(match[1]),
    month:
      Number(match[2])
  };
}


async function readSeasonContentRevision(
  env,
  pendingOpen
) {
  const parts =
    parseMonthlySeasonId(
      pendingOpen?.seasonId
    );

  const revision =
    Number(
      pendingOpen?.poolRevision
    );

  if (
    !parts ||
    !Number.isSafeInteger(
      revision
    ) ||
    revision <= 0
  ) {
    return {
      ok: false,
      error:
        "INVALID_SEASONAL_CHEST_REVISION"
    };
  }

  const coordinator =
    getGlobalPvpCoordinator(
      env
    );

  if (!coordinator) {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }

  try {
    const response =
      await coordinator.fetch(
        new Request(
          "https://pvp.internal" +
          "/season/content/revision" +
          `?year=${parts.year}` +
          `&month=${parts.month}` +
          `&revision=${revision}`
        )
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      result?.ok !== true ||
      !result.content
    ) {
      return {
        ok: false,
        error:
          result?.error ??
          "SEASON_CONTENT_REVISION_READ_FAILED"
      };
    }

    return {
      ok: true,
      content:
        result.content
    };
  }
  catch {
    return {
      ok: false,
      error:
        "PVP_COORDINATOR_UNAVAILABLE"
    };
  }
}


function formatAtomicAtoms(
  atoms
) {
  const count =
    Math.max(
      1,
      Math.floor(
        Number(atoms) || 1
      )
    );

  return "⚛".repeat(
    count
  );
}


async function handleOpenCommand(
  env,
  user,
  profile,
  args
) {
  if (
    args.length !== 2
  ) {
    return new Response(
      `@${user}, uso: !baú abrir <número>`
    );
  }

  const selection =
    Number(
      args[1]
    );

  if (
    !Number.isSafeInteger(
      selection
    ) ||
    selection <= 0
  ) {
    return new Response(
      `@${user}, informe um número de baú válido. Ex.: !baú abrir 1`
    );
  }

  const result =
    attemptChestOpen(
      profile,
      selection
    );

  if (!result.ok) {
    if (
      result.error ===
        "CHEST_GROUP_NOT_FOUND"
    ) {
      return new Response(
        `@${user}, esse número de baú não existe na sua lista.`
      );
    }

    if (
      result.error ===
        "CHEST_OPEN_NOT_IMPLEMENTED"
    ) {
      return new Response(
        `@${user}, a abertura desse tipo de baú ainda não está implementada.`
      );
    }

    if (
      [
        "SEASONAL_CHEST_IDENTITY_REQUIRED",
        "SEASONAL_CHEST_SEASON_NOT_BOUND",
        "INVALID_SEASONAL_CHEST_IDENTITY"
      ].includes(
        result.error
      )
    ) {
      return new Response(
        `@${user}, esse Baú Sazonal é antigo e não possui identidade histórica completa para uma abertura segura.`
      );
    }

    return new Response(
      `@${user}, não foi possível tentar abrir esse baú.`
    );
  }

  if (
    result.action === "open" &&
    result.pending &&
    result.chestType === "seasonal"
  ) {
    const pendingOpen =
      result.pendingOpen;

    const needsSeasonContent =
      pendingOpen.rewardPlan.rewards
        .some(
          reward =>
            [
              "seasonal_skill",
              "seasonal_consumable",
              "seasonal_pvp_finisher"
            ].includes(
              reward?.type
            ) &&
            reward?.resolved !==
              true
        );

    if (needsSeasonContent) {
      const revisionResult =
        await readSeasonContentRevision(
          env,
          pendingOpen
        );

      if (!revisionResult.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas o catálogo histórico desse Baú Sazonal não pôde ser carregado agora. Tente novamente para concluir a recompensa.`
        );
      }

      const resolvedSkill =
        resolveSeasonalChestSkillRewards(
          profile,
          pendingOpen,
          revisionResult.content
        );

      if (!resolvedSkill.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas a habilidade temática do Baú Sazonal ainda não pôde ser resolvida.`
        );
      }

      const resolvedConsumable =
        resolveSeasonalChestConsumableRewards(
          pendingOpen,
          revisionResult.content
        );

      if (!resolvedConsumable.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas o Consumível Sazonal ainda não pôde ser resolvido.`
        );
      }

      const resolvedPvpFinisher =
        resolveSeasonalChestPvpFinisherRewards(
          profile,
          pendingOpen,
          revisionResult.content
        );

      if (!resolvedPvpFinisher.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas o Finalizador de PvP Sazonal ainda não pôde ser resolvido.`
        );
      }
    }

    const applied =
      applyResolvedSeasonalChestRewards(
        profile,
        result.chestId
      );

    if (!applied.ok) {
      await saveProfile(
        env,
        user,
        profile
      );

      return new Response(
        `@${user}, a abertura foi registrada, mas as recompensas já resolvidas do Baú Sazonal ainda não puderam ser aplicadas.`
      );
    }

    await saveProfile(
      env,
      user,
      profile
    );

    const chestName =
      String(
        pendingOpen?.nameSnapshot ??
        "Baú Sazonal"
      ).trim() ||
      "Baú Sazonal";

    return new Response(
      `📦 @${user}, ${chestName} teve a abertura registrada. O plano foi congelado e as recompensas sazonais já resolvidas foram aplicadas com segurança.`
    );
  }

  if (
    result.action === "open" &&
    result.pending
  ) {
    const pendingOpen =
      result.pendingOpen;

    const resolvedBonuses =
      resolveAtomicChestBonusRewards(
        pendingOpen
      );

    if (!resolvedBonuses.ok) {
      await saveProfile(
        env,
        user,
        profile
      );

      return new Response(
        `@${user}, a abertura foi registrada, mas ainda não foi possível resolver um bônus pendente.`
      );
    }

    const resolvedConsumables =
      resolveAtomicChestConsumableRewards(
        pendingOpen
      );

    if (!resolvedConsumables.ok) {
      await saveProfile(
        env,
        user,
        profile
      );

      return new Response(
        `@${user}, a abertura foi registrada, mas ainda não foi possível resolver um consumível pendente.`
      );
    }

    const needsSkillCatalog =
      pendingOpen.rewardPlan.rewards
        .some(
          reward =>
            (
              reward?.type ===
                "scroll" ||
              reward?.type ===
                "new_elemental_ability"
            ) &&
            reward?.resolved !==
              true
        );

    if (needsSkillCatalog) {
      let skillsData;

      try {
        skillsData =
          await fetchJson(
            SKILLS_URL
          );
      }
      catch {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas o catálogo de habilidades não pôde ser carregado agora. Tente novamente para concluir as recompensas pendentes.`
        );
      }

      const resolvedAbilities =
        resolveAtomicChestAbilityRewards(
          profile,
          pendingOpen,
          skillsData
        );

      if (!resolvedAbilities.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas ainda não foi possível resolver a habilidade garantida.`
        );
      }

      const resolvedScrolls =
        resolveAtomicChestScrollRewards(
          profile,
          pendingOpen,
          skillsData
        );

      if (!resolvedScrolls.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, a abertura foi registrada, mas ainda não foi possível resolver um Pergaminho pendente.`
        );
      }
    }

    const applied =
      applyResolvedAtomicChestRewards(
        profile,
        result.chestId
      );

    if (!applied.ok) {
      await saveProfile(
        env,
        user,
        profile
      );

      return new Response(
        `@${user}, a abertura foi registrada, mas não foi possível aplicar as recompensas resolvidas agora.`
      );
    }

    let finalized =
      false;

    if (
      applied.fullyResolved &&
      applied.appliedRewardIndexes
        .length ===
        pendingOpen.rewardPlan
          .rewards.length
    ) {
      const finalization =
        finalizeAtomicChestOpen(
          profile,
          result.chestId
        );

      if (!finalization.ok) {
        await saveProfile(
          env,
          user,
          profile
        );

        return new Response(
          `@${user}, as recompensas foram aplicadas, mas o Baú Atômico ainda não pôde ser finalizado com segurança.`
        );
      }

      finalized = true;
    }

    await saveProfile(
      env,
      user,
      profile
    );

    if (finalized) {
      return new Response(
        `📦 @${user}, o Baú Atômico ${formatAtomicAtoms(result.currentAtoms)} abriu! Todas as recompensas foram aplicadas e o baú foi consumido.`
      );
    }

    return new Response(
      `📦 @${user}, o Baú Atômico ${formatAtomicAtoms(result.currentAtoms)} abriu! As recompensas disponíveis foram aplicadas; ainda existem recompensas pendentes de resolução.`
    );
  }

  /*
   * Tentativas sem resultado e evoluções alteram o estado
   * interno do baú e também precisam ser persistidas.
   */
  await saveProfile(
    env,
    user,
    profile
  );

  if (
    result.action === "nothing"
  ) {
    return new Response(
      `📦 @${user}, o Baú Atômico ${formatAtomicAtoms(result.currentAtoms)} não abriu nem evoluiu nesta tentativa. Tentativa ${result.attemptNumber}/3.`
    );
  }

  if (
    result.action === "evolve"
  ) {
    return new Response(
      `⚛️ @${user}, seu Baú Atômico evoluiu de ${formatAtomicAtoms(result.fromAtoms)} para ${formatAtomicAtoms(result.currentAtoms)}.`
    );
  }

  return new Response(
    `@${user}, resultado de abertura não reconhecido.`
  );
}


function formatChestGroup(
  group,
  number
) {
  const atomicMarker =
    group.type === "atomic"
      ? " ⚛"
      : "";

  return (
    `${number}. ${group.label}${atomicMarker} ×${group.quantity}`
  );
}


export async function chestRoute(
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

  const args =
    rawArgs
      .split(/\s+/)
      .filter(Boolean);

  if (
    args.length > 0 &&
    normalizeCommand(
      args[0]
    ) === "abrir"
  ) {
    return handleOpenCommand(
      env,
      user,
      profile,
      args
    );
  }

  const parsedPage =
    parsePage(
      rawArgs
    );

  if (!parsedPage.ok) {
    return new Response(
      `@${user}, uso: !baú | !baú página 2 | !baú abrir <número>`
    );
  }

  const result =
    getChestGroups(
      profile
    );

  if (!result.ok) {
    return new Response(
      `@${user}, não foi possível consultar seus baús.`
    );
  }

  if (
    result.groups.length === 0
  ) {
    return new Response(
      `📦 @${user}, você não possui baús.`
    );
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        result.groups.length /
        CHESTS_PER_PAGE
      )
    );

  if (
    parsedPage.page >
      totalPages
  ) {
    return new Response(
      `@${user}, página inexistente. Seus baús possuem ${totalPages} página(s).`
    );
  }

  const start =
    (
      parsedPage.page - 1
    ) *
    CHESTS_PER_PAGE;

  const pageGroups =
    result.groups.slice(
      start,
      start +
      CHESTS_PER_PAGE
    );

  const entries =
    pageGroups.map(
      (group, index) =>
        formatChestGroup(
          group,
          start + index + 1
        )
    );

  return new Response(
    `📦 Baús de @${user} ┃ ${entries.join(" ┃ ")} ┃ Página ${parsedPage.page}/${totalPages}`
  );
}
