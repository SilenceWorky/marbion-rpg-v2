# 👑 Administração de Streamers — Marbion RPG V2

Status: ⏳ Planejado / especificação registrada

Este documento complementa `docs/plataforma-multistreamer.md` e define a área administrativa exclusiva do proprietário principal da plataforma para aprovar streamers, atribuir cargos e sobrescrever permissões individualmente.

---

# 🎯 Objetivo

O Marbion RPG não será liberado automaticamente para qualquer canal da Twitch.

Um streamer pode criar conta no site e solicitar participação, mas somente o proprietário principal da plataforma poderá transformar aquela conta em um canal oficialmente autorizado a usar o RPG.

A aprovação acontece por uma página privada chamada **Streamers**.

Essa página não aparece para jogadores comuns, Streamers Parceiros, Streamers de Confiança ou outros administradores comuns.

Inicialmente, somente a conta principal do dono do Marbion RPG possui acesso a essa área.

---

# 🔒 Proprietário principal

Deve existir uma distinção entre:

```txt
OWNER / cargo administrativo
```

E:

```txt
PRIMARY_OWNER / proprietário principal da plataforma
```

O `PRIMARY_OWNER` é a identidade máxima e canônica do projeto.

A função não deve depender apenas de um texto de cargo enviado pelo frontend. O backend deve validar o Twitch User ID/Marbion User ID definido como proprietário principal.

Inicialmente:

- apenas uma conta possui `PRIMARY_OWNER`
- somente ela vê a página **Streamers**
- somente ela pode aprovar novos canais
- somente ela pode alterar cargo-base de streamer
- somente ela pode editar overrides individuais de permissões de streamers
- somente ela pode remover um streamer da plataforma
- somente ela pode bloquear completamente um canal participante

No futuro essa capacidade pode ser delegada apenas se o próprio proprietário principal decidir implementar isso explicitamente.

---

# 🧭 Menu exclusivo do proprietário

Além das páginas normais e das páginas de streamer, a conta do proprietário principal verá:

```txt
☰

Início
Personagem
Comandos
Conta

── Streamer ──
Painel do Streamer
Overlays
Permissões
Regras de Streamers
Vídeo de Introdução
Integrações
Configuração do RPG

── Proprietário ──
Streamers
```

A seção **Proprietário** inteira deve ser invisível para quem não possuir autorização de `PRIMARY_OWNER`.

Ocultar no frontend não é suficiente: todas as APIs dessa seção também devem exigir autorização no backend.

---

# 🎥 Página “Streamers”

A página deve permitir visualizar e administrar todas as contas de canais relacionadas ao Marbion.

Exemplo de lista:

```txt
STREAMERS

[Pesquisar streamer...]

Canal                 Status        Cargo
StreamerA             Ativo         Streamer Parceiro
StreamerB             Ativo         Streamer de Confiança
StreamerC             Pendente      Nenhum
StreamerD             Bloqueado     Streamer Parceiro
```

Filtros futuros:

- todos
- pendentes
- ativos
- bloqueados
- Streamer Parceiro
- Streamer de Confiança
- outros cargos futuros

---

# ✅ Aprovação de um novo streamer

Fluxo recomendado:

```txt
Streamer entra no site com Twitch
        ↓
solicita acesso ao Marbion RPG
        ↓
status = PENDING
        ↓
PRIMARY_OWNER abre “Streamers”
        ↓
seleciona o canal
        ↓
escolhe cargo-base
        ↓
revisa/edita permissões
        ↓
APROVAR STREAMER
        ↓
canal passa a poder ativar o MarbionBot/RPG
```

A Twitch deve ser usada para identificar a conta real do canal pelo Twitch User ID.

---

# 🏷️ Cargo-base + permissões individuais

O cargo define apenas o **conjunto padrão** de permissões.

Ele NÃO é a decisão final.

Exemplo:

```txt
Streamer Parceiro
→ normalmente NÃO pode conceder habilidade característica

Streamer de Confiança
→ normalmente PODE receber essa permissão
```

Mas o proprietário pode sobrescrever a configuração de uma pessoa específica.

Exemplo A:

```txt
Streamer: A
Cargo: TRUSTED_STREAMER

Permissão padrão:
player.characteristic.grant = true

Override individual:
player.characteristic.grant = false

Resultado final:
❌ NÃO pode conceder habilidade característica
```

Exemplo B:

```txt
Streamer: B
Cargo: PARTNER_STREAMER

Permissão padrão:
player.characteristic.grant = false

Override individual:
player.characteristic.grant = true

Resultado final:
✅ PODE conceder habilidade característica
```

Portanto, dois streamers com o mesmo cargo podem possuir poderes diferentes.

---

# 🧩 Modelo de resolução de permissões

Cada streamer possui:

```txt
cargo-base
+
overrides individuais
=
permissão efetiva
```

Estrutura conceitual:

```json
{
  "userId": "twitch_123",
  "streamerRole": "TRUSTED_STREAMER",
  "permissionOverrides": {
    "player.characteristic.grant": false,
    "boss.global.spawn": true
  }
}
```

Regra de resolução:

```txt
1. existe override individual para a permissão?
   → SIM: usar true/false do override

2. não existe override?
   → usar o valor padrão do cargo-base
```

