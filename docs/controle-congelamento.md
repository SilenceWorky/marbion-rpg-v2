# ❄️ Congelamento — Marbion RPG V2

Status: ✔️ validado em PvP real

## Visão geral

Congelamento é a segunda implementação real do motor genérico de Controle da V2, reutilizando a mesma infraestrutura validada com Paralisia.

O efeito bloqueia ações futuras por meio de `remainingBlocks`, em vez de depender apenas de expiração por turno.

## Habilidade piloto

Habilidade usada para validação: **Lança Glaciar**.

Metadados no catálogo `worky-live-responses/skills.json`:

```json
{
  "nome": "Lança Glaciar",
  "tipo": "Elemental",
  "elemento": "Gelo",
  "controlType": "congelamento",
  "controlDuration": 1
}
```

A habilidade continua sendo `Elemental`; `controlType` adiciona o efeito de Controle.

## Regras atuais

- a habilidade precisa acertar para aplicar Congelamento;
- o dano direto acontece antes da aplicação do Controle;
- se o dano direto já derrubar o alvo, o Congelamento não é criado;
- duração piloto: 1 ação bloqueada;
- se o alvo ainda não agiu no turno, perde a ação daquele mesmo turno;
- se o alvo já agiu, o Congelamento permanece ativo e bloqueia sua próxima ação;
- uma ação bloqueada não gasta Mentalidade;
- uma habilidade temporária não é consumida se for impedida pelo Controle;
- depois de cumprir o último bloqueio, o efeito é removido automaticamente;
- `!ataque` informa aplicação e bloqueio;
- `!estado` mostra o Congelamento enquanto houver bloqueios pendentes.

## Estado interno

Exemplo de efeito ativo:

```js
{
  type: "congelamento",
  effectCategory: "control",
  source: "Lança Glaciar",
  remainingBlocks: 1,
  appliedAtTurn: 2
}
```

## Exibição no chat

Aplicação:

```txt
❄️ @jogador ficou Congelado e perderá 1 ação(ões).
```

Ação bloqueada:

```txt
❄️ @jogador tentou usar Soco, mas ficou Congelado por Lança Glaciar e perdeu a ação.
```

`!estado`:

```txt
❄️ Lança Glaciar — 1 ação(ões) bloqueada(s)
```

## Testes concluídos

- teste integrado com Lança Glaciar real do catálogo ✔️
- Congelamento aplicado antes da ação bloqueia no mesmo turno ✔️
- Congelamento aplicado depois da ação permanece para o turno seguinte ✔️
- Mentalidade preservada quando a ação é bloqueada ✔️
- remoção automática após cumprir o bloqueio ✔️
- mensagem de aplicação do Congelamento ✔️
- mensagem de ação bloqueada ✔️
- exibição no `!estado` ✔️
- teste real na Twitch com bloqueio no mesmo turno ✔️
- teste real na Twitch com efeito persistente para o turno seguinte ✔️
- teste real na Twitch com consumo do bloqueio no turno seguinte ✔️
- `!estado` retorna `Efeitos: Nenhum` após o bloqueio ser consumido ✔️

## Validação final em produção

Fluxo confirmado na Twitch:

```txt
T3: alvo ainda estava Congelado
→ alvo tentou usar Soco
→ ação foi bloqueada por Lança Glaciar
→ Turno 4 iniciou
→ !estado: Efeitos: Nenhum
```

Esse teste fecha o ciclo completo de Congelamento em produção: aplicação, persistência, bloqueio posterior e remoção automática.

## Relação com o motor de Controle

Atualmente o motor genérico possui duas implementações validadas em produção:

```txt
⚡ Paralisia
❄️ Congelamento
```

Ambas usam o mesmo mecanismo de bloqueio de ações, preservação de Mentalidade e consumo somente quando a ação realmente executa.
