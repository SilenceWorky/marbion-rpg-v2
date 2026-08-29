import fs from "node:fs/promises";

const SOURCE =
  "https://raw.githubusercontent.com/SilenceWorky/worky-live-responses/main/skills.json";
const OUT = "./skills-v1-1500.json";
const EACH = 50;

const MAIN = [
  "Fogo","Água","Vento","Terra","Eletricidade","Fluxo","Cristal","Som","Natureza","Gelo",
  "Psíquico","Lava","Sombra","Luz","Veneno","Metal","Tempo","Espaço","Gravidade","Matéria"
];

const FUSIONS = {
  Vidro:["Fogo + Terra","Cristal + Fogo"],
  Vapor:["Água + Fogo"],
  Magnetismo:["Metal + Eletricidade"],
  Obsidiana:["Lava + Água"],
  Ilusão:["Psíquico + Luz"],
  Ácido:["Água + Veneno"],
  Plasma:["Fogo + Eletricidade"],
  Radiação:["Luz + Veneno"],
  Singularidade:["Espaço + Gravidade"]
};

const ALL = [...MAIN,"Neutro",...Object.keys(FUSIONS)];

const THEMES = {
  Fogo:["Chama","Brasa","Labareda","Fagulha","Incêndio","Pira"],
  Água:["Maré","Onda","Torrente","Dilúvio","Gêiser","Vórtice"],
  Vento:["Rajada","Tufão","Ciclone","Vendaval","Furacão","Lâmina de Ar"],
  Terra:["Rocha","Abalo","Pilar","Tremor","Monólito","Cratera"],
  Eletricidade:["Raio","Arco","Descarga","Trovão","Relâmpago","Sobrecarga"],
  Fluxo:["Corrente","Impulso","Ritmo","Vetor","Cadência","Nexo"],
  Cristal:["Fragmento","Prisma","Agulha","Geodo","Estilhaço","Obelisco"],
  Som:["Onda Sônica","Eco","Acorde","Ressonância","Frequência","Vibração"],
  Natureza:["Raízes","Espinhos","Pólen","Floresta","Cipó","Semente"],
  Gelo:["Lança Glaciar","Nevasca","Geada","Iceberg","Avalanche","Zero Absoluto"],
  Psíquico:["Pressão Mental","Pulso Psíquico","Sinapse","Trauma","Comando","Domínio"],
  Lava:["Magma","Erupção","Cratera","Rio de Lava","Fissura","Caldeira"],
  Sombra:["Lâmina Sombria","Manto","Véu","Abismo","Eclipse","Umbra"],
  Luz:["Raio Radiante","Aura","Facho","Julgamento","Clarão","Aurora"],
  Veneno:["Nuvem Tóxica","Toxina","Miasma","Peçonha","Contaminação","Esporo"],
  Metal:["Lâmina de Aço","Armadura","Martelo","Corrente","Chuva de Aço","Forja"],
  Tempo:["Atraso Temporal","Paradoxo","Instante","Rebobinagem","Linha Temporal","Era"],
  Espaço:["Fenda Espacial","Portal","Salto","Horizonte","Vácuo","Distorção"],
  Gravidade:["Pressão Gravitacional","Órbita","Poço Gravitacional","Compressão","Queda","Ancoragem"],
  Matéria:["Compressão Molecular","Transmutação","Ruptura Molecular","Partícula","Recomposição","Fragmentação"],
  Neutro:["Golpe Puro","Impacto","Pulso","Força Bruta","Concentração","Ruptura Neutra"],
  Vidro:["Lâmina de Vidro","Estilhaço","Vitral","Prisma Vítreo","Caco","Espelho"],
  Vapor:["Nuvem de Vapor","Jato Pressurizado","Névoa Quente","Caldeira","Bruma","Condensação"],
  Magnetismo:["Campo Magnético","Polaridade","Atração","Repulsão","Indução","Dipolo"],
  Obsidiana:["Lâmina de Obsidiana","Espinho Negro","Caco Obsidiano","Muralha Vulcânica","Monólito","Fragmentação Negra"],
  Ilusão:["Miragem","Reflexo Falso","Labirinto Mental","Imagem Dupla","Véu Ilusório","Fantasma"],
  Ácido:["Jato Ácido","Chuva Corrosiva","Poça Ácida","Névoa Corrosiva","Dissolução","Maré Ácida"],
  Plasma:["Raio de Plasma","Arco Plasmático","Esfera de Plasma","Lâmina Plasmática","Núcleo Plasmático","Pulso Ionizado"],
  Radiação:["Pulso Radioativo","Feixe Ionizante","Nuvem Radioativa","Decaimento","Zona Irradiada","Fissão"],
  Singularidade:["Horizonte de Eventos","Poço Infinito","Ponto Zero","Núcleo Singular","Queda Infinita","Colapso Cósmico"]
};

