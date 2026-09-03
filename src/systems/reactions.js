import {
  getFusionElements
} from "./element-compatibility.js";


export const PHYSICAL_COUNTER_TYPE =
  "counter_physical";

export const ELEMENTAL_REFLECT_TYPE =
  "reflect_elemental";

export const REACTION_PRIORITY =
  100;

export const REACTION_DAMAGE_TAKEN_MULTIPLIER =
  0.5;

export const REACTION_RETURN_DAMAGE_MULTIPLIER =
  0.5;

export const ELEMENTAL_REFLECT_MENTALIDADE_COST =
  10;


function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


export function getReactionType(
  skill
) {
  return normalize(
    skill?.reactionType
  );
}


export function isReactionSkill(
  skill
) {
  const type =
    getReactionType(
      skill
    );

  return (
    type === PHYSICAL_COUNTER_TYPE ||
    type === ELEMENTAL_REFLECT_TYPE
  );
}


export function getReflectableElements(
  profile
) {
  const elements =
    new Map();

  const nativeElements =
    Array.isArray(
      profile?.elements
    )
      ? profile.elements
          .filter(Boolean)
      : [];


  for (
    const element
    of nativeElements
  ) {
    elements.set(
      normalize(element),
      element
    );
  }


  for (
    const element
    of getFusionElements(
      profile
    )
  ) {
    elements.set(
      normalize(element),
      element
    );
  }


  return [
    ...elements.values()
  ];
}


export function canReflectElement(
  reflectElements,
  incomingElement
) {
  const target =
    normalize(
      incomingElement
    );

  if (!target) {
    return false;
  }


  return (
    Array.isArray(
      reflectElements
    ) &&
    reflectElements.some(
      element =>
        normalize(
          element
        ) === target
    )
  );
}


function isDirectDamageSkill(
  skill
) {
  if (
    isReactionSkill(
      skill
    )
  ) {
    return false;
  }

  return (
    Math.max(
      0,
      Number(
        skill?.dano
      ) || 0
    ) > 0
  );
}


export function matchReaction(
  stanceSkill,
  incomingSkill,
  defender
) {
  const reactionType =
    getReactionType(
      stanceSkill
    );

  const incomingType =
    normalize(
      incomingSkill?.tipo
    );

  const incomingElement =
    incomingSkill?.elemento ??
    null;


  if (
    !isDirectDamageSkill(
      incomingSkill
    )
  ) {
    return {
      matched: false,
      reactionType,
      reason:
        "NOT_DIRECT_DAMAGE"
    };
  }


  if (
    reactionType ===
    PHYSICAL_COUNTER_TYPE
  ) {
    return {
      matched:
        incomingType ===
        "fisica",

      reactionType,

      reason:
        incomingType ===
        "fisica"
          ? null
          : "NOT_PHYSICAL"
    };
  }


  if (
    reactionType ===
    ELEMENTAL_REFLECT_TYPE
  ) {
    if (
      incomingType !==
      "elemental"
    ) {
      return {
        matched: false,
        reactionType,
        reason:
          "NOT_ELEMENTAL"
      };
    }


    const compatible =
      canReflectElement(
        defender?.reflectElements,
        incomingElement
      );


    return {
      matched:
        compatible,

      reactionType,

      element:
        incomingElement,

      reason:
        compatible
          ? null
          : "ELEMENT_NOT_OWNED"
    };
  }


  return {
    matched: false,
    reactionType,
    reason:
      "NOT_REACTION"
  };
}


export function splitReactionDamage(
  rawDamage
) {
  const safeDamage =
    Math.max(
      0,
      Math.floor(
        Number(
          rawDamage
        ) || 0
      )
    );

  const taken =
    Math.ceil(
      safeDamage *
      REACTION_DAMAGE_TAKEN_MULTIPLIER
    );

  const returned =
    Math.floor(
      safeDamage *
      REACTION_RETURN_DAMAGE_MULTIPLIER
    );


  return {
    rawDamage:
      safeDamage,

    taken,
    returned
  };
}
