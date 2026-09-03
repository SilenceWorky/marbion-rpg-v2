# Counter físico e Refletir elemental

Status: implementação concluída e regressões automáticas aprovadas; validação real na Twitch ainda pendente.

## Objetivo

Adicionar duas habilidades Universais equipáveis em slots normais de PvP. Elas são escolhidas por `!ataque 1-4`, sem revelar ao adversário qual habilidade foi selecionada antes da resolução.

## 1. Contra-ataque físico

- Habilidade: `Universais:Contra_Ataque`.
- Nome exibido: `Contra-ataque`.
- Tipo: Física.
- Elemento: Universal.
- Custo de Mentalidade: 0.
- Prioridade: 100.
- Só reage a ataques diretos do tipo Física.
- Ao ativar corretamente:
  - o usuário recebe 50% do dano direto que receberia;
  - os outros 50% são devolvidos ao atacante;
  - para dano ímpar, o defensor recebe a metade arredondada para cima e a devolução usa a metade arredondada para baixo, sem criar dano extra.
- Se a metade do dano ainda derrotar o defensor, não ocorre devolução.
- Se o adversário não usar um ataque físico compatível, a postura é desperdiçada naquele turno.
- Como é Física, continua permitida durante Silêncio.

## 2. Refletir elemental

- Habilidade: `Universais:Refletir`.
- Nome exibido: `Refletir`.
- Tipo: Elemental.
- Elemento da própria skill: Universal.
- Custo de Mentalidade: 10.
- Prioridade: 100.
- O custo é pago quando a postura realmente é executada, mesmo que o adversário escolha depois um golpe incompatível.
- Só reage a ataques diretos do tipo Elemental.
- O elemento do golpe recebido precisa pertencer ao personagem que está refletindo.
- Ao ativar corretamente:
  - o usuário recebe 50% do dano direto que receberia;
  - os outros 50% são devolvidos ao atacante.
- Se a metade do dano ainda derrotar o defensor, não ocorre devolução.
- Como é Elemental, Silêncio impede seu uso.

### O que conta como “meu elemento” para Refletir

Conta:
- elemento nativo do personagem;
- elemento de fusão realmente desbloqueado pelos elementos nativos.

Não conta:
- afinidade de pergaminho;
- habilidade temporariamente aprendida por Neutro;
- elemento que o personagem apenas possui em uma skill sem possuir afinidade elemental própria.

Exemplos:
- Fogo -> pode refletir Fogo.
- Psíquico + Luz -> desbloqueia Ilusão -> pode refletir Ilusão.
- Fogo -> não pode refletir Água.

## Regras comuns

- São habilidades equipadas nos 4 slots e usadas por `!ataque N`.
- A escolha permanece escondida até a resolução do turno.
- Counter/Refletir possuem prioridade alta para preparar a postura antes de ataques normais.
- Se ambos escolherem Counter/Refletir, nenhuma postura dispara contra a outra.
- Cura, Buff, Suporte sem dano e Meditação não disparam as posturas.
- DoTs já ativos não disparam Counter/Refletir.
- Auto-dano de Confusão não dispara Counter/Refletir.
- Não existe cadeia infinita de reflexão.
- Controle, Sono, Confusão e demais bloqueios continuam sendo verificados antes da execução da postura; se impedirem a ação, ela não é preparada e o custo segue a regra normal de ação bloqueada.
- Nesta primeira implementação, a reação redistribui o dano direto. Efeitos secundários do golpe original continuam sendo processados normalmente sobre o alvo atingido e não são duplicados no atacante pela devolução.

## Snapshot elemental do PvP

Ao aceitar um PvP, cada jogador recebe no snapshot da batalha a lista `reflectElements`, formada por:
- elementos nativos;
- fusões desbloqueadas naquele momento.

Isso evita que afinidades de pergaminho ou skills temporárias sejam tratadas como elementos próprios para Refletir.

## Implementação

Motor: `src/systems/reactions.js`

Integrações principais:
- `src/durable/PvpCoordinator.js`
- `src/routes/attack.js`
- catálogo externo `skills.json`

Teste principal:
- `testar_counter_refletir_pvp.mjs`

## Próxima etapa

1. validação local no Codespace;
2. `wrangler deploy --dry-run`;
3. deploy real;
4. validar Contra-ataque físico na Twitch;
5. validar Refletir com elemento compatível;
6. validar Refletir com elemento incompatível;
7. após produção, marcar Counter/Refletir como concluídos no roadmap.
