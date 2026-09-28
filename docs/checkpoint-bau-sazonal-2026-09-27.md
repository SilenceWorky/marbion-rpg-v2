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


# 13. Aplicação idempotente e Consumíveis Sazonais — 27/09/2026

A abertura sazonal agora possui aplicador próprio de recompensas resolvidas. O Worker aplica somente recompensas com `resolved: true` e persiste `rewardPlan.appliedRewardIndexes`, impedindo duplicação em retry.

Tipos já aplicáveis:

```txt
normal_xp
money
seasonal_skill
seasonal_consumable
```

A habilidade sazonal é aprendida permanentemente com `source: "seasonal_chest"`.

O Consumível Sazonal é entregue ao inventário base de consumíveis com `source: "seasonal_chest"` e `grantId` determinístico por instância de baú + índice da recompensa + unidade. Assim, repetir a aplicação não cria uma segunda cópia acidental da mesma entrega.

## Catálogo sazonal de consumíveis

O conteúdo mensal passou a aceitar `seasonalConsumables[]`, preservado também nos snapshots históricos de revisão. Cada entrada possui, nesta etapa:

```txt
id
key
name
rarity
description
introducedInSeasonalChestId
introducedInSeasonalChestOrder
```

O catálogo usa as seis raridades canônicas. O sorteio do Baú Sazonal segue exatamente:

```txt
Comum        39,9%
Raro         30%
Super Raro   20%
Mítico        8%
Lendário      2%
Único          0,1%
```

A elegibilidade respeita o mesmo isolamento e progressão histórica dos demais conteúdos:

```txt
mesmo seasonId
+
mesmo snapshot poolRevision
+
introducedInSeasonalChestOrder <= chestOrder
```

Logo, um consumível introduzido no Baú #2 não pode sair no Baú #1; o Baú #2 pode acessar consumíveis do #1 e #2; outra temporada não participa do pool.

Consumíveis sazonais são acumuláveis. Não foi definido nesta etapa nenhum efeito de uso específico deles; portanto o sistema atual cobre cadastro, versionamento histórico, sorteio, entrega e persistência no inventário, sem inventar regras de efeito/uso que ainda não foram aprovadas.

## Testes concluídos

Passaram:

- `testar_consumiveis_bau_sazonal.mjs`: pesos, raridade Único, progressão cumulativa e isolamento;
- `testar_catalogo_consumiveis_sazonais.mjs`: normalização e persistência do catálogo mensal;
- `testar_aplicacao_recompensas_bau_sazonal.mjs`: aplicação idempotente de XP, dinheiro, habilidade e consumível;
- `testar_rota_consumivel_bau_sazonal.mjs`: resolução, entrega e retry sem duplicação na rota real;
- `testar_rota_bau_sazonal_pending.mjs`;
- `testar_comando_abrir_bau.mjs`;
- `testar_editor_baus_sazonais.mjs`;
- `testar_habilidade_bau_sazonal.mjs`;
- `testar_plano_bau_sazonal.mjs`.

O Baú Sazonal ainda não é removido/finalizado nesta etapa porque finalizador, mensagem de vitória, cosmético e relíquia continuam pendentes de implementação.

Nenhum deploy de produção foi executado.

# 13. Distribuição anual de Baús Sazonais no Passe — 27/09/2026

Implementação concluída no commit `4e9c823` (`feat: vincula recompensas anuais aos baus sazonais`), já reconciliada com o commit paralelo de Finalizadores PvP Sazonais `e821460`.

A identidade dos Baús Sazonais já era anual porque `seasonId` usa `YYYY-MM`. A lacuna resolvida nesta etapa era definir qual identidade concreta cada recompensa genérica `seasonal_chest` deve entregar em cada mês/ano.

O conteúdo mensal foi evoluído para `PVP_SEASON_CONTENT_VERSION = 3` e ganhou:

```txt
seasonalChestRewardBindings[]
```

Cada binding possui:

```txt
key
seasonalChestId
```

Slots canônicos atuais do Passe:
- cada patamar do catálogo que contém `seasonal_chest` possui uma chave `season_pass:tier:<N>`;
- o pós-passe possui `season_pass:post`;
- atualmente são 13 patamares com Baú Sazonal + 1 slot de pós-passe = 14 bindings possíveis.

Exemplos:

```txt
2026-12
season_pass:tier:5   -> seasonal:2026-12:chest:<id-A>
season_pass:tier:75  -> seasonal:2026-12:chest:<id-B>
season_pass:tier:100 -> seasonal:2026-12:chest:<id-C>
season_pass:post     -> seasonal:2026-12:chest:<id-C>

2027-12
season_pass:tier:5   -> seasonal:2027-12:chest:<outro-id>
```