`false` deve ser uma negação explícita válida e não pode ser confundida com “não configurado”.

Internamente é recomendável distinguir:

```txt
INHERIT = herdar do cargo
ALLOW   = permitir explicitamente
DENY    = bloquear explicitamente
```

---

# 🎛️ Interface de edição de streamer

Ao clicar em um streamer, o proprietário deve ver algo semelhante a:

```txt
Streamer: ExampleChannel
Twitch ID: 123456789
Status: ATIVO

Cargo-base:
[ Streamer de Confiança ▼ ]

PERMISSÕES

Canal
[✓] Administrar próprio canal
[✓] Configurar overlays
[✓] Ativar/desativar módulos permitidos

Jogadores
[✓] Visualizar dados administrativos permitidos
[ ] Editar perfil de jogador
[ ] Dar habilidade comum por ADM
[ ] Dar habilidade especial
[ ] Dar habilidade característica
[ ] Remover habilidade característica

Eventos
[✓] Participar de eventos globais
[ ] Spawnar mob global manualmente
[ ] Spawnar boss global manualmente
[ ] Encerrar evento global

Administração
[ ] Alterar regras globais
[ ] Alterar economia
[ ] Conceder cargos
[ ] Ver auditoria completa
```

Cada item deve deixar claro se está:

```txt
HERDADO DO CARGO
PERMITIDO MANUALMENTE
BLOQUEADO MANUALMENTE
```

Uma opção útil de interface seria usar três estados:

```txt
◯ Herdar
✓ Permitir
✕ Bloquear
```

---

# 🧬 Habilidades características

As futuras Habilidades Características são um recurso especialmente sensível e precisam de permissão própria.

Permissões sugeridas:

```txt
player.characteristic.view
player.characteristic.grant
player.characteristic.remove
player.characteristic.override_limit
```

`player.characteristic.grant` não deve estar acoplada genericamente a `player.skill.grant`.

Assim podemos permitir que um streamer conceda habilidades comuns para testes/eventos sem permitir que ele distribua Características raras ou limitadas globalmente.

---

# 🔐 Exemplos de permissões administrativas

```txt
channel.manage
channel.bot.manage
channel.overlay.manage
channel.modules.manage

player.view
player.admin.edit
player.skill.grant
player.skill.remove
player.characteristic.view
player.characteristic.grant
player.characteristic.remove

mob.global.spawn
mob.global.stop
boss.global.spawn
boss.global.stop
event.global.start
event.global.stop

rules.global.edit
economy.global.edit
role.assign
role.revoke
audit.view
streamer.manage
```

`streamer.manage` deve ser reservado ao `PRIMARY_OWNER` na implementação inicial.

---

# 🚫 Bloqueio e remoção

Na página Streamers, o proprietário deve poder:

- suspender temporariamente um canal
- remover o acesso do MarbionBot ao canal
- impedir comandos do RPG naquele canal
- revogar integrações
- remover cargo de streamer
- bloquear nova ativação até revisão

Isso NÃO deve apagar os personagens globais dos jogadores daquele canal.

O canal perde acesso ao RPG; os jogadores continuam existindo globalmente.

---

# 🧾 Auditoria

Toda alteração feita nessa página deve ser auditada.

Exemplos:

```txt
PRIMARY_OWNER aprovou StreamerB
Cargo: PARTNER_STREAMER
```

```txt
PRIMARY_OWNER alterou StreamerA
player.characteristic.grant:
INHERIT(true) → DENY(false)
```

```txt
PRIMARY_OWNER alterou StreamerB
player.characteristic.grant:
INHERIT(false) → ALLOW(true)
```

```txt
PRIMARY_OWNER suspendeu StreamerC
Motivo: revisão administrativa
```

O log deve armazenar pelo menos:

- actor ID
- target streamer ID
- ação
- valor anterior
- valor novo
- timestamp
- motivo opcional

---

# 🛡️ Segurança obrigatória

A rota administrativa de streamers deve obedecer:

- autenticação Twitch válida
- sessão válida
- verificação server-side de `PRIMARY_OWNER`
- nunca aceitar `role`, `isOwner` ou permissões fornecidas pelo navegador como fonte de verdade
- CSRF/state adequados para ações sensíveis
- rate limiting
- auditoria obrigatória
- confirmação adicional para remoção/suspensão e poderes extremamente sensíveis

A página ser invisível para outros usuários é apenas UX; a verdadeira proteção deve estar no backend.

---

# 📌 Decisões definidas

- haverá uma página **Streamers** exclusiva do proprietário principal
- somente o proprietário principal aprova quem pode usar o RPG em outra live
- streamer precisa ser autorizado antes de ativar o RPG no canal
- o proprietário escolhe o cargo-base do streamer
- cargos fornecem permissões padrão
- permissões podem ser sobrescritas individualmente por streamer
- um Streamer de Confiança pode ter um poder específico removido
- um Streamer Parceiro pode receber excepcionalmente um poder que seu cargo normalmente não possui
- Habilidades Características terão permissões próprias e separadas das habilidades comuns
- alterações administrativas serão auditadas
- bloquear um canal nunca apaga os personagens globais dos jogadores
