# Marbion RPG V2 — Ranking, anti-farm, reset de Elo e temporadas

Data canônica original: 2026-09-11
Atualização canônica: 2026-09-14

Este documento registra as decisões de design tomadas após a validação em produção da Fila Global de PvP e foi atualizado para refletir a arquitetura mensal de temporadas consolidada na Etapa 24.

## 1. Estado atual

- Cooldown real: validado em produção.
- Crítico geral: validado em produção.
- Matriz elemental / combos V1 / Counter / Refletir: núcleo fechado.
- Fila Global de PvP: validada localmente e em produção na Twitch.
- `!recusar`, `!desistir`, timeout/AFK, anti-farm, Ranking Dinâmico V2 e resets administrativos de Elo: implementados e validados.
- Etapa 24 — Temporadas: infraestrutura mensal, planejamento, agendamento, catálogo, ativação, encerramento, retries e comandos ADM implementados no GitHub/local; ainda não liberada como temporada real em produção.
- Etapa 25 — Passe de batalha: pendente.
- Etapa 26 — soft reset, snapshot final e recompensas de fim de temporada: pendente.

## 2. Ranking dinâmico por dificuldade pessoal

O rating inicial continua sendo 1000.

A progressão é assimétrica. Quanto maior o rating do jogador, menor seu ganho base e maior sua perda base.

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

Regras atuais de segurança:
- vitória normal: mínimo +1;
- rating nunca abaixo de 0;
- ganho máximo por luta: +75;
- perda máxima por derrota normal: -150;
- perda máxima por desistência: -300.

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

Os cálculos de vencedor e perdedor são independentes; o sistema não é zero-sum.

## 4. Desistência / forfeit

Comando implementado:

```txt
!desistir
```

Regra principal:

```txt
forfeitLoss = 2 * normalCalculatedLoss
```

Proteção contra farming por desistência precoce:
- desistência antes do Turno 3: o desistente recebe a penalidade 2x, mas o adversário recebe 0 Elo;
- a luta pode continuar contando para estatísticas conforme as regras do motor;
- a partir do Turno 3, o vencedor pode receber Elo normal, sujeito ao anti-farm da dupla.

## 5. Anti-farm por repetição de adversário

Janela canônica: 24 horas.

Dentro da janela, para a mesma dupla A x B:
- 1ª partida: ranqueada normal;
- 2ª partida: ranqueada normal;
- 3ª partida: ranqueada normal;
- 4ª partida e seguintes: amistosas, com 0 ganho e 0 perda de Elo.

A partir da 4ª partida, o combate continua funcionando normalmente, mas o resultado não altera rating.

## 6. Reset administrativo de Elo

Comandos implementados:

```txt
!adm elo reset @usuario
!adm elo reset geral
```

### Reset individual
- rating volta para 1000;
- rank é recalculado;
- posição de Prodígio é removida/recalculada;
- histórico competitivo é preservado conforme as regras atuais.

### Reset geral
- usa geração global de Elo;
- perfis antigos são sincronizados preguiçosamente quando acessados;
- histórico competitivo é preservado;
- o reset é bloqueado quando existe estado PvP incompatível com a operação.

## 7. Temporadas ranqueadas — regra canônica atual

A antiga proposta de duração fixa de 30 dias foi substituída.

Cada temporada corresponde exatamente a um mês civil em `America/Fortaleza`:

```txt
início: dia 1 às 00:00
fim:    dia 1 do mês seguinte às 00:00
```

Consequências:
- fevereiro, meses de 30 dias, meses de 31 dias e anos bissextos usam sua duração civil real;
- o calendário nunca desliza;
- um atraso técnico de ativação não prolonga a temporada;
- horas perdidas por atraso são perdidas, não carregadas para o mês seguinte;
- uma temporada do mês anterior nunca nasce depois que o mês seguinte já começou.

A identidade mensal é canônica:

```txt
ID = YYYY-MM
```

Exemplo:

```txt
2027-09
```

## 8. Tema-base mensal e nome anual

Tema-base e nome da temporada são conceitos separados.

- **Tema-base:** permanente por mês do ano.
- **Nome:** pode mudar a cada ano.

Temas-base canônicos atualmente configurados:

```txt
Agosto    — Arquivo do Infinito
Setembro  — Jardim do Criador
```

Meses sem tema-base canônico ainda não podem ser autorizados para uma temporada real.

Exemplo conceitual:

```txt
Setembro
Tema-base permanente: Jardim do Criador
Nome em 2026: Um Novo Florescer
Nome em 2027: Jardim do Amanhã
```

## 9. Planejamento, catálogo e autorização

Uma temporada não começa apenas porque o calendário chegou a um novo mês.

Ela precisa ter sido previamente autorizada.

Fluxo canônico:

```txt
catálogo / painel / ADM
→ definição anual do nome
→ agendamento interno
→ alarm do Durable Object
→ ativação no mês correto
```

Regras:
- meses podem ser definidos com antecedência;
- múltiplos meses e anos futuros podem coexistir;
- o catálogo de código preenche apenas lacunas;
- definições persistidas têm prioridade sobre o catálogo;
- um agendamento existente é preservado;
- remover uma entrada do catálogo não apaga automaticamente dados persistidos;
- mês indefinido não gera temporada automaticamente.

O catálogo oficial de código continua vazio até que nomes reais sejam aprovados. Isso impede a criação acidental de temporadas.

## 10. Ativação automática e atraso técnico

No início do mês autorizado, o Durable Object tenta ativar a temporada automaticamente.

Se a ativação atrasar, mas o mês ainda estiver em andamento, a temporada pode iniciar normalmente mantendo os limites canônicos originais.

Exemplo:

