# Marbion RPG V2 / MarbionBot — Checkpoint de transferência

Data canônica: **2026-09-18**

Este documento foi criado para iniciar um novo chat dedicado ao **MarbionBot**, sem perder o estado do RPG V2. O novo chat deve ler este arquivo antes de tomar decisões técnicas.

---

# 1. Separação dos trabalhos a partir de agora

A partir deste checkpoint, existem dois fluxos separados:

## Chat do RPG V2
Continua responsável por:
- mecânicas do RPG;
- comandos;
- rotas do Worker;
- sistemas de perfil;
- PvP;
- temporadas;
- passe;
- economia;
- baús;
- habilidades;
- inventários;
- testes do backend;
- deploy do código do RPG.

## Novo chat do MarbionBot
Será responsável por:
- criar o bot da Twitch chamado **MarbionBot**;
- autenticação/login do bot na Twitch;
- conexão ao chat;
- leitura de mensagens/comandos;
- envio de respostas no chat;
- substituir o papel atual do StreamElements;
- integração do bot com o backend Marbion RPG V2;
- reconexão, rate limits, logs e operação do bot;
- futuramente outras funções técnicas próprias do bot.

Regra arquitetural importante:
**o MarbionBot não deve duplicar a lógica do RPG.**
A lógica principal continua no Worker/backend. O bot deve ser, sempre que possível, a camada de transporte/integração entre Twitch e o backend.

Conta Twitch já criada pelo usuário:

```txt
MarbionBot
```

---

# 2. Situação do Codespaces

Em 2026-09-18 o usuário atingiu **100% da franquia mensal de GitHub Codespaces**.

O GitHub informou que a franquia será renovada em:

```txt
2026-10-01
```

Por isso, o desenvolvimento que dependa do Codespace ficará pausado até a renovação ou até o usuário optar por outro ambiente local.

GitHub continua sendo a fonte canônica do código.

---

# 3. Repositório e estado exato

Repositório:

```txt
SilenceWorky/marbion-rpg-v2
```

Branch:

```txt
main
```

HEAD do GitHub no momento deste checkpoint:

```txt
5fde1aeb8dbb95402cc736dc099c127f1301d16b
```

Commit:

```txt
5fde1ae — feat: adicionar inventario base de pergaminhos
```

IMPORTANTE:
- o commit `5fde1ae` foi criado no GitHub;
- o usuário ainda **não confirmou um git pull desse commit**, porque o Codespaces ficou indisponível;
- o último HEAD local confirmado antes disso era `1e944ff`;
- portanto, ao retomar o Codespace, primeiro conferir `git status` e então sincronizar com `git pull --ff-only` se estiver limpo.

O bloco de inventário de pergaminhos em `5fde1ae` ainda está **sem teste local confirmado**.

Teste pendente correspondente:

```bash
node testar_inventario_pergaminhos.mjs
```

Saída esperada:

```txt
✅ Inventário base de Pergaminhos validado.
```

---

# 4. Regras de trabalho do projeto

- trabalhar de forma extremamente incremental;
- **um comando ou teste por mensagem**;
- esperar a saída exata do usuário antes de avançar;
- não repetir regressões profundas sem motivo técnico;
- nunca usar `git add .`;
- nunca pedir ou expor tokens, OAuth secrets, client secrets ou chaves;
- nunca commitar segredos;
- distinguir sempre:
  - planejado;
  - implementado no GitHub;
  - validado localmente;
  - implantado em produção;
- não criar/ativar temporada real sem autorização explícita;
- não desligar infraestrutura V1 até todas as dependências terem sido migradas.

Arquivos locais protegidos:

```txt
skills-v1-1500-debuff.json
skills-v1-1500-final.json
skills-v1-1500.json
```

---

# 5. Infraestrutura do RPG V2

Worker de produção:

```txt
https://marbion-rpg-v2.wellingsonpl.workers.dev
```

KV:

