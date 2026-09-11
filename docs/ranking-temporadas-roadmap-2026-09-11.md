# Marbion RPG V2 — Ranking, anti-farm, reset de Elo e temporadas

Data canônica: 2026-09-11

Este documento registra as decisões de design tomadas após a validação em produção da Fila Global de PvP.

## 1. Estado atual

- Cooldown real: validado em produção.
- Crítico geral: validado em produção.
- Matriz elemental / combos V1 / Counter / Refletir: núcleo fechado.
- Fila Global de PvP: validada localmente (motor, integração e hardening) e em produção na Twitch.
- Próximo bloco técnico: recusar desafio, desistência/forfeit, timeout de turno e hardening de lutas abandonadas.

## 2. Ranking dinâmico por dificuldade pessoal

O rating inicial continua sendo 1000.

A progressão deixa de ser simétrica. Quanto maior o rating do jogador, menor seu ganho base e maior sua perda base.

Fator de dificuldade pessoal:

```txt
D(R) = clamp(1 + 0.8 * ((R - 1000) / 1700), 1.0, 2.2)
```

Ganho base:

```txt
winBase = 30 / D(R)
```

Perda base:

```txt
lossBase = 30 * D(R)
```

Regras de segurança planejadas:
- vitória normal: mínimo +1;
- rating nunca abaixo de 0;
- ganho máximo recomendado por luta: +75;
- perda máxima recomendada por derrota normal: -150;
- perda máxima recomendada por desistência: -300.

## 3. Diferença entre ratings dos adversários

A diferença de rating também altera risco e recompensa.

Definição:

```txt
delta = opponentRating - playerRating
```

### Vitória contra adversário mais forte

```txt
winMultiplier = 1 + min(1.5, delta / 800)
```

O bônus pode chegar a 2.5x.

### Vitória contra adversário mais fraco

```txt
winMultiplier = max(0.08, 1 / (1 + abs(delta) / 200))
```

Quanto maior a vantagem de rating, menor o ganho. Em diferenças extremas, uma vitória pode render apenas 1 ou 2 pontos.

### Derrota do jogador mais fraco contra jogador mais forte

Não recebe penalidade adicional pela diferença de rating. Aplica apenas sua perda base pessoal.

### Derrota do jogador mais forte contra jogador mais fraco

```txt
lossMultiplier = min(3, 1 + abs(delta) / 600)
```

A perda pode chegar a 3x antes dos caps.

Resultado final:

```txt
win = round(winBase * winMultiplier)
loss = round(lossBase * lossMultiplier)
```

Os cálculos de vencedor e perdedor são independentes; o sistema deixa de ser zero-sum.

## 4. Desistência / forfeit

Comando planejado:

```txt
!desistir
```

Regra principal:

```txt
forfeitLoss = 2 * normalCalculatedLoss
```

Ou seja, quem desiste perde o dobro da perda que teria naquele confronto, respeitando o cap específico de desistência.

Proteção contra farming por desistência precoce:
- desistência antes do Turno 3: o desistente recebe a penalidade 2x, mas o adversário recebe 0 Elo;
- a luta ainda pode contar como vitória/derrota nas estatísticas;
- a partir do Turno 3, o vencedor pode receber Elo normal, ainda sujeito ao anti-farm da dupla.

## 5. Anti-farm por repetição de adversário

Regra canônica recomendada: contar partidas entre a mesma dupla, e não apenas vitórias consecutivas de um jogador. Isso evita burlar o sistema alternando derrotas propositalmente.

Janela proposta: 24 horas.

Dentro da janela, para a mesma dupla A x B:
- 1ª partida: ranqueada normal;
- 2ª partida: ranqueada normal;
- 3ª partida: ranqueada normal;
- 4ª partida e seguintes: amistosas, com 0 ganho e 0 perda de Elo.

A partir da 4ª partida, o combate continua funcionando normalmente, mas o resultado não altera rating.

Quando a janela de 24h expirar, a dupla volta a poder disputar partidas ranqueadas.

## 6. Reset administrativo de Elo

Comandos planejados:

