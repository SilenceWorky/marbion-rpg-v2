import {
  CHEST_TYPES,
  createChestInstance
} from "./chest-inventory.js";


export const ATOMIC_CHEST_MIN_ATOMS =
  1;

export const ATOMIC_CHEST_MAX_ATOMS =
  5;

export const ATOMIC_CHEST_MAX_FAILED_ATTEMPTS =
  2;


function normalizeInteger(
  value,
  fallback = null
) {
  const number =
    Math.floor(
      Number(value)
    );

  if (
    !Number.isFinite(number)
  ) {
    return fallback;
  }

  return number;
}


function normalizeScriptedSteps(
  value
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      step =>
        String(step ?? "")
          .trim()
          .toLowerCase()
    )
    .filter(
      step =>
        step === "nothing" ||
        step === "evolve" ||
        step === "open"
    );
}


export function createAtomicChestState(
  {
    currentAtoms = 1,
    maxAtoms = 5,
    minimumOpenAtoms = 1,
    attemptsAtLevel = 0,
    scriptedSteps = []
  } = {}
) {
  const current =
    normalizeInteger(
      currentAtoms
    );

  const maximum =
    normalizeInteger(
      maxAtoms
    );

  const minimumOpen =
    normalizeInteger(
      minimumOpenAtoms
    );

  const attempts =
    normalizeInteger(
      attemptsAtLevel
    );

  if (
    current === null ||
    current <
      ATOMIC_CHEST_MIN_ATOMS ||
    current >
      ATOMIC_CHEST_MAX_ATOMS
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_CURRENT_ATOMS"
    };
  }

  if (
    maximum === null ||
    maximum <
      ATOMIC_CHEST_MIN_ATOMS ||
    maximum >
      ATOMIC_CHEST_MAX_ATOMS
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_MAX_ATOMS"
    };
  }

  if (current > maximum) {
    return {
      ok: false,
      error:
        "ATOMIC_CURRENT_EXCEEDS_MAX"
    };
  }

  if (
    minimumOpen === null ||
    minimumOpen <
      ATOMIC_CHEST_MIN_ATOMS ||
    minimumOpen >
      maximum
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_MINIMUM_OPEN_ATOMS"
    };
  }

  if (
    attempts === null ||
    attempts < 0 ||
    attempts >
      ATOMIC_CHEST_MAX_FAILED_ATTEMPTS
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_ATTEMPTS"
    };
  }

  return {
    ok: true,
    state: {
      currentAtoms:
        current,

      maxAtoms:
        maximum,

      minimumOpenAtoms:
        minimumOpen,

      attemptsAtLevel:
        attempts,

      scriptedSteps:
        normalizeScriptedSteps(
          scriptedSteps
        ),

      scriptIndex: 0
    }
  };
}


export function normalizeAtomicChestState(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_STATE"
    };
  }

  const created =
    createAtomicChestState(
      value
    );

  if (!created.ok) {
    return created;
  }

  const rawScriptIndex =
    normalizeInteger(
      value.scriptIndex,
      0
    );

  if (
    rawScriptIndex < 0 ||
    rawScriptIndex >
      created.state.scriptedSteps.length
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_SCRIPT_INDEX"
    };
  }

  created.state.scriptIndex =
    rawScriptIndex;

  return created;
}


export function createAtomicChest(
  profile,
  {
    currentAtoms = 1,
    maxAtoms = 5,
    minimumOpenAtoms = 1,
    attemptsAtLevel = 0,
    scriptedSteps = [],
    metadata = {},
    createdAt = Date.now()
  } = {}
) {
  const atomic =
    createAtomicChestState({
      currentAtoms,
      maxAtoms,
      minimumOpenAtoms,
      attemptsAtLevel,
      scriptedSteps
    });

  if (!atomic.ok) {
    return atomic;
  }

  const chest =
    createChestInstance(
      profile,
      {
        type:
          CHEST_TYPES.ATOMIC,

        createdAt,

        metadata: {
          ...(
            metadata &&
            typeof metadata ===
              "object" &&
            !Array.isArray(metadata)
              ? structuredClone(
                  metadata
                )
              : {}
          ),

          atomic:
            atomic.state
        }
      }
    );

  if (!chest.ok) {
    return chest;
  }

  return {
    ok: true,
    chest:
      chest.chest,
    atomic:
      chest.chest.metadata.atomic
  };
}


export function getAtomicChestState(
  chest
) {
  if (
    !chest ||
    chest.type !==
      CHEST_TYPES.ATOMIC
  ) {
    return {
      ok: false,
      error:
        "NOT_ATOMIC_CHEST"
    };
  }

  const normalized =
    normalizeAtomicChestState(
      chest?.metadata?.atomic
    );

  if (!normalized.ok) {
    return normalized;
  }

  chest.metadata.atomic =
    normalized.state;

  return {
    ok: true,
    state:
      chest.metadata.atomic
  };
}
