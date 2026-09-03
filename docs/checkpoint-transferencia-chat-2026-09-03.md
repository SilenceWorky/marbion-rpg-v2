# Checkpoint completo — transferência de chat

Data: 2026-09-03
Projeto: Marbion RPG V2
Repositório principal: `SilenceWorky/marbion-rpg-v2`

Este arquivo existe para permitir continuar o projeto em outro chat sem perder decisões, regras, bugs já corrigidos, validações reais na Twitch e o ponto exato de continuidade.

---

## 1. Infraestrutura atual

- Worker V2: `https://marbion-rpg-v2.wellingsonpl.workers.dev`
- KV V2: `MARBION_USERS_V2`
- Namespace ID: `3731c622c6764dbc9025cef56030c23e`
- Durable Object: `PVP_COORDINATOR`
- Classe: `PvpCoordinator`
- Nome global usado: `marbion-global-pvp`
- Caminho no Codespace: `/workspaces/marbion-rpg-v2`
- Wrangler v4.

### V1 NÃO APAGAR AINDA

Preservar até a migração final:
- Worker V1 antigo: `https://marbion-race-api.wellingsonpl.workers.dev/`
- KV antigo/binding: `MARBION_USERS`
- V1 monolítica ainda é referência e backup.
- Spawn automático antigo já foi desabilitado.
- Só remover Worker/KV/rotas V1 depois da V2 estar completamente validada e com backup/export do KV antigo.

---

## 2. Regras de trabalho com o usuário

- Responder em português.
- Trabalhar uma etapa por vez.
- Sempre testar antes de commit/deploy real.
- Antes de deploy: syntax check + testes do sistema novo + regressões + `npx wrangler deploy --dry-run`.
- Só depois fazer `npx wrangler deploy` real.
- Ao fornecer código para colar em arquivo existente, entregar com a indentação exata do ponto de inserção.
- O usuário prefere que alterações no GitHub sejam feitas automaticamente quando possível.
- Não pedir segredo/chave ADM.
- Não usar `git add .` porque existem JSONs locais que não devem ser commitados:
  - `skills-v1-1500-debuff.json`
  - `skills-v1-1500-final.json`
  - `skills-v1-1500.json`
- Quando o usuário disser que vai dormir, mandar comandos de checkpoint.
- Depois do incidente com Ilusão: quando o usuário questionar uma regra estrutural que possa já existir, primeiro conferir código/docs/histórico e explicar o estado atual antes de alterar. Não transformar uma dúvida em mudança destrutiva automaticamente.

---

## 3. Perfil / persistência

Foi corrigido um bug importante de persistência em que mudanças de Status pareciam salvar, mas eram sobrescritas ao entrar em PvP por cópia antiga do KV.

Sistema atual usa persistência forte em `src/core/database.js` e sincronização com o Durable Object.

Validação feita:
- perfil forte ignora cópia antiga do KV;
- entrar em PvP preserva Status mais recente;
- KV continua espelhado sem restaurar dados velhos.

Arquivo de teste:
- `testar_persistencia_perfil_forte.mjs`

### Perfil-base atual

Campos de Status:
- `strength`
- `magicStrength`
- `speed`
- `evasion`
- `accuracy`
- `defense`
- `statusPoints`

Mentalidade:
- `mentalidade`
- `maxMentalidade`
- `lastMentalidadeRegenAt`

Skills:
- `skills`
- `skillMeta`
- `equippedSkills`
- `skillCooldowns`

---

## 4. Progressão / Status

XP de nível usa curva:

```js
Math.round(200 * Math.pow(level, 1.18))
```

Cada level concede 1 Status Point.

`!status` mostra os atributos.

### Reset ADM de Status — VALIDADO EM PRODUÇÃO

Comando:

```text
!adm status reset @usuario
```

Regra definida pelo usuário:
- zera TODOS os Status Points guardados;
- remove TODOS os pontos distribuídos;
- volta para:
  - Força: 5
  - Força Mágica: 5
  - Velocidade: 5
  - Evasão: 5
  - Precisão: 90
  - Defesa: 5
  - Pontos: 0

Validado ao vivo em `@SilenceWorky` e `@acervojuju`.

Observação: o perfil-base antigo ainda tinha `defense: 0`; o reset ADM foi definido pelo usuário com Defesa 5. Decidir futuramente se novos personagens também devem nascer com Defesa 5.

