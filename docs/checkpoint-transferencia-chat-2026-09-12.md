# Checkpoint de transferência — Marbion RPG V2

Data: 2026-09-12

Este arquivo existe para continuar o projeto em outro chat sem perder o estado real. Ao retomar, ler este arquivo antes de qualquer alteração e continuar exatamente da seção **PONTO EXATO DE RETOMADA**.

---

## 1. Projeto e infraestrutura

- Repositório principal: `SilenceWorky/marbion-rpg-v2`
- Branch atual: `main`
- Worker V2: `https://marbion-rpg-v2.wellingsonpl.workers.dev`
- Cloudflare KV V2: `MARBION_USERS_V2`
- Namespace id: `3731c622c6764dbc9025cef56030c23e`
- Durable Object: binding `PVP_COORDINATOR`, classe `PvpCoordinator`, instância global `marbion-global-pvp`
- Stack: Cloudflare Workers + Wrangler v4 + KV + Durable Object + StreamElements/Twitch.
- Catálogo externo: `SilenceWorky/worky-live-responses`, principalmente `skills.json`, `racas.json`, `elementos.json`.
- A V1 antiga continua preservada até a V2 ficar completa. Não apagar Worker/KV V1 ainda.

Arquivos JSON locais que permanecem untracked e NÃO devem ser commitados por engano:
- `skills-v1-1500-debuff.json`
- `skills-v1-1500-final.json`
- `skills-v1-1500.json`

Evitar `git add .` enquanto eles existirem.

HEAD confirmado no GitHub ao encerrar a sessão:
- `63beeaf3952c697ea4c2c4b142e21b64ffaa8f22` — `Adiciona Soco universal ao PvP`

Commits imediatamente anteriores relevantes:
- `a19f3a6b89c68528f79815586d80608225044d6f` — teste do Soco universal
- `2669c6fcccd38395abaf1f987b567b53b0de1030` — script de integração do Soco universal
- `aca06ed1c25176a7b7789e777097712a0a68100e` — mensagem do Ranking Dinâmico V2 com ganho/perda separados

---

## 2. Fluxo de trabalho preferido

- Trabalhar em passos curtos e controlados.
- Um teste/comando por vez quando possível.
- Sempre testar antes de deploy real.
- Depois de cada etapa, o usuário normalmente responde `foi`.
- Quando possível, editar o GitHub diretamente neste chat.
- Não usar Codex como padrão neste projeto.
- Para mudanças manuais, informar arquivo/ponto exato/indentação.
- Nunca afirmar que algo foi implementado se estiver apenas documentado.
- Não repetir testes profundos já validados em produção sem necessidade.
- Quando o usuário disser que vai dormir, gerar checkpoint imediato.

---

## 3. Estado atual do núcleo de combate

Sistemas já implementados/validados incluem:
- PvP base e fila global
- Mentalidade persistente
- Meditação
- regeneração natural fora de PvP
- buffs/debuffs
- DoTs
- controles/restrições
- crítico
- dano elemental
- combos V1
- Counter físico
- Refletir elemental
- cooldown real de habilidades
- admin PvP
- admin HP/Mentalidade e máximos
- Ranking Dinâmico V2
- anti-farm PvP
- Soco universal fora dos 4 slots

Cooldown canônico:
```txt
availableAtTurn = executedTurn + cooldown + 1
```

Soco:
- `BASIC_PUNCH_SKILL`
- custo 0
- cooldown 0
- dano base 12
- precisão 95
- escala Força
- elemento Universal

---

## 4. ADM de recursos máximos — CONCLUÍDO

Subcomandos adicionados ao `!adm`:
```txt
!adm maxhp @usuario 250
!adm maxmentalidade @usuario 120
```

Aliases implementados:
- maxhp
- hpmax
- maxvida
- vidamax
- maxmentalidade
- mentalidademax
- maxmental
- mentalmax

Regras:
- aumentar máximo preserva recurso atual
- reduzir máximo abaixo do atual faz clamp
- máximos possuem piso 1
- comportamento antigo de `!adm hp` preservado

Teste `testar_adm_max_recursos.mjs` passou completamente.

---

## 5. Ranking Dinâmico V2 — VALIDADO EM PRODUÇÃO

Fórmula canônica:
```txt
D(R) = clamp(1 + 0.8 * ((R - 1000) / 1700), 1.0, 2.2)
winBase = 30 / D(R)
lossBase = 30 * D(R)
```

