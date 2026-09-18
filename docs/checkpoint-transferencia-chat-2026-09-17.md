# Marbion RPG V2 — Checkpoint de transferência de chat

Data canônica: **2026-09-17**

Este arquivo existe para permitir continuar o projeto em outro chat sem perder o ponto exato. O próximo chat deve ler este documento antes de alterar código.

---

# 1. Regras de trabalho

- Repositório: `SilenceWorky/marbion-rpg-v2`.
- Branch: `main`.
- Trabalhar **um comando ou teste por vez** e esperar o resultado do usuário antes de avançar.
- O assistente pode editar o GitHub diretamente; o usuário normalmente executa `git pull --ff-only`, comandos e testes no Codespace.
- Não repetir regressões profundas já aprovadas sem motivo técnico.
- Nunca confundir **planejado**, **implementado no GitHub/local** e **implantado em produção**.
- Nunca criar/ativar uma temporada real em produção sem autorização explícita do usuário.
- Nunca pedir/exibir tokens, secrets ou chaves.
- Nunca usar `git add .`.
- Arquivos locais protegidos que não devem ser apagados/commitados por engano:
  - `skills-v1-1500-debuff.json`
  - `skills-v1-1500-final.json`
  - `skills-v1-1500.json`
- Se aparecer `__pycache__/`, pode ser removido.
- O usuário prefere fluxo extremamente incremental: **um teste/comando por mensagem**.

---

# 2. Infraestrutura

Worker de produção:

```txt
https://marbion-rpg-v2.wellingsonpl.workers.dev
```

KV V2:

```txt
Binding: MARBION_USERS_V2
Namespace: 3731c622c6764dbc9025cef56030c23e
```

Durable Object:

```txt
Binding: PVP_COORDINATOR
Classe exportada: PvpCoordinator
Instância global: marbion-global-pvp
```

Conteúdo externo:

```txt
SilenceWorky/worky-live-responses
```

Arquivos principais externos:

```txt
racas.json
elementos.json
skills.json
```

V1 continua preservada e não deve ser desligada ainda.

---

# 3. Estado geral do roadmap

- Etapas 1–23: concluídas.
- Etapa 24 — Temporadas: concluída e implantada em produção.
- Etapa 25 — Passe de Batalha / Economia / Banco / Baús: **em implementação ativa**.
- Etapa 26 — fechamento sazonal / snapshot / recompensas / soft reset: pendente.
- Futuro:
  - 27 Missões Diárias
  - 28 Mercador
  - 29 Marketplace da Comunidade
  - 30 Cristais de Mentalidade
  - 31 onboarding
  - 32 status/poderes de raça
  - 33 aliases em inglês perto do fim
  - depois website/visual/multistreamer.

---

# 4. Etapa 24 — Temporadas

Regras canônicas já fechadas:

```txt
Timezone: America/Fortaleza (UTC-03:00)
startsAt: dia 1 às 00:00
endsAt: dia 1 do mês seguinte às 00:00
```

Temas-base confirmados:

```txt
Agosto    — Arquivo do Infinito
Setembro  — Jardim do Criador
```

Comandos canônicos:

