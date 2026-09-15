# Marbion RPG V2 — Checkpoint de transferência de chat

Data canônica: **2026-09-15**

Este arquivo existe para permitir continuar o projeto em outro chat sem perder o ponto exato. O próximo chat deve ler este documento antes de alterar código.

---

# 1. Regras de trabalho

- Repositório: `SilenceWorky/marbion-rpg-v2`.
- Branch: `main`.
- Trabalhar **um comando ou teste por vez** e esperar o resultado do usuário antes de avançar.
- O assistente pode editar o GitHub diretamente; o usuário normalmente executa `git pull --ff-only`, comandos e testes no Codespace.
- Não repetir regressões profundas já aprovadas sem motivo técnico.
- Nunca confundir **planejado**, **implementado localmente/GitHub** e **implantado em produção**.
- Nunca criar/ativar uma temporada real em produção sem autorização explícita do usuário.
- Nunca pedir/exibir tokens, secrets ou chaves.
- Nunca usar `git add .`.
- Arquivos locais protegidos que não devem ser apagados/commitados por engano:
  - `skills-v1-1500-debuff.json`
  - `skills-v1-1500-final.json`
  - `skills-v1-1500.json`
- Se aparecer `__pycache__/`, pode ser removido.

---

# 2. Infraestrutura de produção

Worker:

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

Configuração atual em `wrangler.jsonc`:
- Worker `marbion-rpg-v2`;
- `main = src/index.js`;
- cron diário `0 12 * * *` (09:00 em Fortaleza);
- KV remoto V2;
- Durable Object SQLite `PvpCoordinator`.

Conteúdo externo:

```txt
SilenceWorky/worky-live-responses
```

Arquivos relevantes:

```txt
racas.json
elementos.json
skills.json
```

V1 continua preservada e NÃO deve ser desligada enquanto sistemas legados ainda dependerem dela.

---

# 3. Estado geral do roadmap

Etapas 16–23: concluídas.

Etapa 24 — **Temporadas mensais**: **implantada em produção em 15/09/2026 e validada por smoke tests seguros**.

Etapa 25 — **Passe de Batalha da Temporada 1**: design em andamento; **nenhum código do passe foi implementado ainda**.

Etapa 26 — **snapshot/recompensas/soft reset sazonal de Elo**: pendente.

---

# 4. Etapa 24 — Temporadas: estado FINAL

A arquitetura antiga de 30 dias fixos foi substituída por calendário civil mensal.

Regras canônicas:

```txt
Timezone: America/Fortaleza (UTC-03:00)
startsAt: dia 1 às 00:00
endsAt: dia 1 do mês seguinte às 00:00
```

- atraso técnico dentro do próprio mês não prorroga a temporada;
- mês já encerrado não ativa retroativamente;
- mês sem definição/autorização não gera temporada;
- catálogo oficial pode autorizar previamente meses;
- catálogo vazio não inventa temporadas;
- definição persistida tem prioridade sobre catálogo;
- `scheduledAt` registra o momento real da persistência;
- schedule vencido é limpo para não ficar órfão;
- ativação atrasada mantém limites civis canônicos;
- falha transitória de ativação gera retry horário enquanto o mês ainda for válido;
- temporada ativa agenda seu próprio fim;
- na virada mensal, a antiga encerra antes de uma nova autorizada ativar;
- alarm de temporada compartilha o Durable Object com desafios/timeout/retries PvP sem quebrar prioridades.

Temas-base atualmente canônicos:

```txt
Agosto    — Arquivo do Infinito
Setembro  — Jardim do Criador
```

Nenhum outro tema-base deve ser tratado como oficial sem confirmação do usuário.

Comandos canônicos:

```txt
!temporada
!adm temporada definir <ano> <mês> <nome>
!adm temporada cancelar <ano> <mês>
!adm temporada encerrar
```

Bloqueados/legados:

```txt
!adm temporada iniciar ...
!adm temporada agendar ...
```

O catálogo oficial continua intencionalmente sem nomes reais de temporada aprovados. **Nenhuma temporada real foi criada ou ativada em produção.**

---

# 5. Deploy de 15/09/2026 e smoke tests de produção

O usuário autorizou explicitamente o deploy da infraestrutura da Etapa 24.

Deploy executado com:

```bash
npm run deploy
```

O deploy concluiu com sucesso, reconhecendo:
- binding `PVP_COORDINATOR`;
- binding `MARBION_USERS_V2`;
- cron `0 12 * * *`.

Smoke tests realizados depois do deploy:

### Consulta pública de temporada