Mismatch:
- vencer mais forte aumenta ganho
- vencer mais fraco reduz ganho
- forte perdendo para fraco sofre multiplicador de perda
- cálculo não é zero-sum

Caps:
- ganho máximo +75
- perda normal máxima -150
- forfeit máximo -300
- rating nunca abaixo de 0

Testes locais passaram:
- `testar_ranking_dinamico.mjs`
- `testar_antifarm_pvp.mjs`

Validação real na Twitch:

Antes:
- `@silenceworky`: 973
- `@acervojuju`: 1030

1ª luta — `@acervojuju` venceu:
```txt
@acervojuju +23 -> 1053
@silenceworky -30 -> 943
```
Resultado bateu exatamente com o esperado.

2ª luta:
```txt
@acervojuju +19 -> 1072
@silenceworky -30 -> 913
```
Resultado bateu exatamente.

3ª luta:
```txt
@acervojuju +16 -> 1088
@silenceworky -30 -> 883
```
Resultado bateu exatamente.

Conclusão: ganho/perda assimétricos e persistência de Elo estão validados em produção.

---

## 6. Anti-farm PvP — VALIDADO EM PRODUÇÃO

Regra canônica por dupla em janela móvel de 24h:
```txt
1ª partida -> ranqueada
2ª partida -> ranqueada
3ª partida -> ranqueada
4ª+        -> amistosa ±0
```

A ordem da dupla é indiferente: A×B = B×A.

Partidas amistosas continuam entrando na janela móvel para não reabrir farming imediatamente.

A 4ª luta real entre `@silenceworky` e `@acervojuju` retornou:
```txt
🤝 Partida amistosa | Esta dupla já atingiu o limite de 3 partidas ranqueadas nas últimas 24h. XP de Combate: ±0.
```

Confirmação posterior por `!rank`:

`@acervojuju`:
```txt
XP de Combate: 1088
Vitórias: 12
Derrotas: 6
PvPs: 18
Sequência: 3
Melhor sequência: 7
```

`@silenceworky`:
```txt
XP de Combate: 883
Vitórias: 7
Derrotas: 13
PvPs: 20
Sequência: 0
Melhor sequência: 2
```

Isso prova que a 4ª amistosa NÃO alterou Elo nem estatísticas ranqueadas.

Anti-farm considerado concluído/validado em produção.

---

## 7. Soco universal — NOVO E VALIDADO EM PRODUÇÃO

Problema encontrado durante teste de ranking:
- o jogador tinha 4 habilidades equipadas
- as 4 estavam em cooldown
- Soco existia apenas como fallback de slot vazio
- jogador podia ficar sem ação ofensiva disponível

Regra definida pelo usuário:
- slots 1-4 continuam equipáveis normalmente
- existe um 5º slot virtual fixo exclusivo do Soco
- esse slot NÃO pertence ao loadout
- não pode ser alterado/trocado
- comando público:
```txt
!ataque soco
```

Implementação:
- internamente `soco` normaliza para slot virtual 5
- slot 5 sempre resolve para `BASIC_PUNCH_SKILL`
- Soco continua com custo 0 e cooldown 0
- permanece disponível mesmo se as quatro skills normais estiverem em cooldown

Testes locais:
`node testar_soco_universal.mjs`

Todos passaram:
- slot 5 virtual existe
- `!ataque soco` reconhecido
- normalização para slot 5
- resolução para `BASIC_PUNCH_SKILL`
- custo 0
- cooldown 0
- permanece disponível com outras skills em cooldown
- usar Soco não inicia cooldown

Validação real na Twitch:
```txt
⚔️ @silenceworky escolheu a habilidade 5. Aguardando @acervojuju.
```
Depois, ao resolver o turno:
```txt
⚔️ Turno 1 | @silenceworky: Soco | @acervojuju: Soco | ...
```

O Soco executou normalmente, causou dano quando acertou, pôde errar normalmente e avançou o turno.

Soco universal considerado mecanicamente concluído e validado em produção.

### Pequeno detalhe visual pendente
Durante a espera ainda aparece:
```txt
@usuario escolheu a habilidade 5
```

O slot 5 deveria ser apenas interno. Melhor mensagem futura:
```txt
⚔️ @usuario escolheu uma ação. Aguardando @oponente.
```

Não revelar `Soco` antes do adversário escolher, para não quebrar o princípio atual de escolha oculta.

