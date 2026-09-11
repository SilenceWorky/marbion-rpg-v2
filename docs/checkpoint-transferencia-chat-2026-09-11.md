# Checkpoint de transferência — Marbion RPG V2

Data: 2026-09-11

Este arquivo existe para continuar o projeto em um novo chat sem perder contexto. Ao iniciar outro chat, ler este arquivo antes de qualquer alteração e continuar exatamente da seção **PONTO EXATO DE RETOMADA**.

---

## 1. Projeto e infraestrutura

- Repositório principal: `SilenceWorky/marbion-rpg-v2`
- Worker V2: `https://marbion-rpg-v2.wellingsonpl.workers.dev`
- Cloudflare KV V2: `MARBION_USERS_V2`
- Namespace id: `3731c622c6764dbc9025cef56030c23e`
- Durable Object: binding `PVP_COORDINATOR`, classe `PvpCoordinator`, instância global `marbion-global-pvp`
- Stack: Cloudflare Workers + Wrangler v4 + KV + Durable Object + StreamElements/Twitch.
- Catálogo externo: `SilenceWorky/worky-live-responses`, principalmente `skills.json`, `racas.json`, `elementos.json`.
- A V1 antiga continua preservada até a V2 ficar pronta. Não apagar Worker/KV V1 ainda.

Arquivos JSON locais que costumam aparecer como untracked e NÃO devem ser commitados por engano:
- `skills-v1-1500-debuff.json`
- `skills-v1-1500-final.json`
- `skills-v1-1500.json`

Evitar `git add .` enquanto eles estiverem presentes.

---

## 2. Preferência de trabalho do usuário

- Trabalhar em etapas curtas.
- Sempre testar antes de deploy real.
- Depois de cada etapa: usuário roda comandos no Codespace/Twitch e responde geralmente `foi`.
- Para código manual, informar arquivo, ponto exato e indentação pronta.
- Quando possível, atualizar GitHub automaticamente.
- Não alterar regras estruturais/canônicas por suposição. Depois do incidente de Ilusão, se o usuário questionar elemento, fusão, raça, regra de combate ou lore, primeiro conferir código/documentação/histórico e então confirmar antes de modificar.
- Quando o usuário disser que vai dormir, gerar checkpoint imediato.

---

## 3. Sistemas principais já concluídos/validados

### Perfil / persistência
- Perfil V2 e persistência forte implementados.
- Bug em que Status parecia salvar e voltava para valor antigo ao entrar em PvP foi corrigido.
- Teste `testar_persistencia_perfil_forte.mjs` passou.
- Perfil possui `skillCooldowns: {}` reservado para cooldowns.

### Mentalidade
- Mentalidade persistente entre batalhas.
- Regeneração natural fora de PvP: +1 a cada 5 minutos.
- Dentro do PvP não regenera naturalmente.
- Mentalidade restante ao terminar PvP volta para o perfil e reinicia o relógio de regen.
- Nova luta começa com Mentalidade real do perfil, não com o máximo.
- Meditação existe em PvP e recupera Mentalidade; cooldown próprio separado.
- Regeneração natural foi validada em produção.

### PvP base
- desafio/aceite
- 4 slots
- `!ataque 1-4`
- ordem por prioridade > Velocidade > desempate 50/50
- loadout/stats em snapshot ao aceitar
- Soco como fallback universal em slot vazio
- gasto de Mentalidade somente quando ação executa
- ação bloqueada por controle/sono/etc. não gasta Mentalidade e não consome skill temporária
- ranking/XP de combate
- `!estado` usa HP/Mentalidade vivos do Durable Object durante PvP

### Admin PvP
Implementado:
- `!adm pvp empate`
- `!adm pvp vitória @usuario`

Resultado administrativo por padrão:
- encerra PvP
- libera jogadores
- persiste Mentalidade
- NÃO altera Elo/XP ranqueado, vitórias/derrotas/streak

### Reset administrativo de Status
Implementado e validado em produção:

`!adm status reset @usuario`

