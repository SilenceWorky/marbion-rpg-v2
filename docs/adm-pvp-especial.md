# 🛠️ Administração especial de PvP — Marbion RPG V2

Status: planejamento registrado

## Objetivo

Criar comandos administrativos para encerrar, forçar resultados e futuramente aplicar regras especiais em batalhas de PvP sem depender de jogar turnos até a luta terminar naturalmente.

## Comandos imediatos planejados

### `!adm pvp empate`

Encerra imediatamente o PvP ativo como empate administrativo.

Regras:
- nenhum jogador recebe vitória;
- nenhum jogador recebe derrota;
- não altera XP de Combate / Elo;
- não altera streak;
- `winner = null`;
- `loser = null`;
- `draw = true`;
- `adminDraw = true`;
- `finishReason = "ADMIN_DRAW"`;
- preserva a Mentalidade restante de ambos;
- reutiliza `persistBattleMentalidade()`;
- reinicia normalmente o relógio de regeneração natural de Mentalidade fora de combate;
- libera os jogadores imediatamente para outro PvP.

Mensagem sugerida:

```txt
🛠️ ADM | PvP entre @jogador1 e @jogador2 encerrado em empate administrativo.
```

### `!adm pvp vitória @usuario`

Encerra imediatamente o PvP ativo declarando o usuário informado como vencedor administrativo.

Regras:
- o usuário precisa estar no PvP ativo;
- o outro participante vira o perdedor;
- o comando deve registrar explicitamente que o resultado foi forçado por ADM;
- por padrão, resultados administrativos NÃO devem alterar XP de Combate / Elo, streak, vitórias ou derrotas ranqueadas, para impedir manipulação acidental de ranking durante testes;
- preserva a Mentalidade restante dos dois jogadores;
- reutiliza `persistBattleMentalidade()`;
- libera ambos para novo PvP imediatamente.

Campos sugeridos:

```js
battle.status = "FINISHED";
battle.state = "FINISHED";
battle.adminResult = true;
battle.finishReason = "ADMIN_WIN";
battle.winner = usuario;
battle.loser = outroJogador;
battle.finishedAt = Date.now();
```

Mensagem sugerida:

```txt
🛠️ ADM | PvP encerrado. @usuario foi definido como vencedor administrativo.
```

## Modificadores administrativos de batalha — futuro

A arquitetura deve permitir que cada PvP tenha um objeto de regras especiais, por exemplo:

```js
battle.rules = {
  infiniteMentalidade: false,
  mentalidadeDisabled: false,
  elementalSkillsDisabled: false,
  physicalOnly: false,
  healingDisabled: false,
  controlDisabled: false,
  dotDisabled: false,
  damageMultiplier: 1,
  customLabel: null
};
```

Esses modificadores devem existir somente naquela batalha e nunca alterar permanentemente o perfil dos jogadores.

Exemplos de comandos futuros:

```txt
!adm pvp regra mentalidade infinita on
!adm pvp regra mentalidade off
!adm pvp regra fisico apenas on
!adm pvp regra elemental off
!adm pvp regra cura off
!adm pvp regra controle off
!adm pvp regra dot off
!adm pvp regra dano 2
!adm pvp regra reset
```

## Exemplos de batalhas especiais

### Mentalidade infinita

- habilidades continuam mostrando custo;
- execução não reduz Mentalidade;
- validação de custo não impede uso;
- útil para testes intensivos de habilidades.

### Sem Mentalidade

- habilidades que custam Mentalidade ficam indisponíveis;
- Soco e ações permitidas sem custo continuam funcionando;
- pode ser usado como regra temática.

### Somente físico

- habilidades elementais/mágicas não podem ser selecionadas;
- golpes físicos permanecem válidos;
- mensagem deve informar a regra especial em vez de parecer erro do sistema.

### Outras restrições futuras

A mesma base pode permitir:
- proibir cura;
- proibir Controle;
- proibir DoT;
- multiplicador de dano;
- HP inicial customizado;
- Mentalidade inicial customizada;
- turnos com limite;
- morte súbita;
- efeitos ambientais;
- regras de evento ou torneio.

## Princípio de implementação

As regras especiais devem ser snapshot da batalha e verificadas pelo `PvpCoordinator` durante seleção e execução. O perfil persistente nunca deve ser modificado apenas porque um PvP possui uma regra especial.

Resultados administrativos devem permanecer distinguíveis de resultados naturais para auditoria, testes e futuro painel de administração.