```txt
Binding: MARBION_USERS_V2
Namespace: 3731c622c6764dbc9025cef56030c23e
```

Durable Object:

```txt
Binding: PVP_COORDINATOR
Classe: PvpCoordinator
Instância global: marbion-global-pvp
```

Conteúdo externo:

```txt
SilenceWorky/worky-live-responses
```

Arquivos externos principais:

```txt
racas.json
elementos.json
skills.json
```

Stack atual do RPG:
- Cloudflare Workers;
- Wrangler v4;
- KV;
- Durable Objects;
- StreamElements como ponte atual com Twitch.

Objetivo da nova etapa:
**retirar o StreamElements da função de ponte e substituir pelo MarbionBot.**

---

# 6. Infraestrutura V1 ainda preservada

Worker antigo:

```txt
https://marbion-race-api.wellingsonpl.workers.dev/
```

Binding/KV antigo:

```txt
MARBION_USERS
```

A V1 ainda não deve ser apagada.

Spawn automático antigo:
- controlado no `scheduled()` do Worker V1;
- Cron Trigger Cloudflare;
- chave KV `__mob_spawn_enabled__`;
- `/moboff` grava `"false"`;
- `/mobon` grava `"true"`.

---

# 7. Roadmap — estado geral

```txt
Etapas 1–23  concluídas
Etapa 24     Temporadas — concluída e implantada
Etapa 25     Passe / Economia / Banco / Baús — em implementação
Etapa 26     Fechamento sazonal / snapshot / rewards / soft reset — pendente
Etapa 27     Missões Diárias — futura
Etapa 28     Mercador — futura
Etapa 29     Marketplace — futura
Etapa 30     Cristais de Mentalidade — futura
Etapa 31     Onboarding — futura
Etapa 32     Status/poderes de raça — futura
Etapa 33     aliases em inglês — futura
```

---

# 8. PvP já concluído

Já existem:
- fila global;
- Ranking Dinâmico V2;
- anti-farm de 24h;
- `!recusar`;
- `!desistir`;
- timeout/AFK;
- resolução de combate;
- Elo;
- rank;
- cooldown;
- crítico;
- combinações elementais;
- Counter;
- Reflect;
- Mentalidade;
- regeneração.

Ranking:
```txt
D(R)=clamp(1+0.8*((R-1000)/1700),1.0,2.2)
winBase=30/D(R)
lossBase=30*D(R)
cap vitória +75
cap derrota normal -150
cap desistência -300
mínimo 0
Prodígios = top 7 elegíveis em 2700+
```

Cooldown canônico:
```txt
availableAtTurn = executedTurn + cooldown + 1
```

---

# 9. Temporadas

Calendário civil.

Timezone:

```txt
America/Fortaleza
UTC-03:00
```

Início:
```txt
dia 1 00:00
```

Fim:
```txt
dia 1 do mês seguinte 00:00
```

Temas-base já confirmados:
```txt
Agosto    — Arquivo do Infinito
Setembro  — Jardim do Criador
```

