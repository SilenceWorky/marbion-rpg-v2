import {
  getAtomicChestState
} from "./atomic-chest-state.js";


export const ATOMIC_CHEST_NO_RESULT_CHANCE =
  0.35;


export const ATOMIC_CHEST_EVOLUTION_CHANCES =
  Object.freeze({
    1: 0.50,
    2: 0.25,
    3: 0.10,
    4: 0.01,
    5: 0
  });


function readRandom(
  random
) {
  let value;

  try {
    value =
      Number(
        random()
      );
  }
  catch {
    return {
      ok: false,
      error:
        "ATOMIC_RANDOM_FAILED"
    };
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_RANDOM"
    };
  }

  return {
    ok: true,
    value
  };
}


function applyNothing(
  state,
  {
    attemptNumber,
    scripted
  }
) {
  state.attemptsAtLevel =
    attemptNumber;

  return {
    ok: true,
    action:
      "nothing",
    attemptNumber,
    scripted,
    currentAtoms:
      state.currentAtoms,
    opened: false,
    evolved: false
  };
}


function applyEvolution(
  state,
  {
    attemptNumber,
    scripted,
    forced = false
  }
) {
  const fromAtoms =
    state.currentAtoms;

  state.currentAtoms += 1;
  state.attemptsAtLevel = 0;

  return {
    ok: true,
    action:
      "evolve",
    attemptNumber,
    scripted,
    forced,
    fromAtoms,
    currentAtoms:
      state.currentAtoms,
    opened: false,
    evolved: true
  };
}


function applyOpen(
  state,
  {
    attemptNumber,
    scripted
  }
) {
  return {
    ok: true,
    action:
      "open",
    attemptNumber,
    scripted,
    currentAtoms:
      state.currentAtoms,
    opened: true,
    evolved: false
  };
}


function resolveGuaranteedAction(
  state,
  {
    attemptNumber,
    scripted,
    random
  }
) {
  /*
   * Um baú com bloqueio interno nunca pode abrir abaixo
   * de minimumOpenAtoms. Quando uma tentativa precisa
   * produzir resultado, ele evolui obrigatoriamente até
   * alcançar esse piso.
   */
  if (
    state.currentAtoms <
      state.minimumOpenAtoms
  ) {
    return applyEvolution(
      state,
      {
        attemptNumber,
        scripted,
        forced: true
      }
    );
  }

  if (
    state.currentAtoms >=
      state.maxAtoms
  ) {
    return applyOpen(
      state,
      {
        attemptNumber,
        scripted
      }
    );
  }

  const roll =
    readRandom(
      random
    );

  if (!roll.ok) {
    return roll;
  }

  const evolutionChance =
    ATOMIC_CHEST_EVOLUTION_CHANCES[
      state.currentAtoms
    ] ?? 0;

  if (
    roll.value <
      evolutionChance
  ) {
    return applyEvolution(
      state,
      {
        attemptNumber,
        scripted,
        forced: false
      }
    );
  }

  return applyOpen(
    state,
    {
      attemptNumber,
      scripted
    }
  );
}


function resolveScriptedStep(
  state,
  {
    attemptNumber,
    random
  }
) {
  if (
    state.scriptIndex >=
      state.scriptedSteps.length
  ) {
    return null;
  }

  const step =
    state.scriptedSteps[
      state.scriptIndex
    ];

  /*
   * O passo só é consumido quando ele realmente pode
   * ser aplicado. Um script inválido não deve avançar
   * silenciosamente e corromper a sequência escondida.
   */
  if (
    step === "nothing" &&
    attemptNumber >= 3
  ) {
    return {
      ok: false,
      error:
        "ATOMIC_SCRIPT_THIRD_ATTEMPT_CANNOT_FAIL"
    };
  }

  if (
    step === "open" &&
    state.currentAtoms <
      state.minimumOpenAtoms
  ) {
    return {
      ok: false,
      error:
        "ATOMIC_SCRIPT_OPEN_BELOW_MINIMUM"
    };
  }

  state.scriptIndex += 1;

  if (step === "nothing") {
    return applyNothing(
      state,
      {
        attemptNumber,
        scripted: true
      }
    );
  }

  if (step === "evolve") {
    if (
      state.currentAtoms >=
        state.maxAtoms
    ) {
      return {
        ok: false,
        error:
          "ATOMIC_SCRIPT_EVOLVE_AT_MAX"
      };
    }

    return applyEvolution(
      state,
      {
        attemptNumber,
        scripted: true,
        forced: true
      }
    );
  }

  if (step === "open") {
    return applyOpen(
      state,
      {
        attemptNumber,
        scripted: true
      }
    );
  }

  return resolveGuaranteedAction(
    state,
    {
      attemptNumber,
      scripted: true,
      random
    }
  );
}


export function resolveAtomicChestAttempt(
  chest,
  {
    random = Math.random
  } = {}
) {
  if (
    typeof random !==
      "function"
  ) {
    return {
      ok: false,
      error:
        "INVALID_ATOMIC_RANDOM_SOURCE"
    };
  }

  const atomic =
    getAtomicChestState(
      chest
    );

  if (!atomic.ok) {
    return atomic;
  }

  const state =
    atomic.state;

  const attemptNumber =
    state.attemptsAtLevel + 1;

  const scripted =
    resolveScriptedStep(
      state,
      {
        attemptNumber,
        random
      }
    );

  if (scripted) {
    return scripted;
  }

  /*
   * Nas duas primeiras tentativas de um mesmo nível,
   * 35% resulta em "nada". A terceira não passa por
   * essa rolagem e obrigatoriamente abre ou evolui.
   */
  if (attemptNumber <= 2) {
    const noResultRoll =
      readRandom(
        random
      );

    if (!noResultRoll.ok) {
      return noResultRoll;
    }

    if (
      noResultRoll.value <
        ATOMIC_CHEST_NO_RESULT_CHANCE
    ) {
      return applyNothing(
        state,
        {
          attemptNumber,
          scripted: false
        }
      );
    }
  }

  return resolveGuaranteedAction(
    state,
    {
      attemptNumber,
      scripted: false,
      random
    }
  );
}
