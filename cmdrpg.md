# 🎮 CMD RPG — MARBION V2

> Documento oficial de acompanhamento dos comandos e sistemas do **Marbion RPG V2**.
>
> Regra de manutenção: este arquivo deve ser atualizado sempre que um sistema novo for implementado, alterado ou concluído.
>
> Legenda: **✔️ implementado e validado** | **🧪 implementado/em validação** | **⏳ pendente** | **🗃️ legado V1 ainda não migrado**
>
> Última atualização canônica: **15/09/2026**.

---

# 🧱 ARQUITETURA V2

- Worker modular Cloudflare ✔️
- KV central `MARBION_USERS_V2` ✔️
- acesso a perfil centralizado por `getProfile()` / `saveProfile()` ✔️
- Durable Object `PVP_COORDINATOR` para estado vivo de batalha ✔️
- perfil forte/autoritativo para evitar sobrescrita por cópia antiga do KV ✔️
- conteúdo externo em `worky-live-responses` para `racas.json`, `elementos.json` e `skills.json` ✔️
- `cmdrpg.md` mantido no próprio repositório `marbion-rpg-v2` ✔️
- V1 preservada como referência até a V2 ficar completa ✔️

Infraestrutura V1 ainda preservada como referência e NÃO deve ser desligada até a migração completa de Mobs, Bosses, tags, armas e demais sistemas legados.

---

# 👤 PERFIL E PROGRESSÃO

## !raça
Desperta uma raça para o jogador.

Status V2: ✔️

---

## !elemento
Desperta 1 ou 2 elementos seguindo as regras de raridade e exclusividade.

Status V2: ✔️

Regras importantes:
- Neutro é exclusivo e não divide perfil com outro elemento.
- O jogador precisa possuir raça antes de despertar elemento.

---

## !pinfo
Mostra informações básicas do personagem.

Status V2: ✔️

Atualmente inclui:
- raça
- elemento(s)
- nível
- XP atual / XP necessário

Expansões futuras:
- nome próprio do personagem
- gênero
- idade
- tags
- Arma Vínculo
- efeitos persistentes
- inventário resumido
- outros dados completos do perfil

---

## Sistema de nível
Status V2: ✔️

- XP normal sobe nível.
- XP excedente é carregado para o próximo nível.
- Pode subir múltiplos níveis de uma vez.
- Cada nível concede +1 ponto de status.

Curva atual:
```js
getXpNeeded(level) = Math.round(200 * Math.pow(level, 1.18))
```

---

# 📊 ATRIBUTOS

## !status
Mostra os atributos e permite distribuir pontos.

Status V2: ✔️

Atributos:
- Força (`strength`)
- Magia / Força Mágica (`magicStrength`)
- Velocidade (`speed`)
- Evasão (`evasion`)
- Precisão (`accuracy`)
- Defesa (`defense`)

Regra:
- 1 ponto de status = +1 no atributo escolhido.

Exemplos:
```txt
!status
!status força 2
!status magia 1
!status velocidade 3
```

---

## !estado
Mostra o estado atual do personagem.

Status V2: ✔️

Fora de combate usa o perfil normal.
Durante PvP consulta o estado vivo dentro do Durable Object.

Mostra:
- HP atual / máximo
- Mentalidade atual / máxima
- turno atual quando estiver em PvP
- adversário quando estiver em PvP
- efeitos ativos
- buffs/debuffs
- DoTs e duração restante
- controles ativos
- estados elementais como Molhado enquanto estiverem ativos

---

# 🎁 XP E RECOMPENSAS

## !daily
Status V2: ✔️ versão básica

Atualmente:
- entrega entre 40 e 70 XP
- cooldown exato de 24h

Pendente:
- streak de daily
- bônus progressivo
- recompensas especiais

---

## !checkin
Status V2: ⏳

Planejado:
- ganho periódico de XP
- cooldown próprio

---

## !xpchest
Status V2: ⏳

Planejado:
- XP normal
- XP elemental
- recompensas variadas

---

# 🌌 ELEMENTOS E FUSÕES

## Elementos principais
Status V2: ✔️

20 elementos principais:
- Fogo
- Água
- Vento
- Terra
- Eletricidade
- Fluxo
- Cristal
- Som
- Natureza
- Gelo
- Psíquico
- Lava
- Sombra
- Luz
- Veneno
- Metal
- Tempo
- Espaço
- Gravidade
- Matéria

Elemento especial:
- Neutro

---

## Fusões especiais
Status V2: ✔️

Fusões válidas:
- Fogo + Terra → Vidro
- Cristal + Fogo → Vidro
- Água + Fogo → Vapor
- Metal + Eletricidade → Magnetismo
- Lava + Água → Obsidiana
- Psíquico + Luz → Ilusão
- Água + Veneno → Ácido
- Fogo + Eletricidade → Plasma
- Luz + Veneno → Radiação
- Espaço + Gravidade → Singularidade

Regras:
- somente elementos nativos contam como ingredientes
- fusões não viram elementos nativos
- não existe cadeia de fusões derivadas

---

## Afinidades de pergaminho
Status V2: ✔️

Afinidades atuais:
- Água → Gelo
- Fluxo → Som, Vento, Água, Tempo
- Fogo → Luz
- Eletricidade → Luz
- Vento → Gravidade, Vapor

---

## Matriz de dano elemental
Status V2: ✔️ **validado em testes e Twitch real**

Multiplicadores:
```txt
Vantagem:     1.5x
Resistência:  0.75x
Neutro:       1x
Imunidade:    0x
Retorno de imunidade: 2x
```

Regras:
- defensor com dois elementos multiplica as duas relações
- não existe cap artificial para elemento duplo
- uma imunidade domina qualquer segundo multiplicador
- Neutro é neutro nos dois sentidos
- Universal é neutro
- Singularidade permanece neutra nesta versão
- DoTs não recebem multiplicador elemental por tick nesta versão

Ordem atual do dano direto:
```txt
Base / escala
→ Defesa
→ Multiplicador elemental
→ Crítico
→ Combo elemental
→ Counter / Refletir
→ HP
```

