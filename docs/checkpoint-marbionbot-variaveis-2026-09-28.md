# Checkpoint — MarbionBot / Motor de Variáveis e Comandos Gerais — 28/09/2026

Este checkpoint registra decisões de arquitetura para implementar futuramente comandos gerais do MarbionBot, separados da lógica do RPG.

## Prioridade atual

Não interromper o fechamento do Baú Sazonal para implementar este bloco agora.

Ordem definida:
1. terminar Relíquia / Item Especial Sazonal;
2. finalizar e validar o Baú Sazonal;
3. liberar/configurar o comando público `!baú`;
4. depois iniciar o motor geral de variáveis/comandos do MarbionBot.

O MarbionBot não será apenas um bot de RPG. Ele também poderá substituir gradualmente funções de bots como StreamElements/Nightbot, com comandos informativos, utilitários e de brincadeira.

## Conceito central

Comandos personalizados não devem precisar de código próprio para cada função simples.

Exemplo:
```txt
!jogo
Resposta: {user}, o jogo atual é {game}
```

O MarbionBot deve interpretar as variáveis do template e substituir pelos valores reais.

Arquitetura desejada:
```txt
Mensagem da Twitch
    ↓
MarbionBot
    ↓
Comando personalizado
    ↓
Template
    ↓
Variable Engine
    ├─ usuário
    ├─ canal/live
    ├─ Twitch API
    ├─ aleatoriedade
    ├─ contadores
    ├─ banco do bot
    └─ RPG/Marbion quando aplicável
    ↓
Resposta no chat
```

## Sintaxe principal

A sintaxe principal do MarbionBot será simples, usando chaves:

```txt
{user}
{target}
{game}
{title}
{uptime}
```

Pode ser considerada compatibilidade futura com aliases no estilo:
```txt
$(game)
${game}
```

mas a interface principal do MarbionBot deve mostrar a sintaxe com `{}`.

## Variáveis iniciais planejadas

### Usuário
```txt
{user}          usuário que executou o comando
{target}        usuário citado/alvo do comando
{accountage}    idade da conta Twitch
{followage}     há quanto tempo segue o canal
{watchtime}     tempo assistido, se houver base própria
{lastseen}      última atividade conhecida, se houver base própria
```

### Canal / transmissão
```txt
{channel}       canal atual
{game}          categoria/jogo atual
{title}         título atual da live
{uptime}        duração da live atual
{downtime}      tempo offline, se implementado
{viewers}       espectadores atuais
{followers}     total de seguidores
{subs}          total de inscritos quando a API/permissão permitir
```

### Argumentos
```txt
{args}          todos os argumentos
{arg:1}         primeiro argumento
{arg:2}         segundo argumento
```

### Aleatoriedade
```txt
{random:1:100}              número aleatório no intervalo
{choice:Sim|Não|Talvez}     escolhe uma opção
{random_user}               usuário aleatório elegível do chat
{random_emote}              emote aleatório, se houver suporte
```

### Utilidades futuras
```txt
{time}
{count:nome}
{quote}
{countdown:data}
{countup:data}
```

### Variáveis administrativas/sensíveis
Podem existir futuramente, mas precisam de permissões fortes:
```txt
{setgame:...}
{settitle:...}
{api:...}
```

Nunca permitir que um viewer comum altere título/categoria ou faça chamadas arbitrárias de API.

## Painel do site

Criar uma aba/seção chamada algo como `Variáveis`.

Ela deve listar TODAS as variáveis disponíveis, agrupadas por categoria, com:
- nome/token;
- descrição;
- exemplo;
- requisitos;
- cooldown especial, quando houver;
- permissões necessárias;
- botão para copiar/inserir no template.

Objetivo: o usuário não deve precisar pesquisar externamente para descobrir recursos ocultos.

Exemplo:
```txt
📺 Transmissão

{game}
Mostra a categoria/jogo atual.
Exemplo:
"{channel} está jogando {game}"
```

## Comandos opcionais/templates

Comandos como estes NÃO precisam ser comandos base obrigatórios:
```txt
!jogo
!followage
!uptime
!sorte
!8ball
!futuro
!previsão
```

O painel poderá oferecer modelos opcionais para o streamer adicionar/remover.

Exemplo:
```txt
!jogo
Resposta: 🎮 {channel} está jogando {game}
```

## Regra canônica de {futuro}

`{futuro}` é uma variável especial de diversão.

Ela sorteia uma mensagem em um banco grande de previsões.

Exemplos de templates:
```txt
!futuro
{user}, eu vejo que {futuro}
```

```txt
!previsão
🔮 A previsão de {user}: {futuro}
```

Os comandos são diferentes, mas o recurso utilizado é o mesmo: `{futuro}`.

### Cooldown especial

O cooldown de 24 horas pertence à VARIÁVEL `{futuro}`, não ao nome do comando.

Portanto:
- usuário usa `!futuro` e recebe uma previsão;
- 5 minutos depois usa `!previsão`;
- como ambos usam `{futuro}`, o segundo uso deve ser bloqueado;
- trocar o nome do comando não contorna o cooldown.

Duração:
```txt
24 horas = 86.400 segundos
```

Escopo planejado:
```txt
usuário + canal + variável "future"
```

Chave conceitual:
```txt
variableCooldown:<channelId>:<userId>:future
```

O cooldown normal configurável do comando continua separado.

Exemplo:
```txt
!futuro
cooldown do comando: 30s

{futuro}
cooldown interno da variável: 24h
```

O cooldown interno de `{futuro}` não deve poder ser reduzido por um comando personalizado comum.

### Quando estiver em cooldown

Não deixar o token cru aparecer.

Resposta esperada, por exemplo:
```txt
🔮 @Usuario, você já consultou seu futuro. Tente novamente em 17h 32min.
```

### Banco de previsões

Não colocar centenas/milhares de frases diretamente dentro do comando.

Criar um banco próprio de previsões.

Estrutura conceitual:
```js
{
  id: "future_000184",
  text: "você encontrará algo inesperado onde menos espera.",
  active: true,
  weight: 1,
  category: "normal"
}
```

Pode haver categorias/raridades futuramente, se desejado.

Também é desejável anti-repetição:
- evitar devolver a mesma previsão ao mesmo usuário em usos consecutivos;
- manter pequeno histórico recente por usuário quando viável.

## Princípio importante

A funcionalidade verdadeira é a variável, não o comando.

`!futuro`, `!previsão`, `!oraculo`, etc. são apenas comandos personalizados que podem apontar para `{futuro}`.

Da mesma forma:
- `{game}` deve funcionar em qualquer comando;
- `{followage}` deve funcionar em qualquer comando;
- `{random:1:100}` deve funcionar em qualquer comando.

## Próximo passo quando este bloco for retomado

Quando o Baú Sazonal estiver fechado e o `!baú` estiver pronto:

1. criar o núcleo do Variable Engine;
2. implementar primeiro variáveis locais simples:
   - `{user}`
   - `{target}`
   - `{args}`
   - `{arg:N}`
   - `{random:min:max}`
   - `{choice:...}`
3. adicionar variáveis de Twitch:
   - `{channel}`
   - `{game}`
   - `{title}`
   - `{uptime}`
   - `{followage}`
   - `{accountage}`
4. criar infraestrutura de cooldown por variável;
5. implementar `{futuro}` com cooldown de 24h compartilhado;
6. criar banco de previsões;
7. criar a aba `Variáveis` no site;
8. depois ampliar o catálogo de variáveis e templates opcionais.

Não misturar esse bloco com lógica do RPG enquanto a Etapa 25 ainda estiver sendo fechada.