Também foi observado uma vez um `]` ao final de `Turno 2 iniciado.]`. O código do Worker monta a frase sem `]`, então investigar a configuração do StreamElements antes de alterar o Worker por causa disso.

---

## 8. Testes de regressão que passaram nesta sessão

Passaram completamente:
- `node testar_ranking_dinamico.mjs`
- `node testar_antifarm_pvp.mjs`
- `node testar_fila_global_pvp.mjs`
- `node testar_fila_global_pvp_integracao.mjs`
- `node testar_fila_global_pvp_hardening.mjs`
- `node testar_adm_pvp.mjs`
- `node testar_adm_max_recursos.mjs`
- `node testar_soco_universal.mjs`
- `node --check src/durable/PvpCoordinator.js`
- `node --check src/routes/attack.js`
- `npx wrangler deploy --dry-run`

Deploy real também foi concluído e as mudanças foram validadas na Twitch.

Não repetir a bateria inteira sem motivo.

---

## 9. Fila Global de PvP — JÁ CONCLUÍDA

Não repetir o teste profundo em produção.

Estado validado:
- só uma batalha global ativa
- duplas aceitas entram na fila
- FIFO
- jogador não duplica em fila/batalha
- promoção automática após fim natural ou ADM
- batalha anterior vira FINISHED antes da promoção
- promoção não aplica ranking na luta recém-iniciada

---

## 10. Próxima ordem canônica

A ordem atual permanece:

1. Ranking Dinâmico V2 ✅ PRODUÇÃO
2. Anti-farm A×B ✅ PRODUÇÃO
3. `!recusar` ⏭️ PRÓXIMO
4. `!desistir` / forfeit
5. timeout + hardening
6. ADM reset Elo individual/global
7. seasons + soft reset
8. Season 1 battle pass
9. Support skills
10. aprendizado automático de skill por nível
11. Combos Elementais V2
12. efeitos especiais Tempo/Espaço/Gravidade/Matéria
13. individualidade básica do personagem
14. fundação Multistreamer/site/bot próprio

---

## 11. `!recusar` — REGRA JÁ DEFINIDA, AINDA NÃO IMPLEMENTADA

Regra aprovada:
- somente o jogador desafiado pode recusar
- remove imediatamente o desafio pendente
- sem penalidade
- não deve cancelar uma dupla que já aceitou e entrou na fila global, salvo decisão explícita futura

Ainda não existe rota/comando de produção para isso.

---

## 12. `!desistir` / forfeit — PLANEJADO, NÃO IMPLEMENTADO

Regra já discutida:
- quem desiste recebe 2× a perda normal do matchup
- cap de perda por forfeit: -300
- vencedor NÃO recebe recompensa dobrada
- desistência antes do Turno 3: desistente leva a perda dobrada, adversário recebe 0 Elo
- Turno 3+: vencedor recebe Elo normal, respeitando anti-farm

O motor de ranking já possui suporte estrutural a `forfeit` / `earlyForfeit`, mas ainda falta rota/integração completa.

---

# 13. PONTO EXATO DE RETOMADA

Ao voltar:

1. Ler este checkpoint.
2. Não refazer Ranking Dinâmico, anti-farm, fila global ou Soco universal: todos já foram validados em produção.
3. Opcionalmente corrigir primeiro o pequeno texto visual da espera do Soco (`habilidade 5` -> `escolheu uma ação`) se o usuário quiser fechar esse detalhe antes de avançar.
4. Atualizar `cmdrpg.md` para registrar explicitamente:
   - Ranking Dinâmico V2 validado em produção
   - anti-farm validado em produção
   - Soco universal como slot virtual fixo via `!ataque soco`
   - data canônica 12/09/2026
5. Em seguida iniciar a implementação de **`!recusar`**.

Regra de `!recusar` a implementar:
```txt
!recusar
```
- apenas o alvo do desafio pendente pode usar
- remove o desafio imediatamente
- sem penalidade
- resposta clara no chat
- não interfere em PvP já ativo
- não interfere em dupla já enfileirada após `!aceitar`

Depois de `!recusar`, seguir para `!desistir`.

---

## 14. Observação final

O usuário encerrou a sessão informando que iria dormir logo após a confirmação final do anti-farm em produção.

Estado técnico ao encerrar:
- Worker atualizado
- GitHub atualizado
- Ranking Dinâmico V2 validado
- Anti-farm validado
- Soco universal validado
- próximo sistema real: `!recusar`