Resultado:
- `statusPoints = 0`
- Força = 5
- Força Mágica = 5
- Velocidade = 5
- Evasão = 5
- Precisão = 90
- Defesa = 5

Não altera nível, XP, raça, elementos, skills, slots, Mentalidade, ranking, inventário etc.

Observação: o perfil-base antigo ainda possui Defesa 0 em `createBaseProfile`; o reset ADM foi definido pelo usuário para Defesa 5. Decidir depois se novo personagem também deve nascer com Defesa 5.

---

## 4. Efeitos/debuffs/controles concluídos

Todos abaixo foram implementados e testados, vários também validados na Twitch:

- Veneno
- Queimadura
- Sangramento
- Paralisia
- Congelamento
- Atordoamento
- Cegueira
- Silêncio
- Lentidão
- Confusão
- Sono

### Sono
Regra validada em produção:
- aplica por até 2 ações
- bloqueia ação
- ação bloqueada não gasta Mentalidade
- reduz 2 -> 1 -> 0
- acorda naturalmente após consumir as ações
- dano direto recebido depois da aplicação acorda imediatamente
- dano zero não acorda
- reaplicação renova sem duplicar

Bug corrigido: `Quebra de Consciência` estava aplicando redução de Precisão em vez de Sono porque Debuff genérico tinha precedência. Agora `controlType/sono` é tratado corretamente antes do Debuff genérico.

---

## 5. Elementos e correção importante de Ilusão

Ilusão EXISTE e é uma fusão válida.

Regra correta:
- Psíquico + Luz -> Ilusão

Durante o desenvolvimento, Ilusão foi removida por engano após uma dúvida do usuário. Isso já foi revertido.

Estado correto:
- `Véu Ilusório Ascendente [Ilusão]`
- habilidades de Ilusão continuam sendo Ilusão
- Psíquico continua sendo elemento nativo separado
- Ilusão continua sendo fusão de Psíquico + Luz

Não remover novamente sem confirmação explícita após conferir o estado atual.

---

## 6. Counter físico e Refletir elemental — CONCLUÍDOS

### Contra-ataque físico
Skill universal equipável em slot normal, não é comando separado.

Regra:
- prioridade alta (100)
- custo 0 Mentalidade
- reage apenas a dano Físico direto
- recebe aproximadamente 50% do dano
- devolve aproximadamente 50% ao atacante
- dano ímpar: defensor recebe `ceil(50%)`, atacante recebe `floor(50%)`
- se o golpe incompatível, postura não ativa
- não reage a DoT, Confusão, Meditação, buff, cura, suporte sem dano, outro Counter etc.
- se a metade do dano ainda matar quem preparou o Counter, não devolve o golpe

Validado em produção. Exemplo observado:
- golpe original 9
- Silence recebeu 5
- Juju recebeu 4 de volta

### Refletir elemental
Skill universal equipável em slot normal.

Regra:
- prioridade alta (100)
- custo 10 Mentalidade POR TENTATIVA executada, mesmo se não houver golpe compatível
- reage somente a ataque Elemental direto
- só reflete elementos pertencentes ao personagem
- elementos nativos contam
- fusões realmente desbloqueadas contam
- possuir skill de outro elemento por pergaminho não torna esse elemento refletível
- recebe aproximadamente 50% do dano e devolve aproximadamente 50%
- efeitos secundários do golpe (Queimadura, Congelamento etc.) continuam no alvo original; nesta versão o Refletir redistribui apenas dano direto

Exemplo validado:
- personagem Silence: Fogo + Terra
- Fogo foi refletido corretamente
- Chama Devastadora daria 43 -> Silence recebeu 22, Juju recebeu 21
- Queimadura continuou em Silence

Teste incompatível validado:
- Silence Fogo + Terra
- Juju usa Lança Glaciar [Gelo]
- Refletir NÃO ativa
- Silence recebe 100% do dano direto
- Congelamento secundário é aplicado normalmente

### Mensagens de falha de reação
Foi adicionado feedback explícito no chat.