Commit principal:
- `eca6c4817369abf63c87bb492f894cf28de8c601` — `Adiciona comando ADM para resetar Status`

---

## 5. PvP base

Sistema Pokémon-like:
- desafio/aceite;
- 4 slots de habilidade;
- ambos escolhem via `!ataque N`;
- primeiro jogador só revela o slot escolhido, não a habilidade;
- turno resolve quando os dois escolherem;
- ordem: prioridade da skill > Velocidade > 50/50 em empate;
- segundo só age se sobreviver;
- loadout/stats são snapshotados no aceite;
- Soco é fallback virtual em slot vazio;
- Mentalidade gasta apenas quando a ação realmente executa;
- skill temporária de personagem Neutro só é consumida quando executa;
- se Controle/Sono/etc impedir execução, não gasta Mentalidade nem consome skill temporária.

### ADM para encerrar PvP — VALIDADO

```text
!adm pvp empate
!adm pvp vitória @usuario
```

Resultado ADM padrão:
- encerra sem alterar Elo/estatísticas ranqueadas;
- persiste Mentalidade restante;
- libera jogadores para novo PvP.

Documento:
- `docs/adm-pvp-especial.md`

Modificadores especiais de PvP estão documentados para futuro, mas NÃO implementar ainda sem necessidade:
- Mentalidade infinita;
- Mentalidade desligada;
- apenas Físico;
- Elemental desligado;
- cura desligada;
- Controle desligado;
- DoT desligado;
- multiplicador de dano etc.

---

## 6. Mentalidade / Meditação

### Regeneração natural — VALIDADA EM PRODUÇÃO

Regra:
- só fora de PvP;
- `+1 Mentalidade a cada 5 minutos`;
- durante PvP não regenera;
- PvP começa com Mentalidade REAL do perfil, não cheia automaticamente;
- Mentalidade restante ao fim do PvP volta ao perfil;
- timer de regeneração reinicia ao terminar batalha.

Arquivos:
- `src/systems/mentalidade-regen.js`
- `testar_regen_mentalidade.mjs`
- `testar_regen_mentalidade_pvp.mjs`
- `testar_ciclo_regen_mentalidade_pvp.mjs`

### Meditação — VALIDADA

- recupera 25 Mentalidade;
- cooldown próprio de 3 turnos completos;
- prioridade -1;
- comando `!meditar`;
- se morrer antes de meditar, não recebe recuperação/cooldown.

---

## 7. Efeitos/debuffs/controles concluídos

Todos abaixo foram implementados e validados, vários também em produção/Twitch:

### DoT
- ☠️ Veneno ✅
- 🔥 Queimadura ✅
- 🩸 Sangramento ✅

Motor genérico de DoT:
- tipos diferentes coexistem;
- mesmo tipo reaplicado renova duração e mantém dano mais forte;
- ticks no início do novo turno;
- pode matar antes das ações;
- dupla morte simultânea por DoT gera empate;
- causa de derrota dinâmica.

### Controle
- ⚡ Paralisia ✅
- ❄️ Congelamento ✅
- 💫 Atordoamento ✅

Motor genérico de Controle:
- bloqueia ação;
- se efeito chega antes da ação, pode bloquear no mesmo turno;
- se chega depois que alvo agiu, bloqueia ação futura;
- ação bloqueada não gasta Mentalidade nem skill temporária.

### Outros
- 🌑 Cegueira ✅
- 🤐 Silêncio ✅
- 🐌 Lentidão ✅
- 😵 Confusão ✅
- 💤 Sono ✅

#### Cegueira
- reduz Precisão;
- duração corrigida para não depender indevidamente da ordem de Velocidade;
- restaura Precisão ao expirar.

#### Silêncio
- bloqueia habilidades não Físicas;
- Soco/Físicas permitidos;
- Meditação permitida;
- ação proibida não gasta Mentalidade.

#### Lentidão
- reduz Velocidade;
- altera ordem dos turnos futuros;
- restaura corretamente ao expirar.

#### Confusão
- 2 ações verificadas;
- pode causar 10 de auto-dano e perder a ação;
- se superar teste, age normalmente;
- auto-dano não executa/não consome skill selecionada;
- reaplicação renova sem duplicar.

#### Sono — VALIDADO 100% EM PRODUÇÃO

Habilidade piloto: `Quebra de Consciência [Psíquico]`.

