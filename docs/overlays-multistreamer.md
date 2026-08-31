# 🎥 Overlays Multi-Streamer — Marbion RPG V2

Status: ⏳ Planejado / especificação registrada

## Objetivo

Criar uma área de **Overlays** dentro do painel de streamer do site do Marbion.

Cada streamer poderá escolher uma overlay pronta do catálogo, personalizá-la para o estilo da própria live e copiar um link de Browser Source para usar diretamente no OBS.

A regra principal é:

> **O estado do RPG é global; a apresentação visual é específica de cada canal.**

Exemplo: o mesmo Boss global pode estar ativo simultaneamente em várias lives, com o mesmo HP e a mesma fase, mas cada streamer pode exibi-lo com uma overlay diferente, cores diferentes, música diferente e layout diferente.

---

# 🧭 Área “Overlays” no painel do streamer

O menu de streamer deverá incluir uma página própria:

- Painel do Streamer
- Overlays
- Permissões
- Regras de Streamers
- Vídeo de Introdução
- Integrações
- Configuração do RPG

A página **Overlays** será uma galeria de overlays disponíveis para aquele canal.

---

# 🖼️ Catálogo de overlays

O streamer poderá navegar por categorias, por exemplo:

- Boss
- Mob
- PvP
- Personagens / skins
- HP / HUD
- Level Up
- Drops / loot
- Ranking
- Eventos globais
- Mortes
- Notificações especiais

Cada categoria poderá possuir várias versões visuais.

Exemplo:

```txt
Boss
├─ Padrão Marbion
├─ Minimalista
├─ Fantasia
├─ Sombrio
├─ Neon
└─ Custom do streamer
```

O streamer não será obrigado a usar a mesma overlay usada pelo dono do projeto ou por outro canal.

---

# 👁️ Preview antes de instalar

Cada overlay deverá possuir uma prévia no site.

A tela pode mostrar:

- thumbnail
- preview animado
- nome da overlay
- autor/tema
- resolução recomendada
- elementos exibidos
- opções personalizáveis
- botão “Testar overlay”
- botão “Personalizar”
- botão “Copiar link para OBS”

O modo de teste deve usar dados fictícios e nunca alterar o estado real do RPG.

---

# 🎨 Personalização por streamer

Uma overlay escolhida vira uma **instância de overlay do canal**.

Essa instância poderá guardar configurações próprias sem alterar o template original.

Exemplos de personalização:

## Visual

- cores
- fonte
- tamanho de textos
- escala
- posição dos elementos
- orientação
- opacidade
- bordas
- sombras
- animações
- logo do canal
- imagens decorativas permitidas
- background

## Conteúdo

- mostrar/esconder nome do boss
- mostrar/esconder HP numérico
- mostrar/esconder porcentagem
- mostrar fase
- mostrar participantes
- mostrar último atacante
- mostrar dano recente
- mostrar ranking de dano
- mostrar drops

## Áudio

Quando aplicável:

- música do boss/evento
- efeitos sonoros
- volume da música
- volume dos efeitos
- fade in/fade out
- ativar/desativar áudio

O áudio escolhido pelo streamer afeta somente a overlay daquele canal.

---

# 👑 Exemplo: Boss global com overlays diferentes

Estado global:

```txt
Boss: Leviatã
HP: 82.450 / 100.000
Fase: 2
```

Esse estado é único no backend.

Apresentação:

```txt
Live A
→ Overlay Boss “Padrão Marbion”
→ música A
→ cores vermelhas

Live B
→ Overlay Boss “Minimalista”
→ sem música
→ barra pequena no topo

Live C
→ Overlay Boss “Neon”
→ música C
→ layout lateral
```

Todos veem **o mesmo Boss**, mas com apresentação própria.

---

# 🔗 Link para OBS

Depois de configurar uma overlay, o site deverá fornecer um link pronto para Browser Source.

Formato conceitual:

```txt
https://marbion.com/overlay/<canal>/<overlay-instance-id>
```

