# Checkpoint de transferência — Marbion RPG V2 / Baú Sazonal — 27/09/2026

Este arquivo é o ponto canônico para continuar o projeto em um novo chat sem recomeçar trabalho já concluído.

## Repositório / ambiente

- Repositório: `SilenceWorky/marbion-rpg-v2`
- Branch: `main`
- Pasta local: `C:\Users\KABUM\Desktop\marbion-rpg-v2`
- Worker produção: `https://marbion-rpg-v2.wellingsonpl.workers.dev`
- KV: `MARBION_USERS_V2`
- Durable Object: `PVP_COORDINATOR`, instância global `marbion-global-pvp`
- Não houve deploy de produção neste bloco do Baú Sazonal.
- Nunca ativar/criar temporada real em produção sem autorização explícita.
- Não usar `git add .`.
- Arquivos locais protegidos e que não devem ser apagados/commitados por acidente: `skills-v1-1500-debuff.json`, `skills-v1-1500-final.json`, `skills-v1-1500.json`.

## Fluxo de trabalho

O usuário prefere implementação extremamente incremental: uma operação/teste por vez, conferir saída exata, depois continuar.

Remote Desktop disponível:
- dispositivo: `SilenceDesk`
- id: `6b11737e-1109-4e40-b1d8-f849b801ecfd`

Quando chegar em comandos do MarbionBot/site, NÃO configurar automaticamente. Avisar o usuário qual comando/campos precisam ser cadastrados; o usuário fará a configuração manualmente no painel.

## Roadmap prático

Etapas 1–24 concluídas.
Etapa 25 em andamento: Economia / Baús / Passe.
Dentro da Etapa 25:
- Baú Atômico I–V: funcionalmente fechado e validado.
- Baú Sazonal: implementação atual.
- Depois de fechar Etapa 25: PADM.
- Depois: Etapa 26 (fechamento de temporada, snapshot, recompensas, soft reset).
- Mobs/Bosses vêm depois de blocos intermediários e infraestrutura de spawn/permissões.

## Baú Sazonal — regras canônicas

Recompensa base:
- 50% XP, 50–180;
- 50% dinheiro, 20–80 Bronze-equivalente, convertido canonicamente pelo próprio baú.

Pool especial:
- 12% habilidade temática sazonal;
- 38% consumível sazonal;
- 15% finalizador PvP sazonal;
- 15% mensagem de vitória sazonal;
- 10% item/acessório sazonal;
- 10% relíquia/item especial sazonal.

Habilidade temática:
- somente habilidades sazonais da revisão histórica do baú;
- compatíveis com o personagem;
- não possuídas;
- pesos: Comum 40%, Raro 30%, Super Raro 20%, Mítico 8%, Lendário 2%, Único 0%;
- sem habilidade compatível/nova disponível -> 1 Platina.

Consumível sazonal:
- somente consumíveis cadastrados na temporada;
- não mistura com Poções normais;
- acumulável e continua após o fim da temporada;
- pesos: Comum 39,9%, Raro 30%, Super Raro 20%, Mítico 8%, Lendário 2%, Único 0,1%;
- ainda NÃO foi definido efeito/uso específico dos consumíveis sazonais; não inventar.

Colecionáveis:
- finalizador, mensagem, cosmético/acessório e relíquia são permanentes;
- priorizam item ainda não possuído;
- coleção completa da categoria/temporada -> 1 Platina.

## Identidade permanente / progressão cumulativa dos baús

Cada baú sazonal possui:
- `seasonId`
- `seasonalChestId` estável e permanente;
- `chestOrder` dentro da temporada;
- `poolRevision` histórica;
- `nameSnapshot`;
- `descriptionSnapshot`.

Regra central:
- conteúdo introduzido no Baú #1 pode sair no #1, #2, #3... da MESMA temporada;
- conteúdo introduzido no #2 nunca sai no #1;
- conteúdo introduzido no #3 nunca sai no #1/#2;
- nunca atravessa temporadas.