Validações reais:
```txt
Eletricidade → Terra = 0x ✅
Terra → Eletricidade = 2x ✅
Terra → Fogo = 1.5x ✅
```

---

# 🧠 HABILIDADES

## Catálogo de habilidades
Status V2: ✔️

Catálogo atual:
- 30 categorias elementais/fusões
- 50 habilidades por categoria elemental/fusão
- 1500 habilidades elementais/fusões
- habilidades Universais e habilidades especiais de sistema adicionais

Os nomes globais foram validados e desduplicados.

---

## !habilidades
Status V2: ✔️

Regras:
- ordem segue `profile.skills`
- novas habilidades entram no final
- paginação de 8 habilidades por página

---

## !slot
Status V2: ✔️

Sintaxe:
```txt
!slot [slot] [número da habilidade]
```

Para limpar o slot e voltar ao Soco:
```txt
!slot 1 soco
!slot 1 0
```

---

## !slots
Status V2: ✔️

- mostra os 4 slots atuais
- slot vazio usa **Soco** virtualmente
- Soco não ocupa `profile.skills`

---

## Soco
Status V2: ✔️ **validado em produção**

Ação universal virtual e fixa:
- comando público: `!ataque soco`
- funciona como uma 5ª ação virtual, fora dos 4 slots equipáveis
- não pode ser trocada/removida
- custo: 0
- dano base: 12
- precisão: 95
- prioridade: 0
- escala: Força
- não usa o cooldown genérico
- mensagem de espera identifica corretamente **Soco**, sem chamar de “habilidade 5”
---

## Aprendizado por nível
Status V2: 🧪 base estrutural pronta

Regra definida:
- habilidades obtidas naturalmente por nível devem ser apenas dos elementos nativos do personagem

Integração completa com subida de nível: ⏳

---

## Aprendizado por pergaminho
Status V2: ✔️

Pode usar:
- elemento nativo
- fusões válidas
- afinidades
- Universal

---

## Regra especial do Neutro
Status V2: ✔️

Neutro pode aprender por pergaminho habilidades de qualquer elemento.

Se a habilidade não for Neutro/Universal:
- fica temporária
- `usesRemaining: 1`
- é removida somente depois que realmente executa
- errar ainda consome o uso
- morrer antes de agir NÃO consome
- após o último uso é removida de `skills`, `skillMeta`, cooldown e slots
- slot vazio volta a Soco

---

# 🧠 MENTALIDADE

## Sistema de Mentalidade em PvP
Status V2: ✔️

Regras:
- cada habilidade pode ter `custoMentalidade`
- escolha só é aceita se houver Mentalidade suficiente
- escolher NÃO gasta
- executar gasta
- morrer antes de agir não gasta
- Soco custa 0
- valor restante é preservado ao terminar o PvP

---

## !meditar
Status V2: ✔️ **validado em PvP real**

Regras atuais:
- recupera 25
- respeita `maxMentalidade`
- não ocupa slot
- prioridade -1
- não pode ser usada com barra cheia
- se morrer antes de agir não recupera e não cria cooldown
- cooldown de 3 turnos completos

---

## Recuperação genérica
Status V2: ✔️

`restoreMentalidade()` pode servir futuramente para:
- poções
- livros
- comidas
- habilidades de suporte
- equipamentos

---

## Regeneração natural fora do combate
Status V2: ✔️ **implementado e validado**

Regras:
- +1 de Mentalidade a cada 5 minutos fora do PvP
- não existe regeneração natural durante uma luta
- não interfere na Mentalidade viva de uma batalha em andamento
- entrada e saída do PvP preservam corretamente o valor real

---

# ❤️ HP E CURA

## HP real no PvP
Status V2: ✔️

- batalha cria snapshot de HP
- dano altera HP do snapshot vivo
- HP nunca fica negativo

---

## Cura
Status V2: ✔️

- habilidades `tipo: Cura` curam o próprio usuário
- respeitam `maxHp`
- cura efetiva é separada da cura teórica
- gasto de Mentalidade ocorre normalmente

Teste real validado com **Maré Regenerativa**.

---

# ⬆️ BUFFS E DEBUFFS

## Buff de atributo
Status V2: ✔️ **validado em PvP real**

- age sobre o próprio usuário
- atributo vem de `skill.escala`
- suporta Força, Magia, Velocidade, Evasão, Precisão e Defesa
- força inicial: `custoMentalidade / 5`
- mínimo +1
- máximo +10
- duração base: 2 turnos
- expiração devolve o atributo ao valor correto

---

## Debuff de atributo
Status V2: ✔️ **validado em PvP real**

- precisa acertar o adversário
- pode causar dano direto e Debuff na mesma execução
- atributo vem de `skill.debuffStat`
- mínimo de 1 e máximo de 10
- atributo nunca fica abaixo de 0
- duração base: 2 turnos
- expiração devolve exatamente o valor retirado

---

# ☠️ DANO POR TURNO (DoT)

## Motor genérico de DoT
Status V2: ✔️

Regras:
- DoTs processam no início do novo turno
- efeitos diferentes podem coexistir
- reaplicar o mesmo tipo renova duração
- mantém o maior dano por turno na reaplicação
- registra o dano realmente causado
- pode encerrar a luta antes das novas ações
- suporta empate por morte simultânea
- `killedBy` identifica a causa real

Tipos integrados:
- ☠️ Veneno ✔️
- 🔥 Queimadura ✔️
- 🩸 Sangramento ✔️

Planejados sobre a mesma base:
- ☢️ Radiação
- 🧬 Deterioração
- 🌋 Lava e outros efeitos periódicos

---

## Veneno
Status V2: ✔️ **validado em PvP real**

- duração base: 3 ticks
- primeiro tick no início do turno seguinte
- dano por tick = `Math.max(2, Math.round(custoMentalidade * 0.35))`

---

## Queimadura
Status V2: ✔️ **validado em PvP real**

- duração base: 2 ticks
- primeiro tick no início do turno seguinte
- dano por tick = `Math.max(2, Math.round(custoMentalidade * 0.45))`
- Chama Devastadora é habilidade piloto validada

