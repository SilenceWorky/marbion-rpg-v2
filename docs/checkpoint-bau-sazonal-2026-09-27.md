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

---

# 11. Editor e identidade permanente dos Baús Sazonais — 27/09/2026

Implementação concluída no RPG Worker no commit `e3dda37` (`feat: adiciona identidade e progressao dos baus sazonais`).

O conteúdo mensal continua sendo a fonte canônica única. Não foi criada tabela/fonte paralela. O objeto persistido por mês foi evoluído para `PVP_SEASON_CONTENT_VERSION = 2` e agora contém também:

```txt
revision
seasonalChests[]
seasonalSkills[].introducedInSeasonalChestId
seasonalSkills[].introducedInSeasonalChestOrder
```

Dados antigos v1 continuam legíveis. Eles são normalizados com `revision: 0`, `seasonalChests: []` e habilidades históricas sem associação explícita a baú.

## Identidade de cada Baú Sazonal

Cada definição persistida de baú contém:

```txt
id
seasonId
order
name
description
poolRevision
createdAt
updatedAt
```

Para baús novos, o ID moderno usa o formato técnico `seasonal:YYYY-MM:chest:<token>`. IDs legados já usados pelo Worker, como `YYYY-MM:bau-rena`, continuam aceitos para compatibilidade e nunca são renomeados automaticamente.

Após o primeiro save/publicação do baú, `id`, `seasonId`, `order` e `poolRevision` são identidade imutável. Nome e descrição permanecem editáveis. Baú publicado não pode ser removido silenciosamente pelo save mensal.

## Revisões históricas e congelamento do pool

Cada save mensal incrementa `content.revision`. Antes de avançar o conteúdo atual, o Worker grava também um snapshot histórico imutável daquela revisão em chave separada.

Cada baú recebe `poolRevision` no momento em que é criado. Assim, um Baú #1 criado na revisão 1 continua apontando para a revisão 1 mesmo depois que o mês chega às revisões 2, 3, 4 etc.

O PVP Coordinator ganhou leitura por revisão em `/season/content/revision`. A abertura versionada deve usar a revisão congelada do próprio baú e nunca consultar apenas o conteúdo atual da temporada.

Instâncias novas de Baú Sazonal podem carregar `seasonId + seasonalChestId + chestOrder + poolRevision + snapshots de nome/descrição`. Instâncias antigas com apenas `seasonId` continuam legíveis como legado, sem inventar ID, ordem ou revisão.

## Progressão cumulativa

A elegibilidade de habilidade sazonal segue a regra:

```txt
mesmo seasonId
+
introducedInSeasonalChestOrder <= chestOrder
+
snapshot revision == poolRevision do baú
```

Logo, Natal #1 nunca vê recompensas introduzidas no #2/#3; Natal #2 vê #1+#2; Natal #3 vê #1+#2+#3. Outra temporada com ordem igual não participa do pool.

Conteúdo histórico sem associação a baú não é ligado automaticamente nem aleatoriamente: permanece explicitamente fora do pool de Baú Sazonal até o ADM definir a associação.

## Testes concluídos

Passaram:

- `testar_editor_baus_sazonais.mjs`: persistência, edição, recarregamento, revisão histórica e imutabilidade;
- `testar_progressao_baus_sazonais_habilidades.mjs`: progressão cumulativa, isolamento entre temporadas e revisão congelada;
- `testar_habilidade_bau_sazonal.mjs`: resolver de habilidade com identidade versionada;
- testes antigos de elementos, raridades, efeitos e vínculo season-only;
- `testar_integracao_temporada_coordenador.mjs`;
- `testar_integracao_temporada_mensal_coordenador.mjs`.

Nenhum deploy de produção foi executado nesta fase.


# 12. Abertura segura inicial do Baú Sazonal — 27/09/2026

Implementação concluída no commit `4247fbd` (`feat: inicia abertura segura do bau sazonal`).

O comando/serviço de abertura agora reconhece Baú Sazonal com identidade completa e cria um `pendingOpen` congelado contendo:

```txt
seasonId
seasonalChestId
chestOrder
poolRevision
nameSnapshot
descriptionSnapshot
createdAt
rewardPlan
```

O primeiro pedido de abertura sorteia o plano e grava o pending no próprio baú. Repetir a abertura enquanto existe pending reutiliza exatamente o mesmo plano; o RNG não é chamado novamente.

Baús legados que possuem apenas `seasonId` continuam no inventário, mas a abertura segura é recusada com `SEASONAL_CHEST_IDENTITY_REQUIRED`; nenhum ID/ordem/revisão histórica é inventado.

Quando o plano possui recompensa `seasonal_skill`, a rota busca o snapshot histórico pelo `poolRevision` do próprio baú via `/season/content/revision` e chama o resolver de habilidade contra esse snapshot. Portanto a abertura não consulta simplesmente a temporada atual.

Se o catálogo histórico estiver temporariamente indisponível, o perfil é salvo com o mesmo `pendingOpen` e o jogador pode tentar novamente sem reroll. O Baú Sazonal ainda não é removido antes da finalização completa de todas as recompensas.

Nesta fase somente a recompensa de habilidade sazonal já possui resolução temática integrada. Consumível sazonal, finalizador, mensagem de vitória, cosmético e relíquia continuam como próximas resoluções do pending; não foram simulados nem inventados.

Testes concluídos:
- `testar_pending_bau_sazonal.mjs`;
- `testar_abertura_servico_bau_sazonal.mjs`;
- `testar_rota_bau_sazonal_pending.mjs`;
- `testar_progressao_baus_sazonais_habilidades.mjs`;
- `testar_habilidade_bau_sazonal.mjs`;
- `testar_comando_abrir_bau.mjs`.

Nenhum deploy de produção foi executado.
