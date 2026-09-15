# Marbion RPG V2 — Checkpoint de transferência de chat

Data canônica: **2026-09-14**

Este arquivo existe para continuar o projeto em um novo chat sem perder contexto. O próximo chat deve ler este documento antes de alterar código.

---

# 1. Regras de trabalho deste projeto

- Repositório: `SilenceWorky/marbion-rpg-v2`, branch `main`.
- Fluxo preferido do usuário: **um comando ou teste por vez**, esperar o resultado e só então continuar.
- O assistente deve editar o GitHub quando apropriado; o usuário normalmente apenas executa `git pull --ff-only` e testes locais no Codespace.
- Não repetir baterias profundas já validadas sem motivo técnico.
- Nunca tratar algo planejado como implementado.
- Sempre distinguir claramente: **GitHub/local**, **deploy atual em produção** e **planejado**.
- Nunca criar uma temporada real em produção sem autorização explícita do usuário.
- Nunca pedir nem exibir segredos/tokens/chaves.
- A `MARBION_ADMIN_KEY` já foi exposta uma vez em screenshot e foi rotacionada; nunca pedir para o usuário colar ou mostrar a chave.
- Nunca usar `git add .`.
- Arquivos locais protegidos que não devem ser apagados nem commitados por engano:
  - `skills-v1-1500-debuff.json`
  - `skills-v1-1500-final.json`
  - `skills-v1-1500.json`
- Se aparecer `__pycache__/`, pode remover; não mexer nos JSONs protegidos.

---

# 2. Infraestrutura conhecida

Worker de produção:

```txt
https://marbion-rpg-v2.wellingsonpl.workers.dev
```

KV V2:

```txt
Binding: MARBION_USERS_V2
Namespace: 3731c622c6764dbc9025cef56030c23e
```

Durable Object:

```txt
Binding: PVP_COORDINATOR
Classe exportada final: PvpCoordinator
Instância global: marbion-global-pvp
```

Conteúdo externo:

```txt
SilenceWorky/worky-live-responses
```

Arquivos externos relevantes:

```txt
racas.json
elementos.json
skills.json
```

Último Version ID de produção conhecido neste checkpoint:

```txt
3f3715c2-f785-412f-bf80-92b7d18ccfda
```

A produção ainda não recebeu a arquitetura mensal nova descrita abaixo. Não fazer deploy sem fechar os pontos restantes.

---

# 3. Estado geral do roadmap

Etapas 16–23 estão concluídas.

Etapa 24 — **Temporadas**: em desenvolvimento avançado. A infraestrutura mensal, planejamento, agendamento, ativação, encerramento automático, catálogo e comandos ADM foram implementados no GitHub/local, mas **ainda não devem ser considerados deployados em produção**.

Etapa 25 — Passe de batalha da Temporada 1: pendente.

Etapa 26 — Soft reset de Elo no fim da temporada: pendente.

Etapa 27 — Administração: base atual implementada; expansões futuras continuam pendentes.

Roadmap original preservado:

1. Fundação técnica
2. Perfil e progressão básica
3. Recompensas básicas
4. Elementos e fusões
5. Catálogo e uso de habilidades
6. Aprendizado de habilidades por nível
7. Mentalidade
8. HP, cura, buffs e debuffs
9. DoTs
10. Controles e restrições
11. Cooldown
12. Crítico
13. Counter e Refletir
14. Combos Elementais V1
15. PvP básico
16. Fila Global de PvP
17. Ranking atual
18. Ranking Dinâmico V2
19. Anti-farm
20. `!recusar`
21. `!desistir` / forfeit
22. Timeout e hardening
23. Reset administrativo de Elo
24. Temporadas
25. Passe de batalha da Temporada 1
26. Soft reset
27. Administração atual
28. Habilidades de suporte
29. Combos Elementais V2
30. Tempo, Espaço, Gravidade e Matéria
31. Tags
32. Inventário e itens
33. Morte e reencarnação
34. Rebuff
35. Armas Vínculos
36. Mobs V2
37. Bosses / Raid Boss
38. Individualidade do personagem
39. Skin/personagem visual
40. Plataforma Multi-Streamer
41. Marbion Bot próprio
42. Painel de streamer
43. Cargos e permissões multi-streamer
44. Página exclusiva “Streamers”
45. Habilidades Características
46. Overlays Multi-Streamer
47. Eventos globais Multi-Streamer
48. Social
49. Economia
50. Mundo
51. Profissões/outros
52. Fim da V1
53. reservado para infraestrutura/migração