---

## Sangramento
Status V2: ✔️

- usa o motor genérico de DoT
- representa dano físico periódico
- integrado à resolução do PvP

---

# 🌀 CONTROLES E RESTRIÇÕES

## Motor genérico de Controle
Status V2: ✔️

Controles/restrições já integrados e testados:
- Paralisia ✔️
- Congelamento ✔️
- Atordoamento ✔️
- Sono ✔️
- Confusão ✔️
- Silêncio ✔️
- Lentidão ✔️
- Cegueira ✔️

Regras gerais:
- efeitos ofensivos só são aplicados quando o golpe realmente acerta, quando aplicável
- bloqueio antes da execução não deve gastar Mentalidade nem iniciar cooldown
- controles mantêm estado no `player.effects`

---

# ⏳ COOLDOWN

## Cooldown real de habilidades
Status V2: ✔️ **validado em produção**

Regra canônica:
```txt
availableAtTurn = executedTurn + cooldown + 1
```

Exemplo:
```txt
Cooldown 3 usado no T1
→ bloqueia T2, T3 e T4
→ volta no T5
```

Regras:
- cooldown só começa quando a habilidade realmente executa
- não começa se a ação foi bloqueada antes da execução
- errar o golpe após executar inicia cooldown normalmente
- Soco fica fora do motor genérico
- Meditação possui cooldown próprio
- Counter/Refletir iniciam cooldown ao preparar a postura, mesmo se não houver ataque compatível

Validação em produção incluiu ciclo completo `3 → 2 → 1 → disponível` e casos de miss/execução.

---

# 💥 CRÍTICO

## Crítico geral
Status V2: ✔️ **validado em testes e produção**

Padrão:
```txt
Chance: 5%
Multiplicador: 1.5x
```

Regras:
- rolagem só ocorre depois de confirmar acerto
- dano direto 0 não critica
- DoT não critica por tick
- porção direta de habilidade com DoT pode critar
- cura, buff e Meditação não criticam
- habilidades podem sobrescrever `critChance` e `critMultiplier`
- crítico acontece depois do multiplicador elemental

Marcador no chat:
```txt
💥 CRÍTICO!
```

---

# ⚔️ COUNTER / REFLETIR

## Contra-ataque
Status V2: ✔️ **validado em PvP real**

- reage a dano Físico direto
- divide o dano compatível em aproximadamente 50% recebido + 50% devolvido
- custo atual do Counter físico: 0

---

## Refletir
Status V2: ✔️ **validado em PvP real**

- reage a ataque Elemental compatível com os elementos refletíveis do personagem
- fusões desbloqueadas podem contar para Refletir
- pergaminho não concede refletibilidade permanente
- divide o dano compatível em aproximadamente 50% recebido + 50% devolvido
- custo atual: 10 de Mentalidade

Counter/Refletir recebem o dano já processado por:
```txt
Defesa → Elemento → Crítico → Combo elemental
```

---

# 💧⚡ COMBOS ELEMENTAIS

## Combos Elementais V1
Status V2: ✔️ **100% validado em produção**

### Molhado
Água aplica:
```txt
💧 Molhado
```

Regras:
- duração: 2 turnos
- aplicado no T1 permanece ativo durante o T2
- expira ao abrir o T3 se não for consumido ou renovado
- nova aplicação de Água renova a duração sem duplicar o efeito

### Eletrocussão
```txt
Molhado + Eletricidade
→ ⚡ Eletrocussão
→ consome Molhado
→ +25% de dano direto
```

### Evaporação
```txt
Molhado + Fogo
→ ♨️ Evaporação
→ consome Molhado
→ sem bônus de dano na V1
```

Foi validada ao vivo usando **Onda Absoluto → Chama Devastadora**.

## Combos Elementais V2
Status V2: ⏳

Planejado:
- novas reações
- novos estados elementais
- ampliar interações entre os elementos além da V1

---

# ⚔️ PVP

## !pvp @usuario
Status V2: ✔️ **validado em produção**

- cria desafio
- convite expira após 2 minutos
- se o alvo não responder dentro dos 2 minutos, o desafio é cancelado automaticamente
- o cancelamento é publicado autonomamente no chat pela saída Twitch do Worker
- expirar um desafio NÃO aplica strike AFK
- expirar um desafio NÃO altera Elo
- expirar um desafio NÃO altera vitórias, derrotas ou outras estatísticas
- o timeout do convite compartilha o Durable Object Alarm com os eventos de 60/90 segundos das batalhas

---

## !aceitar
Status V2: ✔️

---

## !ataque 1-4 / !ataque soco
Status V2: ✔️

Regras:
- uma escolha por turno
- slots 1-4 usam habilidades equipadas
- `!ataque soco` usa a ação universal fixa
- primeira escolha fica aguardando o adversário
- habilidades só são reveladas na resolução
- falta de Mentalidade permite escolher outra ação
- ação já escolhida não pode ser substituída no mesmo turno
---

## Ordem das ações
Status V2: ✔️

1. prioridade
2. Velocidade
3. empate total → 50/50

---

## Resolução ofensiva
Status V2: ✔️

Inclui:
- precisão da habilidade
- Accuracy
- Evasão
- chance mínima de acerto
- dano base e atributo de escala
- Defesa com retorno decrescente
- dano elemental
- crítico
- combos elementais
- Counter/Refletir
- HP real

---

## Fila Global de PvP — 1 luta por vez
Status V2: ✔️ **validado em produção**

Regras:
- existe apenas 1 batalha PvP global ativa por vez
- se outra dupla aceitar um desafio enquanto há luta ativa, entra na fila global
- um jogador não pode ocupar múltiplas posições da fila
- ordem da fila é FIFO
- posição da dupla é informada no chat
- ao terminar a luta ativa, a próxima dupla é promovida automaticamente
- promoção automática funciona tanto após encerramento natural quanto após encerramento administrativo
- a luta promovida reutiliza o fluxo normal de aceite/inicialização