Comandos:
```txt
!temporada
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

Nenhuma temporada real foi criada automaticamente durante os trabalhos recentes.

---

# 10. Passe de Temporada

Passe gratuito, sem premium.

Regras:
- 100 patamares;
- 53.250 XP total;
- 550 XP pós-100 = 1 Baú Sazonal;
- SUB recebe 2x XP do Passe;
- tier 100 entrega título anual único;
- após tier 100 interface continua 100/100;
- excesso pós-passe acumula;
- passe reseta com a temporada.

Arquivos:
```txt
src/systems/season-pass-progression.js
src/systems/season-pass-state.js
src/config/season-pass-rewards.js
src/systems/season-pass-rewards-state.js
```

---

# 11. Economia e Banco

Conversão:

```txt
10 Bronze = 1 Prata
10 Prata  = 1 Ouro
10 Ouro   = 1 Platina
```

Regra geral:
- ganhos normais não se convertem automaticamente;
- banco pode fundir e separar moedas;
- transações podem usar equivalente em Bronze e gerar troco canônico.

Exceção:
**recompensas monetárias do Baú Atômico são convertidas automaticamente para denominações canônicas antes de serem adicionadas ao perfil.**

Exemplos:
```txt
18 B-eq  = 1 Prata + 8 Bronze
36 B-eq  = 3 Prata + 6 Bronze
72 B-eq  = 7 Prata + 2 Bronze
144 B-eq = 1 Ouro + 4 Prata + 4 Bronze
```

---

# 12. Pix

Implementado como:
**saga distribuída, idempotente e retomável**.

Não descrever como ACID cross-DO.

Fluxo:
```txt
criar pendente
confirmar
debit side
credit side
finalize side
```

TTL:
```txt
2 minutos para iniciar
```

Se o débito já ocorreu, retry pode completar depois do TTL.

Comandos:
```txt
!banco pix <quantidade> <moeda> @usuario
!confirmar
!banco confirmar
!banco cancelar
```

---

# 13. Baús — tipos e seleção

Tipos:
```txt
Baú Atômico
Baú Sazonal
Baú de Monstro
Baú de Boss
Baú ADM
```

Ordem fixa da listagem:
```txt
1 Atômico
2 Sazonal
3 Monstro
4 Boss
5 ADM
```

Cada baú é instância individual.
A interface agrupa por tipo.
Ao abrir um grupo, seleção da instância é FIFO.

Rotas:
```txt
/bau
/baú
```

Comando:
```txt
!baú abrir <número>
```

---

# 14. Baú Atômico — mecânica

Tentativas 1 e 2:
```txt
35% = nada
```

Tentativa 3:
```txt
obrigatoriamente abre ou evolui
```

Evoluções:
```txt
⚛ → ⚛⚛             50%
⚛⚛ → ⚛⚛⚛           25%
⚛⚛⚛ → ⚛⚛⚛⚛         10%
⚛⚛⚛⚛ → ⚛⚛⚛⚛⚛       1%
```

Chance natural de chegar a cinco átomos:
```txt
0,0125% = 1/8000
```

Ao evoluir, tentativas do nível resetam.

`minimumOpenAtoms` pode impedir abertura abaixo de um piso.

---

# 15. Baú Atômico — XP e dinheiro

XP:
```txt
⚛           1–23
⚛⚛         11–46
⚛⚛⚛       23–92
⚛⚛⚛⚛     46–184
⚛⚛⚛⚛⚛   92–368
```

Dinheiro em equivalente Bronze:
```txt
⚛           1–9
⚛⚛          4–18
⚛⚛⚛         9–36
⚛⚛⚛⚛      18–72
⚛⚛⚛⚛⚛    36–144
```

Baú de 1 átomo:
```txt
50% XP
50% dinheiro
```

De 2 átomos em diante:
```txt
XP + dinheiro simultaneamente
```

---

# 16. Baú Atômico — catálogo estrutural

⚛:
- XP OU dinheiro;
- 20% consumível.

⚛⚛:
- XP + dinheiro;
- 30% consumível;
- 8% Pergaminho R1 compatível.

⚛⚛⚛:
- XP + dinheiro;
- 1 consumível garantido;
- 25% Pergaminho R1/R2, pesos 70/30;
- 20% segundo consumível.

⚛⚛⚛⚛:
- XP + dinheiro;
- Pergaminho compatível garantido;
- R2 75%, R3 20%, R4 5%;
- 30% bônus com pool ainda não definido.

⚛⚛⚛⚛⚛:
- XP + dinheiro;
- nova habilidade elemental compatível garantida;
- se pool esgotado: 75% 1 Platina / 25% 2 Platinas;
- 40% Pergaminho R3/R4/R5, pesos 75/20/5;
- 20% bônus com pool ainda não definido.

Ainda não inventar os pools de bônus IV/V.

---

# 17. Abertura segura / idempotência do Baú Atômico

Foi implementado `pendingOpen`.

Quando o baú abre:
1. resultado da abertura é persistido;
2. plano de recompensas é sorteado uma única vez;
3. plano fica congelado dentro de `pendingOpen.rewardPlan`;
4. retry reutiliza exatamente o mesmo plano;
5. XP e dinheiro já resolvidos podem ser aplicados idempotentemente;
6. `appliedRewardIndexes` impede duplicação.

O baú ainda **não deve ser removido** enquanto existirem recompensas não resolvidas/não entregues.

Arquivos importantes:
```txt
src/systems/atomic-chest-state.js
src/systems/atomic-chest-mechanic.js
src/systems/chest-open-service.js
src/systems/atomic-chest-reward-plan.js
src/systems/atomic-chest-reward-apply.js
src/routes/chest.js
```

Testes confirmados:
```txt
✅ Serviço base de abertura dos Baús validado.
✅ Plano de recompensas do Baú Atômico validado.
✅ Aplicação idempotente das recompensas resolvidas do Baú Atômico validada.
✅ Comando !baú abrir com persistência base validado.
```

---

# 18. Raridades canônicas de habilidades

Escala oficial:

```txt
Comum
Raro
Super Raro
Mítico
Lendário
Único
```

Pergaminhos:
```txt
R1 = Comum
R2 = Raro
R3 = Super Raro
R4 = Mítico
R5 = Lendário
```

`Único` fica fora da escala normal R1–R5.

Arquivo:
```txt
src/config/skill-rarities.js
```

Teste:
```txt
✅ Escala canônica de raridades e Pergaminhos R1–R5 validada.
```

Observação:
o `skills.json` externo ainda contém nomes antigos como `Incomum`, `Muito Raro` e `Especial`.
A migração completa desse catálogo ainda não foi executada neste checkpoint.

---

# 19. Pergaminhos — compatibilidade e sorteio

O sistema já consegue selecionar uma habilidade compatível para R1–R5.

Regras:
- não selecionar habilidade já possuída;
- respeitar elemento nativo;
- respeitar elementos de fusão;
- respeitar afinidades de pergaminho;
- Universal permitido;
- personagem Neutro pode aprender por pergaminho habilidade de qualquer elemento;
- `Único` não entra em R1–R5;
- pool vazio retorna `SCROLL_REWARD_POOL_EXHAUSTED`.

Arquivos:
```txt
src/systems/element-compatibility.js
src/systems/scroll-reward-selector.js
```

Teste:
```txt
✅ Sorteio de habilidade compatível para Pergaminhos R1–R5 validado.
```

---

# 20. Pergaminho dentro do Baú Atômico

Já existe resolução congelada do pergaminho.

Arquivo:
```txt
src/systems/atomic-chest-scroll-resolver.js
```

Quando um reward do tipo `scroll` é resolvido, ficam congelados:
- tier;
- raridade;
- habilidade exata;
- ID;
- elemento.

Retry não rerrola.

Falha por pool esgotado não deve deixar outros pergaminhos parcialmente resolvidos.

Teste:
```txt
✅ Resolução congelada de Pergaminhos do Baú Atômico validada.
```

Commit:
```txt
1e944ff — feat: resolver pergaminhos do bau atomico
```

---

# 21. PONTO EXATO DO RPG AO PAUSAR

Commit no GitHub:
```txt
5fde1ae — feat: adicionar inventario base de pergaminhos
```

Esse commit adiciona:
```txt
src/systems/scroll-inventory.js
testar_inventario_pergaminhos.mjs
alterações em src/core/profile.js
```

Novo formato base:
```js
inventory: {
  scrolls: [],
  scrollSequence: 0
}
```

O sistema pretende suportar:
- pergaminhos como itens individuais;
- ID `scroll:N`;
- tier R1–R5;
- habilidade exata armazenada no pergaminho;
- source;
- createdAt;
- busca por ID;
- remoção por ID;
- compatibilidade com perfis antigos.

**Esse bloco ainda não foi validado localmente porque o Codespaces esgotou a franquia antes do pull/teste.**

Ao retomar o RPG:
1. conferir estado local;
2. sincronizar `main`;
3. executar somente:
```bash
node testar_inventario_pergaminhos.mjs
```
4. só avançar se passar.

Depois disso, o passo lógico será integrar o pergaminho resolvido do Baú Atômico ao inventário, preservando idempotência, sem ensinar a habilidade automaticamente.

---

# 22. Consumíveis e recompensas ainda pendentes

Ainda não existe definição final suficiente para:
- inventário de consumíveis;
- catálogo de consumíveis do Baú Atômico;
- pool bônus de ⚛⚛⚛⚛;
- pool bônus de ⚛⚛⚛⚛⚛;
- entrega final da nova habilidade elemental do estágio V;
- fallback completo/entrega quando pool de habilidade V esgota;
- consumo definitivo do baú após todas as recompensas.

Não inventar essas regras sem decisão do usuário.

---

# 23. Estado de produção

Etapa 24 está implantada.

As mudanças recentes da Etapa 25 descritas neste documento estão no GitHub e foram em grande parte validadas localmente, mas **não devem ser descritas como implantadas em produção** sem um deploy explícito confirmado.

Nenhum deploy da Etapa 25 recente foi autorizado/confirmado neste fluxo.

---

# 24. MarbionBot — objetivo da nova conversa

Nome da conta Twitch:
```txt
MarbionBot
```

Objetivo:
**substituir StreamElements como bot/intermediário dos comandos do RPG na Twitch.**

Princípio inicial recomendado:
```txt
Twitch chat
    ↓