Elegibilidade usa:
`mesmo seasonId + mesmo snapshot poolRevision + introducedInSeasonalChestOrder <= chestOrder`.

O `poolRevision` congela o catálogo histórico. Um baú antigo jamais deve começar a dar conteúdo publicado depois.

Baús guardados por meses/anos continuam com identidade original. ADMs poderão futuramente distribuir baús históricos por ID.

Conteúdo histórico sem associação a baú não é ligado automaticamente nem aleatoriamente.

## Implementação concluída

Commit `e3dda37 feat: adiciona identidade e progressao dos baus sazonais`
- conteúdo mensal versionado;
- `seasonalChests[]`;
- `introducedInSeasonalChestId` / `introducedInSeasonalChestOrder`;
- revisões históricas;
- identidade permanente;
- progressão cumulativa/isolamento.

Commit `4247fbd feat: inicia abertura segura do bau sazonal`
- `pendingOpen` próprio do Baú Sazonal;
- retry reutiliza exatamente o mesmo plano, sem reroll;
- ramo sazonal separado do Atômico em `!baú abrir`;
- busca revisão histórica via `/season/content/revision`;
- habilidade temática resolvida contra snapshot histórico;
- baú legado/incompleto é bloqueado em vez de receber identidade inventada.

Commit `ca311e6 docs: registra abertura segura do bau sazonal`.

Commit `c9847fd feat: adicionar consumiveis ao bau sazonal`
- aplicador idempotente de recompensas sazonais;
- tipos aplicáveis atualmente: `normal_xp`, `money`, `seasonal_skill`, `seasonal_consumable`;
- controle por `rewardPlan.appliedRewardIndexes`;
- habilidade aprendida com `source: "seasonal_chest"`, permanente;
- consumível entregue com `source: "seasonal_chest"`;
- `grantId` determinístico por baú + índice da recompensa + unidade;
- `seasonalConsumables[]` adicionado ao conteúdo mensal e snapshots históricos;
- resolver de consumíveis com pesos completos, incluindo Único 0,1%;
- progressão cumulativa por baú e isolamento por temporada;
- rota real resolve, entrega e preserva retry sem duplicação.

Commit `0bc621c docs: registra consumiveis do bau sazonal`.

Último HEAD conhecido neste checkpoint:
`0bc621c docs: registra consumiveis do bau sazonal`

Antes de qualquer alteração no novo chat, executar:
`git status --short`
`git log -8 --oneline`
para detectar trabalho concorrente.

## Testes que já passaram

- `testar_editor_baus_sazonais.mjs`
- `testar_progressao_baus_sazonais_habilidades.mjs`
- `testar_habilidade_bau_sazonal.mjs`
- `testar_pending_bau_sazonal.mjs`
- `testar_abertura_servico_bau_sazonal.mjs`
- `testar_rota_bau_sazonal_pending.mjs`
- `testar_comando_abrir_bau.mjs`
- `testar_consumiveis_bau_sazonal.mjs`
- `testar_catalogo_consumiveis_sazonais.mjs`
- `testar_aplicacao_recompensas_bau_sazonal.mjs`
- `testar_rota_consumivel_bau_sazonal.mjs`
- `testar_plano_bau_sazonal.mjs`
- testes de integração de temporada/coordenador citados no checkpoint específico.

## Estado funcional atual do Baú Sazonal

Já faz:
1. identifica baú e revisão histórica;
2. cria/reutiliza `pendingOpen`;
3. congela o plano;
4. carrega o snapshot histórico correto;
5. resolve habilidade temática;
6. resolve consumível sazonal;
7. aplica XP;
8. aplica dinheiro;
9. aplica habilidade sazonal;
10. aplica consumível sazonal;
11. impede duplicação em retry.

Ainda NÃO faz:
- resolver/entregar finalizador PvP sazonal;
- resolver/entregar mensagem de vitória sazonal;
- resolver/entregar item/acessório sazonal;
- resolver/entregar relíquia sazonal;
- finalização/removal definitiva do Baú Sazonal após todos os rewards.