```txt
!adm elo reset @usuario
!adm elo reset geral
```

### Reset individual
- rating volta para 1000;
- rank é recalculado a partir de 1000;
- posição de Prodígio é removida/recalculada;
- por padrão, histórico de vitórias/derrotas e melhor streak deve ser preservado como histórico, salvo se for criado um modo explícito de reset total.

### Reset geral
- todos os jogadores voltam para rating 1000;
- ranking e posições de Prodígio são recalculados;
- deve exigir confirmação administrativa forte para evitar execução acidental.

## 7. Temporadas ranqueadas

Duração inicial proposta: 30 dias.

Cada temporada possui:
- ID e nome;
- data de início;
- data de encerramento;
- XP de temporada separado do XP normal;
- níveis do passe;
- trilha de recompensas;
- itens e recompensas cosméticas;
- título exclusivo no final da trilha;
- snapshot final do ranking;
- histórico de campeões / Prodígios da temporada.

Comandos planejados:

```txt
!temporada
!passe
!adm temporada iniciar
!adm temporada encerrar
```

`!temporada` deve mostrar temporada atual, tempo restante e posição/rating do jogador.

`!passe` deve mostrar XP de temporada, nível do passe, próxima recompensa e progresso.

## 8. Passe de batalha — Temporada 1

A Temporada 1 funcionará como primeiro passe de batalha do RPG.

Estrutura planejada:
- XP de temporada obtido por atividades válidas;
- níveis progressivos;
- recompensas de XP normal;
- itens;
- consumíveis futuros;
- recompensas cosméticas/títulos;
- título exclusivo no nível final.

O nome do título final e a quantidade exata de níveis permanecem pendentes de decisão de design.

## 9. Soft reset de Elo no fim da temporada

Objetivo: reduzir ratings altos sem apagar a progressão nem colocar todos no rating inicial.

Fórmula recomendada:

```txt
if rating <= 1000:
    newRating = rating
else:
    newRating = 1000 + round((rating - 1000) * 0.75)
```

Isso remove 25% do excesso de rating acima de 1000 e preserva 75% da progressão excedente.

Exemplos aproximados:

```txt
1200 -> 1150
1500 -> 1375
1800 -> 1600
2100 -> 1825
2400 -> 2050
2700 -> 2275
```

Vantagens:
- preserva a ordem relativa dos jogadores;
- jogadores altos recuam mais em pontos absolutos;
- ninguém no topo volta ao início;
- cria espaço competitivo para a nova temporada;
- evita inflação eterna de rating.

Ao encerrar a temporada:
1. congelar/salvar ranking final;
2. conceder recompensas e títulos;
3. registrar campeões e Prodígios;
4. aplicar soft reset;
5. limpar posições de Prodígio e recalculá-las a partir do novo ranking;
6. zerar XP/nível do passe da temporada encerrada;
7. iniciar a próxima temporada.

## 10. Ordem de implementação recomendada

1. Finalizar documentação e atualizar o roadmap principal.
2. Refatorar `pvp-ranking.js` para o novo cálculo assimétrico de ganho/perda.
3. Implementar histórico recente A x B e anti-farm de 3 partidas ranqueadas / 4ª+ amistosa.
4. Implementar `!recusar`.
5. Implementar `!desistir` com penalidade 2x e regra anti-farm de desistência precoce.
6. Implementar timeout de turno e recuperação de lutas abandonadas.
7. Implementar `!adm elo reset @usuario` e `!adm elo reset geral`.
8. Criar infraestrutura de temporadas.
9. Criar XP de temporada e passe da Temporada 1.
10. Implementar encerramento automático/manual da temporada e soft reset.
11. Validar tudo localmente, em dry-run e depois na Twitch.

## 11. Observação de balanceamento

Os coeficientes deste documento são canônicos como ponto de partida, mas devem ficar centralizados em configuração para permitir ajuste sem reescrever o motor. Após testes reais, valores como 0.8, 1700, 800, 200, 600, caps e retenção de 75% do soft reset podem ser rebalanceados mantendo a mesma arquitetura matemática.