Validação:
- testes locais do motor ✔️
- integração ✔️
- hardening ✔️
- Twitch real com duas duplas distintas ✔️

---

## !recusar
Status V2: ✔️ **validado em produção**

Regras:
- somente o jogador desafiado pode recusar
- remove imediatamente o desafio pendente
- sem perda de Elo
- não interfere em PvP já ativo
- não remove dupla que já entrou na fila global
---

## !desistir / forfeit
Status V2: ✔️ **validado em produção**

Regra canônica:
- encerra a luta como derrota de quem desistiu
- desistente perde **2x** a perda normal calculada para aquele confronto
- cap máximo da perda por desistência: `-300`
- rating nunca fica abaixo de 0
- vencedor NÃO recebe recompensa dobrada
- a próxima dupla da fila é promovida normalmente

Proteção contra desistência precoce:
- antes do Turno 3: desistente recebe a penalidade 2x, mas o adversário recebe **0 Elo**
- a partir do Turno 3: vencedor recebe Elo normal, sujeito ao anti-farm

Validado em produção nos Turnos 1, 2, 3 e 5, incluindo penalidade dinâmica de desistência.
---

## Timeout de turno / AFK
Status V2: ✔️ **implementado e validado em produção**

Regra canônica:
```txt
T+60s sem ação
→ aviso: restam 30 segundos

T+90s sem ação
→ jogador perde a ação
→ recebe 1 strike AFK
→ ação do adversário é resolvida normalmente

3 strikes AFK na mesma luta
→ derrota automática por inatividade
```

O relógio usa **Durable Object Alarm**, portanto não depende de alguém enviar outro comando para destravar a luta.

Disciplina entre partidas:
- 1º incidente AFK abre uma janela de observação de 30 minutos
- novo AFK dentro da janela → bloqueio de PvP por 15 minutos
- após cumprir o bloqueio, existe nova janela de 30 minutos
- reincidência dentro dela → 1 hora
- próximas punições seguem progressão `x4`: 4h, 16h, 64h etc.
- partidas normais entre os incidentes NÃO limpam a janela
- se a janela de 30 minutos expirar sem novo AFK, a reincidência volta ao estágio inicial
- enquanto houver bloqueio, o jogador não pode desafiar nem aceitar PvP
- AFKs adicionais da mesma luta enquanto um bloqueio já está ativo não escalam imediatamente a punição

Mensagens/eventos validados:
```txt
⏰ @user, você ainda não escolheu uma ação. Restam 30 segundos.
💤 @user não executou uma ação a tempo e perdeu a vez. AFK: 1/3.
💤 @user ficou AFK por 3 turnos e perdeu o PvP por inatividade.
```

Observação de infraestrutura:
- o Worker registra e agenda os eventos automaticamente via Durable Object Alarm
- a saída autônoma para o chat pela API oficial da Twitch está operacional e validada em produção
- avisos de 60s, perdas de turno por AFK, derrota por inatividade e timeout de desafios podem ser publicados sem depender de novo comando no chat
- o StreamElements continua sendo usado na camada de comandos compatível, mas essas mensagens espontâneas não dependem do `customapi`
- o bot central dedicado do Marbion continua como etapa futura da plataforma Multi-Streamer
---

# 🏆 RANKING PVP / XP DE COMBATE

## Sistema atual
Status V2: ✔️ **Ranking Dinâmico V2 validado em produção**

- XP de Combate separado do XP normal
- rating inicial: 1000
- ganho e perda são calculados separadamente
- o sistema não é zero-sum
- dificuldade de progressão aumenta conforme o próprio rating
- diferença de rating entre adversários altera risco/recompensa
- vitória normal rende pelo menos +1, salvo partida amistosa/anti-farm
- rating nunca fica abaixo de 0
---

## Elos
Status V2: ✔️

- Prata III: 0+
- Prata II: 1100+
- Prata I: 1200+
- Ouro III: 1300+
- Ouro II: 1400+
- Ouro I: 1500+
- Platina III: 1600+
- Platina II: 1700+
- Platina I: 1800+
- Diamante III: 1900+
- Diamante II: 2000+
- Diamante I: 2100+
- Corrompido III: 2200+
- Corrompido II: 2300+
- Corrompido I: 2400+
- Imperador III: 2500+
- Imperador II: 2600+
- Imperador I: 2700+

Prodígios:
- somente jogadores com 2700+ podem ocupar vagas
- limite de 7 posições
- Prodígio I até Prodígio VII

---

## !rank
Status V2: ✔️

Inclui:
- Elo
- XP de Combate
- vitórias
- derrotas
- PvPs
- sequência atual
- melhor sequência

---

## !toprank
Status V2: ✔️

---

## Ranking Dinâmico V2
Status V2: ✔️ **implementado, testado e validado em produção**

Objetivo:
- quanto maior o próprio rating, mais difícil continuar subindo
- jogador de rating alto ganha menos por vitória e perde mais por derrota
- diferença de rating entre adversários também altera risco/recompensa
- sistema deixa de ser zero-sum

### Dificuldade pessoal

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

### Vitória contra adversário mais forte

```txt
delta = opponentRating - playerRating
winMultiplier = 1 + min(1.5, delta / 800)
```

Máximo: `2.5x`.

### Vitória contra adversário mais fraco

```txt
winMultiplier = max(0.08, 1 / (1 + abs(delta) / 200))
```

Em diferenças extremas, um favorito pode ganhar apenas 1 ou 2 pontos.

### Derrota do jogador mais fraco contra jogador mais forte

```txt
lossMultiplier = 1
```

Perder para alguém muito acima NÃO adiciona punição extra pela diferença de rating.

### Derrota do jogador mais forte contra jogador mais fraco

```txt
lossMultiplier = min(3, 1 + abs(delta) / 600)
```

### Caps planejados

- ganho normal máximo: `+75`
- perda normal máxima: `-150`
- perda máxima por desistência: `-300`
- rating nunca abaixo de `0`
- vitória normal sempre rende pelo menos `+1`, salvo partida amistosa/anti-farm

### Princípio