MarbionBot
    ↓
Worker/API Marbion RPG V2
    ↓
resposta
    ↓
MarbionBot envia ao chat
```

Assim:
- o bot não precisa reimplementar PvP, banco, baús etc.;
- comandos continuam centralizados no backend;
- o bot controla autenticação Twitch, parsing básico, chamadas HTTP, resposta, cooldown técnico, logs e reconexão;
- migração pode ser gradual, comando por comando, sem quebrar StreamElements imediatamente.

Não desligar StreamElements antes de o MarbionBot estar funcional e os comandos essenciais terem sido validados.

---

# 25. Primeira tarefa sugerida do novo chat do MarbionBot

O novo chat deve começar pelo **desenho da arquitetura e autenticação**, antes de codificar tudo de uma vez.

Primeiro bloco:
1. decidir runtime/localização do bot;
2. decidir biblioteca/API Twitch;
3. configurar app Twitch/OAuth de forma segura;
4. conectar `MarbionBot` a um canal de teste;
5. fazer apenas um teste simples de leitura e resposta;
6. depois criar a camada genérica que chama as rotas do Worker.

Nunca colocar token OAuth em código ou GitHub.

---

# 26. Prompt curto para abrir o novo chat

Copiar e enviar:

```txt
Vamos iniciar a nova etapa do projeto Marbion: o MarbionBot, que vai substituir o StreamElements como bot da Twitch. Leia no GitHub do repositório SilenceWorky/marbion-rpg-v2 o arquivo docs/checkpoint-transferencia-bot-2026-09-18.md e siga exatamente o estado, as separações e o ponto de partida descritos nele. Neste chat vamos trabalhar no bot, não reimplementar a lógica do RPG.
```

---

# 27. Regra final de continuidade

Para o novo chat:
- bot = integração Twitch/infraestrutura técnica;
- RPG = lógica do jogo permanece no backend;
- começar simples;
- um passo por vez;
- preservar compatibilidade;
- não apagar StreamElements/V1 prematuramente;
- nunca expor secrets;
- não assumir que qualquer mudança recente da Etapa 25 já está em produção.