---

# 4. Sistemas PvP já fechados — não retestar profundamente sem necessidade

Já concluídos e validados anteriormente:

- Fila Global de PvP.
- Ranking Dinâmico V2.
- Anti-farm de 24h: 3 primeiras lutas ranqueadas por dupla; 4ª+ amistosa.
- `!recusar`.
- `!desistir` / forfeit.
- Timeout/AFK com Durable Object Alarm.
- Avisos autônomos pela Twitch.
- Resultado PvP exact-once.
- Reset individual de Elo.
- Reset geral de Elo por geração.
- `!rank @usuario`.
- Cooldown real.
- Crítico.
- Combos Elementais V1.
- Counter/Refletir.
- Mentalidade e regeneração fora de PvP.

Ranking canônico:

```txt
D(R) = clamp(1 + 0.8 * ((R - 1000) / 1700), 1.0, 2.2)
winBase = 30 / D(R)
lossBase = 30 * D(R)
```

Caps:

```txt
+75 vitória normal
-150 derrota normal
-300 desistência
rating mínimo 0
```

Elos:

```txt
0–1099 Prata III
1100 Prata II
1200 Prata I
1300 Ouro III
1400 Ouro II
1500 Ouro I
1600 Platina III
1700 Platina II
1800 Platina I
1900 Diamante III
2000 Diamante II
2100 Diamante I
2200 Corrompido III
2300 Corrompido II
2400 Corrompido I
2500 Imperador III
2600 Imperador II
>=2700 Imperador I
```

Prodígios: top 7 elegíveis com 2700+.

Cooldown canônico:

```txt
availableAtTurn = executedTurn + cooldown + 1
```

---

# 5. Temporadas — regra canônica atual

A arquitetura antiga de **30 dias fixos** foi substituída por temporadas mensais de calendário civil.

Regra central:

```txt
Tema-base = permanente por mês
Nome da temporada = varia por ano
Definição = pode existir meses/anos antes
Catálogo pré-definido = autoriza/prepara os meses
Agendamento interno = automático a partir do catálogo/storage
Ativação = automática somente para temporada previamente autorizada
Atraso técnico dentro do mesmo mês = ativa com limites canônicos; tempo perdido não é reposto
Mês já encerrado = não ativa retroativamente
```

Timezone canônico:

```txt
America/Fortaleza
UTC -03:00
```

Exemplo de setembro:

```txt
startsAt = 01/09 00:00
endsAt   = 01/10 00:00
```

Se a ativação ocorrer 10 horas atrasada em 01/09 às 10:00, a temporada ativa normalmente, porém continua terminando em 01/10 às 00:00. As 10 horas são perdidas, não carregadas para outubro.

Se agosto só for processado já em setembro, agosto não inicia. Se setembro também estiver autorizado, setembro pode iniciar normalmente.

Nenhum mês indefinido deve gerar uma temporada automaticamente.

---

# 6. Temas-base canônicos atualmente configurados

Em `src/systems/pvp-season-calendar.js`:

```txt
Agosto    — Arquivo do Infinito
Setembro  — Jardim do Criador
```

Nenhum outro mês deve ser tratado como canônico sem confirmação.

Ideias provisórias, **não codificar sem confirmação**:

```txt
Janeiro   — Novo Amanhecer
Fevereiro — Festival das Cores
Março     — Marcha das Tempestades
Abril     — Véu das Ilusões
Maio      — Florescimento de Auroris
Junho     — Fogueiras de Marbion
Julho     — Coração do Inverno
Outubro   — Noite do Terror
Novembro  — Marcha do Caos
Dezembro  — Festival de Natal
```

