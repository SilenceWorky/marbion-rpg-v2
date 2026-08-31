# 🌐 Plataforma Multi-Streamer — Marbion RPG V2

Status: ⏳ Planejado / especificação registrada

## Objetivo

Transformar o Marbion RPG em um RPG compartilhado entre múltiplas transmissões da Twitch.

O personagem pertence ao jogador, não ao streamer/canal onde ele foi criado. Ao entrar em qualquer canal participante do Marbion RPG, o jogador mantém o mesmo personagem, raça, elementos, nível, XP, atributos, habilidades, slots, inventário, ranking, mortes, rebuffs, características especiais e demais dados globais.

A plataforma web será pública para jogadores e também funcionará como painel de integração e administração para streamers.

---

# 🧬 Identidade global do jogador

A identidade canônica deve ser o `Twitch User ID`, e não o nome do usuário.

Motivo: nomes da Twitch podem mudar; o ID permanece estável.

Estrutura conceitual:

```txt
Twitch User ID
  ↓
Marbion Player ID
  ↓
Perfil global do personagem
```

O backend deverá manter compatibilidade/migração dos perfis atuais que hoje usam username como chave.

---

# 🌍 Dados globais compartilhados

Devem ser globais entre todos os canais participantes:

- personagem
- raça
- elementos
- nível e XP
- atributos
- statusPoints
- HP/Mentalidade persistentes conforme regra futura
- habilidades aprendidas
- slots de habilidades
- inventário
- Arma Vínculo
- ranking PvP
- vitórias/derrotas/streaks
- mortes e rebuffs
- características/habilidades únicas vinculadas à alma
- punições globais do RPG
- eventos globais
- mobs globais, inicialmente
- bosses globais, inicialmente

Exemplo:

```txt
Jogador cria personagem na Live A
        ↓
visita a Live B
        ↓
usa exatamente o mesmo personagem
```

---

# 📺 Dados específicos de cada canal

Cada canal participante terá configuração própria, separada do personagem global:

- streamer responsável
- status do RPG no canal (ativo/inativo)
- conexão com Twitch
- conexão com StreamElements, quando utilizada
- permissões administrativas daquele streamer
- configuração de comandos
- configuração futura de overlays
- preferências visuais do canal
- participação em eventos globais
- futuras regras opcionais permitidas pela plataforma

Essa separação evita que configurações de uma live alterem indevidamente os personagens globais.

---

# 🔐 Login e integrações

## Jogador comum

Fluxo planejado:

```txt
Entrar com Twitch
→ perfil identificado pelo Twitch User ID
→ abrir personagem
```

Não precisa conectar StreamElements.

## Streamer

Fluxo planejado:

```txt
Entrar com Twitch
→ detectar canal
→ solicitar ativação do RPG
→ conectar integrações necessárias
→ configurar o canal
```

StreamElements poderá ser conectado como integração adicional quando necessário para instalação/gestão de comandos.

A implementação deve evitar tornar StreamElements uma dependência do núcleo do RPG.

---

# 🤖 Instalação do RPG em novos canais

Objetivo de UX:

```txt
Streamer entra no site
→ conecta a conta
→ clica em “Instalar Marbion RPG”
→ comandos/configurações são preparados automaticamente
```

O streamer não deve precisar copiar dezenas de comandos manualmente.

## Estratégia recomendada

A arquitetura deve permitir duas formas:

### 1. Marbion Bot — preferencial

Um bot central do próprio Marbion entra nos canais autorizados, lê os comandos e conversa diretamente com a API global do RPG.

Vantagens:
- não depende de criar um custom command por comando
- atualizações de comandos ficam centralizadas
- novos comandos aparecem para todos os canais sem reinstalação manual
- reduz dependência do StreamElements
- facilita padronização multi-streamer

### 2. Compatibilidade StreamElements

Manter suporte a StreamElements para canais que desejarem usá-lo.

O site poderá preparar/sincronizar os custom commands quando houver uma forma suportada de autorização/escrita pela integração do StreamElements.

Se a API oficial disponível no momento da implementação não fornecer todas as operações necessárias, deverá existir um instalador alternativo sem scraping ou credenciais inseguras.

---

# 🧭 Site público

## Menu de jogador comum

No menu hambúrguer no canto superior esquerdo:

- Início
- Personagem
- Comandos
- Conta

## Início

Tela principal focada no personagem.

