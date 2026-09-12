import fs from "node:fs";

const coordinatorPath =
  "src/durable/PvpCoordinator.js";

const routerPath =
  "src/router.js";

const refuseRoutePath =
  "src/routes/refuse.js";


function replaceExactlyOnce(
  content,
  before,
  after,
  label
) {
  const occurrences =
    content.split(before).length - 1;

  if (occurrences !== 1) {
    throw new Error(
      `${label}: esperado 1 trecho, encontrado ${occurrences}.`
    );
  }

  return content.replace(
    before,
    after
  );
}


let coordinator =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

let router =
  fs.readFileSync(
    routerPath,
    "utf8"
  );


/*
 * 1. Método do Durable Object.
 */
if (
  !coordinator.includes(
    "async refuseChallenge("
  )
) {
  coordinator =
    replaceExactlyOnce(
      coordinator,
      "  async acceptChallenge(\n",
      `  async refuseChallenge(\n    user\n  ) {\n    user =\n      normalizeUser(\n        user\n      );\n\n\n    if (!user) {\n      return {\n        ok: false,\n        error: \"INVALID_USER\"\n      };\n    }\n\n\n    let data =\n      await this.getData();\n\n\n    data =\n      this.cleanExpiredChallenges(\n        data\n      );\n\n\n    /*\n     * Apenas o alvo do desafio pendente\n     * pode recusá-lo. O desafiante não\n     * encontra uma entrada com target=user.\n     */\n    const challengeIndex =\n      data.challenges.findIndex(\n        challenge =>\n          challenge?.target === user\n      );\n\n\n    if (\n      challengeIndex === -1\n    ) {\n      /*\n       * cleanExpiredChallenges pode ter\n       * removido entradas vencidas; salva\n       * o estado normalizado mesmo no erro.\n       */\n      await this.saveData(\n        data\n      );\n\n      return {\n        ok: false,\n        error: \"NO_CHALLENGE\"\n      };\n    }\n\n\n    const challenge =\n      data.challenges[\n        challengeIndex\n      ];\n\n\n    data.challenges.splice(\n      challengeIndex,\n      1\n    );\n\n\n    await this.saveData(\n      data\n    );\n\n\n    return {\n      ok: true,\n\n      challenger:\n        challenge.challenger,\n\n      target:\n        challenge.target\n    };\n  }\n\n\n  async acceptChallenge(\n`,
      "PvpCoordinator: método refuseChallenge"
    );
}


/*
 * 2. Endpoint interno do Durable Object.
 */
if (
  !coordinator.includes(
    'url.pathname ===\n      "/refuse"'
  )
) {
  coordinator =
    replaceExactlyOnce(
      coordinator,
      `    if (\n      url.pathname ===\n      \"/accept\"\n    ) {`,
      `    if (\n      url.pathname ===\n      \"/refuse\"\n    ) {\n      const result =\n        await this.refuseChallenge(\n          url.searchParams.get(\n            \"user\"\n          )\n        );\n\n\n      return new Response(\n        JSON.stringify(\n          result\n        ),\n        {\n          headers: {\n            \"Content-Type\":\n              \"application/json\"\n          }\n        }\n      );\n    }\n\n\n    if (\n      url.pathname ===\n      \"/accept\"\n    ) {`,
      "PvpCoordinator: endpoint /refuse"
    );
}


fs.writeFileSync(
  coordinatorPath,
  coordinator,
  "utf8"
);


/*
 * 3. Rota pública /recusar.
 */
const refuseRoute = `function getCoordinator(\n  env\n) {\n  const id =\n    env.PVP_COORDINATOR.idFromName(\n      \"marbion-global-pvp\"\n    );\n\n  return env.PVP_COORDINATOR.get(\n    id\n  );\n}\n\n\nexport async function refuseRoute(\n  request,\n  env\n) {\n  const url =\n    new URL(request.url);\n\n\n  const user =\n    url.searchParams.get(\n      \"user\"\n    );\n\n\n  if (!user) {\n    return new Response(\n      \"❌ Usuário não informado.\"\n    );\n  }\n\n\n  const coordinator =\n    getCoordinator(\n      env\n    );\n\n\n  const internalUrl =\n    new URL(\n      \"https://pvp.internal/refuse\"\n    );\n\n\n  internalUrl.searchParams.set(\n    \"user\",\n    user\n  );\n\n\n  const response =\n    await coordinator.fetch(\n      new Request(\n        internalUrl.toString()\n      )\n    );\n\n\n  const result =\n    await response.json();\n\n\n  if (!result.ok) {\n    if (\n      result.error ===\n      \"NO_CHALLENGE\"\n    ) {\n      return new Response(\n        \`@\${user}, você não possui nenhum desafio de PvP pendente para recusar.\`\n      );\n    }\n\n\n    return new Response(\n      \"❌ Não foi possível recusar o desafio.\"\n    );\n  }\n\n\n  return new Response(\n    \`🚫 @\${result.target} recusou o desafio de @\${result.challenger}.\`\n  );\n}\n`;


fs.writeFileSync(
  refuseRoutePath,
  refuseRoute,
  "utf8"
);


/*
 * 4. Router público.
 */
if (
  !router.includes(
    'import { refuseRoute } from "./routes/refuse.js";'
  )
) {
  router =
    replaceExactlyOnce(
      router,
      'import { acceptRoute } from "./routes/accept.js";',
      'import { refuseRoute } from "./routes/refuse.js";\nimport { acceptRoute } from "./routes/accept.js";',
      "router: import refuseRoute"
    );
}


if (
  !router.includes(
    'path === "/recusar"'
  )
) {
  router =
    replaceExactlyOnce(
      router,
      `  if (path === \"/aceitar\") {`,
      `  if (path === \"/recusar\") {\n    return refuseRoute(\n      request,\n      env\n    );\n  }\n\n  if (path === \"/aceitar\") {`,
      "router: rota /recusar"
    );
}


fs.writeFileSync(
  routerPath,
  router,
  "utf8"
);


/*
 * 5. Verificações estruturais.
 */
const finalCoordinator =
  fs.readFileSync(
    coordinatorPath,
    "utf8"
  );

const finalRouter =
  fs.readFileSync(
    routerPath,
    "utf8"
  );

const finalRefuseRoute =
  fs.readFileSync(
    refuseRoutePath,
    "utf8"
  );


const checks = [
  [
    finalCoordinator.includes(
      "async refuseChallenge("
    ),
    "método refuseChallenge existe"
  ],
  [
    finalCoordinator.includes(
      "challenge?.target === user"
    ),
    "somente o alvo pode recusar"
  ],
  [
    finalCoordinator.includes(
      'url.pathname ===\n      "/refuse"'
    ),
    "endpoint interno /refuse existe"
  ],
  [
    finalRouter.includes(
      'path === "/recusar"'
    ),
    "router público /recusar existe"
  ],
  [
    finalRefuseRoute.includes(
      "https://pvp.internal/refuse"
    ),
    "rota pública encaminha ao Durable Object"
  ]
];


for (
  const [ok, label]
  of checks
) {
  if (!ok) {
    throw new Error(
      `Falha de integração: ${label}.`
    );
  }

  console.log(
    `✅ ${label}`
  );
}


console.log(
  "\n🚫 !recusar integrado localmente."
);
