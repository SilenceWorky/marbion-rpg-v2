# Marbion — Checkpoint canônico dos efeitos de habilidades sazonais

Data: **2026-09-26**

Este documento registra os efeitos atualmente reconhecidos/suportados pelo sistema de combate de Marbion e a regra de uso deles na interface de edição de habilidades sazonais do site.

---

# 1. Contexto da interface

Na aba de **Temporada**, o usuário pode editar informações como:

- nome da temporada;
- descrição da temporada;
- habilidades sazonais do período.

Para cada habilidade sazonal, a interface deve permitir informar pelo menos:

- nome;
- dano base;
- descrição;
- **efeito opcional**.

O campo de efeito deve ser opcional: uma habilidade pode existir sem efeito adicional.

A intenção é permitir que a habilidade tenha um efeito extra, como Buff, Debuff, Controle, DoT, estado elemental, cura, recuperação ou reação.

---

# 2. Lista canônica atual de efeitos

## Debuffs / reduções de atributo

- Cegueira
- Lentidão
- Debuff de Força
- Debuff de Força Mágica
- Debuff de Velocidade
- Debuff de Evasão
- Debuff de Precisão
- Debuff de Defesa

## Controles / restrições

- Sono
- Confusão
- Silêncio
- Paralisia
- Congelamento
- Atordoamento

## Dano periódico

- Veneno
- Queimadura
- Sangramento

## Estados e reações elementais

- Molhado
- Eletrocussão
- Evaporação

## Buffs de atributo

- Buff de Força
- Buff de Força Mágica
- Buff de Velocidade
- Buff de Evasão
- Buff de Precisão
- Buff de Defesa

## Recuperação / suporte

- Cura
- Recuperação de Mentalidade

## Reações defensivas

- Contra-ataque
- Reflexão

---

# 3. Lista plana para uso em Select/Dropdown

A interface pode exibir uma opção inicial:

```txt
Sem efeito
```

E depois:

```txt
Cegueira
Sono
Confusão
Silêncio
Lentidão
Paralisia
Congelamento
Atordoamento
Veneno
Queimadura
Sangramento
Molhado
Eletrocussão
Evaporação
Cura
Recuperação de Mentalidade
Contra-ataque
Reflexão
Buff de Força
Buff de Força Mágica
Buff de Velocidade
Buff de Evasão
Buff de Precisão
Buff de Defesa
Debuff de Força
Debuff de Força Mágica
Debuff de Velocidade
Debuff de Evasão
Debuff de Precisão
Debuff de Defesa
```

---

# 4. Regra de implementação da interface

A edição de uma habilidade sazonal deve possuir um campo de efeito opcional.

Exemplo conceitual:

```txt
Nome: [__________________]
Dano base: [______]
Descrição: [____________________________]

Efeito:
[ Sem efeito ▼ ]
```

Ao abrir o seletor, devem aparecer os efeitos listados neste checkpoint.

O site pode organizar visualmente os efeitos por categoria, mas deve preservar os nomes canônicos.

---

# 5. Importante sobre Buff e Debuff

Nem todo efeito da lista é tecnicamente um Buff ou Debuff simples.

Categorias existentes incluem:

- Buff;
- Debuff;
- Controle;
- Restrição;
- Dano periódico;
- Estado elemental;
- Reação elemental;
- Cura/recuperação;
- Reação defensiva.

Portanto, o campo da interface deve ser tratado genericamente como **Efeito**, e não limitado internamente apenas a `buff` ou `debuff`.

---

# 6. Regras atuais conhecidas no backend

Alguns efeitos já possuem comportamento específico implementado no backend, por exemplo:

- Cegueira reduz Precisão;
- Lentidão reduz Velocidade;
- Paralisia, Congelamento e Atordoamento bloqueiam ação;
- Sono bloqueia ações e pode terminar com dano direto;
- Confusão pode causar auto-dano/perda de ação;
- Silêncio restringe habilidades não físicas;
- Veneno, Queimadura e Sangramento causam dano periódico;
- Molhado habilita reações elementais;
- Eletrocussão é reação de Eletricidade em alvo Molhado;
- Evaporação é reação de Fogo em alvo Molhado;
- Buffs e Debuffs alteram atributos temporariamente;
- Cura recupera HP;
- Recuperação de Mentalidade recupera Mentalidade;
- Contra-ataque e Reflexão são reações defensivas.

O site não deve inventar regras adicionais de duração, chance, intensidade ou stacking apenas porque um efeito foi selecionado.

---

# 7. Escopo desta etapa do site

Neste momento, a interface precisa primeiro permitir **selecionar o efeito associado à habilidade sazonal**.

Parâmetros avançados como:

- chance de aplicar;
- duração;
- intensidade;
- dano por turno;
- quantidade de atributo;
- número de ações bloqueadas;

podem ser adicionados em etapa posterior caso a edição detalhada das habilidades sazonais passe a controlar esses valores.

Se esses parâmetros ainda não estiverem definidos pela regra canônica, não inventar valores automaticamente.

---

# 8. Fonte técnica

Os efeitos foram consolidados a partir dos sistemas atuais do repositório, incluindo principalmente:

```txt
src/systems/skill-effects.js
src/systems/sleep.js
src/systems/confusion.js
src/systems/silence.js
src/systems/slowdown.js
src/systems/elemental-combos.js
src/systems/reactions.js
```

Este documento deve ser usado como checkpoint funcional para a interface de edição de habilidades sazonais.