```bash
curl "https://marbion-rpg-v2.wellingsonpl.workers.dev/temporada?user=silenceworky"
```

Resposta:

```txt
@silenceworky, não há temporada ranqueada cadastrada no momento.
```

Resultado: passou; deploy não criou temporada fantasma.

### Proteção da rota interna/legada

```bash
curl -i "https://marbion-rpg-v2.wellingsonpl.workers.dev/season/start"
```

Resultado:

```txt
HTTP/2 404
Marbion RPG V2 | Rota não encontrada
```

Resultado: passou; `/season/start` não está exposta publicamente.

### Ranking após deploy

```bash
curl "https://marbion-rpg-v2.wellingsonpl.workers.dev/rank?user=silenceworky"
```

Resposta validada:

```txt
⚔️ @silenceworky | Elo: Prata III | XP de Combate: 1000 | Vitórias: 10 | Derrotas: 14 | PvPs: 29 | Sequência: 2 | Melhor sequência: 2
```

### Estado do jogador após deploy

```bash
curl "https://marbion-rpg-v2.wellingsonpl.workers.dev/estado?user=silenceworky"
```

Resposta validada:

```txt
@silenceworky | ❤️ HP: 100/9999999999999 | 🧠 Mentalidade: 1049/9999999999999 | Efeitos: Nenhum
```

Resultado geral: Worker saudável e dados competitivos/perfil preservados.

O ciclo real `SCHEDULED → ACTIVE → ENDED` não foi testado em produção porque isso exigiria criar uma temporada real. Continuar respeitando a regra de autorização explícita.

---

# 6. Commits/documentação após o deploy

Documentação da Etapa 24 foi atualizada após os smoke tests.

Commits recentes importantes:

```txt
35c5a7b92b26675e71f8398a57513aae756c39db
  docs: registrar deploy da etapa 24 em produção

fadd868ae88c028dd2a75df5aab51bd3ec0e6e60
  docs: marcar etapa 24 como implantada em produção
```

Arquivos atualizados:

```txt
docs/ranking-temporadas-roadmap-2026-09-11.md
cmdrpg.md
```

Este checkpoint é o próximo commit após `fadd868`.

---

# 7. StreamElements — ponto pendente curto da Etapa 24

O backend do comando público já está implantado.

Ainda falta adicionar/confirmar a entrada no StreamElements para:

```txt
!temporada
```

Resposta sugerida do comando StreamElements:

```txt
$(customapi https://marbion-rpg-v2.wellingsonpl.workers.dev/temporada?user=$(user))
```

Os subcomandos ADM de temporada provavelmente não exigem comandos StreamElements separados se o `!adm` atual já encaminhar todos os argumentos ao Worker. Isso ainda precisa ser confirmado olhando a configuração atual do `!adm` no StreamElements.

Não bloquear a Etapa 25 por causa disso, mas não esquecer antes do uso real na Twitch.

---

# 8. Etapa 25 — Passe de Batalha: decisões JÁ CONFIRMADAS

O usuário decidiu:

1. O Passe de Batalha é **100% gratuito**.
2. Não existe trilha premium paga.
3. O passe usa exatamente o **nome da temporada anual**, e NÃO o tema-base.
   - Exemplo: temporada `Um Novo Amanhecer` → passe `Um Novo Amanhecer`.
4. O passe terá **100 patamares**. Isso está confirmado.
5. O último patamar entrega um **título exclusivo daquela temporada**.
6. Depois do patamar 100 deve existir uma progressão repetível para manter incentivo até o fim do mês.
7. Essa progressão pós-passe entrega recompensa aleatória básica, como dinheiro, XP normal do personagem, pergaminhos/itens simples etc., conforme os sistemas existirem.
8. **Inscritos/subs recebem 2x XP de Passe**.
9. O bônus de sub é sobre XP do passe; não foi definido como multiplicador de Elo, XP normal, dinheiro ou recompensas do patamar.
10. A inspiração de design principal é o passe do Brawl Stars.

Regra conceitual de sub:

```txt
jogador normal: XP do passe = 1x
SUB:            XP do passe = 2x
```

Por enquanto não foi definido bônus diferente para Prime/Tier 1/Tier 2/Tier 3. A proposta atual é qualquer sub válido = 2x.

---

# 9. Cosméticos sazonais — decisões JÁ CONFIRMADAS

O usuário quer skins/cosméticos no passe.

Cinco classes/slots definidos:

```txt
Cabelo
Acessório
Blusa
Calça
Sapato
```

`Acessório` substitui a ideia restrita de `Chapéu`, permitindo por temporada usar chapéu, pulseira, colar, óculos etc.

