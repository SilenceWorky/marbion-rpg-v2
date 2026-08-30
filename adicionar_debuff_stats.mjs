import fs from
  "node:fs/promises";


const SOURCE =
  "https://raw.githubusercontent.com/SilenceWorky/worky-live-responses/main/skills.json";


const OUTPUT =
  "./skills-v1-1500-debuff.json";


const DEBUFF_STATS_BY_ELEMENT = {
  Fogo: [
    "defense",
    "accuracy"
  ],

  Água: [
    "speed",
    "accuracy",
    "strength"
  ],

  Vento: [
    "accuracy",
    "speed",
    "evasion"
  ],

  Terra: [
    "speed",
    "evasion",
    "defense"
  ],

  Eletricidade: [
    "speed",
    "evasion",
    "accuracy"
  ],

  Fluxo: [
    "speed",
    "accuracy",
    "magicStrength"
  ],

  Cristal: [
    "defense",
    "speed",
    "evasion"
  ],

  Som: [
    "accuracy",
    "magicStrength",
    "evasion"
  ],

  Natureza: [
    "speed",
    "evasion",
    "strength"
  ],

  Gelo: [
    "speed",
    "evasion",
    "accuracy"
  ],

  Psíquico: [
    "accuracy",
    "magicStrength",
    "strength"
  ],

  Lava: [
    "defense",
    "speed",
    "evasion"
  ],

  Sombra: [
    "accuracy",
    "evasion",
    "magicStrength"
  ],

  Luz: [
    "accuracy",
    "evasion",
    "defense"
  ],

  Veneno: [
    "strength",
    "speed",
    "defense"
  ],

  Metal: [
    "speed",
    "evasion",
    "defense"
  ],

  Tempo: [
    "speed",
    "evasion",
    "accuracy"
  ],

  Espaço: [
    "accuracy",
    "evasion",
    "speed"
  ],

  Gravidade: [
    "speed",
    "evasion",
    "strength"
  ],

  Matéria: [
    "defense",
    "strength",
    "magicStrength"
  ],

  Neutro: [
    "strength",
    "magicStrength",
    "speed",
    "evasion",
    "accuracy",
    "defense"
  ],

  Vidro: [
    "defense",
    "accuracy",
    "evasion"
  ],

  Vapor: [
    "accuracy",
    "speed",
    "evasion"
  ],

  Magnetismo: [
    "speed",
    "accuracy",
    "defense"
  ],

  Obsidiana: [
    "defense",
    "speed",
    "evasion"
  ],

  Ilusão: [
    "accuracy",
    "evasion",
    "magicStrength"
  ],

  Ácido: [
    "defense",
    "strength",
    "speed"
  ],

  Plasma: [
    "defense",
    "speed",
    "accuracy"
  ],

  Radiação: [
    "strength",
    "defense",
    "magicStrength"
  ],

  Singularidade: [
    "speed",
    "evasion",
    "defense"
  ]
};


const response =
  await fetch(
    SOURCE
  );


if (!response.ok) {
  throw new Error(
    `Falha ao carregar skills.json: HTTP ${response.status}`
  );
}


const data =
  await response.json();


let changed = 0;


const report = {};


for (
  const [
    element,
    group
  ]
  of Object.entries(data)
) {
  if (
    element === "Universais"
  ) {
    continue;
  }


  const availableStats =
    DEBUFF_STATS_BY_ELEMENT[
      element
    ];


  if (
    !availableStats
  ) {
    continue;
  }


  let debuffIndex = 0;


  for (
    const skill
    of Object.values(group)
  ) {
    const type =
      String(
        skill.tipo ?? ""
      )
        .trim()
        .toLowerCase();


    /*
     * Ácido e Veneno atualmente
     * possuem algumas habilidades
     * tipo "Veneno".
     *
     * Elas também entram nesta
     * infraestrutura de Debuff.
     */
    if (
      type !== "debuff" &&
      type !== "veneno"
    ) {
      continue;
    }


    const stat =
      availableStats[
        debuffIndex %
        availableStats.length
      ];


    skill.debuffStat =
      stat;


    debuffIndex += 1;

    changed += 1;


    if (!report[element]) {
      report[element] = [];
    }


    report[element].push({
      nome:
        skill.nome,

      debuffStat:
        stat
    });
  }
}


await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    data,
    null,
    2
  ) + "\n",
  "utf8"
);


console.log(
  "=== DEBUFF STATS ==="
);


console.log(
  "Habilidades alteradas:",
  changed
);


for (
  const [
    element,
    skills
  ]
  of Object.entries(
    report
  )
) {
  console.log(
    `\n${element}: ${skills.length}`
  );


  for (
    const skill
    of skills
  ) {
    console.log(
      `- ${skill.nome} -> ${skill.debuffStat}`
    );
  }
}


console.log(
  "\nArquivo criado:",
  OUTPUT
);