```txt
Setembro deveria iniciar: 01/09 00:00
Falha temporária resolve:  01/09 10:00

startsAt continua = 01/09 00:00
endsAt continua   = 01/10 00:00
```

As dez horas perdidas não são adicionadas a outubro.

Se a ativação falhar por erro transitório, existe retry automático de uma hora em uma hora enquanto o mês ainda for válido.

Exemplo:

```txt
00:00 falhou
01:00 retry
02:00 retry
...
```

O retry nunca atravessa o `endsAt` do mês.

## 11. Encerramento automático mensal

A temporada mensal agenda o próprio encerramento mesmo quando não existe uma temporada autorizada para o mês seguinte.

À meia-noite da virada:

```txt
1. encerrar a temporada anterior exatamente no endsAt canônico;
2. ativar o novo mês somente se ele estiver previamente autorizado;
3. recalcular o alarm compartilhado do Durable Object.
```

Se não existir temporada autorizada para o novo mês, apenas a anterior encerra. Nenhuma nova temporada é inventada.

O encerramento mensal é idempotente: processar novamente a mesma virada não encerra duas vezes.

## 12. Alarm compartilhado com o PvP

O mesmo Durable Object Alarm é compartilhado por:
- expiração de desafios;
- timeout de turnos/batalhas;
- retries transitórios do PvP;
- início de temporada;
- fim de temporada;
- retry horário de ativação.

A ordem temporal real decide qual evento ocupa o próximo alarm.

As proteções já validadas garantem que:
- um timeout PvP anterior à temporada mantém prioridade;
- limpar um alarm de batalha não apaga silenciosamente um início/fim mensal;
- múltiplas temporadas futuras preservam a mais próxima;
- retry transitório de batalha de 1 segundo não é substituído por um evento mensal mais distante.

## 13. Renomeação de temporada futura

Uma temporada ainda futura pode ser renomeada antes de começar.

Ao editar o nome:
- o planejamento anual é atualizado;
- o snapshot do agendamento também é atualizado;
- `scheduledAt` é preservado;
- `startsAt` e `endsAt` permanecem canônicos;
- o alarm não é recriado apenas por causa do nome.

Depois que a temporada já está `ACTIVE`, editar o planejamento não renomeia automaticamente a temporada em andamento.

## 14. Comandos atuais de temporada

Comando público:

```txt
!temporada
```

Quando existe uma temporada ativa, mostra o estado atual. Quando não existe temporada ativa mas existe uma futura agendada, pode informar a próxima temporada programada.

Comandos administrativos canônicos:

```txt
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

### `definir`
- define ou renomeia o nome anual;
- autoriza/agrega o agendamento interno do mês;
- não inicia a temporada imediatamente;
- só aceita meses ainda futuros;
- exige tema-base canônico configurado.

### `cancelar`
- remove o agendamento/autorização daquele mês;
- preserva o nome planejado;
- recalcula o alarm.

### `encerrar`
- ferramenta administrativa emergencial para encerrar a temporada atual.

Comandos legados desativados:

```txt
!adm temporada iniciar <ID> <nome>
!adm temporada agendar ...
```

Não existe mais duração arbitrária de 30 dias nem ID livre na interface normal.

## 15. Passe de batalha — Etapa 25

Ainda pendente.

Planejado:
- XP de temporada separado do XP normal;
- níveis progressivos;
- recompensas de XP normal;
- itens;
- consumíveis futuros;
- cosméticos/títulos;
- título exclusivo no nível final.

Quantidade exata de níveis, curva de XP e nome do título final ainda serão definidos.

## 16. Soft reset e encerramento competitivo — Etapa 26

A fórmula canônica permanece:

```txt
if rating <= 1000:
    newRating = rating
else:
    newRating = 1000 + round((rating - 1000) * 0.75)
```

Exemplos:

```txt
1200 -> 1150
1500 -> 1375
1800 -> 1600
2100 -> 1825
2400 -> 2050
2700 -> 2275
```

O fluxo completo de fim competitivo ainda será implementado separadamente:

```txt
1. congelar/salvar ranking final
2. conceder recompensas e títulos
3. registrar campeões e Prodígios
4. aplicar soft reset
5. limpar/recalcular posições de Prodígio
6. zerar XP/nível do passe encerrado
7. aguardar/ativar apenas a próxima temporada previamente autorizada
```

Importante: finalizar uma temporada nunca cria automaticamente um mês indefinido.

## 17. Estado de implantação

A arquitetura mensal mais nova está no GitHub/local e ainda não deve ser confundida com uma temporada real ativa em produção.

Regras de segurança para a liberação:
- não criar setembro de 2026 em produção agora;
- não preencher nomes oficiais no catálogo sem aprovação;
- não iniciar uma temporada manualmente só para testar;
- completar primeiro os blocos que ainda forem necessários para a primeira versão jogável;
- quando chegar o lançamento, autorizar explicitamente os meses desejados.

## 18. Próxima ordem de implementação

1. Manter a documentação sincronizada com a arquitetura mensal.
2. Fechar a Etapa 24 e validar somente regressões realmente afetadas pelas últimas mudanças.
3. Implementar Etapa 25 — XP de temporada e Passe de Batalha.
4. Implementar Etapa 26 — snapshot, recompensas de fim, soft reset e histórico sazonal.
5. Preparar a primeira temporada oficial apenas quando a versão jogável estiver pronta.
6. Fazer deploy controlado sem criar temporada não autorizada.
7. Validar em produção primeiro em modo sem temporada ativa; depois liberar o mês oficial quando decidido.

## 19. Observação de balanceamento

Os coeficientes de ranking permanecem centralizados/configuráveis para permitir ajuste sem reescrever o motor. Valores como 0.8, 1700, 800, 200, 600, caps e retenção de 75% do soft reset podem ser rebalanceados mantendo a mesma arquitetura matemática.