Exemplo:
`🪞 Refletir de @SilenceWorky falhou: Gelo não pertence aos elementos refletíveis do personagem. Lança Glaciar foi recebido normalmente.`

Também há mensagens para:
- Counter contra Elemental
- Refletir contra Físico
- golpe inimigo que erra
- ação inimiga que não chega a executar por controle/sono/etc.

Counter + Refletir foram considerados concluídos após validação visual na Twitch.

---

## 7. Comando de Status usado em testes

O usuário utiliza ADM para dar pontos e manipular stats durante testes.

Exemplos já usados:
- `!adm pontos @acervojuju 999999999`
- `!status força 495`
- alterações grandes em Velocidade e Defesa para validar ordem/dano

Cuidado: valores absurdos de Defesa podem forçar dano mínimo de 1 e parecer que Counter está errado. Isso ocorreu no primeiro teste do Counter; depois os atributos foram normalizados e o sistema funcionou.

---

## 8. Individualidade do personagem — ideia futura registrada

O usuário quer futuramente um sistema de individualidade de perfil/personagem:

- nome do personagem escolhido pelo usuário, ex. `!nome ...`
- gênero gerado ao nascer, não escolhido pelo jogador
- idade inicial normalmente 14 ou 15 anos
- idade aumenta com uma combinação de fatores (XP, evolução, atividade, tempo assistindo lives etc.), não apenas level
- títulos por idade, por exemplo `Ancião` após idade alta
- expectativa de vida variável por raça
- Shinigamis, Demônios e Vampiros seriam imortais por idade
- outras raças teriam expectativa de vida própria
- morte por idade foi considerada, mas por enquanto NÃO implementar; pode ser ruim para jogadores antigos

Recomendação atual: implementar a estrutura de individualidade após fechar o núcleo do combate e antes/na fase Multistreamer. Watch time/idade dinâmica combina melhor com a infraestrutura Multistreamer.

Documento relacionado já criado anteriormente: `docs/individualidade-personagem.md`.

---

## 9. Multistreamer — objetivo prioritário futuro

O usuário quer chegar logo ao sistema Multistreamer.

Visão futura:
- mesmo personagem Twitch/global funcionando em vários streamers participantes
- bot Twitch próprio, substituindo gradualmente dependência de StreamElements por streamer
- site com login Twitch
- menu do jogador
- painel de streamer
- overlays/links para OBS
- permissões granulares para streamers/admins
- eventos globais compartilhados inicialmente
- editor/admin futuro para efeitos das skills

Documentos já existentes no repo:
- `docs/plataforma-multistreamer.md`
- `docs/overlays-multistreamer.md`
- `docs/administracao-streamers.md`

O usuário explicitamente disse que quer muito chegar ao Multistreamer. Não desviar o roadmap sem necessidade.

---

## 10. Roadmap de combate atual

Ordem aproximada que estávamos seguindo:

1. Buffs reais ✅
2. Meditação ✅
3. Debuffs ✅
4. DoTs (Veneno/Queimadura/Sangramento) ✅
5. Controle (Paralisia/Congelamento/Atordoamento) ✅
6. Cegueira/Silêncio/Lentidão/Confusão/Sono ✅
7. Regeneração natural de Mentalidade ✅
8. Counter físico ✅
9. Refletir elemental ✅
10. **Cooldown real de habilidades — EM IMPLEMENTAÇÃO / PRÓXIMO TESTE**
11. Crítico
12. dano/fraquezas elementais
13. Combos
14. fechar núcleo de combate
15. individualidade mínima de personagem
16. avançar para Multistreamer/site/bot próprio

---

# 11. COOLDOWN REAL — ESTADO ATUAL

O usuário aprovou a seguinte regra:

Exemplo de skill `cooldown: 3` usada no Turno 1:

- T1: usa ✅
- T2: bloqueada
- T3: bloqueada
- T4: bloqueada
- T5: disponível novamente ✅