Fluxo:

```txt
Streamer escolhe overlay
→ personaliza
→ salva
→ copia link
→ OBS
→ Adicionar Fonte do Navegador
→ colar link
→ overlay ativa
```

O streamer não deverá precisar hospedar arquivos localmente.

---

# 🔒 Segurança do link de overlay

O link do OBS deve ser **somente leitura**.

Nunca colocar no link:

- token OAuth da Twitch
- token administrativo
- segredo do canal
- credenciais do streamer

A Browser Source pode receber um identificador público/aleatório de instância de overlay que apenas permite consumir o estado visual necessário.

Deve existir no painel:

- regenerar link
- revogar link antigo
- desativar overlay

Assim, caso o URL vaze, ele pode ser invalidado sem desconectar a Twitch do streamer.

---

# 🧱 Modelo conceitual de dados

```txt
overlay_template
  id
  name
  category
  version
  defaultConfig
  capabilities

channel_overlay
  id
  channelId
  templateId
  enabled
  config
  publicViewKey
  createdAt
  updatedAt
```

Exemplo de `config`:

```json
{
  "theme": "dark",
  "showHpPercent": true,
  "showParticipants": false,
  "musicId": "boss_theme_03",
  "musicVolume": 0.35,
  "layout": "bottom-center"
}
```

---

# 🔄 Templates e atualizações

Templates oficiais devem possuir versão.

Exemplo:

```txt
Boss Padrão
v1 → v2 → v3
```

Quando uma overlay oficial for atualizada, o sistema deve tentar preservar as configurações do streamer.

Evitar que uma atualização global apague personalizações de canal.

O ideal é separar:

```txt
Template oficial
+
Config personalizada do canal
=
Overlay final
```

---

# 🌍 Sincronização em tempo real

Overlays não devem consultar o estado global em intervalos lentos quando houver alternativa melhor.

Arquitetura futura recomendada:

```txt
Backend Marbion
     ↓
Event/Overlay Gateway
     ↓
WebSocket ou mecanismo equivalente
     ↓
Browser Sources dos streamers
```

Assim eventos como:

- boss sofreu dano
- boss mudou de fase
- PvP começou
- jogador usou habilidade
- personagem morreu
- loot caiu

podem aparecer imediatamente na transmissão.

---

# 🎭 Personagens e skins

A futura overlay de personagens deve consumir a skin global do jogador.

Exemplo:

```txt
Player ID global
→ skinData
→ overlay PvP
```

O streamer poderá personalizar **a moldura, posição e apresentação**, mas não substituir silenciosamente a skin global do jogador por outra identidade.

Na primeira versão, enquanto o sistema de skins não existir, a overlay poderá usar:

- NPC padrão
- silhueta
- avatar temporário
- texto “Skin em breve”

---

# 🛠️ Permissões

Streamer Parceiro pode administrar overlays do próprio canal.

Permissão conceitual:

```txt
channel.overlay.manage
```

Ela permite:

- escolher template
- personalizar
- ativar/desativar
- gerar/regenerar link

Não permite:

- alterar template oficial global
- modificar overlay de outro streamer
- alterar estado global do boss/mob/PvP

Permissões superiores futuras:

```txt
overlay.template.create
overlay.template.edit
overlay.template.publish
overlay.channel.override
```

---

# 📌 Decisões definidas

- haverá uma página própria de Overlays no painel do streamer
- existirão várias overlays para o mesmo tipo de evento
- streamer escolhe qual versão quer usar
- streamer pode personalizar a overlay escolhida
- cada overlay configurada fornece um link para OBS
- o mesmo evento global pode ser exibido de formas diferentes em cada live
- música e apresentação podem ser específicas de cada canal
- templates oficiais e configurações do canal serão separados
- URLs de Browser Source não carregarão tokens administrativos/OAuth
- links poderão ser regenerados/revogados
- overlays futuras de personagens usarão a skin global do jogador
- o estado real do RPG continuará centralizado no backend global