Versão inicial pode exibir:

```txt
Skin do personagem — Em breve
```

ou um NPC/modelo padrão.

Dados que podem aparecer desde o início:
- nome Twitch
- raça
- elementos
- nível
- XP
- HP/Mentalidade
- ranking PvP
- resumo das habilidades

## Personagem

Página detalhada com:
- atributos
- habilidades
- slots
- inventário
- Arma Vínculo
- mortes/rebuffs
- características especiais
- histórico futuro

## Comandos

Lista pública dos comandos do RPG com:
- sintaxe
- descrição
- exemplos
- requisitos
- cooldowns

A página deve ser alimentada pela mesma fonte de configuração do backend para evitar documentação divergente.

## Conta

- Twitch vinculada
- configurações básicas
- privacidade
- integrações autorizadas

---

# 🎥 Painel de Streamer

Usuários reconhecidos como streamers participantes recebem páginas adicionais:

- Painel do Streamer
- Permissões
- Regras de Streamers
- Vídeo de Introdução
- Integrações
- Configuração do RPG

## Painel do Streamer

Mostra:
- status do RPG no canal
- status das integrações
- comandos ativos
- versão do RPG
- eventos globais ativos
- saúde da conexão/API

## Permissões

Página somente informativa para mostrar exatamente o que o cargo atual pode ou não pode fazer.

## Regras de Streamers

Documento obrigatório com as regras de uso da plataforma e limites administrativos.

## Vídeo de Introdução

Vídeo produzido pelo dono do projeto explicando:
- como funciona o RPG
- regras básicas
- responsabilidades do streamer
- eventos globais
- comandos
- o que administradores podem e não podem fazer

---

# 👑 Sistema de cargos e permissões

As permissões devem usar RBAC (Role-Based Access Control) e, internamente, permissões granulares.

Não confiar apenas em `if role === ...` espalhados pelo código.

Estrutura conceitual:

```txt
ROLE
  ↓
lista de permissões
  ↓
ação autorizada ou negada
```

## OWNER / DONO

Cargo máximo.

Pode:
- administrar toda a plataforma
- conceder/remover cargos
- editar permissões
- alterar regras globais
- conceder/remover habilidades de qualquer jogador
- manipular perfis quando necessário
- iniciar/encerrar eventos globais
- administrar mobs/bosses
- aplicar punições globais
- acessar auditoria completa

Inicialmente reservado ao dono do Marbion RPG.

## TRUSTED_STREAMER / STREAMER DE CONFIANÇA

Streamer com privilégios administrativos elevados.

Pode receber permissões como:
- administrar o próprio canal
- atuar sobre eventos quando autorizado
- utilizar comandos ADM selecionados
- ajudar em testes
- moderar problemas do RPG

Não recebe automaticamente todas as permissões do OWNER.

## PARTNER_STREAMER / STREAMER PARCEIRO

Nível padrão para streamers que apenas desejam disponibilizar o RPG em sua live.

Pode:
- instalar/ativar o RPG no próprio canal
- configurar integrações do próprio canal
- ativar/desativar opções permitidas
- visualizar suas permissões
- acessar documentação/regras
- configurar overlays futuros do próprio canal

Não pode:
- conceder habilidades especiais
- modificar personagem de terceiros
- editar regras globais
- alterar economia global
- alterar cargos
- spawnar/encerrar eventos globais sem permissão específica

## PLAYER

Usuário comum sem funções administrativas.

---

# 🧩 Permissões granulares

Exemplos de permissões futuras:

```txt
channel.manage
channel.commands.manage
channel.overlay.manage
player.view
player.admin.edit
player.skill.grant
player.skill.remove
event.global.start
event.global.stop
mob.global.spawn
boss.global.spawn
role.assign
role.revoke
rules.global.edit
audit.view
```

Os cargos são apenas pacotes dessas permissões.

Isso permitirá criar novos cargos futuramente sem reescrever o sistema de autorização.

---

# 🧾 Auditoria obrigatória

Toda ação administrativa sensível deve gerar log.

Exemplo:

```txt
actor: streamer_x
role: TRUSTED_STREAMER
action: player.skill.grant
target: twitch_user_id_123
value: Habilidade Especial
channel: twitch_channel_id_456
```

Nunca depender apenas da confiança pessoal para segurança da plataforma.

Isso permite identificar rapidamente abuso, erro ou conta comprometida.