Regras:
- o binding sempre aponta para o ID exato do baú;
- só pode apontar para baú existente dentro do mesmo conteúdo/seasonId;
- patamar que não possui recompensa `seasonal_chest` não pode receber binding artificial;
- binding ausente significa explicitamente `não definido`; não existe escolha automática do #1, último ou mais novo;
- quantidade continua vindo do catálogo do Passe: por exemplo, Patamar 75 = 2 unidades do baú selecionado e Patamar 100 = 3 unidades do baú selecionado;
- o pós-passe possui escolha independente;
- revisões históricas do conteúdo preservam os bindings daquela revisão;
- dados antigos são normalizados com `seasonalChestRewardBindings: []`, sem inventar distribuição.

Foi criado o resolver canônico:
`src/systems/seasonal-chest-reward-binding-resolver.js`.

Ele resolve um slot para a definição completa do baú e valida `seasonId`, identidade e `poolRevision`. Esse resolver fica pronto para a futura integração da entrega física do Passe.

Importante: `deliveryIntegrated` do Passe continua `false`. Esta etapa configura corretamente qual baú deverá ser entregue, mas não finge que o resgate físico completo das recompensas do Passe já existe.

Teste novo:
`testar_vinculo_recompensas_baus_sazonais.mjs`.

Validado:
- 2026 e 2027 podem mapear os mesmos patamares para IDs diferentes;
- cross-season é recusado;
- revisão histórica preserva binding antigo;
- quantidades 1/2/3 do catálogo permanecem corretas;
- pós-passe possui binding próprio;
- slot inexistente é recusado;
- conteúdo antigo não recebe binding automático;
- integração coexistindo com Consumíveis Sazonais e Finalizadores PvP Sazonais passou sem regressão.

Nenhum deploy de produção foi executado.

# 14. Distribuição simplificada: padrão mensal, exceções e pós-passe ponderado — 27/09/2026

Implementação concluída no commit `9cc6157` (`feat: simplifica distribuicao dos baus sazonais`).

O schema mensal foi evoluído para `PVP_SEASON_CONTENT_VERSION = 4` sem remover compatibilidade com os bindings detalhados anteriores.

Novos campos canônicos:

```txt
defaultSeasonalChestId
seasonalChestRewardBindings[]
seasonalChestPostPassPool[]
```

Semântica:

- `defaultSeasonalChestId`: identidade do Baú Sazonal padrão daquele `seasonId`; todo patamar do Passe que concede `seasonal_chest` herda este baú quando não houver exceção.
- `seasonalChestRewardBindings`: passa a representar principalmente exceções por patamar. Um binding específico substitui o baú padrão somente naquele slot.
- `seasonalChestPostPassPool`: pool personalizado do pós-passe, com entradas `seasonalChestId + chancePercent`.

Regras preservadas:

- o baú padrão deve pertencer ao mesmo `seasonId`;
- exceções só podem apontar para baús existentes do mesmo mês/ano;
- dados antigos continuam legíveis;
- nenhum dado histórico recebe baú padrão ou pool aleatório inventado;
- bindings antigos continuam sendo resolvidos normalmente;
- se não houver pool personalizado do pós-passe, o pós-passe herda o comportamento normal: binding antigo específico, quando existir, ou o baú padrão;
- um pool personalizado não pode repetir o mesmo baú;
- todas as chances do pool personalizado precisam ser > 0 e <= 100;
- quando o pool existe, a soma das chances precisa ser 100% (tolerância técnica de 0,01);
- o sorteio ponderado é feito por chamada, portanto cada recompensa do pós-passe sorteia uma identidade segundo as porcentagens configuradas;
- quantidade dos patamares continua vindo exclusivamente do catálogo do Passe.

Resolver atualizado:
`src/systems/seasonal-chest-reward-binding-resolver.js`.

Ele agora informa a origem da resolução (`default`, `override` ou `post_pass_pool`) e possui:
- `getSeasonPassPostSeasonalChestRewardPool`;
- `rollSeasonPassPostSeasonalChestReward`.

Teste novo:
`testar_distribuicao_padrao_baus_sazonais.mjs`.

Validado:
- patamar sem exceção herda o baú padrão;
- exceção substitui o padrão sem alterar a quantidade do catálogo;
- pós-passe 50%/30%/20% seleciona corretamente os três intervalos;
- ausência de pool personalizado faz o pós-passe herdar o padrão;
- soma diferente de 100% é recusada;
- baú padrão cross-season é recusado;
- testes anteriores de bindings anuais, editor, progressão cumulativa, finalizadores e catálogo do Passe permaneceram verdes.