O ganho do vencedor e a perda do derrotado são calculados separadamente.

Exemplo conceitual:
```txt
favorito vence jogador muito abaixo
→ pode ganhar +2

favorito perde para jogador muito abaixo
→ pode perder -100 ou mais
```

Coeficientes devem ficar centralizados/configuráveis para permitir balanceamento posterior sem reescrever o motor.

---

## Anti-farm por repetição de adversário
Status V2: ✔️ **implementado e validado em produção**

Janela canônica: **24 horas**.

Para a mesma dupla A x B:
```txt
1ª partida → ranqueada
2ª partida → ranqueada
3ª partida → ranqueada
4ª partida e seguintes → amistosa, ±0 Elo
```

Regras:
- conta partidas entre a dupla, não vitórias consecutivas
- A x B e B x A são a mesma dupla
- alternar propositalmente o vencedor não reinicia a contagem
- da 4ª em diante a luta continua funcionando normalmente, mas não altera rating
- partidas amistosas também devem participar da janela móvel para impedir farming contínuo
- quando a janela móvel permitir novamente menos de 3 confrontos recentes, a dupla volta a poder disputar partidas ranqueadas

Partida amistosa por anti-farm não deve alterar:
- rating
- peakRating
- wins/losses ranqueados
- duels ranqueados
- streak
- bestStreak

---

# 🛠️ ADMINISTRAÇÃO

## !adm
Status V2: ✔️

Subcomandos atuais:
```txt
!adm level @usuario 20
!adm raça @usuario Terrariano
!adm elemento @usuario Fogo Terra
!adm status reset @usuario
!adm pontos @usuario 10
!adm skill @usuario add Nome da Habilidade
!adm skill @usuario rem Nome da Habilidade
!adm pvp empate
!adm pvp vitória @usuario
```

---

## !adm hp
Status V2: ✔️ **validado fora e dentro do PvP**

SET absoluto:
```txt
!adm hp @usuario 5
```

Ajustes relativos:
```txt
!adm hp @usuario +5
!adm hp @usuario -5
!adm hp @usuario + 5
!adm hp @usuario - 5
!adm hp @usuario mais 5
!adm hp @usuario menos 5
```

Regras:
- SET define o valor exato; não soma
- `+` adiciona
- `-` remove
- mínimo 0
- máximo `maxHp`
- em PvP altera o snapshot vivo
- fora do PvP altera o perfil
- `HP 0` por ADM não concede vitória automaticamente

---

## !adm mentalidade
Status V2: ✔️ **validado fora e dentro do PvP**

Usa a mesma sintaxe de SET / `+` / `-` do HP.

Regras:
- mínimo 0
- máximo `maxMentalidade`
- em PvP altera o snapshot vivo
- fora do PvP altera o perfil persistente

---

## Reset administrativo de tempo
Status V2: ✔️ **implementado e validado em produção**

Sintaxes equivalentes:
```txt
!adm tempo reset @usuario escopo [extra]
!adm reset tempo @usuario escopo [extra]
```

Escopos:
```txt
tudo
pvp
afk
habilidades
habilidade 1-4
meditar
antifarm @oponente
daily
checkin
xpchest
reroll
cura
```

Regras:
- `antifarm` limpa o histórico da dupla dos dois lados
- `habilidade N` limpa somente o cooldown do slot escolhido
- `pvp` limpa tempos/restrições temporais ligados ao PvP
- `afk` limpa bloqueio, nível de reincidência, janela de 30 minutos e strikes vivos da batalha
- `tudo` inclui também o estado temporal/disciplinar de AFK
- não apaga raça, elementos, Elo, vitórias/derrotas, inventário ou identidade do personagem

---

## Recursos máximos por ADM
Status V2: ✔️

Comandos:
```txt
!adm maxhp @usuario valor
!adm maxmentalidade @usuario valor
```

Regras:
- altera o máximo no perfil e no snapshot vivo quando aplicável
- aumentar o máximo não cura/preenche automaticamente
- diminuir o máximo limita o valor atual se necessário

---

## Reset administrativo de Elo
Status V2: ✔️ **implementado, testado e validado em produção**

Comandos:
```txt
!adm elo reset @usuario
!adm elo reset geral
```

### Reset individual

```txt
!adm elo reset @usuario
```

Regras:
- rating volta para `1000`
- rank é recalculado a partir do novo rating
- posição de Prodígio é removida
- vitórias e derrotas são preservadas
- quantidade de PvPs é preservada
- sequência atual e melhor sequência são preservadas
- `peakRating` é preservado
- histórico anti-farm é preservado
- disciplina e penalidades de AFK são preservadas
- ledger de resultados/exact-once é preservado

O reset individual altera somente o estado competitivo atual de Elo/rank/Prodígio.

### Reset geral

```txt
!adm elo reset geral
```

O reset geral utiliza um sistema de **gerações de Elo**.

Ao executar:
```txt
geração atual → próxima geração
```

Exemplo validado em produção:
```txt
geração 0 → 1
```

Cada perfil possui sua própria geração de Elo. Quando um perfil antigo é acessado pela primeira vez após um reset geral, ele é sincronizado automaticamente para a geração atual.

Na sincronização:
- rating volta para `1000`
- rank é recalculado
- posição de Prodígio é removida
- histórico competitivo é preservado
- `peakRating` é preservado
- anti-farm é preservado
- disciplina de AFK é preservada
- ledger de resultados é preservado

A sincronização é preguiçosa:
- o reset geral não precisa percorrer todos os jogadores de uma vez
- cada perfil é atualizado quando for acessado
- um perfil atrasado pode avançar diretamente para a geração atual
- acessar novamente o perfil na mesma geração não aplica outro reset

Proteções:
- o reset geral é recusado enquanto existir batalha PvP ativa
- é recusado enquanto houver desafio PvP pendente
- é recusado enquanto houver jogadores na fila PvP
- existe trava temporária durante a troca de geração

A geração global fica no coordenador PvP e é espelhada no KV para evitar uma consulta extra de Durable Object em cada leitura de perfil.