```txt
!temporada
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

Nenhuma temporada real deve ser criada sem autorização explícita.

---

# 5. Etapa 25 — Passe de Batalha: estado implementado

Já implementado e validado:

## Perfil do Passe

`src/core/profile.js` possui:

```js
seasonPass: {
  seasonId: null,
  xp: 0,
  tier: 0,
  completed: false,
  postPassXp: 0,
  claimedRewards: []
}
```

## Curva do Passe

Implementada em:

```txt
src/systems/season-pass-progression.js
```

Valores canônicos:

```txt
100 patamares
53.250 XP total
550 XP pós-passe = 1 Baú Sazonal
```

## Estado / concessão de XP

Implementado em:

```txt
src/systems/season-pass-state.js
```

Inclui:
- reset por temporada;
- multiplicador;
- overflow pós-100;
- tier completion;
- tiers desbloqueados;
- contagem de recompensas pós-passe.

## Catálogo dos 100 patamares

Implementado em:

```txt
src/config/season-pass-rewards.js
```

Catálogo completo e validado.

## Estado de resgate

Implementado em:

```txt
src/systems/season-pass-rewards-state.js
```

Ainda não entrega fisicamente todas as recompensas; mantém estado de claim e prevalidation.

---

# 6. Economia / Banco — estado atual

Base de moedas implementada e validada.

Conversão:

```txt
10 Bronze = 1 Prata
10 Prata  = 1 Ouro
10 Ouro   = 1 Platina
```

Importante:
- ganhos não se convertem automaticamente;
- banco permite unir/separar;
- débitos podem quebrar denominações maiores e gerar troco canônico.

Arquivos principais:

```txt
src/systems/money.js
src/systems/bank-exchange.js
src/routes/bank.js
```

---

# 7. Pix — estado FINAL local/GitHub

Pix foi implementado como **saga distribuída idempotente e retomável**, NÃO como transação ACID global entre dois Durable Objects.

Fluxo:

```txt
1. criar Pix pendente
2. confirmar
3. debit side no DO do remetente
4. credit side no DO do destinatário
5. finalize side no DO do remetente
```

Comandos/rotas:

```txt
!banco pix <quantidade> <moeda> @usuario
!confirmar
!banco confirmar
!banco cancelar
```

TTL:

```txt
2 minutos para INICIAR a transferência
```

Regra crítica corrigida:
- se o Pix expirar antes de qualquer débito, ele não inicia;
- se o débito já aconteceu e houver falha/retry, a transferência pode terminar mesmo depois do TTL;
- isso evita dinheiro preso entre remetente e destinatário.

Testes já validados:

```txt
✅ Orquestração distribuída e retomável do Pix validada.
✅ Lados duráveis e idempotentes do Pix validados.
✅ Confirmação do Pix pelas rotas !confirmar e !banco confirmar validada.
✅ Rota base do Banco validada.
```

Commits importantes do Pix:

```txt
a16c885 — feat: adicionar orquestracao retomavel do pix
85cc17f — feat: adicionar confirmacao do pix nas rotas
7525222 — feat: adicionar cancelamento de pix no banco
b93e325 — fix: permitir retomada segura de pix expirado
```

---

# 8. Baús — decisões canônicas

Tipos:

```txt
Baú Atômico
Baú Sazonal
Baú de Monstro
Baú de Boss
Baú ADM
```

A listagem usa grupos por tipo, mas cada baú é armazenado como **instância individual**.

A seleção do grupo usa ordem fixa:

```txt
1. Atômico
2. Sazonal
3. Monstro
4. Boss
5. ADM
```

A instância real aberta dentro do grupo é escolhida por **FIFO**.

---

# 9. Inventário base de Baús — implementado e validado

Perfil possui:

```js
chests: [],
chestSequence: 0
```

Arquivo:

```txt
src/systems/chest-inventory.js
```

Suporta:
- instâncias individuais;
- IDs únicos por perfil;
- agrupamento por tipo;
- busca por ID;
- remoção;
- seleção FIFO;
- compatibilidade com perfis antigos.

Teste validado:

```txt
✅ Inventário base de Baús validado.
```

Commit:

```txt
fae97ba — feat: adicionar inventario base de baus
```

---

# 10. Estado interno do Baú Atômico — implementado e validado

Arquivo:

```txt
src/systems/atomic-chest-state.js
```

Estado atual:

```txt
currentAtoms
maxAtoms
minimumOpenAtoms
attemptsAtLevel
scriptedSteps
scriptIndex
pendingOpen
```

`pendingOpen` foi adicionado no commit atual mais recente para suportar abertura idempotente, mas o teste desse novo campo está falhando; ver seção 15.

Teste anterior, antes de `pendingOpen`, passou:

```txt
✅ Estado interno base do Baú Atômico validado.
```

Commit base:

```txt
f27866b — feat: adicionar estado interno do bau atomico
```

---

# 11. Mecânica do Baú Atômico — implementada e validada

Arquivo:

```txt
src/systems/atomic-chest-mechanic.js
```

Regras canônicas implementadas:

```txt
Tentativa 1/2:
35% = nada

