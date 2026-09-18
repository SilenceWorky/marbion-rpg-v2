function ensureInventory(
  profile
) {
  if (
    !profile ||
    typeof profile !== "object" ||
    Array.isArray(profile)
  ) {
    return {
      ok: false,
      error:
        "INVALID_PROFILE"
    };
  }

  if (
    !profile.inventory ||
    typeof profile.inventory !== "object" ||
    Array.isArray(
      profile.inventory
    )
  ) {
    profile.inventory = {};
  }

  if (
    !Array.isArray(
      profile.inventory.scrolls
    )
  ) {
    profile.inventory.scrolls = [];
  }

  if (
    !Number.isSafeInteger(
      profile.inventory.scrollSequence
    ) ||
    profile.inventory.scrollSequence < 0
  ) {
    profile.inventory.scrollSequence = 0;
  }

  return {
    ok: true,
    scrolls:
      profile.inventory.scrolls
  };
}


function normalizeTier(
  value
) {
  const tier =
    String(value ?? "")
      .trim()
      .toUpperCase();

  return (
    tier === "R1" ||
    tier === "R2" ||
    tier === "R3" ||
    tier === "R4" ||
    tier === "R5"
  )
    ? tier
    : null;
}


export function addScrollToInventory(
  profile,
  {
    tier,
    skill,
    source = "unknown",
    createdAt = Date.now()
  } = {}
) {
  const state =
    ensureInventory(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const normalizedTier =
    normalizeTier(
      tier
    );

  if (!normalizedTier) {
    return {
      ok: false,
      error:
        "INVALID_SCROLL_TIER"
    };
  }

  if (
    !skill ||
    typeof skill !== "object" ||
    Array.isArray(skill) ||
    !String(
      skill.id ?? ""
    ).trim()
  ) {
    return {
      ok: false,
      error:
        "INVALID_SCROLL_SKILL"
    };
  }

  if (
    profile.inventory
      .scrollSequence >=
      Number.MAX_SAFE_INTEGER
  ) {
    return {
      ok: false,
      error:
        "SCROLL_SEQUENCE_OVERFLOW"
    };
  }

  profile.inventory
    .scrollSequence += 1;

  const scroll = {
    id:
      `scroll:${profile.inventory.scrollSequence}`,
    tier:
      normalizedTier,
    skill: {
      id:
        String(skill.id),
      group:
        skill.group ?? null,
      key:
        skill.key ?? null,
      nome:
        skill.nome ?? null,
      elemento:
        skill.elemento ?? null,
      raridade:
        skill.raridade ?? null
    },
    source:
      String(source ?? "unknown"),
    createdAt:
      Math.max(
        0,
        Math.floor(
          Number(createdAt) ||
          Date.now()
        )
      )
  };

  profile.inventory.scrolls.push(
    scroll
  );

  return {
    ok: true,
    scroll
  };
}


export function getScrollInventory(
  profile
) {
  const state =
    ensureInventory(
      profile
    );

  if (!state.ok) {
    return state;
  }

  return {
    ok: true,
    scrolls:
      state.scrolls
  };
}


export function getScrollById(
  profile,
  scrollId
) {
  const state =
    ensureInventory(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const id =
    String(scrollId ?? "")
      .trim();

  const scroll =
    state.scrolls.find(
      entry =>
        entry?.id === id
    ) || null;

  return scroll
    ? {
        ok: true,
        scroll
      }
    : {
        ok: false,
        error:
          "SCROLL_NOT_FOUND"
      };
}


export function removeScrollById(
  profile,
  scrollId
) {
  const state =
    ensureInventory(
      profile
    );

  if (!state.ok) {
    return state;
  }

  const id =
    String(scrollId ?? "")
      .trim();

  const index =
    state.scrolls.findIndex(
      entry =>
        entry?.id === id
    );

  if (index < 0) {
    return {
      ok: false,
      error:
        "SCROLL_NOT_FOUND"
    };
  }

  const [removed] =
    state.scrolls.splice(
      index,
      1
    );

  return {
    ok: true,
    scroll:
      removed
  };
}
