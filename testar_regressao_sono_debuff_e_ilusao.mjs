import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getFusionElements
} from "./src/systems/element-compatibility.js";


const coordinator =
  fs.readFileSync(
    "src/durable/PvpCoordinator.js",
    "utf8"
  );


const sleepDispatchIndex =
  coordinator.indexOf(
    'controlType ===\n    "sono"'
  );

const genericDebuffIndex =
  coordinator.indexOf(
    'skillType === "debuff"'
  );


assert.ok(
  sleepDispatchIndex >= 0,
  "O roteamento especial de Sono precisa existir."
);

assert.ok(
  genericDebuffIndex >= 0,
  "O roteamento genérico de Debuff precisa existir."
);

assert.ok(
  sleepDispatchIndex < genericDebuffIndex,
  "controlType=sono precisa ter prioridade sobre o Debuff genérico."
);


const psychicLightFusions =
  getFusionElements({
    elements: [
      "Psíquico",
      "Luz"
    ]
  });


assert.equal(
  psychicLightFusions.some(
    element =>
      String(element)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() ===
      "ilusao"
  ),
  false,
  "Psíquico + Luz não pode mais desbloquear Ilusão."
);


console.log(
  "✅ controlType=sono tem prioridade sobre Debuff genérico."
);

console.log(
  "✅ Psíquico + Luz não gera mais o elemento legado Ilusão."
);

console.log(
  "\n💤🧠 REGRESSÃO DE SONO + ILUSÃO LEGADA PASSOU."
);
