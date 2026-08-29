import fs from "node:fs/promises";

const INPUT =
  "./skills-v1-1500.json";

const OUTPUT =
  "./skills-v1-1500-final.json";


function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


const data =
  JSON.parse(
    await fs.readFile(
      INPUT,
      "utf8"
    )
  );


const usedNames =
  new Set();

const renamed = [];


for (
  const [group, skills]
  of Object.entries(data)
) {
  for (
    const [key, skill]
    of Object.entries(skills)
  ) {
    const originalName =
      String(
        skill?.nome ?? ""
      ).trim();

    let finalName =
      originalName;

    let normalized =
      normalize(
        finalName
      );


    if (
      usedNames.has(
        normalized
      )
    ) {
      /*
       * Mantemos a primeira ocorrência.
       * A ocorrência seguinte recebe o
       * elemento/grupo como qualificador.
       *
       * Exemplos:
       * Monólito Ascendente
       * -> Monólito Ascendente de Obsidiana
       *
       * Corrente Ascendente
       * -> Corrente Ascendente de Metal
       */
      finalName =
        `${originalName} de ${group}`;

      normalized =
        normalize(
          finalName
        );


      let suffix = 2;

      while (
        usedNames.has(
          normalized
        )
      ) {
        finalName =
          `${originalName} de ${group} ${suffix}`;

        normalized =
          normalize(
            finalName
          );

        suffix += 1;
      }


      skill.nome =
        finalName;


      renamed.push({
        id:
          `${group}:${key}`,

        before:
          originalName,

        after:
          finalName
      });
    }


    usedNames.add(
      normalized
    );
  }
}


/*
 * Segunda validação independente.
 */
const finalNames =
  new Map();

let total = 0;


for (
  const [group, skills]
  of Object.entries(data)
) {
  for (
    const [key, skill]
    of Object.entries(skills)
  ) {
    total += 1;

    const name =
      normalize(
        skill.nome
      );

    if (
      !finalNames.has(name)
    ) {
      finalNames.set(
        name,
        []
      );
    }

    finalNames.get(name).push(
      `${group}:${key}`
    );
  }
}


const remainingDuplicates =
  [...finalNames.entries()]
    .filter(
      ([, ids]) =>
        ids.length > 1
    );


if (
  remainingDuplicates.length > 0
) {
  console.error(
    "Ainda existem nomes duplicados:"
  );

  for (
    const [name, ids]
    of remainingDuplicates
  ) {
    console.error(
      name,
      ids
    );
  }

  process.exit(1);
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
  "=== CORREÇÃO GLOBAL DE NOMES ==="
);

console.log(
  `Habilidades analisadas: ${total}`
);

console.log(
  `Nomes corrigidos: ${renamed.length}`
);

console.log(
  `Duplicatas restantes: ${remainingDuplicates.length}`
);

console.log(
  `Arquivo criado: ${OUTPUT}`
);


if (
  renamed.length > 0
) {
  console.log(
    "\n=== ALTERAÇÕES ==="
  );

  for (
    const item
    of renamed
  ) {
    console.log(
      `${item.id}: ${item.before} -> ${item.after}`
    );
  }
}