O Baú Sazonal deliberadamente ainda não é removido porque essas quatro categorias especiais ainda não foram implementadas.

## Próximo passo exato

Continuar pela próxima categoria do pool especial: **Finalizador de PvP Sazonal (15%)**.

Antes de codificar:
1. conferir status/HEAD;
2. procurar se já existe sistema real de finalizadores/colecionáveis no repo;
3. reutilizar arquitetura existente, se houver;
4. se não houver, criar primeiro a base mínima de inventário/coleção permanente e equipável sem inventar gatilho visual final;
5. preservar `seasonId`, `seasonalChestId`, `chestOrder`, `poolRevision`;
6. priorizar finalizador não possuído da mesma temporada;
7. coleção completa -> 1 Platina;
8. aplicação idempotente;
9. não finalizar/remover o baú até todas as categorias do pool estarem resolvidas/aplicadas.

Não implementar mensagem/cosmético/relíquia no mesmo passo; manter fluxo incremental.

## Referência detalhada

Também ler:
`docs/checkpoint-bau-sazonal-2026-09-27.md`

Esse arquivo contém as regras canônicas detalhadas e o histórico de implementação específico do Baú Sazonal.

## Cosméticos Sazonais — tipo/slot canônico (27/09/2026)

Implementação concluída no commit `0f2475f` (`feat: adiciona tipos aos cosmeticos sazonais`).

O catálogo `seasonalCosmetics` passou a armazenar também:

```txt
slot
```

A taxonomia é a mesma já usada pelo Passe de Temporada. Não existe uma segunda classificação paralela.

Slots canônicos:

- `hair` — Cabelo;
- `accessory` — Acessório (chapéu, óculos, cachecol etc.);
- `top` — Parte de cima (camisa, casaco etc.);
- `bottom` — Parte de baixo (calça, short, saia etc.);
- `shoes` — Calçado (bota, tênis etc.).

Fonte canônica:
`src/config/cosmetic-slots.js`.

Ela expõe:
- `SEASON_COSMETIC_SLOT_DEFINITIONS`;
- `SEASON_COSMETIC_SLOTS`;
- `normalizeSeasonCosmeticSlot()`;
- `getSeasonCosmeticSlotDefinition()`.

O endpoint administrativo de Temporadas agora devolve `cosmeticSlots` com ID e rótulo para a Platform consumir diretamente.

### Persistência e compatibilidade

O schema anual do conteúdo de temporada passou para `PVP_SEASON_CONTENT_VERSION = 6`.

Novos cosméticos enviados pelo editor precisam possuir um slot canônico válido.

Dados históricos já persistidos antes desta mudança, sem `slot`, continuam legíveis:
- o storage normaliza esses registros com `slot: null`;
- nenhuma categoria é inventada automaticamente;
- quando forem editados/salvos pela interface nova, o ADM precisará escolher explicitamente o tipo.

### Fluxo de recompensa

O `slot` é preservado em todo o fluxo:

```txt
seasonalCosmetics
→ resolver do Baú Sazonal
→ rewardPlan congelado
→ aplicação da recompensa
→ profile.cosmetics.owned[]
```

A coleção do jogador passa a armazenar `slot` junto de `seasonId`, `cosmeticId`, nome e metadados de aquisição.

A coleção continua inerte na v1.0:
- nenhum sistema de equipar foi criado;
- nenhum visual/preview foi criado;
- o slot serve como classificação canônica e preparação para o sistema futuro de equipamento/aparência.

`grantCosmetic()` aceita registros legados sem slot, mas rejeita um slot não vazio que não pertença à taxonomia canônica.

### Testes

Novo teste:
`testar_slots_cosmeticos.mjs`.

Também foram atualizados:
- `testar_catalogo_cosmeticos_sazonais.mjs`;
- `testar_colecao_cosmeticos.mjs`;
- `testar_cosmetico_bau_sazonal.mjs`;
- `testar_aplicacao_cosmetico_bau_sazonal.mjs`;
- `testar_rota_cosmetico_bau_sazonal.mjs`.

