# Marbion — Checkpoint canônico dos elementos sazonais

Data: **2026-09-26**

Este documento congela a regra canônica dos **3 elementos principais de cada mês da temporada** e a rotação anual usada pelo site/MarbionBot/RPG.

## 1. Regra-base

Cada mês possui **3 elementos principais**. Esses elementos são os que recebem as novas habilidades sazonais daquele período.

O ano-base desta tabela é **2026**.

### 2026

| Mês | Elementos principais |
|---|---|
| Janeiro | Luz · Tempo · Fogo |
| Fevereiro | Cristal · Ilusão · Radiação |
| Março | Eletricidade · Som · Vento |
| Abril | Psíquico · Sombra · Neutro |
| Maio | Natureza · Terra · Água |
| Junho | Lava · Plasma · Metal |
| Julho | Gelo · Fluxo · Gravidade |
| Agosto | Espaço · Matéria · Singularidade |
| Setembro | Vidro · Vapor · Magnetismo |
| Outubro | Veneno · Ácido · Obsidiana |
| Novembro | Água · Fogo · Vento |
| Dezembro | Gelo · Terra · Natureza |

## 2. Regra de rotação anual

A cada novo ano, **cada trio anda exatamente um mês para frente no calendário**.

Exemplo:

- Dezembro/2026 = Gelo · Terra · Natureza
- Janeiro/2027 = Gelo · Terra · Natureza

Ao mesmo tempo:

- Janeiro/2026 = Luz · Tempo · Fogo
- Fevereiro/2027 = Luz · Tempo · Fogo

Portanto, o trio que ocupava um mês no ano anterior passa a ocupar o **mês seguinte** no ano seguinte.

Dezembro faz wrap para Janeiro.

## 3. Fórmula

Considere os 12 trios de 2026 como posições 0–11, começando em Janeiro.

Para um ano `Y`, o deslocamento é:

```txt
deslocamento = Y - 2026
```

Para descobrir qual trio usar em um determinado mês `m` (Janeiro = 0, Fevereiro = 1, ..., Dezembro = 11):

```txt
indiceBase = (m - deslocamento) mod 12
```

Use módulo positivo de 0 a 11.

Isso faz o trio avançar um mês por ano.

## 4. Exemplos

### 2027

| Mês | Elementos |
|---|---|
| Janeiro | Gelo · Terra · Natureza |
| Fevereiro | Luz · Tempo · Fogo |
| Março | Cristal · Ilusão · Radiação |
| Abril | Eletricidade · Som · Vento |
| Maio | Psíquico · Sombra · Neutro |
| Junho | Natureza · Terra · Água |
| Julho | Lava · Plasma · Metal |
| Agosto | Gelo · Fluxo · Gravidade |
| Setembro | Espaço · Matéria · Singularidade |
| Outubro | Vidro · Vapor · Magnetismo |
| Novembro | Veneno · Ácido · Obsidiana |
| Dezembro | Água · Fogo · Vento |

### Dezembro ao longo dos anos

```txt
2026 = Gelo · Terra · Natureza
2027 = Água · Fogo · Vento
2028 = Veneno · Ácido · Obsidiana
2029 = Vidro · Vapor · Magnetismo
2030 = Espaço · Matéria · Singularidade
2031 = Gelo · Fluxo · Gravidade
2032 = Lava · Plasma · Metal
2033 = Natureza · Terra · Água
2034 = Psíquico · Sombra · Neutro
2035 = Eletricidade · Som · Vento
```

## 5. Regras de implementação no site

- Não hardcodar manualmente uma tabela independente para cada ano se a rotação puder ser calculada pela regra acima.
- A tabela de 2026 é a fonte-base canônica.
- O site pode gerar automaticamente 2026–2035, 2036 etc.
- O deslocamento é de exatamente **+1 mês por ano**.
- O trio não muda internamente: ele apenas muda de mês conforme o ano.
- Dezembro → Janeiro ao avançar um ano.
- Não alterar nomes/acentos dos elementos sem decisão canônica posterior.

## 6. Uso previsto

Os elementos principais do mês serão usados para identificar quais elementos recebem **novas habilidades sazonais** naquela temporada/mês.