Nenhuma entrega física do Passe foi ativada e nenhum deploy de produção foi executado.

# 15. REGRA CANÔNICA NOVA — Baú Sazonal recorrente por mês, não por ano — 27/09/2026

Esta seção **substitui a interpretação anterior** de que a identidade do Baú Sazonal pertencia exclusivamente a um único `seasonId = YYYY-MM`.

Implementação concluída no commit `6e04e02` (`feat: herda baus sazonais entre anos`).

## Regra atual

A identidade permanente do Baú Sazonal pertence ao **mês temático recorrente**.

Exemplo:

```txt
Dezembro/2026
#1 Baú De Madeira Congelada — ID A
#2 Baú De Rena              — ID B

Dezembro/2027
#1 Baú De Madeira Congelada — mesmo ID A
#2 Baú De Rena              — mesmo ID B

Dezembro/2028
#1 Baú De Madeira Congelada — mesmo ID A
#2 Baú De Rena              — mesmo ID B
```

O ID nasce uma única vez no primeiro ano em que o baú é criado e nunca é regenerado nos anos seguintes.

Um baú novo criado somente em Dezembro/2027 recebe seu ID uma vez e passa a existir em Dezembro/2027, 2028, 2029 etc. Ele **não retroage** para Dezembro/2026.

Baús nunca atravessam meses diferentes. Um baú de Dezembro não aparece em Fevereiro, Novembro etc.

## Separação identidade mensal x publicação anual

O Worker agora mantém duas responsabilidades distintas:

1. **Catálogo mensal de identidade**
   - chave própria por mês;
   - contém ID permanente, `originSeasonId`, ordem, nome, descrição e última temporada que atualizou a definição;
   - é a fonte de recorrência do baú nos anos futuros.

2. **Conteúdo anual da temporada**
   - continua em `YYYY-MM`;
   - contém a publicação daquele ano, `poolRevision`, bindings do Passe e conteúdo sazonal;
   - preserva snapshots históricos/revisões.

O schema do conteúdo anual passou para `PVP_SEASON_CONTENT_VERSION = 5`.

O catálogo mensal usa `PVP_SEASONAL_CHEST_MONTH_CATALOG_VERSION = 1`.

## Herança

Ao ler um ano futuro do mesmo mês:

- o Worker injeta os baús já existentes no catálogo mensal;
- mantém exatamente os mesmos IDs e ordens;
- altera apenas o `seasonId` anual da definição para o ano visualizado;
- antes do primeiro save daquele ano, esses baús aparecem com `poolRevision: null` e `inherited: true`;
- no primeiro save anual, os mesmos IDs recebem a nova `poolRevision` daquele ano.

Exemplo:

```txt
ID A nasceu em 2026-12.

Instância entregue em 2026:
seasonId = 2026-12
seasonalChestId = ID A
poolRevision = revisão histórica de 2026

Instância entregue em 2027:
seasonId = 2027-12
seasonalChestId = mesmo ID A
poolRevision = revisão histórica de 2027
```

Assim, guardar o baú de 2026 continua seguro: ele abre usando a temporada/revisão de 2026 mesmo que a mesma identidade seja usada novamente em 2027.

## Compatibilidade/migração

- IDs antigos como `seasonal:2026-12:chest:<token>` continuam válidos e passam a representar o ano de **origem da identidade**, não um limite de uso.
- Um ID originado em 2026-12 pode ser usado em 2027-12, 2028-12 etc.
- Ele não pode ser usado em mês diferente.
- Ele não pode ser usado retroativamente em ano anterior ao seu ano de origem.
- se o catálogo mensal ainda não existir, o Worker o deriva de forma segura do conteúdo anual anterior já persistido;
- nenhuma migração inventa IDs novos para baús existentes.

O catálogo também guarda `latestSeasonId`: uma edição feita em ano mais novo pode seguir para anos futuros, mas salvar um ano antigo depois não faz o catálogo voltar no tempo.

## Teste

Novo teste:
`testar_heranca_anual_baus_sazonais.mjs`.

Validado:
- mesmos IDs de Dezembro/2026 aparecem em Dezembro/2027;
- primeiro save de 2027 publica esses mesmos IDs com revisão anual própria;
- novo baú criado em 2027 aparece em 2028;
- novo baú de 2027 não aparece em 2026;
- edição de nome em 2027 segue para 2028;
- salvar 2026 depois não reverte a definição mais nova do catálogo;
- Dezembro não vaza para Novembro;
- uma instância de 2027 aceita ID originado em 2026 do mesmo mês;
- testes de distribuição padrão, bindings, editor, progressão, habilidade, finalizador, mensagem de vitória e `!baú abrir` continuaram passando.

Nenhum deploy de produção foi executado.
