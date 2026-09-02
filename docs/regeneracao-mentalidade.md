# 🧠 Regeneração natural de Mentalidade — Marbion RPG V2

Status: ✔️ implementado, testado localmente e validado em produção

## Regra atual

- recupera `+1` de Mentalidade a cada 5 minutos completos fora de combate;
- nunca ultrapassa `maxMentalidade`;
- vários intervalos completos offline são somados de uma vez;
- frações de intervalo são preservadas;
- enquanto a Mentalidade está cheia, não são acumulados créditos de regeneração;
- perfis antigos sem timestamp válido iniciam o relógio sem receber regeneração retroativa indevida.

## Relação com PvP

- antes de iniciar um PvP, a regeneração acumulada fora de combate é aplicada ao perfil;
- a batalha começa com a Mentalidade real do perfil, e não automaticamente cheia;
- durante o PvP não existe regeneração natural por tempo;
- ao terminar o PvP, a Mentalidade restante na batalha é persistida no perfil;
- o relógio de regeneração fora de combate recomeça no instante em que a luta termina;
- resultados administrativos de PvP usam a mesma persistência de Mentalidade.

## `!estado`

Fora do PvP, `!estado` aplica a regeneração natural pendente, salva o perfil e mostra o valor atualizado.

Durante o PvP, `!estado` lê exclusivamente a Mentalidade viva armazenada no Durable Object e não altera o perfil persistente.

## Validações locais

Foram validados:

- perfil antigo sem regeneração retroativa;
- intervalo incompleto;
- um intervalo completo;
- múltiplos intervalos;
- limite de `maxMentalidade`;
- ausência de crédito acumulado enquanto cheio;
- preservação de fração de tempo;
- regeneração antes do PvP;
- persistência ao terminar o PvP;
- `!estado` fora do PvP;
- ausência de regeneração durante PvP;
- ciclo completo fim de PvP → tempo fora de combate → novo PvP.

## Validação real em produção

Teste real realizado com `@SilenceWorky`:

```txt
PvP iniciado com Mentalidade real: 6/50
→ !adm pvp empate
→ PvP encerrado preservando 6/50
→ 21:39: !estado = 6/50
→ 21:44: !estado = 7/50
```

O intervalo real de 5 minutos recuperou exatamente `+1`, confirmando o funcionamento em produção.

## Arquivos principais

```txt
src/systems/mentalidade-regen.js
src/durable/PvpCoordinator.js
src/routes/estado.js
testar_regen_mentalidade.mjs
testar_regen_mentalidade_pvp.mjs
testar_ciclo_regen_mentalidade_pvp.mjs
```
