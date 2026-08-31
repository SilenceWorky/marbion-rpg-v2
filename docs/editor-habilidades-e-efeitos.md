# 🧩 Editor de Habilidades e Efeitos — Marbion RPG V2

Status: ⏳ Planejado / especificação registrada

## Objetivo

Criar no site do Marbion uma área administrativa para pesquisar rapidamente habilidades do catálogo e editar seus efeitos sem precisar abrir manualmente `skills.json`.

Essa área deverá ser acessível ao `PRIMARY_OWNER` e, conforme permissão, a Streamers de Confiança ou outros cargos autorizados.

---

# 🎯 Problema que resolve

O catálogo possui grande quantidade de habilidades e diversos efeitos futuros.

Editar manualmente cada habilidade no JSON não é sustentável.

Exemplos de propriedades que poderão ser administradas pelo painel:

- Queimadura
- Veneno
- Sangramento
- Radiação
- Eletrocutado
- Paralisia
- Congelamento
- Atordoamento
- redução de Defesa
- redução de Precisão
- redução de Velocidade
- redução de Força
- redução de Magia
- redução de Evasão
- buffs
- cura
- prioridade
- duração
- chance de aplicar
- intensidade
- dano periódico
- imunidades/interações futuras

---

# 🔎 Pesquisa de habilidades

O painel deverá permitir pesquisa por:

- nome
- elemento
- tipo
- raridade
- categoria
- efeito atual
- habilidade com/sem DoT
- habilidade com/sem controle
- habilidade com/sem Debuff

Exemplo:

```txt
[Pesquisar habilidade...]

Filtros:
Elemento: Fogo
Efeito: Queimadura

Chama Devastadora
Explosão Térmica
Inferno Escarlate
...
```

---

# 🧠 Modelo de efeitos

O campo provisório:

```json
"dotType": "queimadura"
```

é adequado para validar a primeira Queimadura, mas não deve ser o modelo final do catálogo.

Uma habilidade pode possuir mais de um efeito simultaneamente.

Exemplo futuro recomendado:

```json
{
  "nome": "Chama Devastadora",
  "tipo": "Elemental",
  "elemento": "Fogo",
  "effects": [
    {
      "type": "dot",
      "effect": "queimadura",
      "chance": 1,
      "duration": 2
    }
  ]
}
```

Outro exemplo:

```json
{
  "nome": "Tempestade Condutora",
  "effects": [
    {
      "type": "status",
      "effect": "eletrocutado",
      "chance": 0.35
    },
    {
      "type": "debuff",
      "stat": "speed",
      "amount": 3,
      "duration": 2
    }
  ]
}
```

Isso permite combinações como:

```txt
Dano direto
+
Queimadura
+
redução de Defesa
```

ou:

```txt
Dano elétrico
+
Eletrocutado
+
Paralisia
```

sem criar um campo diferente para cada sistema.

---

# 🧱 Categorias de efeitos

## DoT

```txt
queimadura
veneno
sangramento
radiação
outros danos periódicos
```

## Controle / Status

```txt
eletrocutado
paralisia
congelado
atordoado
silenciado
outros controles futuros
```

## Debuff

```txt
defense
accuracy
speed
strength
magicStrength
evasion
```

## Buff

Mesma base de atributos, aplicada ao próprio usuário ou alvo aliado futuramente.

---

# 🎛️ Interface de edição

Ao abrir uma habilidade:

```txt
Habilidade: Chama Devastadora
Elemento: Fogo
Tipo: Elemental

EFEITOS

[✓] Queimadura
    Chance: 100%
    Duração: 2 turnos
    Fórmula: padrão de Queimadura

[ ] Congelamento
[ ] Eletrocutado
[ ] Paralisia

Debuffs:
[ ] Defesa
[ ] Precisão
[ ] Velocidade
...

[ SALVAR ]
```

O painel deve permitir adicionar, remover e editar múltiplos efeitos.

---

# 🤖 Automação inicial do catálogo

Antes da edição manual pelo site, deverá existir um processo automatizado para pré-classificar as habilidades existentes.

O processo pode usar:

- elemento
- nome
- descrição (`efeito`)
- tipo atual
- padrões temáticos

Exemplo:

```txt
"aplica queimadura"
→ sugerir Queimadura

"congela o alvo"
→ sugerir Congelamento

"reduz a defesa"
→ sugerir Debuff de Defesa
```

IMPORTANTE:

A automação não deve publicar alterações irreversíveis cegamente.

Fluxo recomendado:

```txt
Analisar catálogo
→ gerar sugestões
→ validar estrutura
→ revisar casos ambíguos
→ aplicar em lote
→ backup
→ testes
```

O painel também poderá ter futuramente:

```txt
[Aplicar sugestão]
[Rejeitar]
[Editar]
```

---

# 👑 Permissões

Permissões sugeridas:

```txt
skill.catalog.view
skill.effect.edit
skill.effect.bulk_edit
skill.effect.publish
skill.effect.suggest
skill.catalog.rollback
```

## PRIMARY_OWNER

Pode tudo.

## Streamer de Confiança

Pode receber, individualmente:

```txt
skill.catalog.view
skill.effect.edit
```

mas não necessariamente:

```txt
skill.effect.bulk_edit
skill.effect.publish
```

## Streamer Parceiro

Não recebe acesso por padrão, mas o `PRIMARY_OWNER` pode liberar qualquer uma dessas permissões por override individual.

Isso segue o modelo já definido:

```txt
cargo-base
+
override individual
=
permissão efetiva
```

---

# 🧾 Auditoria

Toda alteração precisa registrar:

- quem alterou
- habilidade
- valor anterior
- valor novo
- timestamp
- motivo opcional

Exemplo:

```txt
StreamerX alterou:
Chama Devastadora

effects:
[]
→
[{ type: "dot", effect: "queimadura" }]
```

---

# ↩️ Histórico e rollback

Como o catálogo é sensível, o sistema deverá preservar versões.

Exemplo:

```txt
skill-catalog v41
skill-catalog v42
skill-catalog v43
```

O `PRIMARY_OWNER` poderá restaurar uma versão anterior caso uma edição em massa cause problemas.

---

# 🔄 Fonte única de verdade

O site NÃO deverá manter uma segunda cópia divergente das habilidades.

O editor deve alterar a mesma fonte de dados consumida pelo backend do RPG.

Fluxo conceitual:

```txt
Editor Web
  ↓
API administrativa
  ↓
Catálogo oficial de habilidades
  ↓
Validação
  ↓
Publicação
  ↓
Backend Marbion / MarbionBot
```

---

# 📌 Decisões definidas

- haverá automação para adicionar efeitos às habilidades que precisam
- a primeira Queimadura pode usar `dotType` temporariamente para teste
- o modelo final deve aceitar múltiplos efeitos por habilidade
- haverá editor pesquisável de habilidades no site
- Streamers de Confiança podem receber permissão para editar efeitos
- o `PRIMARY_OWNER` controla individualmente quem pode editar/publicar
- efeitos como Queimadura, Eletrocutado, Congelamento e redução de Defesa poderão ser configurados pelo painel
- alterações serão auditadas
- deverá existir histórico/rollback do catálogo
- edição em massa exigirá permissões separadas
- automação de classificação deverá gerar sugestões e validações antes de publicar mudanças em lote