Regras validadas:
- aplica Sono por 2 ações;
- aparece no `!estado` como Dormindo;
- bloqueia ação;
- não gasta Mentalidade;
- conta 2 → 1 → 0;
- acorda naturalmente após 2 ações;
- dano direto recebido depois da aplicação acorda imediatamente;
- dano zero não acorda;
- reaplicação renova sem duplicar.

Bug corrigido: `Quebra de Consciência` antes estava caindo no Debuff genérico e reduzindo Precisão em vez de causar Sono.

---

## 8. Elementos / fusões — ATENÇÃO ESPECIAL

Houve um erro durante o desenvolvimento: Ilusão foi removida por engano ao interpretar que era nome legado de Psíquico.

REGRA CORRETA:

```text
Psíquico + Luz → Ilusão
```

Ilusão EXISTE e é elemento de fusão.

Habilidades como `Véu Ilusório Ascendente` devem continuar `[Ilusão]`.

`Quebra de Consciência` é `[Psíquico]`.

Fusão Ilusão foi restaurada e validada visualmente na Twitch.

Não remover Ilusão novamente.

Outras fusões continuam definidas em `src/systems/element-compatibility.js`.

---

## 9. Counter físico + Refletir elemental — VALIDADO 100% EM PRODUÇÃO

Duas habilidades Universais equipáveis normalmente em slots 1–4. Não existem comandos `!counter`/`!refletir`; o jogador usa `!ataque N` para esconder intenção do adversário.

### ⚔️ Contra-ataque físico

- reage apenas a dano Físico direto;
- custo: 0 Mentalidade;
- prioridade alta: 100;
- recebe ~50% do dano;
- devolve ~50% ao atacante;
- em dano ímpar: `ceil` para defensor, `floor` devolvido;
- se golpe incompatível, postura falha/desperdiça;
- não reage a DoT, Confusão, Cura, Buff, Meditação, outro Counter etc.;
- se metade do dano ainda matar o defensor, não devolve golpe.

Validação real:
- golpe de 9 → defensor recebeu 5, atacante recebeu 4 de volta.

### 🪞 Refletir elemental

- custo: 10 Mentalidade por tentativa executada;
- prioridade alta: 100;
- reage apenas a golpe Elemental direto;
- só funciona se o elemento recebido pertence ao personagem;
- elementos NATIVOS contam;
- fusões desbloqueadas contam;
- possuir skill por pergaminho não transforma elemento estranho em afinidade refletível;
- recebe ~50%, devolve ~50%;
- se elemento incompatível, recebe 100% e não devolve nada;
- mesmo falhando por incompatibilidade, paga 10 Mentalidade porque a postura foi preparada;
- efeitos secundários do golpe continuam no alvo original nesta primeira versão; só o dano direto é redistribuído.

Validação real compatível:
- SilenceWorky = Fogo + Terra;
- Chama Devastadora [Fogo] de 43 de dano;
- Silence recebeu 22;
- Juju recebeu 21 devolvido.

Validação real incompatível:
- Lança Glaciar [Gelo] causou 44 completos;
- Silence não possui Gelo;
- Refletir não reduziu nem devolveu;
- Congelamento secundário continuou funcionando.

### Mensagens corrigidas

Antes dizia apenas que Refletir estava preparado e não explicava falha.

Agora o chat explica:
- elemento não pertence aos refletíveis;
- golpe não é Elemental;
- golpe não é Físico para Counter;
- golpe errou;
- ação não chegou a executar;
- golpe não causou dano direto etc.

Exemplo validado em produção:

```text
🪞 Refletir de @SilenceWorky falhou: Gelo não pertence aos elementos refletíveis do personagem. Lança Glaciar foi recebido normalmente.
```

Commit da mensagem:
- `50b9990a121e5d72dfd57ddca8f6c06ef0019c5e`

Arquivos principais:
- `src/systems/reactions.js`
- `src/durable/PvpCoordinator.js`
- `src/routes/attack.js`
- `testar_counter_refletir_pvp.mjs`

---

## 10. Cooldown real — PONTO EXATO ATUAL

ESTE É O PRÓXIMO SISTEMA EM ANDAMENTO.

A regra foi aprovada pelo usuário:

```text
skill com cooldown 3 usada no T1:
T1 usa
T2 bloqueada
T3 bloqueada
T4 bloqueada
T5 disponível novamente
```