const MODS = [
  "Ascendente","Absoluto","Voraz","Imperial","Cortante",
  "Profundo","Ressonante","Terminal","Primordial"
];

const BASE_RARITY = {
  Fogo:"Comum",Água:"Comum",Vento:"Comum",Terra:"Comum",
  Eletricidade:"Incomum",Fluxo:"Incomum",Cristal:"Incomum",Som:"Incomum",
  Natureza:"Raro",Gelo:"Raro",Psíquico:"Raro",Lava:"Raro",
  Sombra:"Muito Raro",Luz:"Muito Raro",Veneno:"Muito Raro",Metal:"Muito Raro",
  Tempo:"Lendário",Espaço:"Lendário",Gravidade:"Lendário",Matéria:"Lendário",
  Neutro:"Especial",Vidro:"Especial",Vapor:"Especial",Magnetismo:"Especial",
  Obsidiana:"Especial",Ilusão:"Especial",Ácido:"Especial",Plasma:"Especial",
  Radiação:"Especial",Singularidade:"Especial"
};

const ROLES = [
  "quick","elemental","physical","buff","debuff",
  "elemental","support","heavy","elemental","heal"
];

function slug(v) {
  return String(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^A-Za-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
}

function scaleFor(element, role) {
  if (role === "physical") {
    if (["Vento","Eletricidade","Fluxo"].includes(element)) return "speed";
    if (["Luz","Veneno","Ácido","Radiação"].includes(element)) return "accuracy";
    return "strength";
  }
  if (role === "buff") return "defense";
  if (role === "support") return "mentalidade";
  if (["Vento","Fluxo"].includes(element)) return "speed";
  return "magicStrength";
}

function tipo(role, element) {
  if (role === "physical") return "Fisica";
  if (role === "buff") return "Buff";
  if (role === "debuff") return ["Veneno","Ácido"].includes(element) ? "Veneno" : "Debuff";
  if (role === "support") return "Suporte";
  if (role === "heal") return "Cura";
  return "Elemental";
}

function stats(role, i, element) {
  const tier = Math.floor(i / 10);
  let dano = 34 + tier * 10;
  let precisao = 92 - tier * 2;
  let custo = 12 + tier * 7;
  let cooldown = 2 + Math.floor(tier / 2);
  let prioridade = 0;

  if (role === "quick") {
    dano -= 10; precisao += 6; custo -= 3; cooldown = Math.max(1,cooldown-1); prioridade = 1;
  } else if (role === "heavy") {
    dano += 28; precisao -= 12; custo += 12; cooldown += 2; prioridade = -1;
  } else if (["buff","support","heal"].includes(role)) {
    dano = 0; precisao = 100; cooldown += 1;
  } else if (role === "debuff") {
    dano = Math.round(dano * .6); precisao += 4; cooldown += 1;
  } else if (role === "physical") {
    dano += 7; precisao -= 2;
  }

  if (["Tempo","Espaço","Gravidade","Matéria","Singularidade"].includes(element)) {
    custo += 8; cooldown += 1;
  }

  return {
    dano: Math.max(0,dano),
    precisao: Math.max(55,Math.min(100,precisao)),
    custoMentalidade: Math.max(0,custo),
    cooldown: Math.min(12,cooldown),
    prioridade
  };
}

function effect(role, element) {
  if (role === "quick") return `Ataque rápido de ${element}, com prioridade maior e dano moderado.`;
  if (role === "heavy") return `Golpe pesado de ${element}, com dano elevado, menor precisão e prioridade reduzida.`;
  if (role === "physical") return `Golpe físico revestido pelo poder de ${element}.`;
  if (role === "buff") return `Fortalece temporariamente o usuário através de ${element}.`;
  if (role === "debuff") return `Aplica um efeito debilitante relacionado a ${element}.`;
  if (role === "support") return `Usa ${element} para suporte tático e estabilização da Mentalidade.`;
  if (role === "heal") return `Canaliza ${element} para recuperar HP do usuário.`;
  return `Ataque direto utilizando o poder de ${element}.`;
}

function normalizeExisting(skill) {
  return skill.prioridade === undefined ? {...skill,prioridade:0} : skill;
}

function fill(existing, element) {
  const group = {};
  for (const [k,v] of Object.entries(existing || {})) group[k] = normalizeExisting(v);

  const names = new Set(Object.values(group).map(v => String(v.nome || "").toLowerCase()));
  let n = 0;

  while (Object.keys(group).length < EACH) {
    const roots = THEMES[element];
    const root = roots[n % roots.length];
    const mod = MODS[Math.floor(n / roots.length) % MODS.length];
    const name = `${root} ${mod}`;
    n += 1;

    if (names.has(name.toLowerCase())) continue;

    let key = slug(name);
    if (group[key]) key = `${key}_${n}`;

    const i = Object.keys(group).length;
    const role = ROLES[i % ROLES.length];
    const s = stats(role,i,element);

    group[key] = {
      nome:name,
      tipo:tipo(role,element),
      raridade:BASE_RARITY[element],
      elemento:element,
      custoMentalidade:s.custoMentalidade,
      cooldown:s.cooldown,
      escala:scaleFor(element,role),
      dano:s.dano,
      precisao:s.precisao,
      prioridade:s.prioridade,
      efeito:effect(role,element)
    };
    names.add(name.toLowerCase());
  }

  if (Object.keys(group).length > EACH) {
    throw new Error(`${element} já possui mais de ${EACH} habilidades.`);
  }
  return group;
}

function validate(data) {
  let count = 0;
  const errors = [];

  for (const element of ALL) {
    const group = data[element];
    const skills = group ? Object.values(group) : [];
    count += skills.length;
    if (skills.length !== EACH) errors.push(`${element}: ${skills.length}`);
    for (const skill of skills) {
      if (skill.elemento !== element) errors.push(`${element}: elemento interno incorreto`);
      for (const field of ["nome","tipo","raridade","custoMentalidade","cooldown","escala","dano","precisao","prioridade","efeito"]) {
        if (skill[field] === undefined) errors.push(`${element}: campo ${field} ausente`);
      }
    }
  }

  if (count !== 1500) errors.push(`Total esperado 1500; encontrado ${count}`);
  return {count,errors};
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Falha ao carregar skills.json: HTTP ${response.status}`);
const old = await response.json();

const out = {Universais:{...(old.Universais || {})}};
for (const element of ALL) out[element] = fill(old[element],element);

const check = validate(out);
if (check.errors.length) {
  console.error(check.errors.join("\n"));
  process.exit(1);
}

await fs.writeFile(OUT,JSON.stringify(out,null,2) + "\n","utf8");

console.log(`Categorias: ${ALL.length}`);
console.log(`Habilidades por categoria: ${EACH}`);
console.log(`Elementais/fusões: ${check.count}`);
console.log(`Universais preservadas: ${Object.keys(out.Universais).length}`);
console.log(`Total no JSON: ${check.count + Object.keys(out.Universais).length}`);
console.log(`Arquivo criado: ${OUT}`);
console.log("\nFusões:");
for (const [name,recipes] of Object.entries(FUSIONS)) {
  console.log(`- ${name}: ${recipes.join(" OU ")}`);
}
