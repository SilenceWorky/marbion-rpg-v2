# 🎮 CMD RPG — MARBION V2

> Documento oficial de acompanhamento dos comandos e sistemas do **Marbion RPG V2**.
>
> Regra de manutenção: este arquivo deve ser atualizado sempre que um sistema novo for implementado, alterado ou concluído.
>
> Legenda: **✔️ implementado na V2** | **🧪 implementado/em validação** | **⏳ pendente** | **🗃️ legado V1 ainda não migrado**

---

# 🧱 ARQUITETURA V2

- Worker modular Cloudflare ✔️
- KV central `MARBION_USERS_V2` ✔️
- acesso a perfil centralizado por `getProfile()` / `saveProfile()` ✔️
- Durable Object `PVP_COORDINATOR` para estado de batalha ✔️
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
- efeitos persistentes
- buffs/debuffs de batalha quando existirem
- dano por turno e duração restante de Veneno, Queimadura e futuros DoTs quando existirem
- Controles ativos, origem e quantidade de ações ainda bloqueadas

Exemplo:
```txt
@SilenceWorky | ⚔️ PvP T8 vs @acervojuju | ❤️ HP: 58/100 | 🧠 Mentalidade: 0/50 | Efeitos: Nenhum
```

---

# 🎁 XP E RECOMPENSAS

## !daily
Recompensa diária.

Status V2: ✔️ versão básica

Atualmente:
- entrega entre 40 e 70 XP
- cooldown exato de 24h

Pendente:
- streak de daily
- bônus progressivo de streak
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
Status V2: ✔️ regras de compatibilidade

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

# 🧠 HABILIDADES

## Catálogo de habilidades
Status V2: ✔️