Regras aprovadas:
- cooldown inicia somente quando a habilidade realmente executa;
- Controle/Sono/Paralisia/Congelamento/Atordoamento que impeça execução → NÃO inicia cooldown;
- Confusão que faça auto-dano/perda de ação → NÃO inicia cooldown;
- habilidade executada mas que ERRA → inicia cooldown normalmente;
- Counter/Refletir: postura preparada → cooldown inicia mesmo se não encontrar golpe compatível;
- Soco virtual → sem cooldown;
- Meditação continua com cooldown próprio separado.

### Implementação automática já entrou no GitHub

Commit principal:
- `0b09701fcb79258949d17e8fda3dcc200b78c125` — `Integra cooldown real de habilidades ao PvP`

GitHub Actions executou com sucesso.

Arquivo novo:
- `src/systems/cooldown.js`

Regra técnica implementada:

```js
availableAtTurn = executedTurn + cooldown + 1
```

Ex.: T1 + CD3 → disponível T5.

Os arquivos temporários da automação (`.github/workflows/temp-skill-cooldown.yml` e patch temporário) já não estão mais no main.

### IMPORTANTE: ainda falta validação do usuário

O usuário ainda NÃO fez a etapa local/Twitch do Cooldown após o commit automático.

No novo chat, COMEÇAR exatamente daqui:

```bash
cd /workspaces/marbion-rpg-v2

git pull --rebase origin main

node --check src/systems/cooldown.js
node --check src/durable/PvpCoordinator.js
node --check src/routes/attack.js

# localizar/rodar os testes de cooldown adicionados ao repo
# depois rodar regressões importantes

npx wrangler deploy --dry-run
```

Se tudo passar:

```bash
npx wrangler deploy
```

Depois validar na Twitch uma habilidade com cooldown conhecido, idealmente Refletir (CD 3) ou Contra-ataque (CD 2):
- usar;
- tentar reutilizar nos turnos bloqueados;
- conferir mensagem com quantidade de turnos restantes;
- verificar retorno no turno correto;
- conferir que ação bloqueada por Controle/Sono não inicia cooldown;
- conferir que erro de precisão inicia cooldown;
- conferir Counter/Refletir incompatível ainda inicia cooldown por postura executada.

Só depois marcar `Cooldown real ✔️` no roadmap/cmdrpg.

---

## 11. Roadmap de combate imediato

Ordem atual aproximada:

1. Debuffs/DoTs/Controle ✅
2. Regeneração natural de Mentalidade ✅
3. Counter/Refletir ✅
4. Cooldown real ⏳ ← ESTAMOS AQUI
5. Crítico ⏳
6. dano/fraquezas/resistências elementais ⏳
7. Combos/sinergias ⏳
8. completar outros núcleos necessários antes do Multistreamer

Objetivo do usuário: chegar ao sistema Multistreamer o quanto antes, sem pular estabilidade do núcleo.

---

## 12. Multistreamer — objetivo grande futuro

Usuário quer RPG compartilhado entre vários streamers:
- mesmo personagem Twitch funciona em múltiplas lives participantes;
- perfil, skills, Status, ranking e inventário globais;
- bot próprio do RPG, reduzindo dependência de StreamElements individual;
- site com login Twitch;
- menu do jogador;
- painel do streamer;
- overlays/OBS;
- permissões de streamer/ADM;
- eventos globais inicialmente compartilhados;
- administração futura de metadados de habilidades.

Docs existentes:
- `docs/plataforma-multistreamer.md`
- `docs/overlays-multistreamer.md`
- `docs/administracao-streamers.md`

---

## 13. Individualidade do personagem — ideia aprovada para futuro

Documento:
- `docs/individualidade-personagem.md`

Ideias do usuário:
- cada perfil terá nome do personagem;
- comando futuro `!nome ...` para jogador escolher o nome;
- gênero nasce definido pelo sistema, jogador não escolhe;
- personagem novo começa com 14 ou 15 anos;
- idade aumenta pela combinação de vários fatores, não apenas level:
  - XP;
  - atividade;
  - tempo assistindo lives;
  - progressão geral;
- sistema de títulos;
- exemplo: título `Ancião` para idade alta;
- raças podem ter expectativas de vida diferentes;
- Shinigamis, Demônios, Vampiros: imortais por idade em princípio;
- Metamorfos/Bruxas: algo na faixa de ~100–150 anos foi citado como ideia;
- morte automática por idade NÃO é prioridade e provavelmente não será usada inicialmente.