---

# 🌐 Eventos globais multi-streamer

Inicialmente mobs e bosses podem continuar como eventos globais.

Exemplo:

```txt
Boss global nasce
        ↓
Live A vê o boss
Live B vê o mesmo boss
Live C vê o mesmo boss
        ↓
todos atacam o mesmo estado global
```

O estado do evento não deve pertencer a nenhum canal individual.

Estrutura conceitual:

```txt
GLOBAL_EVENT_COORDINATOR
  ├─ boss atual
  ├─ HP global
  ├─ fase
  ├─ participantes
  ├─ drops
  └─ timestamps
```

No futuro podem existir também eventos locais por canal, sem alterar a arquitetura global.

---

# 🎨 Skin e visual do personagem

A fundação deve ser preparada desde o primeiro site, mesmo que o editor visual não seja implementado imediatamente.

Versão inicial:
- avatar padrão/NPC
- placeholder “Skin em breve”

Estrutura futura:

```txt
player.cosmetics
player.skinVersion
player.skinData
```

Objetivo posterior:
- editor de personagem
- pixel art
- visual salvo na conta global
- mesmo visual em qualquer live
- overlays PvP usando as skins
- animações futuras

---

# 🏗️ Arquitetura recomendada

Separar a plataforma em duas funções principais:

## Data Plane — RPG

Responsável por:
- personagens
- combate
- habilidades
- inventário
- eventos
- mobs
- bosses
- ranking

É o backend global do jogo.

## Control Plane — Site / Streamers

Responsável por:
- autenticação
- canais participantes
- cargos/permissões
- integrações
- instalação do bot/comandos
- configurações do canal
- auditoria administrativa

O site nunca deve duplicar a lógica do RPG; deve chamar a mesma API central.

---

# 🔒 Segurança

Requisitos obrigatórios:

- Twitch OAuth no servidor
- tokens nunca expostos no frontend
- tokens armazenados de forma segura
- autorização verificada no backend em toda ação administrativa
- Twitch User ID como identidade canônica
- proteção `state` no OAuth
- sessões seguras
- rate limiting
- logs de auditoria
- revogação de integração
- princípio de menor privilégio
- nunca confiar em cargo informado pelo navegador

---

# 🚚 Migração dos jogadores atuais

Antes de abrir a plataforma para outros canais:

1. mapear username atual → Twitch User ID
2. gerar `playerId` estável
3. preservar todos os dados atuais
4. alterar buscas para aceitar Twitch User ID como chave principal
5. manter aliases de username para compatibilidade
6. testar um jogador entrando por dois canais diferentes

Nenhum personagem atual deve ser recriado do zero.

---

# 🗺️ Ordem de implementação recomendada

## Fase 0 — RPG atual

Concluir a fundação do combate:
- Buff
- Debuff
- DoT
- Controle
- Counter
- cooldowns

## Fase 1 — Fundação multi-streamer

Implementar antes da migração completa de mobs/bosses:
- Twitch OAuth
- Twitch User ID global
- site básico
- contas
- configuração de canais
- RBAC
- OWNER / TRUSTED_STREAMER / PARTNER_STREAMER
- auditoria

## Fase 2 — Distribuição para streamers

- painel do streamer
- ativação do RPG
- instalação centralizada dos comandos
- Marbion Bot
- compatibilidade StreamElements
- regras
- vídeo de introdução

## Fase 3 — Perfil visual

- página de personagem
- placeholder de skin
- estrutura de cosméticos
- editor visual posteriormente

## Fase 4 — Eventos multi-streamer

- mobs globais
- bosses globais
- overlays sincronizados
- estado único entre canais

---

# 📌 Decisões já definidas

- o RPG será compartilhado entre streamers
- personagens são globais, não pertencem a uma live específica
- jogador comum entra apenas com Twitch
- streamer terá painel/integrações adicionais
- haverá níveis diferentes de administração
- streamer parceiro não terá poderes capazes de alterar o RPG global livremente
- streamer de confiança poderá receber permissões elevadas
- OWNER mantém controle supremo
- comandos devem poder ser instalados sem configuração manual um por um
- site será público
- skin será preparada arquiteturalmente antes de o editor visual ficar pronto
- mobs e bosses serão globais inicialmente
- StreamElements pode ser integrado, mas não deve ser dependência obrigatória do núcleo do RPG
