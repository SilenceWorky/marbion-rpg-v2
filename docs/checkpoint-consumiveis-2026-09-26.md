# Marbion RPG V2 — Checkpoint canônico de Consumíveis

Data: **2026-09-26**

Este documento registra as regras canônicas atualmente definidas para consumíveis, especialmente Poções de Vida, Poções de Mentalidade e a raridade-base das versões Especiais.

## 1. Regra geral de consumíveis

- Consumível é item de uso único.
- Ao usar uma unidade, ela é removida definitivamente do inventário.
- Alguns consumíveis podem ser usados somente fora de combate.
- Outros podem ser usados dentro e fora de combate.
- Quando um consumível permitido em PvP é usado durante o combate, ele consome a ação daquele turno.
- O jogador não usa o consumível e uma habilidade na mesma ação.

## 2. Poções de Vida

- Poção de Vida Simples: restaura **30% do HP máximo**.
- Poção de Vida Comum: restaura **50% do HP máximo**.
- Poção de Vida Melhorada: restaura **80% do HP máximo**.
- Poção de Vida Especial: restaura **100% do HP máximo**.
As quatro podem ser usadas dentro e fora do combate.

No PvP, o uso consome a ação do turno.

A recuperação nunca pode ultrapassar o HP máximo.

## 3. Poções de Mentalidade

- Poção de Mentalidade Simples: restaura **30% da Mentalidade máxima**.
- Poção de Mentalidade Comum: restaura **50% da Mentalidade máxima**.
- Poção de Mentalidade Melhorada: restaura **80% da Mentalidade máxima**.
- Poção de Mentalidade Especial: restaura **100% da Mentalidade máxima**.

As quatro podem ser usadas dentro e fora do combate.

No PvP, o uso consome a ação do turno.

A recuperação nunca pode ultrapassar a Mentalidade máxima.

## 4. Preços-base atuais

- Simples: **5 Pratas**.
- Comum: **1 Ouro**.
- Melhorada: **3 Ouros**.
- Especial: **5 Platinas**.
## 5. Raridade-base da Poção Especial

A chance-base canônica da categoria Especial é:

```txt
0,1%
```

Em valor decimal:

```txt
0.001
```

Essa chance-base deve ser reutilizável por sistemas futuros, incluindo:

- comerciante/vendedor ambulante;
- drop de mob;
- drop de boss;
- outros pools especiais que usem a mesma raridade-base.

A chance poderá aumentar de acordo com o **nível de Sorte** do jogador relevante para o evento.

A fórmula de Sorte ainda **não foi definida**. Não inventar multiplicadores, bônus ou curva de Sorte antes de uma regra canônica ser aprovada.

Bosses específicos poderão ter regras próprias quando seus pools forem definidos, mas a referência-base da Poção Especial é 0,1%.

## 6. Pool atual do Baú Atômico

Quando um reward de consumível existe no Baú Atômico:
### Baú ⚛

- Simples: 100%.

### Baú ⚛⚛

- Simples: 75%.
- Comum: 25%.

### Baú ⚛⚛⚛

- Simples: 55%.
- Comum: 30%.
- Melhorada: 14,9%.
- Especial: **0,1%**.

Depois de definir a categoria, Vida e Mentalidade são escolhidas em proporção 50/50.

Os Baús ⚛⚛⚛⚛ e ⚛⚛⚛⚛⚛ não possuem consumível normal definido no pool atual.

## 7. Implementação atual

Arquivos principais:

```txt
src/systems/consumable-catalog.js
src/systems/consumable-inventory.js
src/systems/consumable-use.js
src/systems/atomic-chest-consumable-resolver.js
src/systems/atomic-chest-reward-apply.js
src/systems/chest-open-service.js
```

A Poção sorteada pelo Baú Atômico é congelada no `pendingOpen` antes da entrega.
A entrega usa `grantId` determinístico para impedir duplicação em retries.

A habilidade de Sorte ainda não interfere na chance do Baú Atômico porque a fórmula de Sorte não foi definida.

## 8. Próximos usos futuros

Quando Mercador, Mobs e Bosses forem implementados, usar a constante canônica de chance-base da Poção Especial em vez de duplicar números em vários sistemas.

A lógica futura deverá permitir:

```txt
chance final = chance-base +/ou modificador de Sorte
```

A expressão acima é apenas estrutural. A fórmula exata do modificador continua pendente e deve ser definida antes da implementação.
