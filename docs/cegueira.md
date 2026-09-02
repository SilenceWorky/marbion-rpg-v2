# 🌑 Cegueira — PvP

Status: ✔️ implementado e validado em produção na Twitch.

## Regra atual

A Cegueira é um debuff especial de Precisão.

- reduz 20 de Precisão;
- dura 2 ações/turnos efetivos do alvo;
- não acumula consigo mesma;
- reaplicar renova a duração;
- ao expirar, devolve exatamente a Precisão retirada;
- se o golpe errar, a Cegueira não é aplicada.

## Habilidade piloto

`Sombra:Veu_Ascendente` — **Véu Ascendente**

Metadados usados no catálogo:

```json
{
  "debuffType": "cegueira",
  "debuffStat": "accuracy",
  "debuffAmount": 20,
  "debuffDuration": 2
}
```

## Semântica de duração

A duração foi corrigida para não depender da ordem de Velocidade.

### Cegueira aplicada antes da ação do alvo

- T1: alvo já fica afetado;
- T2: continua afetado;
- T3: efeito expira e Precisão é restaurada.

### Cegueira aplicada depois da ação do alvo

- T1: alvo já agiu antes de ficar cego;
- T2: primeiro turno efetivamente afetado;
- T3: segundo turno efetivamente afetado;
- T4: efeito expira e Precisão é restaurada.

## Validação real na Twitch

Cenário validado com o alvo mais rápido e agindo antes do Véu Ascendente:

```txt
T1: Véu Ascendente acerta depois da ação do alvo
    → Cego: Precisão -20 por 2 turnos

T2: !estado
    → Véu Ascendente — Precisão -20 (2T)

T3: !estado
    → Véu Ascendente — Precisão -20 (1T)

T4: !estado
    → Efeitos: Nenhum
```

Resultado: ✔️ duração independente da ordem, exibição em `!estado` e expiração validadas em produção.
