import {
  getElementFusionRules
} from "../systems/element-compatibility.js";


export async function elementFusionsApiRoute() {
  return Response.json({
    ok: true,
    rules:
      getElementFusionRules(),
    rulesNote:
      "Apenas elementos nativos participam das fusões. Elementos obtidos por fusão não geram fusões em cadeia."
  });
}