---

# 7. Commits principais da infraestrutura mensal

Calendário mensal:

```txt
4faebbf4750ffc12281877ffb60b13a0a39d2311  Cria calendário mensal de temporadas
b65d9055c7407b485199b560b9bef8f25aee0cc0  Testes do calendário
```

Metadados/core/service:

```txt
626d0b07f40413308b195c979da1fa1966300a1f
9102398d17a665de0b6b62bca8d927d736ebfe31
63260f4ed80a6c6c26b04cd0275a3c1f6799deda
```

Coordinator mensal:

```txt
2ac74cdd38d028477c7b7f3cdeacb4f4929566f8
 d54a5d15f94f230fed56766fff8c947c00818c9d
```

Planejamento anual:

```txt
ed12595a21309a0b85c46179782434b03f2b2775
051826d0e3d3a164d6a68cdbb2614feb775cfffb
f3afc015879627e9c8b48777ad9bace07a6ae50e
```

Agendamento:

```txt
41be6a8818e0e7f6174c931ceb8a3f56670cc5e1
60f965cec01669c2d0393fb95f4a9ed5883224a1
869e181beb92cb02bd7aa15862389b729b244b9b
600639051e34dbbc697da5a0f015cca863052a52  idempotência estrita
1ab857340eb061e529b0d96b4616687970b214c4  bounds persistidos canonicalizados
```

Temas + ativação:

```txt
63c746528680a87698e1c273edeb4bbcad8e073d  registry de temas-base
349d0ae794cd652af5deabb68528643cc88fa117  ativação
bd2d74fe...                                      testes de ativação
```

Helper da próxima temporada:

```txt
377715fa...
43875aa...
```

Integração de alarm no coordinator:

```txt
4a4060bf...
6d810d4...
5eb7881f...
ed9c560...
85b9f391...
f8673698...
c73291bc...
4953aaf...
e680cd67a003111062b94bc687bdf2f931cfba15
```

Encerramento mensal automático:

```txt
1b676410232113a247bfc6217c07266fd434a696  módulo de expiração
248cc862b90a24f1e6258b839279b7a2ae12857f  teste de encerramento
8d4731a9c9e17bf6ca458678b55d04382cc3d16e  integração no alarm final
4e5249920dbe7968581a394d1de636f33315a5a5  teste da virada mensal
```

Ativação atrasada sem prorrogação:

```txt
4485dd2fca78e86a30f4a411acd1aa2f7c00b843  teste de regressão
```

Resultado local validado:

```txt
✅ atraso de 10h ativa o mês autorizado
✅ startsAt fica na meia-noite original
✅ endsAt continua na próxima virada mensal
✅ mês anterior não inicia quando já virou o calendário
✅ novo mês autorizado pode ativar normalmente
```

---

# 8. Renomeação de temporada futura

Regra aprovada:

- Antes de a temporada começar, mudar o nome também atualiza o snapshot do agendamento.
- `scheduledAt`, `startsAt`, `endsAt` e o alarm não mudam.
- Repetir o mesmo nome é idempotente.
- Depois que a temporada já está ACTIVE, editar o planejamento não renomeia automaticamente a temporada em andamento.

Commits:

```txt
5fd7d1d9c43af172d3c8e7c6bd34e2a6cf3610aa  Sincroniza nome editado com temporada agendada
a780d2412a8c15d68856ddfe122965d21c6f39b2  Propaga edição de nome ao agendamento futuro
57ebf359b9b7323c6fcaf1fb75832dba8fcae209  Teste de edição do nome
```

Teste local passou integralmente.

---

# 9. Retry horário de ativação

Regra aprovada:

Se a ativação falhar tecnicamente na virada do mês:

- o agendamento continua salvo;
- o sistema tenta de novo **uma vez por hora**;
- falhou 00:00 → tenta 01:00;
- falhou 01:00 → tenta 02:00;
- a ativação recuperada continua usando `startsAt` e `endsAt` canônicos;
- o retry nunca deve prolongar a temporada para o mês seguinte.