Validação em produção:
- `SilenceWorky`: Elo `842 → 1000`, mantendo `10 vitórias / 14 derrotas / 29 PvPs / sequência 2 / melhor sequência 2`
- `acervojuju`: sincronizado para `1000`, mantendo `13 vitórias / 16 derrotas / 29 PvPs / sequência 0 / melhor sequência 7`

---

# 🗓️ TEMPORADAS E PASSE

## Temporadas ranqueadas
Status V2: ✔️ **infraestrutura mensal implantada em produção em 15/09/2026; smoke tests de leitura e isolamento passaram**

Modelo canônico:
- temporadas seguem **meses civis**, não uma duração fixa de 30 dias
- timezone canônica: `America/Fortaleza` (UTC−03:00)
- `startsAt` = dia 1 às 00:00 do mês correspondente
- `endsAt` = dia 1 às 00:00 do mês seguinte
- atraso técnico dentro do próprio mês NÃO prorroga o encerramento
- mês já encerrado nunca é ativado retroativamente
- mês sem definição/autorização não gera temporada automaticamente

Tema-base e nome anual são conceitos separados:
- o tema-base pertence ao mês e pode ser reutilizado em anos diferentes
- o nome da temporada varia por ano
- Agosto possui tema-base canônico `Arquivo do Infinito`
- Setembro possui tema-base canônico `Jardim do Criador`
- outros meses só podem receber tema-base quando forem definidos oficialmente

Planejamento/autorização:
- uma temporada pode ser definida com antecedência de meses ou anos
- o catálogo oficial pode preencher automaticamente meses autorizados
- uma definição já persistida por painel/site/ADM tem prioridade sobre o catálogo
- uma entrada presente no catálogo oficial conta como autorização prévia
- se o cron falhar antes da meia-noite, o mês corrente ainda pode ser reconciliado enquanto `now < endsAt`
- `scheduledAt` registra o horário real da primeira persistência/reconciliação
- schedules vencidos são removidos para não permanecerem órfãos no storage

Ativação/encerramento:
- ativação ocorre automaticamente apenas para mês previamente autorizado
- falha técnica de ativação gera retry horário dentro do próprio mês
- retry nunca atravessa `endsAt`
- temporada mensal ativa agenda seu próprio encerramento
- na virada mensal, a anterior encerra antes da ativação do novo mês autorizado
- se não existir nova temporada autorizada, nenhuma é inventada

Alarm compartilhado:
- temporada, desafio PvP, timeout de batalha, retry transitório e retry de ativação compartilham o Durable Object Alarm
- prioridade é sempre do evento mais próximo
- retry transitório de batalha de 1 segundo não pode ser substituído por candidato de temporada ausente

