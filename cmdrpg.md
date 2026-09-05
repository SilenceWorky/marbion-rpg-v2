# 🎮 CMD RPG — MARBION V2

> Documento oficial de acompanhamento dos comandos e sistemas do **Marbion RPG V2**.
>
> Regra de manutenção: este arquivo deve ser atualizado sempre que um sistema novo for implementado, alterado ou concluído.
>
> Legenda: **✔️ implementado e validado** | **🧪 implementado/em validação** | **⏳ pendente** | **🗃️ legado V1 ainda não migrado**
>
> Última atualização canônica: **05/09/2026**.

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
- Controles ativos
- estados elementais como Molhado enquanto estiverem ativos

Exemplo:
```txt
@SilenceWorky | ⚔️ PvP T8 vs @acervojuju | ❤️ HP: 58/100 | 🧠 Mentalidade: 20/50 | Efeitos: Nenhum
```

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
Lista as habilidades que o jogador possui.

Status V2: ✔️

Regras:
- ordem segue `profile.skills`
- novas habilidades entram no final
- paginação de 8 habilidades por página

---

## !slot
Equipa uma habilidade em um dos 4 slots de batalha.

Status V2: ✔️

Sintaxe:
```txt
!slot [slot] [número da habilidade]
```

Exemplos:
```txt
!slot 1 2
!slot 1 25
```

Para limpar o slot e voltar ao Soco:
```txt
!slot 1 soco
!slot 1 0
```

---

## !slots
Mostra os 4 slots atuais.

Status V2: ✔️

Slot vazio usa **Soco** virtualmente.
Soco não ocupa `profile.skills`.

---

## Soco
Status V2: ✔️

Habilidade universal virtual:
- custo: 0
- dano base: 12
- precisão: 95
- prioridade: 0
- escala: Força

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

Exemplo validado:
```txt
15/50 → Meditação → 40/50
```

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
- ocorre por tempo fora do PvP
- não interfere na Mentalidade viva de uma batalha em andamento
- `!estado` fora do PvP aplica e persiste a regeneração quando necessário
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
- pode coexistir com outros DoTs

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
- divide o dano compatível em 50% recebido + 50% devolvido
- custo atual do Counter físico: 0

---

## Refletir
Status V2: ✔️ **validado em PvP real**

- reage a ataque Elemental compatível com os elementos refletíveis do personagem
- fusões desbloqueadas podem contar para Refletir
- divide o dano compatível em 50% recebido + 50% devolvido
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

Validação real:
```txt
52 de dano
+13 de Eletrocussão
= 65 de dano total
```

### Evaporação
```txt
Molhado + Fogo
→ ♨️ Evaporação
→ consome Molhado
→ sem bônus de dano na V1
```

Foi validada ao vivo usando **Onda Absoluto → Chama Devastadora**.
A Queimadura própria de Chama Devastadora continua independente da Evaporação.

---

# ⚔️ PVP

## !pvp @usuario
Status V2: ✔️

Convite expira após 2 minutos.

---

## !aceitar
Status V2: ✔️

---

## !ataque 1-4
Status V2: ✔️

Regras:
- uma escolha por turno
- primeiro jogador revela somente o slot
- habilidades só são reveladas na resolução
- falta de Mentalidade permite escolher outra ação

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

## PvP simultâneo global / fila única
Status V2: ⏳

Objetivo:
- apenas 1 PvP por vez na transmissão
- outros desafios entram em fila
- próximo combate inicia após o atual

---

## Recusar / desistir / timeout
Status V2: ⏳

Planejado:
- `!recusar`
- desistência/forfeit
- timeout de turno
- limpeza automática de batalha abandonada

---

# 🏆 RANKING PVP / XP DE COMBATE

## XP de Combate
Status V2: ✔️

- separado do XP normal
- Elo com K = 32
- vencedor ganha e perdedor perde conforme ratings relativos
- rating inicial: 1000

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

Exemplos:
```txt
!adm mentalidade @usuario 20
!adm mentalidade @usuario +10
!adm mentalidade @usuario -10
```

Regras:
- mínimo 0
- máximo `maxMentalidade`
- em PvP altera o snapshot vivo
- fora do PvP altera o perfil persistente

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

Comandos legados:
- `!boss`
- `!viewboss`
- `!killboss`
- `!bosson`
- `!bossoff`

---

# 🗡️ ARMAS VÍNCULOS E ARMAS ADM

Status V2: 🗃️ estrutura preservada; sistema completo ainda não migrado

Objetivos:
- 1 Arma Vínculo por perfil
- arma ligada à alma
- durabilidade
- quebra pode causar morte
- Armas ADM especiais
- efeitos individuais

Comandos legados/planejados:
- `!arma`
- `!minhaarma`
- `!rollarma`
- `!addarma`
- `!removerarma`

---

# 💀 MORTE E REENCARNAÇÃO

Status V2: ⏳

O perfil já possui campos preparados, mas o fluxo completo ainda precisa ser integrado.

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
- pergaminhos
- poções
- efeitos persistentes

---

# 🖼️ PERSONAGEM / SKIN / OVERLAY

Status V2: ⏳

Planejado:
- `!skin` / `!personagem`
- site personalizado
- login/vínculo Twitch
- editor em pixel art
- skin salva no perfil
- PvP com personagens na transmissão
- animações de ataque
- animações específicas por habilidade
- boss em pixel art

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

## 🌟 PRIORIDADE ATUAL

1. Fila global de PvP — 1 luta por vez ⏳
2. `!recusar`, desistência/forfeit e timeout de turno ⏳
3. Hardening final do ciclo de batalha e recuperação de lutas abandonadas ⏳
4. Habilidades de Suporte com efeitos reais ⏳
5. Aprendizado automático de habilidades por nível ⏳
6. Combos Elementais V2 / novas reações ⏳
7. Efeitos especiais de Tempo, Espaço, Gravidade e Matéria ⏳

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
