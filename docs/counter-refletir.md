# Counter físico e Refletir elemental

Status: especificação aprovada em conceito; implementação pendente de dois valores de balanceamento.

## Objetivo

Adicionar duas habilidades universais equipáveis em slots normais de PvP. Elas são escolhidas por `!ataque 1-4`, sem revelar ao adversário qual habilidade foi selecionada antes da resolução.

## 1. Contra-ataque físico

- Habilidade Universal.
- Tipo físico.
- Custo de Mentalidade: 0.
- Prioridade própria alta para preparar a postura antes de ataques normais.
- Só reage a ataques diretos físicos.
- Ao ativar corretamente:
  - o usuário recebe 50% do dano direto do golpe recebido;
  - parte do ataque é devolvida ao atacante (percentual devolvido ainda a confirmar);
  - efeitos diretamente ligados ao golpe refletido deverão acompanhar a devolução quando tecnicamente aplicáveis.
- Não ativa contra Cura, Buff, Suporte sem dano, Meditação, DoT, dano de Confusão ou outra postura de Counter/Refletir.
- Se o adversário não usar um ataque físico compatível, a postura é desperdiçada naquele turno.
- Como é físico, continua permitido durante Silêncio.

## 2. Refletir elemental

- Habilidade Universal equipável em slot normal.
- Natureza elemental.
- Possui custo de Mentalidade; valor exato ainda a confirmar.
- Prioridade própria alta.
- Só reage a ataques diretos de natureza elemental.
- O elemento do golpe recebido precisa pertencer ao personagem que está refletindo.

### O que conta como “meu elemento”

Conta:
- elemento nativo do personagem;
- elemento de fusão realmente desbloqueado pelos elementos nativos.

Não conta:
- afinidade de pergaminho;
- habilidade temporariamente aprendida por Neutro;
- elemento que o personagem apenas possui em uma skill, sem ter afinidade elemental própria.

Exemplo:
- Personagem possui Fogo -> pode refletir Fogo.
- Personagem possui Psíquico + Luz -> desbloqueia Ilusão -> pode refletir Ilusão.
- Personagem possui Fogo -> não pode refletir Água.

Ao ativar corretamente:
- o usuário recebe 50% do dano direto do golpe;
- parte do ataque é devolvida ao atacante (percentual devolvido ainda a confirmar).

Se o elemento for incompatível, Refletir não ativa e a ação é desperdiçada; o golpe inimigo resolve normalmente.

## Regras comuns

- São habilidades equipadas nos 4 slots e usadas por `!ataque N`.
- A escolha permanece escondida até a resolução do turno.
- Counter/Refletir possuem prioridade alta.
- Se ambos escolherem Counter/Refletir, nenhuma postura dispara contra a outra.
- DoTs já ativos não disparam Counter/Refletir.
- Auto-dano de Confusão não dispara Counter/Refletir.
- Se o defensor morrer com a parcela de dano que atravessou a postura, não devolve o ataque.
- Não deve existir cadeia infinita de reflexão.
- Habilidades temporárias só são consumidas quando efetivamente executadas, seguindo a regra geral do PvP.

## Pontos de balanceamento ainda pendentes

1. Dano devolvido: 50% do golpe original ou 100% do golpe original.
2. Custo fixo de Mentalidade do Refletir.

## Próxima etapa

Após fechar os dois valores acima:
1. criar motor genérico;
2. criar as duas habilidades Universais;
3. testes locais;
4. regressões;
5. dry-run;
6. validação real na Twitch.