Catálogo atual:
- 30 categorias elementais/fusões
- 50 habilidades por categoria
- 1500 habilidades elementais/fusões
- 3 habilidades Universais preservadas
- total atual: 1503 habilidades

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
!slot [número do slot] [número da habilidade]
```

O primeiro número indica **em qual dos 4 slots** a habilidade será equipada.
O segundo número indica **qual habilidade da sua lista `!habilidades`** será colocada naquele slot.

Exemplo:
```txt
!slot 1 2
```
Coloca a **habilidade nº 2** da lista no **slot 1**.

Se a habilidade nº 2 for **Bola de Fogo**, `!slot 1 2` equipa **Bola de Fogo no slot 1**.

Outro exemplo:
```txt
!slot 1 25
```
Coloca a **habilidade nº 25** da lista no **slot 1**.

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
- custo de Mentalidade: 0
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
Status V2: ✔️ regra de compatibilidade e aprendizado

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
- errar o golpe ainda consome o uso
- morrer antes de agir NÃO consome
- após o último uso é removida de `skills`, `skillMeta`, cooldown e slots
- slot vazio volta a Soco

---

# 🧠 MENTALIDADE

## Sistema de Mentalidade em PvP
Status V2: ✔️

Regras:
- cada habilidade pode ter `custoMentalidade`
- a escolha só é aceita se houver Mentalidade suficiente
- escolher NÃO gasta Mentalidade
- executar gasta Mentalidade
- se o jogador morrer antes de agir, não gasta
- Soco custa 0
- `!estado` mostra o valor atual durante a luta

---

## !meditar
Recupera Mentalidade como uma ação especial de combate.

Status V2: ✔️ **validado em PvP real**

Regras atuais:
- recupera 25 de Mentalidade
- respeita `maxMentalidade`
- não ocupa nenhum dos 4 slots
- prioridade: -1
- normalmente age depois de ataques de prioridade 0
- se o jogador morrer antes da vez da Meditação, não recupera Mentalidade
- se morrer antes de agir, o cooldown também não é criado
- não pode meditar com a Mentalidade já cheia
- após executar, entra em cooldown por 3 turnos completos
- se meditar no T4, fica bloqueado no T5, T6 e T7 e volta a estar disponível no T8

Teste real validado:
```txt
Mentalidade: 15/50 → Meditação → 40/50
```

---

## Recuperação genérica de Mentalidade
Status V2: ✔️ base estrutural

`restoreMentalidade()` pode ser reutilizada futuramente por:
- poções
- livros
- comidas
- habilidades de suporte
- equipamentos
- outros sistemas de recuperação

Regeneração natural por tempo fora de combate: ⏳

---

# ❤️ HP E CURA

## HP real no PvP
Status V2: ✔️

- cada batalha cria um snapshot de HP máximo
- dano altera HP dentro do Durable Object
- HP nunca cai abaixo de 0

---

## Cura
Status V2: ✔️

- habilidades `tipo: Cura` curam o próprio usuário
- cura respeita `maxHp`
- valor realmente curado é separado da cura teórica
- gasto de Mentalidade ocorre normalmente

Teste real validado com **Maré Regenerativa**.

---

# ⬆️ BUFFS

## Buff de atributo
Status V2: ✔️ **validado em PvP real**

Funcionamento atual:
- habilidades `tipo: Buff` agem sobre o próprio usuário
- o atributo afetado vem de `skill.escala`
- atributos suportados: Força, Magia, Velocidade, Evasão, Precisão e Defesa
- força inicial do buff: `custoMentalidade / 5`
- mínimo +1
- máximo +10
- duração base: 2 turnos
- o bônus é registrado em `player.effects`
- ao expirar, o valor aplicado é removido do atributo
- `!estado` pode exibir o efeito enquanto estiver ativo

Teste local validado com **Foco Absoluto**:
```txt
Precisão: 90 → 93
Mentalidade: 50 → 35
```

Teste real em PvP validado:
```txt
Foco Absoluto → +3 de Precisão por 2 turnos
```

## Expiração de efeitos
Status V2: ✔️

- `expireBattleEffects()` processa efeitos quando um novo turno começa
- buff continua ativo durante sua duração
- ao atingir o turno de expiração, o atributo volta ao valor anterior
- efeito expirado é removido de `player.effects`

Exemplo validado:
```txt
T1: Precisão 90 → 93
T2: Precisão 93
T3: Precisão 93 → 90 e efeito removido
```

---

# ☠️ DEBUFFS E DANO POR TURNO

## Debuffs de atributo
Status V2: ✔️ **validado em PvP real**

Funcionamento atual:
- habilidades `tipo: Debuff` precisam acertar o adversário
- podem causar dano direto e aplicar Debuff na mesma ação
- o atributo afetado vem de `skill.debuffStat`
- atributos suportados: Força, Magia, Velocidade, Evasão, Precisão e Defesa
- força inicial do Debuff usa `custoMentalidade / 5`
- mínimo de 1
- máximo de 10
- atributo nunca fica abaixo de 0
- somente a quantidade realmente retirada é registrada
- duração base: 2 turnos
- ao expirar, o atributo retirado é devolvido exatamente
- se o golpe errar, não causa dano e não aplica Debuff
- mesmo errando, a habilidade executada consome Mentalidade
- `!estado` mostra o Debuff enquanto estiver ativo

Teste real validado com **Brasa Ascendente**:
```txt
Defesa: 5 → 3
Efeito: ⬇️ Defesa -2
Após expiração: Defesa volta para 5
```

---

## Veneno
Status V2: ✔️ **validado em PvP real**

Habilidades `tipo: Veneno` podem produzir três efeitos na mesma execução:
```txt
Dano direto
+
Debuff de atributo
+
Envenenamento periódico
```

Regras atuais:
- o golpe precisa acertar para envenenar
- Veneno não é aplicado se o dano direto já derrubar o alvo
- duração base: 3 ticks
- primeiro tick acontece no início do turno seguinte
- dano por tick = `Math.max(2, Math.round(custoMentalidade * 0.35))`
- reaplicar Veneno renova a duração
- vários Venenos não acumulam infinitamente
- ao reaplicar, permanece o maior dano por turno
- o dano periódico acontece antes das novas ações do turno
- se o Veneno reduzir HP a 0, a batalha termina antes das ações daquele novo turno
- se os dois jogadores morrerem simultaneamente por Veneno, o PvP termina empatado
- após o último tick, o efeito é removido automaticamente
- mensagens de combate mostram separadamente o HP após a ação e o HP após o tick de Veneno

Exibição no `!estado`:
```txt
☠️ Nuvem Tóxica — 8 dano/turno (2T)
```

Teste real validado com **Nuvem Tóxica**:
```txt
Dano direto
→ Debuff de Força
→ Envenenado