Regras aprovadas:
- cooldown começa apenas se a skill REALMENTE executar
- se Sono/Paralisia/Congelamento/Atordoamento impedir a ação -> não inicia cooldown
- se Confusão causar auto-dano e impedir a skill -> não inicia cooldown
- se a skill executa e ERRA -> cooldown começa normalmente
- Counter/Refletir: se a postura foi realmente preparada -> entra em cooldown mesmo se não encontrar golpe compatível
- Soco -> cooldown 0
- Meditação continua com seu cooldown próprio, separado do motor de skills
- tentativa de usar skill em cooldown deve ser rejeitada antes de travar a ação do turno

Mensagem esperada quando tentar usar:
`@usuario, Refletir ainda está em cooldown. Aguarde 2 turno(s).`

### Implementação automática já feita

Foram criados testes e patch automático para integrar cooldown ao PvP. O GitHub Actions executou com sucesso.

Commit principal de integração identificado:
- `0b09701fcb79258949d17e8fda3dcc200b78c125` — `Integra cooldown real de habilidades ao PvP`

Commits preparatórios:
- `a36232a2c0256bd133c33609d1e77b48c59694c3` — testes do cooldown real
- `84ed8c1625803e9aad5729ffe040dbfb9b52ffdf` — patch temporário
- `d21c80af9d18205681cddc18d4de5de103fe0ebd` — automação temporária

O workflow de integração concluiu com sucesso.

### ÚLTIMA AÇÃO DO USUÁRIO

O usuário rodou os testes locais/dry-run solicitados para Cooldown e respondeu:

`foi`

Ou seja: a etapa local passou.

O usuário então informou que este chat chegou ao limite e pediu para salvar tudo para continuar em novo chat.

---

# 12. PONTO EXATO DE RETOMADA

NÃO reimplementar Cooldown do zero.

No novo chat:

1. Ler este checkpoint.
2. Conferir HEAD/últimos commits e se os arquivos temporários de workflow/patch de cooldown ainda existem; se existirem e não forem mais necessários, remover depois que a integração estiver confirmada.
3. No Codespace:

```bash
cd /workspaces/marbion-rpg-v2

git pull --rebase origin main

git status --short
```

4. Como o usuário já disse `foi` para testes + `wrangler deploy --dry-run`, o próximo passo é **DEPLOY REAL do Cooldown**:

```bash
npx wrangler deploy
```

5. Testar na Twitch com uma habilidade de `cooldown: 3`.

Teste obrigatório:
- T1: executar skill
- T2: tentar reutilizar -> bloqueado, faltam 3 ou contagem equivalente conforme mensagem implementada
- T3: bloqueado
- T4: bloqueado
- T5: disponível e executa novamente

Também validar pelo menos estes casos:
- skill que ERRA entra em cooldown
- skill bloqueada por controle/sono NÃO entra em cooldown
- Refletir/Counter entram em cooldown quando a postura é executada, mesmo que não haja alvo compatível
- Soco não entra em cooldown
- Meditação continua independente

6. Se produção passar, atualizar `cmdrpg.md` e docs marcando `Cooldown real de habilidades ✔️`.
7. Só então seguir para **Crítico**.

---

## 13. Comandos/lembranças úteis para retomar

Encerrar teste de PvP sem mexer em ranking:
`!adm pvp empate`

Resetar atributos de teste:
`!adm status reset @usuario`

Ver estado vivo:
`!estado`

Ver slots:
`!slots`

Ver habilidades:
`!habilidades`

Começar PvP:
`!pvp @acervojuju`

Aceitar:
`!aceitar`

Conta secundária de teste:
`@acervojuju`

---

## 14. Regra operacional importante

Antes de qualquer alteração nova:
- verificar se a funcionalidade já existe
- verificar docs/histórico/código
- não assumir que uma dúvida do usuário significa que algo deve ser removido
- preservar compatibilidade com perfis existentes
- manter testes de regressão de Sono, Confusão, Lentidão, Silêncio, Cegueira, Controle, persistência forte e regeneração de Mentalidade
- deploy real somente após testes e dry-run

---

Fim do checkpoint. Continuar a partir de **Cooldown real -> deploy e validação em produção**.
