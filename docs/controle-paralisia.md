# ⚡ Controle e Paralisia — Marbion RPG V2

Status: ✔️ validado em PvP real

## Motor genérico de Controle

O PvP da V2 possui uma base genérica para efeitos de Controle. O efeito não é tratado apenas como expiração por turno: ele registra quantas ações futuras devem ser bloqueadas.

Campos usados atualmente:

```js
{
  type: "paralisia",
  effectCategory: "control",
  source: "Raio Instantâneo",
  remainingBlocks: 1,
  appliedAtTurn: 1
}
```

Regras validadas:

- um Controle pode bloquear uma ou mais ações;
- o mesmo tipo de Controle reaplicado não cria cópias infinitas;
- reaplicação renova/reforça a quantidade de bloqueios restantes;
- Controles diferentes podem coexistir estruturalmente;
- o bloqueio só é consumido quando chega a vez real do personagem agir;
- se a ação for bloqueada, a Mentalidade da habilidade não é gasta;
- se a ação for bloqueada, uma habilidade temporária de Neutro não é consumida;
- depois do último bloqueio, o efeito é removido automaticamente.

## Regra de ordem das ações

O momento em que o Controle é aplicado importa.

### Controle aplicado antes da ação do alvo

```txt
A é mais rápido
→ A aplica Controle
→ chega a vez de B
→ B perde a ação naquele mesmo turno
```

### Controle aplicado depois da ação do alvo

```txt
B age primeiro
→ A aplica Controle depois
→ o Controle permanece ativo
→ no turno seguinte B perde a ação
```

Essa regra foi validada em testes integrados do `PvpCoordinator`.

## ⚡ Paralisia

Habilidade piloto: **Raio Instantâneo**.

Metadados do catálogo:

```json
{
  "nome": "Raio Instantâneo",
  "tipo": "Elemental",
  "elemento": "Eletricidade",
  "controlType": "paralisia",
  "controlDuration": 1
}
```

A habilidade mantém seu tipo principal como `Elemental`. O campo `controlType` adiciona o efeito de Controle.

Regras atuais:

- precisa acertar para aplicar Paralisia;
- o dano direto acontece antes da aplicação do Controle;
- se o dano direto já derrubar o alvo, não é criado um Controle inútil;
- duração piloto: 1 ação bloqueada;
- a ação bloqueada não gasta Mentalidade;
- a ação bloqueada não consome habilidade temporária;
- `!estado` mostra a Paralisia enquanto ainda houver bloqueios pendentes;
- `!ataque` informa quando a Paralisia é aplicada e quando uma ação é perdida.

Exibição validada no `!estado`:

```txt
⚡ Raio Instantâneo — 1 ação(ões) bloqueada(s)
```

Mensagem validada quando a ação é bloqueada:

```txt
⚡ @jogador tentou usar Soco, mas ficou Paralisado por Raio Instantâneo e perdeu a ação.
```

## Testes concluídos

- motor de Controle isolado ✔️
- bloqueio integrado ao PvP ✔️
- Mentalidade preservada quando a ação é bloqueada ✔️
- habilidade temporária preservada quando a ação é bloqueada ✔️
- Paralisia aplicada antes da ação bloqueia no mesmo turno ✔️
- Paralisia aplicada depois da ação permanece para o turno seguinte ✔️
- mensagem de aplicação da Paralisia ✔️
- mensagem de ação bloqueada ✔️
- exibição da Paralisia no `!estado` ✔️
- teste real na Twitch ✔️
- remoção automática após cumprir o bloqueio ✔️

## Próximo efeito de Controle

❄️ **Congelamento** deve reutilizar este mesmo motor genérico, acrescentando apenas suas regras específicas e os metadados das habilidades correspondentes.
