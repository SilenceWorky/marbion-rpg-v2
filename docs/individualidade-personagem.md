# Individualidade do personagem

Status: conceito registrado; implementação futura planejada.

## Objetivo

Dar identidade própria ao personagem de cada perfil, separando o personagem do nome da conta da Twitch e preparando o RPG para o futuro sistema Multistreamer/site.

## Nome

- Cada perfil terá um nome de personagem.
- O jogador poderá escolher o nome por comando, por exemplo `!nome <nome>`.
- O nome da Twitch continua sendo a identidade da conta; o nome escolhido é do personagem do RPG.
- Regras de troca, cooldown e moderação de nome serão definidas quando o sistema for implementado.

## Gênero

- O gênero não será escolhido manualmente pelo jogador.
- Será definido quando o personagem nascer/for criado.
- A distribuição e opções exatas serão definidas antes da implementação.

## Idade inicial

- Personagens novos começam normalmente com 14 ou 15 anos.
- A idade não sobe simplesmente a cada nível.
- O envelhecimento será resultado de múltiplos fatores de atividade/progressão.

Possíveis fatores futuros:
- experiência adquirida;
- níveis;
- tempo ativo no RPG;
- participação/tempo assistindo lives;
- eventos e progressão de mundo.

## Raça e longevidade

Cada raça poderá possuir uma longevidade diferente.

Exemplos conceituais registrados:
- Shinigamis: imortais por idade;
- Demônios: imortais por idade;
- Vampiros: imortais por idade;
- Metamorfos: expectativa de vida relativamente próxima de 100-150 anos;
- Bruxas: expectativa de vida relativamente próxima de 100-150 anos.

Os valores definitivos de todas as raças serão definidos posteriormente.

## Morte por idade

Não implementar por enquanto.

A idade deve inicialmente servir para identidade, progressão e títulos, sem matar automaticamente personagens antigos.

Isso evita punir jogadores de longo prazo apenas por permanecerem ativos.

## Títulos por idade

O sistema de idade poderá alimentar Títulos.

Exemplo:
- personagem com mais de 100 anos -> título potencial `Ancião`.

Os títulos poderão posteriormente considerar também raça, feitos, PvP, PvE, eventos, profissão e outras conquistas.

## Ordem recomendada de implementação

### Fase A — identidade básica

Implementar depois de fechar o núcleo atual de combate:
- nome do personagem;
- gênero gerado;
- idade inicial 14/15;
- campos estruturais no perfil;
- base para títulos.

Esta fase deve acontecer antes da interface completa Multistreamer/site, porque esses dados serão exibidos no perfil do personagem.

### Fase B — envelhecimento dinâmico

Implementar junto ou depois da infraestrutura própria de bot/Multistreamer, quando existir telemetria confiável de atividade e tempo assistido.

Assim o envelhecimento poderá considerar de verdade:
- XP;
- atividade;
- tempo em live;
- progressão.

### Fase C — longevidade avançada

Somente depois:
- tabelas completas por raça;
- títulos ligados à idade;
- efeitos especiais de longevidade, se desejados.

Morte automática por idade permanece fora do escopo até nova decisão.
