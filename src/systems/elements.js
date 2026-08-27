import {
  weightedRandom
} from "../utils/random.js";

export function rollElements(elementsData) {
  const firstElement =
    weightedRandom(elementsData);

  if (!firstElement) {
    return [];
  }

  const firstData =
    elementsData[firstElement];

  // Elementos exclusivos nunca podem
  // coexistir com outro elemento.
  if (firstData.exclusivo) {
    return [firstElement];
  }

  // 18% de chance de despertar
  // um segundo elemento.
  const hasSecondElement =
    Math.random() < 0.18;

  if (!hasSecondElement) {
    return [firstElement];
  }

  // O segundo elemento não pode ser
  // igual ao primeiro nem exclusivo.
  const secondCandidates =
    Object.fromEntries(
      Object.entries(elementsData)
        .filter(
          ([name, data]) =>
            name !== firstElement &&
            !data.exclusivo
        )
    );

  const secondElement =
    weightedRandom(
      secondCandidates
    );

  if (!secondElement) {
    return [firstElement];
  }

  return [
    firstElement,
    secondElement
  ];
}