Tentativa 3:
não pode falhar
abre ou evolui
```

Evolução:

```txt
⚛ → ⚛⚛               50%
⚛⚛ → ⚛⚛⚛             25%
⚛⚛⚛ → ⚛⚛⚛⚛           10%
⚛⚛⚛⚛ → ⚛⚛⚛⚛⚛         1%
```

Ao evoluir:
- `attemptsAtLevel` volta a 0.

No máximo:
- ⚛⚛⚛⚛⚛ não evolui mais;
- abre.

`minimumOpenAtoms`:
- impede abertura abaixo do piso definido;
- força evolução quando necessário.

`scriptedSteps`:
- suporta `nothing`, `evolve`, `open`;
- passo impossível não é consumido.

Testes validados:

```txt
✅ Mecânica de tentativas e evolução do Baú Atômico validada.
```

Commits:

```txt
117dad2 — feat: adicionar mecanica de evolucao do bau atomico
f36a616 — fix: preservar passo invalido do roteiro atomico
```

---

# 12. Catálogo de recompensas do Baú Atômico — implementado e validado

Arquivo:

```txt
src/config/atomic-chest-rewards.js
```

Estágio I:
- XP normal OU dinheiro;
- +20% consumível.

Estágio II:
- XP + dinheiro;
- +30% consumível;
- +8% Scroll R1 compatível.

Estágio III:
- XP + dinheiro + consumível;
- +25% Scroll R1/R2 com pesos 70/30;
- +20% segundo consumível.

Estágio IV:
- XP + dinheiro;
- Scroll compatível garantido R2/R3/R4 com 75/20/5;
- +30% bônus ainda sem pool definido.

Estágio V:
- XP + dinheiro;
- nova habilidade elemental compatível garantida;
- se pool esgotado: 75% 1 Platina / 25% 2 Platinas;
- +40% Scroll R3/R4/R5 com 75/20/5;
- +20% bônus ainda sem pool definido.

Chance natural de ⚛ até ⚛⚛⚛⚛⚛:

```txt
0,0125% = 1 em 8.000
```

Valores exatos de XP/dinheiro ainda não foram inventados e permanecem `null`.

Teste validado:

```txt
✅ Catálogo de recompensas do Baú Atômico validado.
```

Commit:

```txt
aaa0b67 — feat: adicionar catalogo de recompensas do bau atomico
```

---

# 13. Rota de listagem dos Baús — implementada e validada

Arquivos:

```txt
src/routes/chest.js
src/router.js
```

Rotas:

```txt
/bau
/baú
```

Exemplo de saída:

```txt
📦 Baús de @silenceworky ┃ 1. Baú Atômico ⚛ ×3 ┃ 2. Baú Sazonal ×2 ┃ 3. Baú de Monstro ×5 ┃ 4. Baú de Boss ×4 ┃ 5. Baú ADM ×1 ┃ Página 1/1
```

Suporta paginação.

Teste validado:

```txt
✅ Rota de listagem dos Baús validada.
```

Commit:

```txt
8a093de — feat: adicionar rota de listagem dos baus
```

---

# 14. Seleção numérica e FIFO — implementada e validada

Arquivo:

```txt
src/systems/chest-selection.js
```

Objetivo futuro:

```txt
!baú abrir 3
```

A seleção:
- usa o número do grupo exibido;
- escolhe a primeira instância real daquele tipo;
- mantém FIFO;
- rejeita número inexistente sem alterar inventário.

Teste validado:

```txt
✅ Seleção numérica e FIFO dos Baús validada.
```

Commit:

```txt
b940d1c — feat: adicionar selecao fifo dos baus
```

---

# 15. PONTO EXATO ATUAL — TESTE FALHANDO

Commit atual de código:

```txt
d00884a — feat: adicionar servico base de abertura dos baus
```

Arquivos novos/alterados:

```txt
src/systems/atomic-chest-state.js
src/systems/chest-open-service.js
testar_abertura_base_baus.mjs
```

Objetivo deste bloco:
- selecionar grupo numericamente;
- pegar instância real por FIFO;
- executar tentativa do Baú Atômico;
- se resultado = `open`, persistir um `pendingOpen` no estado do baú;
- retries posteriores devem retornar a mesma abertura pendente sem rerrolar;
- NÃO consumir/remover o baú ainda;
- NÃO entregar recompensa ainda.

O usuário rodou:

```bash
node testar_abertura_base_baus.mjs
```

E o teste FALHOU.

Erro observado:

```txt
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:

+ actual - expected

+ null
- {
-   atoms: 2,
-   attemptNumber: 2,
-   createdAt: 2000,
-   scripted: false
- }

at file:///workspaces/marbion-rpg-v2/testar_abertura_base_baus.mjs:133:8
```

Portanto:

```txt
atomic.metadata.atomic.pendingOpen
```

permaneceu `null` depois de uma tentativa cujo resultado foi `open`.

**NÃO avançar para rewards/consumo/rota !baú abrir antes de corrigir esse erro.**

---

# 16. Diagnóstico provável do erro atual

O bug provavelmente está em uma referência stale dentro de:

```txt
src/systems/chest-open-service.js
```

Fluxo atual:

1. `attemptChestOpen()` chama `getAtomicChestState(chest)` e guarda o retorno em `atomic`.
2. Depois chama `resolveAtomicChestAttempt(chest)`.
3. `resolveAtomicChestAttempt()` chama **novamente** `getAtomicChestState(chest)`.
4. `getAtomicChestState()` normaliza e faz:

```js
chest.metadata.atomic = normalized.state;
```

5. Isso substitui o objeto de estado no `chest`.
6. Ao retornar para `attemptChestOpen()`, a variável `atomic.state` pode continuar apontando para o objeto anterior.
7. Então:

```js
atomic.state.pendingOpen = { ... }
```

é aplicado no objeto stale, enquanto `chest.metadata.atomic.pendingOpen` continua `null`.

Esse diagnóstico combina exatamente com o erro observado.

Correção recomendada:
- depois de `resolveAtomicChestAttempt()`, obter novamente o estado atual do próprio `chest` antes de gravar `pendingOpen`;
- ou alterar a arquitetura para não normalizar/substituir o objeto duas vezes no mesmo fluxo;
- preferir a correção mínima e testável.

Exemplo conceitual da correção mínima:

```js
const result = resolveAtomicChestAttempt(...);

if (result.action === "open") {
  const latestAtomic = getAtomicChestState(chest);

  latestAtomic.state.pendingOpen = {
    ...
  };
}
```

Não aplicar cegamente sem conferir o arquivo atual.

---

# 17. Próximo passo EXATO

Ao retomar:

1. Ler este checkpoint.
2. Conferir `src/systems/chest-open-service.js` e `src/systems/atomic-chest-state.js`.
3. Corrigir o stale reference de `pendingOpen`.
4. Commitar a correção.
5. Pedir ao usuário somente:

```bash
git pull --ff-only
```

6. Depois pedir somente:

```bash
node testar_abertura_base_baus.mjs
```

Resultado esperado:

```txt
✅ Serviço base de abertura dos Baús validado.
```

Somente depois disso continuar com:
- integração do comando `!baú abrir N`;
- persistência via `saveProfile`;
- entrega efetiva de recompensa;
- consumo/removal do baú somente após reward aplicada com segurança/idempotência.

---

# 18. Observação importante sobre recompensa e consumo

A arquitetura deve evitar este cenário:

```txt
baú é removido
→ falha ao entregar recompensa
→ jogador perde o baú
```

E também evitar:

```txt
recompensa é entregue
→ retry acontece
→ recompensa é entregue de novo
```

Por isso `pendingOpen` existe: primeiro congela o resultado da abertura, depois a recompensa será aplicada de modo idempotente, e só então o baú poderá ser consumido/finalizado.

Não remover essa proteção para “simplificar”.

---

# 19. Banco/Pix e Baús não estão em produção ainda

Os blocos recentes da Etapa 25 foram desenvolvidos/validados no GitHub/local.

Não declarar como implantado em produção enquanto não houver deploy explícito e smoke tests.

---

# 20. Prompt curto para novo chat

Usar:

```txt
Continue o projeto Marbion RPG V2. Leia no GitHub `docs/checkpoint-transferencia-chat-2026-09-17.md` e continue exatamente da seção **PONTO EXATO ATUAL — TESTE FALHANDO**. O teste `testar_abertura_base_baus.mjs` está falhando porque `pendingOpen` continua null após action=open; corrija isso primeiro e siga um comando/teste por vez.
```