A ideia é que as peças sejam permanentes e possam ser combinadas futuramente entre temporadas diferentes.

Estrutura técnica sugerida para futuro:

```js
cosmetics: {
  hair: [],
  accessory: [],
  top: [],
  bottom: [],
  shoes: []
}

equippedCosmetics: {
  hair: null,
  accessory: null,
  top: null,
  bottom: null,
  shoes: null
}
```

Essa estrutura ainda NÃO foi implementada.

Distribuição proposta na tabela atual do passe:

```txt
Patamar 10  → Acessório sazonal
Patamar 25  → Sapato sazonal
Patamar 50  → Calça sazonal
Patamar 75  → Blusa sazonal
Patamar 99  → Cabelo sazonal; completa o conjunto 5/5
Patamar 100 → Título exclusivo + Baú Final (proposta)
```

O usuário gostou da ideia de dividir a skin em peças; a tabela ainda está em revisão e não deve ser tratada como congelada até ele aprovar.

---

# 10. Propostas ainda NÃO canônicas — NÃO codificar como números finais

Foi apresentada uma curva inicial de XP do passe:

```txt
Patamares 1–20   → 200 XP cada
Patamares 21–50  → 300 XP cada
Patamares 51–80  → 400 XP cada
Patamares 81–100 → 500 XP cada
Total proposto   → 35.000 XP de Passe
```

Isso ainda NÃO foi aprovado como balanceamento final.

Também foi sugerido pós-passe:

```txt
500 XP adicionais → 1 Baú Sazonal
```

A ideia da progressão repetível foi aprovada conceitualmente, mas o valor exato de `500 XP` ainda é proposta.

Foi apresentada uma tabela completa de recompensas do patamar 1 ao 100 com:
- XP normal;
- dinheiro;
- Baú Básico/Especial/Grande;
- consumíveis;
- pergaminhos;
- cosméticos nos marcos 10/25/50/75/99;
- título no 100.

Essa tabela é **rascunho para revisão**, não especificação final.

Não codificar valores de dinheiro, XP normal, baús ou chances de pergaminho antes da revisão do usuário.

---

# 11. Proposta de estrutura do passe atualmente em revisão

Marcos principais propostos:

```txt
10  → Acessório da temporada
25  → Sapato da temporada + Pergaminho aleatório
50  → Calça da temporada + Baú Grande + Pergaminho
75  → Blusa da temporada + Baú Grande
90  → Baú Grande + Pergaminho
95  → Pergaminho + Baú Especial
99  → Cabelo da temporada; conjunto completo 5/5
100 → Título exclusivo da temporada + Baú Final
```

A lógica geral sugerida foi:
- patamares comuns: recompensas pequenas;
- a cada 5: recompensa melhor;
- a cada 10: marco intermediário;
- 25/50/75/100: grandes marcos;
- 99 fecha a skin;
- 100 é o prêmio de prestígio.

Após 100:

```txt
Passe continua mostrando 100/100
→ barra separada de progresso extra
→ cada ciclo completo entrega recompensa sazonal aleatória
→ ciclo reinicia
→ continua até a temporada terminar
```

Baús pós-passe NÃO devem entregar o título ou as peças cosméticas exclusivas daquela temporada.

---

# 12. PONTO EXATO DE RETOMADA

O usuário encerrou a sessão logo após receber a primeira tabela completa dos 100 patamares.

No próximo chat/sessão, **NÃO começar a programar o passe imediatamente**.

Continuar daqui:

```txt
1. Revisar com o usuário a tabela dos 100 patamares.
2. Ajustar os marcos especiais/cosméticos/recompensas até ele aprovar.
3. Definir quais atividades dão XP de Passe.
4. Definir quanto XP cada atividade concede.
5. Só então fechar a curva de XP por patamar e o custo pós-100.
6. Depois desenhar o modelo de dados e começar a implementação da Etapa 25.
```

A próxima pergunta útil é pedir ao usuário as alterações que ele quer fazer na tabela de 1–100, especialmente nos patamares especiais.

Não tratar `35.000 XP`, `500 XP pós-passe`, valores de recompensas ou conteúdo exato dos baús como finais enquanto ele não confirmar.

---

# 13. Regra operacional crítica

**Nenhuma temporada real deve ser criada/ativada em produção sem autorização explícita do usuário.**

O Passe de Batalha pode ser desenvolvido e testado localmente com fixtures/mocks sem criar temporada real.

Quando chegar a fase de integração em produção, manter a mesma disciplina usada na Etapa 24: deploy controlado, smoke tests seguros e uma ação por vez.