Commits:

```txt
2244d8dc9e1e51ad41848953900ea185ef26fabb  Retry horário
52c18e176eca5c957da0593eb6d30a5b6e075bfe  Teste de retry
```

Teste local passou integralmente. Durante a simulação apareceu de propósito:

```txt
[PVP_SEASON_ACTIVATION] SEASON_STORAGE_WRITE_FAILED
```

Depois, o retry das 01:00 ativou normalmente e o próximo alarm voltou a apontar para o encerramento mensal.

---

# 10. Comandos ADM de temporada — interface nova

A interface antiga foi aposentada.

Comando antigo agora bloqueado:

```txt
!adm temporada iniciar <ID> <nome>
```

Também não existe comando rotineiro `agendar`.

Interface nova:

```txt
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

Semântica:

### `definir`

- cria ou renomeia o planejamento anual;
- autoriza/agenta internamente o mês futuro;
- não inicia a temporada imediatamente;
- só permite meses cujo tema-base já esteja canonicamente configurado;
- não permite criar uma nova autorização manual depois que o mês já começou.

Exemplo:

```txt
!adm temporada definir 2027 9 Jardim do Amanhã
```

### `cancelar`

- remove o agendamento/autorização do mês;
- preserva o nome planejado;
- recalcula o alarm;
- se a temporada já estiver ACTIVE, usar `encerrar`.

### `encerrar`

- permanece como ferramenta administrativa emergencial para a temporada atual.

Commits:

```txt
a0da587e522568e7a034ac0238b9cdf9eb757553  Refatora comandos ADM
2995239080b1fd570973b515548092514e0c2736  Teste dos comandos ADM
```

Teste local passou integralmente:

```txt
✅ definir cria planejamento + autorização + alarm sem iniciar na hora
✅ redefinir nome preserva autorização temporal
✅ iniciar legado bloqueado
✅ mês sem tema-base bloqueado
✅ cancelar remove agendamento e preserva nome
✅ definir tardio bloqueado
✅ encerrar ACTIVE continua funcionando
```

---

# 11. Catálogo pré-definido de temporadas

Arquivos:

```txt
src/config/pvp-season-catalog.js
src/systems/pvp-season-catalog-sync.js
```

Catálogo atualmente vazio por decisão consciente. Não inventar nomes oficiais.

Commit base do catálogo:

```txt
c37854ce9123d1b600c4fcf5ab0727ba72c6c4e6
```

Sincronizador:

```txt
eaa3306557d27678fe3ec56cda579d27162dcbbe
```

Regras já implementadas:

- catálogo preenche lacunas;
- definição persistida no storage/site tem prioridade;
- agendamento persistido existente é preservado;
- remover uma entrada do catálogo não apaga automaticamente storage antigo;
- futuro site deve escrever storage oficial, não editar `.js` diretamente;
- nenhum mês indefinido é inventado.

Cron automático:

```txt
3a0f420...  rota /season/catalog/sync
470f6ff...  scheduled handler no index.js
c36ee18...  cron diário 12:00 UTC = 09:00 America/Fortaleza
```

---

# 12. Ponto semântico ainda aberto e importante — catalog sync no próprio mês

Este é um dos próximos assuntos a revisar no novo chat.

Hoje `syncPvpSeasonCatalog()` possui lógica histórica que pula entradas quando:

```txt
entry.startsAt <= now
```

Ou seja, se o cron/catalog sync só perceber uma entrada do catálogo depois da meia-noite do dia 1, ele não cria o agendamento daquele mês.

Isso pode entrar em conflito com a regra mais nova aprovada pelo usuário:

> uma temporada previamente autorizada pode ativar atrasada durante o próprio mês, mantendo os limites canônicos.

Pergunta a fechar:

- O **catálogo em código** deve ser considerado autorização suficiente para permitir bootstrap tardio durante o mesmo mês se o cron não tiver persistido o schedule antes da virada?

Provável direção arquitetural: sim, porque o catálogo já é uma autorização oficial. Porém isso **não foi alterado ainda** e deve ser discutido/validado antes de mudar código.

Não alterar silenciosamente.

---

# 13. Virada mensal automática

Regra implementada e validada:

1. Na meia-noite do primeiro dia do mês seguinte, a temporada anterior encerra exatamente em seu `endsAt` canônico.
2. Se o novo mês estiver previamente autorizado/agendado, ele ativa.
3. Se o novo mês não estiver definido, somente a anterior encerra; nenhuma nova temporada é inventada.
4. Mesmo sem próxima temporada, a temporada ativa agenda o próprio `endsAt`, para não ficar ACTIVE/EXPIRED para sempre.
5. Se o alarm atrasar, `endedAt` continua sendo o `endsAt` canônico antigo, não o horário real de execução.
6. Na fronteira exata: **encerra a antiga antes de ativar a nova**.

Teste local da virada mensal passou integralmente.

---

# 14. Shared Durable Object Alarm

O mesmo DO alarm é compartilhado entre:

- expiração de desafio;
- timeout de batalha;
- retry PvP transitório;
- início de temporada;
- retry de ativação mensal;
- encerramento mensal.

Arquitetura final exportada:

```txt
src/durable/PvpCoordinatorCatalogEntry.js
```

Ela herda:

```txt
PvpCoordinatorEntry.js
```

que herda o motor PvP antigo em:

```txt
PvpCoordinator.js
```

Motivo: evitar editar casualmente o arquivo-base grande e sensível de combate.

Existe um bug legado conhecido no base scheduler:

```txt
Number(null) === 0
```

O base pode criar um candidato fantasma de challenge quando não existe challenge. A camada final já possui mitigação e recuperação explícita do candidato real de batalha.

Não mexer no base gigantesco sem necessidade forte.

Hardening já validado:

- limpar alarm de batalha preserva season start/end;
- prioridade PvP x temporada correta;
- múltiplas temporadas futuras funcionam;
- retry PvP de 1 segundo não é destruído pelo scheduler de temporada;
- regressão global PvP já passou anteriormente.

Evitar rerodar a bateria global completa sem motivo.

---

# 15. Rotas internas de planejamento/agendamento

No coordinator:

```txt
/season/plan?year=YYYY
/season/plan/define?year=YYYY&month=M&name=...
/season/schedule?year=YYYY
/season/schedule/add?year=YYYY&month=M
/season/schedule/cancel?year=YYYY&month=M
/season/schedule/next
/season/catalog/sync
```

O comando público `!temporada` já possui fallback para mostrar próxima temporada agendada quando não existe temporada ACTIVE.

---

# 16. Documentação atualizada

O documento antigo:

```txt
docs/ranking-temporadas-roadmap-2026-09-11.md
```

foi atualizado para remover a arquitetura de 30 dias fixos e registrar o calendário mensal novo.

Commit:

```txt
b09881a86b36fd7c295a8e8dc3170009406fec05  Atualiza roadmap de temporadas para calendario mensal
```

**Atenção:** no momento em que este checkpoint foi criado, o usuário ainda não havia confirmado o `git pull --ff-only` desse commit de documentação no Codespace. O novo chat deve primeiro verificar se o local já está atualizado para este checkpoint/HEAD.

---

# 17. Próximos pontos antes de deploy de temporadas

Ordem recomendada no próximo chat:

1. Verificar `git pull --ff-only` e confirmar que o checkpoint e o commit de documentação chegaram ao Codespace.
2. Resolver **catalog sync same-month delayed bootstrap**.
3. Revisar se existe algum outro caso de falha de ativação/encerramento que ainda possa deixar schedule órfão.
4. Fazer apenas regressões focadas do shared alarm após qualquer mudança sensível.
5. Atualizar `cmdrpg.md`, que ainda estava com texto antigo de temporadas de 30 dias / `!adm temporada iniciar` no último estado conhecido.
6. Revisar rotas públicas/admin antigas restantes para garantir que nenhuma exponha a semântica arbitrária/30 dias.
7. Só depois decidir se a Etapa 24 está pronta para deploy técnico.
8. Não criar setembro/qualquer temporada real em produção automaticamente.
9. Etapa 25: passe de batalha.
10. Etapa 26: snapshot final, recompensas e soft reset.

---

# 18. Soft reset futuro — fórmula canônica

Ainda não implementado para encerramento de temporada:

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

Fluxo conceitual futuro:

```txt
snapshot final
→ recompensas/títulos
→ histórico de campeões/Prodígios
→ soft reset
→ recalcular Prodígios
→ reset do passe
→ aguardar próxima temporada autorizada
```

Importante: **não iniciar automaticamente uma temporada indefinida**.

---

# 19. PADM / administração futura

Ainda planejamento:

- ADM confiável: `!adm`, com permissões estruturais.
- PADM parceiro: somente `!padm`, allowlist/default-deny, audit/rate limits.
- PADM pode ter mobs de ranks D, B e A conforme decisão já registrada; C foi omitido pelo usuário, não assumir.
- Nunca S/SS para PADM.
- Cooldowns e drop multipliers ainda não definidos.
- Integração com pontos da Twitch é futura.

---

# 20. Produção V1 — preservar até a migração total

Infra V1 ainda deve ser preservada como referência até a V2 ficar completa.

Worker antigo:

```txt
https://marbion-race-api.wellingsonpl.workers.dev/
```

KV/binding antigo:

```txt
MARBION_USERS
```

Spawn automático de mobs V1 é controlado no `scheduled()` do Worker monolítico antigo via Cron Trigger.

Flag KV:

```txt
__mob_spawn_enabled__
```

Rotas antigas:

```txt
/moboff -> grava "false"
/mobon  -> grava "true"
```

Não desativar/apagar a V1 enquanto Mobs, Bosses, tags, armas e demais sistemas legados ainda dependerem dela.

---

# 21. Cloudflare quota — diagnóstico conhecido

Já ocorreu estouro do free tier de Durable Objects:

```txt
Exceeded allowed volume of requests in Durable Objects free tier.
```

Sintomas possíveis:

```txt
unable to make request
HTTP 500
1101
```

Ao ver 1101/erros DO, verificar quota antes de assumir bug de código.

---

# 22. Estado exato no fechamento deste chat

Último commit funcional/testado antes da documentação:

```txt
2995239080b1fd570973b515548092514e0c2736
```

Último commit de documentação antes deste checkpoint:

```txt
b09881a86b36fd7c295a8e8dc3170009406fec05
```

O usuário já executou e passou:

```txt
node testar_ativacao_atrasada_sem_prorrogar_temporada.mjs
node testar_edicao_nome_temporada_agendada.mjs
node testar_retry_horario_ativacao_temporada.mjs
node testar_comandos_adm_temporada_mensal.mjs
```

Todos passaram integralmente.

O passo que estava pendente imediatamente antes do encerramento do chat era apenas:

```bash
git pull --ff-only
```

para trazer o commit de documentação `b09881a8...`.

Como este próprio checkpoint foi criado depois disso no GitHub, no novo chat o primeiro comando local mais seguro será novamente:

```bash
git pull --ff-only
```

Depois verificar o HEAD e continuar a partir do item **12 — catalog sync same-month delayed bootstrap**.

---

# 23. Prompt recomendado para iniciar o próximo chat

Copiar e colar:

```txt
Continue o projeto Marbion RPG V2. Leia no GitHub `docs/checkpoint-transferencia-chat-2026-09-14.md` e continue exatamente de onde paramos. Trabalhe um comando/teste por vez e não crie nenhuma temporada em produção sem minha autorização explícita.
```

---

# 24. Observação final de continuidade

Este checkpoint é a fonte de transferência entre chats. Quando houver conflito entre memória antiga e código atual, verificar o GitHub antes de decidir. Para regras de temporada, priorizar as decisões mensais mais recentes deste arquivo sobre qualquer documentação histórica de “30 dias”.