Comandos atuais:
```txt
!temporada
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

Comandos legados desativados:
```txt
!adm temporada iniciar ...
!adm temporada agendar ...
```

`!temporada`:
- exibe temporada ATIVA quando existir
- exibe a próxima temporada AGENDADA quando não houver ativa
- mostra início/fim ou tempo restante
- inclui rank/rating do jogador quando disponível

`!adm temporada definir`:
- cria ou atualiza o planejamento do mês
- autoriza/agendar internamente o mês futuro
- não inicia imediatamente
- só funciona antes do início do mês
- exige tema-base canônico já configurado

`!adm temporada cancelar`:
- remove a autorização/agendamento temporal
- preserva o nome planejado
- se a temporada já estiver ativa, deve-se usar `encerrar`

`!adm temporada encerrar`:
- ferramenta administrativa de emergência
- encerra a temporada atual
- ainda não executa recompensas nem soft reset nesta etapa

Ainda pendente antes de considerar o ciclo completo de temporadas finalizado:
- validação do ciclo real `SCHEDULED → ACTIVE → ENDED` quando a primeira temporada oficial for autorizada
- snapshot final do ranking
- histórico de campeões/Prodígios da temporada
- recompensas/títulos de encerramento
- soft reset de Elo sazonal
- XP de temporada e Passe de Batalha

---

## Passe de batalha — Temporada 1
Status V2: ⏳

Planejado:
- XP de temporada por atividades válidas
- níveis progressivos
- recompensas de XP normal
- itens
- consumíveis futuros
- cosméticos/títulos
- título exclusivo no nível final

Quantidade exata de níveis e nome do título final ainda serão definidos.

---

## Soft reset de Elo ao fim da temporada
Status V2: ⏳ **fórmula definida**

Para rating acima de 1000:
```txt
newRating = 1000 + round((rating - 1000) * 0.75)
```

Isso remove 25% do excesso acima de 1000 e preserva 75% da progressão.

Exemplos:
```txt
1200 → 1150
1500 → 1375
1800 → 1600
2100 → 1825
2400 → 2050
2700 → 2275
```

Fluxo de encerramento futuro:
1. congelar/salvar ranking final
2. conceder recompensas/títulos
3. registrar campeões e Prodígios
4. aplicar soft reset
5. limpar/recalcular posições de Prodígio
6. zerar XP/nível do passe encerrado
7. aguardar/ativar a próxima temporada somente se ela estiver previamente autorizada

Nunca iniciar automaticamente um mês sem definição/autorização oficial.

---

# 🏷️ TAGS

Status V2: ⏳ migração

Planejado/legado:
- `!tag`
- `!tags`
- `!settag`
- `!admsettag`
- `!addtag`
- `!removetag`

---

# 👹 MOBS

Status V2: 🗃️ legado V1 ainda não migrado

Reimplementar modularmente:
- spawn automático
- spawn manual
- raridade
- mob específico
- despawn
- elementos
- drops
- combate contra mobs
- bloqueio durante boss

Comandos legados:
- `!mob`
- `!vermob`
- `!combate`
- `!mobon`
- `!moboff`

---

# 👑 BOSSES

Status V2: 🗃️ legado V1 ainda não migrado

Preservar/reimplementar:
- spawn manual/automático
- fila
- boss impede mob
- fases
- boss enfurecido
- barra global de HP
- música dinâmica
- alertas animados
- overlays
- Raid Boss global futuro

Comandos legados:
- `!boss`
- `!viewboss`
- `!killboss`
- `!bosson`
- `!bossoff`

---

# 🗡️ ARMAS VÍNCULOS E EQUIPAMENTOS

Status V2: 🗃️ estrutura preservada; sistema completo ainda não migrado

Objetivos:
- 1 Arma Vínculo especial por perfil
- arma ligada à alma
- durabilidade
- quebra podendo causar consequência grave/morte
- Armas ADM especiais
- efeitos individuais
- armas normais equipáveis
- armaduras
- ferreiro/reparo
- drops de equipamentos

Comandos legados/planejados:
- `!arma`
- `!minhaarma`
- `!rollarma`
- `!addarma`
- `!removerarma`

---

# 💀 MORTE E REENCARNAÇÃO

Status V2: ⏳

O perfil já possui campos estruturais preparados para:
- morte
- número de mortes
- ciclos
- reencarnações
- causa/data da morte

Fluxo completo ainda precisa ser integrado.

---

# ♻️ REBUFF

Status V2: ⏳

Referência V1 preservada:
- rebuff voluntário
- reseta progressão
- mantém regras especiais de arma
- concede bônus permanentes

Requisitos antigos, ainda sujeitos a revisão:
- Rebuff 1: nível 50
- Rebuff 2: nível 100
- Rebuff 3: nível 200
- Rebuff 4: nível 500
- Rebuff 5: nível 1000
- Rebuff 6: nível 2000
- Rebuff 7: nível 3500
- Rebuff 8: nível 5000
- Rebuff 9: nível 7500
- Rebuff 10: nível 10000

---

# 🎒 ITENS E INVENTÁRIO

Status V2: ⏳

O perfil já possui `inventory`.

Planejado:
- `!inventario`
- `!item nome`
- `!giveitem`
- drops
- itens customizados
- pergaminhos como item real
- poções
- efeitos persistentes

---

# 🧬 INDIVIDUALIDADE DO PERSONAGEM

Status V2: ⏳ **conceito registrado**

Planejado depois de fechar o bloco PvP atual:
- nome próprio do personagem separado do username Twitch
- futuro `!nome <nome>`
- gênero gerado no nascimento/criação
- idade inicial normalmente 14 ou 15 anos
- base para títulos

Futuro avançado:
- envelhecimento por XP/atividade/tempo no RPG
- longevidade diferente por raça
- títulos ligados à idade e feitos

Morte automática por idade NÃO será implementada por enquanto.

---

# 🌐 PLATAFORMA MULTI-STREAMER

Status V2: ⏳ **especificação registrada / grande próxima fase de infraestrutura**

Objetivo:
- RPG compartilhado entre múltiplas lives da Twitch
- personagem pertence ao jogador, não ao canal
- mesmo personagem/raça/elementos/nível/inventário/ranking em qualquer canal participante

Identidade futura canônica:
```txt
Twitch User ID
→ Marbion Player ID
→ perfil global
```

Antes de abrir para vários canais:
- migrar username atual → Twitch User ID
- preservar personagens atuais
- aliases para compatibilidade
- testar um mesmo jogador em múltiplos canais

---

## Marbion Bot próprio
Status V2: ⏳

Base já operacional:
- saída autônoma do Worker para o chat via API oficial da Twitch ✔️
- publicação automática de eventos de AFK e timeout de desafios ✔️
- o bot central dedicado do Marbion, com identidade própria e uso Multi-Streamer, continua pendente

Estratégia preferencial:
- bot central do Marbion entra nos canais autorizados
- comandos ficam centralizados
- atualizações aparecem para todos sem instalar comando por comando
- StreamElements continua suportado como compatibilidade, mas não deve ser dependência obrigatória do núcleo

---

## Site público / painel
Status V2: ⏳

Jogador:
- Início
- Personagem
- Comandos
- Conta

Streamer:
- Painel do Streamer
- Overlays
- Permissões
- Regras de Streamers
- Vídeo de Introdução
- Integrações
- Configuração do RPG

---

## Cargos e permissões
Status V2: ⏳

Planejado com RBAC + permissões granulares:
- PRIMARY_OWNER
- OWNER
- TRUSTED_STREAMER
- PARTNER_STREAMER
- PLAYER

Permissões sensíveis devem ser verificadas no backend e auditadas.

Página privada `Streamers`:
- exclusiva do PRIMARY_OWNER inicialmente
- aprovar novos streamers
- escolher cargo-base
- aplicar overrides individuais
- suspender/bloquear/remover acesso de canal
- bloquear canal nunca apaga personagens globais

---

## Overlays Multi-Streamer
Status V2: ⏳

Planejado:
- catálogo de overlays para Boss, Mob, PvP, personagens, HUD, loot, ranking e eventos
- templates oficiais + configuração própria de cada canal
- customização de visual/conteúdo/áudio
- link Browser Source para OBS
- URL somente leitura e revogável
- mesmo evento global pode ter apresentações diferentes em cada live
- sincronização futura em tempo real por WebSocket ou mecanismo equivalente

---

# 🔮 ROADMAP / SISTEMAS FUTUROS

## ✅ NÚCLEO DE COMBATE JÁ FECHADO

- HP real ✔️
- Mentalidade real ✔️
- regeneração natural de Mentalidade ✔️
- Cura ✔️
- Buff ✔️
- Debuff ✔️
- Meditação ✔️
- DoT genérico ✔️
- Veneno ✔️
- Queimadura ✔️
- Sangramento ✔️
- Controles/restrições principais ✔️
- Cooldown real ✔️
- Crítico geral ✔️
- Counter ✔️
- Refletir ✔️
- matriz de dano elemental ✔️
- resistências/fraquezas ✔️
- imunidades 0x / retorno 2x ✔️
- elementos duplos ✔️
- Combos Elementais V1 ✔️
- comandos ADM de HP/Mentalidade ✔️
- Fila Global de PvP ✔️
- Ranking Dinâmico V2 ✔️
- Anti-farm A x B ✔️
- `!recusar` ✔️
- `!desistir` ✔️
- Soco universal via `!ataque soco` ✔️
- reset administrativo de tempos ✔️
- reset administrativo de Elo individual e geral ✔️
- timeout de 90s via Durable Object Alarm ✔️
- disciplina progressiva de AFK ✔️
- saída autônoma Twitch para eventos PvP ✔️
- timeout automático de desafios pendentes após 2 minutos ✔️

## 🌟 PRIORIDADE ATUAL — ORDEM CANÔNICA

1. **Ranking Dinâmico V2** — cálculo assimétrico de ganho/perda ✔️
2. **Anti-farm A x B** — 3 partidas ranqueadas/24h; 4ª+ amistosa ✔️
3. **`!recusar`** ✔️
4. **`!desistir` / forfeit** — penalidade 2x e proteção precoce ✔️
5. **Timeout/AFK + disciplina progressiva + hardening exact-once** ✔️
6. **Reset administrativo de Elo individual e geral** ✔️
7. **Temporadas ranqueadas — infraestrutura mensal implantada** ✔️
8. **Passe de batalha da Temporada 1** ⏳
9. **Soft reset sazonal + snapshot/recompensas de encerramento** ⏳
10. **Habilidades de Suporte com efeitos reais** ⏳
11. **Aprendizado automático de habilidades por nível** ⏳
12. **Combos Elementais V2 / novas reações** ⏳
13. **Efeitos especiais de Tempo, Espaço, Gravidade e Matéria** ⏳
14. **Individualidade básica do personagem** ⏳
15. **Fundação Multi-Streamer / site / bot próprio** ⏳

## 🎒 PROGRESSÃO / ITENS

- inventário completo ⏳
- itens consumíveis ⏳
- pergaminhos como item real ⏳
- drops ⏳
- `!checkin` ⏳
- `!xpchest` ⏳
- streak do `!daily` ⏳
- morte/reencarnação ⏳
- Rebuff ⏳

## 👹 CONTEÚDO PVE

- migração modular de Mobs V1 → V2 ⏳
- combate contra mobs ⏳
- drops de mobs ⏳
- migração de Boss V1 → V2 ⏳
- Raid Boss global ⏳
- múltiplas fases ⏳
- boss enfurecido ⏳

## 🗡️ EQUIPAMENTOS

- Armas Vínculos V2 ⏳
- Armas ADM V2 ⏳
- armas normais equipáveis ⏳
- armaduras ⏳
- durabilidade ⏳
- ferreiro/reparo ⏳
- drops de equipamentos ⏳

## 🖥️ OVERLAY / VISUAL

- personagens PvP em pixel art ⏳
- site de criação de personagem ⏳
- vínculo Twitch ⏳
- animação de ataques ⏳
- overlay PvP completo ⏳
- kill feed ⏳
- level up visual ⏳
- boss em pixel art ⏳
- overlay de raid/loot ⏳

## 🏛️ SOCIAL

- guildas ⏳
- clans ⏳
- guerra de guildas ⏳
- boss de guilda ⏳
- chat de guilda ⏳
- títulos ⏳
- achievements ⏳

## 💰 ECONOMIA

- moeda/economia ⏳
- loja ⏳
- trade ⏳
- marketplace ⏳
- crafting ⏳

## 🌎 MUNDO

- quests ⏳
- NPCs ⏳
- biomas ⏳
- eventos globais ⏳
- dungeons ⏳
- relíquias ⏳

## 🎣 PROFISSÕES

- pesca ⏳
- mineração ⏳
- alquimia ⏳
- pets ⏳

---

# 📚 DOCUMENTOS DE ESPECIFICAÇÃO RELACIONADOS

- `docs/ranking-temporadas-roadmap-2026-09-11.md`
- `docs/individualidade-personagem.md`
- `docs/plataforma-multistreamer.md`
- `docs/administracao-streamers.md`
- `docs/overlays-multistreamer.md`
- `docs/counter-refletir.md`
- `docs/regeneracao-mentalidade.md`

---

# 📌 PONTO EXATO DE CONTINUIDADE — 15/09/2026

Últimos sistemas concluídos e validados em produção:
```txt
Timeout/AFK de 60s/90s via Durable Object Alarm ✔️
Disciplina progressiva de AFK ✔️
Saída autônoma para o chat via API oficial da Twitch ✔️
Timeout automático de desafio PvP após 2 minutos ✔️
Cancelamento sem AFK, Elo ou estatísticas ✔️
Reset administrativo individual de Elo ✔️
Reset administrativo geral de Elo por geração ✔️
- geração 0 → 1 validada em produção
- perfis sincronizam para 1000 ao serem acessados
- histórico competitivo, anti-farm, AFK e ledger preservados
- geração forte no coordenador PvP e espelho no KV
- leitura comum de perfil não cria um Durable Object extra para consultar geração
```

Etapa 24 implantada em produção em 15/09/2026:
```txt
Temporadas mensais por calendário civil ✔️
- planejamento anual
- autorização/agendamento mensal
- catálogo oficial
- ativação automática
- bootstrap atrasado do mês corrente autorizado
- retry horário de ativação
- encerramento automático mensal
- limpeza de schedules vencidos
- prioridade segura do alarm compartilhado com PvP
- comandos !adm temporada definir/cancelar/encerrar
- !temporada exibindo ativa ou próxima agendada
- smoke test: nenhuma temporada cadastrada após deploy
- smoke test: /season/start público retorna 404
- smoke test: /rank preservou estado competitivo
- smoke test: /estado preservou perfil e recursos
```

A validação do ciclo real `SCHEDULED → ACTIVE → ENDED` fica reservada para a primeira temporada oficial autorizada. Nenhuma temporada real foi criada no deploy.

Próximo passo técnico:
```txt
Etapa 25 — Passe de batalha da Temporada 1
```

Depois:
```txt
snapshot/recompensas de encerramento
→ soft reset sazonal de Elo
→ habilidades de Suporte com efeitos reais
→ aprendizado automático de habilidades por nível
```

Regra operacional: nenhuma temporada real deve ser criada/ativada em produção sem autorização explícita.