Recomendação atual: implementar estrutura de individualidade depois do núcleo de combate e antes/durante Multistreamer; envelhecimento por watch time fica melhor quando houver infraestrutura Multistreamer/telemetria confiável.

---

## 14. Morte / rebuff / características — futuro, não misturar com KO PvP

Conceitos futuros já definidos em conversas anteriores:
- HP 0 no PvP é derrota/KO, não morte automática do personagem;
- vencedor poderá futuramente escolher poupar/finalizar;
- PvE HP 0 poderá representar morte real;
- rebuff normal perde quase tudo mas gera pequeno bônus permanente;
- morte forçada/rebuff forçado sem bônus;
- mortes normais contadas;
- após várias mortes aumenta chance de destruição da alma; 10ª morte normal seria garantida em conceito;
- habilidades características raríssimas, soul-bound, geralmente limite global de portadores.

Não implementar junto do Cooldown.

---

## 15. Catálogo de skills

Catálogo externo:
- repo `SilenceWorky/worky-live-responses`
- `skills.json`
- `racas.json`
- `elementos.json`

O backend usa URLs raw em `src/config/urls.js`.

Catálogo tem cerca de 1503 skills / 31 grupos.

Pilotos/skills usados em testes incluem:
- Chama Devastadora — Fogo / Queimadura
- Nuvem Tóxica — Veneno
- Raio Instantâneo — Paralisia
- Lança Glaciar — Gelo / Congelamento
- Onda Sônica — Atordoamento
- Véu Ascendente — Cegueira
- Acorde Ascendente — Silêncio
- Nevasca Ascendente — Lentidão
- Véu Ilusório Ascendente — Ilusão / Confusão
- Quebra de Consciência — Psíquico / Sono
- Contra-ataque — Universal / reação física
- Refletir — Universal / reação elemental

Atenção a nomes exatos: é `Lança Glaciar`, não `Lança Glacial`.

---

## 16. Contas de teste

- principal/admin: `silenceworky`
- conta secundária: `acervojuju`

O ADM autorizado é SilenceWorky.

---

## 17. Comandos úteis atuais usados nos testes

```text
!pvp @usuario
!aceitar
!ataque 1
!ataque 2
!ataque 3
!ataque 4
!meditar
!estado
!status
!pinfo
!habilidades
!slots
!slot 1 N
!rank

!adm pvp empate
!adm pvp vitória @usuario
!adm status reset @usuario
!adm skill @usuario add Nome da Skill
!adm pontos @usuario quantidade
```

---

## 18. Commits importantes recentes

Persistência / Mentalidade / Controle e afins:
- `97027f475421e5746347b25143f4312a25696891` — Queimadura/DoT
- `6e54c36` — motor de Controle/base Paralisia
- `bf6a9a0` — Paralisia finalizada
- `6e60eeb3949b4248b866b0eb8ad0b8211eba3bf8` — Congelamento validado real
- `ef298fc476d37f7aeb9faa8d74c0ecc7ed167954` — motor regen Mentalidade
- `c38054b952a0dc3e96b1cba7695dfc042dec82b0` — ciclo completo regen
- `540aab3` — persistência forte do perfil
- `a071587` — Confusão integrada

ADM / Counter / mensagens:
- `eb2bae74faf737b841a9d71379763e6ed6a59c09` — doc ADM PvP especial
- `eca6c4817369abf63c87bb492f894cf28de8c601` — reset ADM Status
- `50b9990a121e5d72dfd57ddca8f6c06ef0019c5e` — mensagens falha Counter/Refletir

Cooldown:
- `0b09701fcb79258949d17e8fda3dcc200b78c125` — integração do cooldown real ao PvP

---

## 19. Instrução para o próximo chat

Ao abrir um novo chat, diga algo como:

```text
Continue o projeto Marbion RPG V2. Leia no GitHub o arquivo docs/checkpoint-transferencia-chat-2026-09-03.md e continue exatamente do ponto do Cooldown real, sem refazer sistemas já validados.
```

O novo chat deve primeiro ler este arquivo e confirmar o ponto atual antes de alterar código.

PONTO EXATO: **Cooldown real foi integrado automaticamente ao GitHub e a Action passou; falta o usuário puxar, rodar testes locais/regressões/dry-run e depois validar em produção.**