Validado:
- os cinco slots canônicos coincidem com os slots usados no Passe;
- `hat` e outros valores fora da taxonomia são recusados;
- cosmético histórico sem slot continua legível como `null`;
- rename preserva ID e slot;
- o resolver preserva slot;
- a aplicação grava slot na coleção;
- a rota real de abertura do baú mantém o slot no plano e no perfil;
- catálogo do Passe e `!baú abrir` continuaram passando.

Nenhum deploy de produção foi executado.

## Relíquias Sazonais — implementação completa do fluxo do Baú (28/09/2026)

A última categoria pendente do pool especial foi implementada de forma incremental, mantendo o RPG Worker como fonte de verdade.

Regras preservadas:
- peso do pool: 10% (`seasonal_relic`);
- relíquia é colecionável permanente de temporada/lore;
- não é consumível nem peça de roupa;
- pode armazenar nome, descrição e lore;
- não concede vantagem de combate por padrão;
- identidade permanente por `seasonId + relicId`;
- progressão cumulativa pelo Baú Sazonal de introdução;
- enquanto existir relíquia elegível ainda não possuída, não há duplicata;
- coleção completa da categoria/temporada converte a recompensa em 1 Platina;
- retry reutiliza o plano congelado e não duplica/rerrola a recompensa.

Implementação:
- `9e02e20 feat: adiciona colecao de reliquias sazonais`
  - cria `profile.relics.owned[]`;
  - cria `src/systems/relic-collection.js`;
  - coleção preserva `seasonId`, `relicId`, nome, descrição, lore, origem, data e metadados do Baú;
- `2d91c41 feat: adiciona catalogo sazonal de reliquias`
  - adiciona `seasonalRelics` ao conteúdo versionado de temporada;
  - conteúdo passa para `PVP_SEASON_CONTENT_VERSION = 7`;
  - API administrativa aceita/salva `id`, `name`, `description`, `lore`, `introducedInSeasonalChestId` e `introducedInSeasonalChestOrder`;
  - rename/edição de lore preserva o ID permanente e revisões históricas;
- `5411e8a feat: resolve reliquias no bau sazonal`
  - cria `seasonal-chest-relic-resolver.js`;
  - valida `seasonId`, `seasonalChestId`, `chestOrder` e `poolRevision`;
  - respeita progressão cumulativa e propriedade existente;
  - coleção completa -> 1 Platina;
- `d991907 feat: aplica reliquias do bau sazonal`
  - entrega a relíquia ao perfil de forma idempotente;
- `e5f3e8e fix: remove duplicacao na aplicacao de reliquias`
  - remove bloco duplicado introduzido durante trabalho concorrente, preservando uma única validação/aplicação canônica;
- `fe2681b feat: integra reliquia ao bau sazonal`
  - integra resolução da relíquia à rota real `!baú abrir`.

Testes novos:
- `testar_colecao_reliquias.mjs`;
- `testar_catalogo_reliquias_sazonais.mjs`;
- `testar_reliquia_bau_sazonal.mjs`;
- `testar_aplicacao_reliquia_bau_sazonal.mjs`;
- `testar_rota_reliquia_bau_sazonal.mjs`.

Regressão executada e aprovada também para Cosméticos, Mensagens de Vitória, Finalizadores PvP, plano estrutural do Baú e comando `!baú abrir`.

Com isso, todas as categorias especiais do pool já possuem fluxo real de resolução/entrega: habilidade, consumível, finalizador, mensagem de vitória, cosmético e relíquia, além de XP/dinheiro base do plano.

### Próximo passo canônico

O próximo passo do Worker deve ser tratado separadamente: **finalização/remoção definitiva da instância do Baú Sazonal somente depois que todas as recompensas do `pendingOpen.rewardPlan` estiverem resolvidas e aplicadas**.

Antes dessa finalização, a Platform ainda precisa ganhar o editor visual de `seasonalRelics` para permitir cadastrar nome, descrição, lore e Baú de introdução sem duplicar regra de gameplay.

Nenhum deploy de produção foi executado e nenhuma temporada real foi ativada/agendada.