Início do T2 → -8 HP
Início do T3 → -8 HP
Início do T4 → -8 HP
→ efeito removido
```

Também foram validados:
- morte causada pelo último tick de Veneno
- encerramento da luta antes das novas ações quando o Veneno mata
- empate quando os dois jogadores chegam a 0 pelo Veneno no mesmo início de turno

---

## Motor genérico de dano periódico (DoT)
Status V2: ✔️ **validado com Veneno e Queimadura**

O processamento de dano periódico foi generalizado para que novos efeitos reutilizem a mesma infraestrutura.

Regras atuais:
- todos os DoTs são processados no início do novo turno, antes das novas ações
- cada tipo de DoT mantém sua própria instância ativa
- efeitos diferentes podem coexistir no mesmo personagem
- reaplicar o mesmo DoT renova sua duração e mantém o maior dano por turno
- o tick registra o dano realmente causado, sem permitir HP negativo
- o efeito que leva o personagem de HP positivo para 0 é marcado como letal
- `killedBy` registra exatamente o tipo e a habilidade responsáveis pela derrota
- depois que um DoT é letal, efeitos seguintes não geram ticks falsos de 0 de dano
- mensagens de derrota usam a causa real dinamicamente, permitindo Veneno, Queimadura e futuros DoTs

Tipos atualmente integrados ao motor:
```txt
☠️ Veneno
🔥 Queimadura
```

Planejado sobre a mesma base:
```txt
🩸 Sangramento
☢️ Radiação
🧬 Deterioração
🌋 Lava / outros efeitos periódicos
```

---

## Queimadura
Status V2: ✔️ **validado em PvP real**

A Queimadura é um efeito adicional da habilidade e não substitui o tipo principal dela.

Exemplo piloto no catálogo:
```json
{
  "nome": "Chama Devastadora",
  "tipo": "Elemental",
  "elemento": "Fogo",
  "dotType": "queimadura"
}
```

Regras atuais:
- a habilidade precisa acertar para aplicar Queimadura
- Queimadura não é aplicada se o dano direto já derrubar o alvo
- duração base: 2 ticks
- primeiro tick acontece no início do turno seguinte
- dano por tick = `Math.max(2, Math.round(custoMentalidade * 0.45))`
- reaplicar Queimadura renova os 2 ticks
- ao reaplicar, permanece o maior dano por turno
- Queimadura pode coexistir com Veneno
- após o segundo tick, o efeito é removido automaticamente
- `!estado` mostra dano por turno e ticks restantes
- a mensagem de combate separa o HP do golpe direto do HP após o tick
- se Queimadura levar o HP a 0, `killedBy` identifica Queimadura como causa da derrota
- em empate por DoT, cada jogador pode ter uma causa de derrota diferente

Exibição validada no `!estado`:
```txt
🔥 Chama Devastadora — 9 dano/turno (1T)
```

Teste real validado com **Chama Devastadora**:
```txt
T1: dano direto → Queimadura aplicada (9 dano/turno por 2 turnos)
Início do T2: -9 HP → Queimadura permanece com 1T
Início do T3: -9 HP → efeito removido
!estado após T3: Efeitos: Nenhum
```

Também foram validados localmente:
- Queimadura causa exatamente 2 ticks
- reaplicação renova duração e mantém a mais forte
- Veneno + Queimadura coexistem
- Queimadura pode derrubar o alvo
- Chama Devastadora real do catálogo executa como `burn` no PvP
- mensagem identifica dinamicamente derrota por Queimadura
- empate pode identificar causas diferentes, por exemplo Veneno em um jogador e Queimadura no outro

---

# ⚔️ PVP

## !pvp @usuario
Desafia outro jogador.

Status V2: ✔️

Exemplo:
```txt
!pvp @acervojuju
```

Convite expira após 2 minutos.

---

## !aceitar
Aceita o desafio recebido.

Status V2: ✔️

---

## !ataque 1-4
Escolhe um dos 4 slots de habilidade durante o turno.

Status V2: ✔️

Regras:
- escolha fica travada no turno
- primeiro jogador revela somente o número do slot
- habilidade real só é revelada quando os dois escolherem
- se a escolha for inválida por falta de Mentalidade, o jogador pode escolher outro slot

---

## Ordem das ações
Status V2: ✔️

1. prioridade da habilidade/ação
2. Velocidade
3. empate total → 50/50 aleatório

A Meditação participa desta mesma ordem com prioridade -1.

---

## Resolução ofensiva
Status V2: ✔️

Inclui:
- precisão da habilidade
- Accuracy do atacante
- Evasão do defensor
- chance mínima de acerto
- dano base
- atributo de escala
- Defesa com retorno decrescente
- HP real

---

## PvP simultâneo global
Status V2: ⏳

Objetivo definido:
- apenas 1 PvP pode acontecer por vez na transmissão
- outros desafios entram em uma fila global
- próximo combate inicia quando o atual terminar

Observação: o coordenador atual já controla batalhas por jogador, mas a fila global única ainda precisa ser implementada.

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

É separado do XP normal do personagem.
Serve para medir desempenho PvP.

Sistema matemático:
- Elo
- K = 32
- vencedor ganha XP de Combate
- perdedor perde XP de Combate
- diferença depende da força relativa dos dois ratings

Rating inicial:
```txt
1000
```

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
- somente jogadores com 2700+ podem ocupar as vagas
- limite de 7 posições
- Prodígio I até Prodígio VII

---

## !rank
Mostra o ranking PvP do jogador.

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
Mostra o topo do ranking PvP.

Status V2: ✔️

---

# 🛠️ ADMINISTRAÇÃO

## !adm
Comando central de administração.

Status V2: ✔️

Subcomandos atuais:
```txt
!adm level @usuario 20
!adm raça @usuario Terrariano
!adm elemento @usuario Fogo Terra
!adm pontos @usuario 10
!adm skill @usuario add Nome da Habilidade
!adm skill @usuario rem Nome da Habilidade
```

Regras:
- somente usuários autorizados
- protegido por chave administrativa
- `!adm pontos` adiciona Status Points disponíveis sem alterar diretamente os atributos
- ADM pode forçar habilidades incompatíveis com os elementos do personagem para testes/administração

---

# 🏷️ TAGS

Sistema de tags: ⏳ migração V2

Comandos planejados/legados:
- `!tag`
- `!tags`
- `!settag`
- `!admsettag`
- `!addtag`
- `!removetag`

---

# 👹 MOBS

Status V2: 🗃️ legado V1 ainda não migrado

Sistemas existentes na V1 que devem ser reimplementados modularmente:
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

Sistemas a preservar/reimplementar:
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

Status V2: 🗃️ legado V1 / estrutura de perfil preservada, sistema completo ainda não migrado

Objetivos preservados:
- 1 Arma Vínculo por perfil
- arma ligada à alma
- durabilidade
- quebra causa morte
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

O perfil V2 já possui campos para morte/reencarnação, mas o fluxo completo ainda precisa ser integrado aos comandos e combates.

Regras preservadas do projeto:
- morte normal não é rebuff
- reencarnação via raça
- limite de mortes/ciclos conforme design final
- quebra de Arma Vínculo pode causar morte

---

# ♻️ REBUFF

Status V2: ⏳

Regras de referência da V1 preservadas para futura migração:
- rebuff voluntário
- reseta progressão
- mantém regras especiais de arma
- concede bônus permanentes

Requisitos antigos:
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

Esses valores ainda devem ser revisados antes da implementação definitiva na V2.

---

# 🎒 ITENS E INVENTÁRIO

Status V2: ⏳

O perfil já possui `inventory`, mas os comandos completos ainda não foram migrados.

Planejado:
- `!inventario`
- `!item nome`
- `!giveitem`
- drops
- itens customizados
- pergaminhos de habilidades
- poções e efeitos persistentes

---

# 🖼️ PERSONAGEM / SKIN / OVERLAY

Status V2: ⏳

Projeto futuro definido:
- comando como `!skin` ou `!personagem`
- link para site personalizado
- login/vínculo pela conta Twitch
- editor de personagem em pixel art
- skin salva no perfil do jogador
- PvP mostra os dois personagens na tela da transmissão
- animações simples de ataque inicialmente
- futuramente animações específicas por habilidade
- boss também aparece em pixel art na tela
- animação do boss durante combate

---

# 🔮 Sistemas Futuros

## 🌟 PRIORIDADE ATUAL

- Buffs reais em combate ✔️
- Expiração de buffs por turno ✔️
- Meditação / recuperação de Mentalidade em PvP ✔️
- Debuffs reais em combate ✔️
- Veneno / dano por turno ✔️
- Queimadura / dano por turno ✔️
- Motor genérico de DoT ✔️
- Motor genérico de Controle ✔️
- Paralisia ✔️
- Congelamento ✔️
- Regeneração natural de Mentalidade fora do combate ⏳
- Counter ⏳
- Cooldown real de habilidades ⏳
- Crítico geral de habilidades ⏳
- Dano elemental ⏳
- Resistências e fraquezas elementais ⏳
- Combos elementais ⏳
- Fila global de PvP (1 luta por vez) ⏳
- Recusar/desistir/timeout PvP ⏳

## ⚔️ HABILIDADES

- 1503 habilidades cadastradas ✔️
- Cura real ✔️
- Mentalidade real ✔️
- Buff ✔️
- Meditação ✔️
- Debuff ✔️
- Suporte ⏳
- DoT ✔️ Veneno + Queimadura
- Controle ✔️ Paralisia + Congelamento
- Counter ⏳
- efeitos especiais de Tempo/Espaço/Gravidade/Matéria ⏳
- sistema de crítico ⏳

## 👑 BOSSES

- migração modular da V1 ⏳
- Raid Boss global ⏳
- boss em pixel art na transmissão ⏳
- animações de boss ⏳
- múltiplas fases ⏳
- boss enfurecido ⏳
- overlay de raid ⏳
- overlay de loot ⏳

## 🖥️ OVERLAYS / VISUAL

- personagens PvP em pixel art ⏳
- site de criação de skin/personagem ⏳
- vínculo com Twitch ⏳
- animação de ataques ⏳
- animações específicas de habilidade ⏳
- overlay PvP completo ⏳
- kill feed ⏳
- overlay de level up ⏳
- HUD MMORPG completa ⏳

## 🗡️ ARMAS

- migração das Armas Vínculos V1 → V2 ⏳
- Armas ADM V2 ⏳
- armaduras ⏳
- ferreiro/reparo ⏳
- drops reais de armas ⏳
- armas normais equipáveis ⏳
- armas proceduralmente numerosas ⏳

## 🏛️ SOCIAL

- guildas ⏳
- clans ⏳
- guerra de guildas ⏳
- boss de guilda ⏳
- chat de guilda ⏳
- títulos ⏳
- achievements ⏳

## 💰 ECONOMIA

- economia ⏳
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
