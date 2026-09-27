# Marbion — Checkpoint canônico do Baú Sazonal

Data: **2026-09-27**

Este documento consolida as decisões fechadas para o **Baú Sazonal** durante a Etapa 25.

Estado atual:
- regras de design: **definidas abaixo**;
- implementação: **ainda não iniciada neste checkpoint**;
- deploy: **não realizado**.

---

# 1. Recompensa-base

Ao abrir um Baú Sazonal, a recompensa-base escolhe entre XP e dinheiro:

```txt
50% → XP
50% → Dinheiro
```

## XP

Faixa:

```txt
50–180 XP
```

## Dinheiro

Faixa em equivalente Bronze:

```txt
20–80 Bronzes-equivalentes
```

O dinheiro do próprio baú deve ser convertido para a forma monetária canônica do RPG.

Exemplos:

```txt
20 → 2 Pratas
80 → 8 Pratas
```

---

# 2. Pool especial do Baú Sazonal

Distribuição definida:

```txt
12% → Habilidade temática da temporada
38% → Consumível sazonal
15% → Finalizador de PvP sazonal
15% → Mensagem de vitória sazonal
10% → Item/Acessório sazonal
10% → Item Especial / Relíquia Sazonal
```

Os pesos acima totalizam 100%.

---

# 3. Habilidade temática da temporada — 12%

Regras:

- precisa ser uma habilidade temática cadastrada para a temporada;
- precisa ser compatível com o personagem;
- precisa ser uma habilidade que o personagem ainda não possua;
- se houver várias habilidades válidas, o sistema sorteia entre elas;
- `Único` fica fora do pool normal;
- se o personagem não possuir nenhuma habilidade temática compatível ainda disponível, a recompensa vira **1 Platina**.

## Pesos de raridade

```txt
Comum        40%
Raro         30%
Super Raro   20%
Mítico        8%
Lendário      2%
Único          0%
```

---

# 4. Consumível sazonal — 38%

Regras:

- entram apenas consumíveis cadastrados para a temporada;
- não mistura com as Poções normais de Vida/Mentalidade;
- se houver vários consumíveis sazonais válidos, sorteia entre eles;
- consumíveis sazonais podem acumular no inventário;
- continuam no inventário e podem ser usados mesmo depois do fim da temporada;
- usam a escala completa de raridades das habilidades.

## Pesos de raridade

```txt
Comum        39,9%
Raro         30%
Super Raro   20%
Mítico        8%
Lendário      2%
Único         0,1%
```

Chance efetiva de um Consumível Sazonal Único por Baú Sazonal:

```txt
38% × 0,1% = 0,038%
aproximadamente 1 em 2.632 Baús Sazonais
```

---

# 5. Finalizador de PvP sazonal — 15%

O Finalizador de PvP é um **cosmético permanente**.

Regras:

- pertence à temporada em que foi obtido;
- permanece na conta após o fim da temporada;
- pode ser equipado e desequipado;
- apenas **1 Finalizador de PvP** fica ativo por vez;
- aparece quando o jogador encerra/vence uma luta PvP;
- não altera dano, XP, Elo, crítico, atributos ou qualquer outra mecânica de combate;
- o sistema prioriza um finalizador da temporada que o jogador ainda não possua;
- enquanto existir algum finalizador novo disponível, não entrega duplicata;
- se o jogador já possuir todos os finalizadores daquela temporada, a recompensa vira **1 Platina**.

---

# 6. Mensagem de vitória sazonal — 15%

A Mensagem de Vitória é um **item cosmético permanente e colecionável**.

Regras:

- fica guardada no inventário;
- não expira com o fim da temporada;
- não existe limite total de mensagens armazenadas;
- mensagens sazonais e não sazonais podem coexistir no inventário;
- apenas **1 mensagem** fica equipada por vez;
- o jogador pode trocar a mensagem equipada quando quiser;
- obter uma nova mensagem não apaga nem substitui as mensagens antigas;
- não concede qualquer vantagem mecânica.

## Duplicatas

As mensagens sazonais são itens colecionáveis definidos pela temporada.

- o sistema prioriza uma mensagem sazonal da temporada que o jogador ainda não possua;
- enquanto houver alguma mensagem nova disponível naquela temporada, não entrega duplicata;
- se o jogador já possuir **todas as mensagens sazonais daquela temporada**, uma nova recompensa de mensagem vira **1 Platina**.

A ideia de três mensagens equipadas com seleção aleatória foi discutida, mas **não faz parte da regra atual**.

---

# 7. Item/Acessório sazonal — 10%

É um **colecionável cosmético permanente** da temporada.

Categorias possíveis:

```txt
Cabelo
Acessório
Blusa
Calça
Sapato
```

Regras:

- pertence à temporada atual;
- permanece no inventário após o fim da temporada;
- não concede atributos nem vantagem de combate;
- o sistema prioriza uma peça sazonal que o jogador ainda não possua;
- se houver várias peças novas disponíveis, sorteia entre elas;
- enquanto existir alguma peça nova, não entrega duplicata;
- se o jogador já possuir todos os itens/acessórios disponíveis daquela temporada, a recompensa vira **1 Platina**.

---

# 8. Item Especial / Relíquia Sazonal — 10%

É um item permanente de coleção/lore da temporada.

Regras:

- pertence à temporada em que foi criado;
- fica permanentemente no inventário;
- não é consumido;
- não é uma peça de roupa;
- pode ter nome, descrição e lore próprios;
- não concede vantagem de combate por padrão;
- uma temporada pode possuir várias Relíquias Sazonais;
- o sistema prioriza uma relíquia daquela temporada que o jogador ainda não possua;
- enquanto existir alguma relíquia nova, não entrega duplicata;
- se o jogador já possuir todas as relíquias daquela temporada, a recompensa vira **1 Platina**.

Exemplo conceitual:

```txt
Relíquia: Fragmento do Jardim do Criador
Temporada: Jardim do Criador
Tipo: Item Especial Sazonal
Permanente: Sim
```

---

# 9. Regra geral de colecionáveis sazonais

Para recompensas permanentes de coleção do Baú Sazonal:

- Finalizadores;
- Mensagens de vitória;
- Itens/Acessórios;
- Relíquias;

a regra geral é:

```txt
se ainda existe item não possuído → priorizar item novo
se a coleção daquela categoria/temporada está completa → 1 Platina
```

A exceção é o **Consumível Sazonal**, que é acumulável e descartável por uso.

A Habilidade Temática possui sua própria regra de compatibilidade elemental e fallback.

---

# 10. Próximo passo

Com as regras acima consolidadas, o próximo trabalho da Etapa 25 é implementar o Baú Sazonal sem alterar as regras canônicas já fechadas neste documento.

A implementação deve preservar:
- idempotência;
- plano de recompensas congelado antes da entrega;
- retries sem reroll indevido;
- aplicação sem duplicação;
- finalização segura do baú somente depois que todas as recompensas forem resolvidas/aplicadas.
