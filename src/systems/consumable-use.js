import {
  getConsumableDefinition
} from "./consumable-catalog.js";

import {
  getConsumableById,
  removeConsumableById
} from "./consumable-inventory.js";


function getResourceFields(
  definition
) {
  if (definition.resource === "hp") {
    return {
      current: "hp",
      maximum: "maxHp"
    };
  }

  if (
    definition.resource ===
      "mentalidade"
  ) {
    return {
      current: "mentalidade",
      maximum: "maxMentalidade"
    };
  }

  return null;
}

export function useConsumable(
  profile,
  consumableId,
  {
    inCombat = false
  } = {}
) {
  const found =
    getConsumableById(
      profile,
      consumableId
    );

  if (!found.ok) {
    return found;
  }

  const definitionResult =
    getConsumableDefinition(
      found.consumable.key
    );

  if (!definitionResult.ok) {
    return definitionResult;
  }

  const definition =
    definitionResult.consumable;

  if (
    inCombat &&
    definition.usableInCombat !== true
  ) {
    return {
      ok: false,
      error:
        "CONSUMABLE_NOT_USABLE_IN_COMBAT"
    };
  }

  if (
    !inCombat &&
    definition.usableOutOfCombat !== true
  ) {
    return {
      ok: false,
      error:
        "CONSUMABLE_NOT_USABLE_OUT_OF_COMBAT"
    };
  }

  const fields =
    getResourceFields(
      definition
    );

  if (!fields) {
    return {
      ok: false,
      error:
        "UNSUPPORTED_CONSUMABLE_EFFECT"
    };
  }

  const maximum =
    Number(
      profile?.[
        fields.maximum
      ]
    );

  const current =
    Number(
      profile?.[
        fields.current
      ]
    );

  if (
    !Number.isFinite(maximum) ||
    maximum <= 0 ||
    !Number.isFinite(current)
  ) {
    return {
      ok: false,
      error:
        "INVALID_CONSUMABLE_RESOURCE"
    };
  }

  const safeCurrent =
    Math.max(
      0,
      Math.min(
        maximum,
        current
      )
    );

  if (safeCurrent >= maximum) {
    return {
      ok: false,
      error:
        "RESOURCE_ALREADY_FULL",
      resource:
        definition.resource
    };
  }

  const restoreAmount =
    Math.max(
      1,
      Math.round(
        maximum *
        definition.restorePercent
      )
    );

  const after =
    Math.min(
      maximum,
      safeCurrent +
      restoreAmount
    );

  const actualRestored =
    after -
    safeCurrent;

  profile[
    fields.current
  ] = after;

  const removed =
    removeConsumableById(
      profile,
      consumableId
    );

  if (!removed.ok) {
    profile[
      fields.current
    ] = safeCurrent;

    return removed;
  }

  return {
    ok: true,
    consumable:
      removed.consumable,
    definition,
    resource:
      definition.resource,
    before:
      safeCurrent,
    after,
    restored:
      actualRestored,
    restorePercent:
      definition.restorePercent,
    inCombat:
      Boolean(inCombat),
    consumesTurn:
      Boolean(
        inCombat &&
        definition
          .consumesTurnInCombat
      )
  };
}
