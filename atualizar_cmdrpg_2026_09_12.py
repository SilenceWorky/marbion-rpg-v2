from pathlib import Path
import re

path = Path("cmdrpg.md")
s = path.read_text(encoding="utf-8")


def replace_once(old, new, label):
    global s
    if old not in s:
        raise RuntimeError(f"Trecho não encontrado: {label}")
    s = s.replace(old, new, 1)


def replace_section(start_heading, next_heading, body):
    global s
    pattern = re.compile(
        re.escape(start_heading) +
        r".*?(?=\n---\n\n" +
        re.escape(next_heading) +
        r")",
        re.S
    )
    if not pattern.search(s):
        raise RuntimeError(f"Seção não encontrada: {start_heading}")
    s = pattern.sub(body.rstrip(), s, count=1)


replace_once(
    "Última atualização canônica: **11/09/2026**.",
    "Última atualização canônica: **12/09/2026**.",
    "data canônica"
)

replace_section(
    "## Soco",
    "## Aprendizado por nível",
    '''## Soco
Status V2: ✔️ **validado em produção**

Ação universal virtual e fixa:
- comando público: `!ataque soco`
- funciona como uma 5ª ação virtual, fora dos 4 slots equipáveis
- não pode ser trocada/removida
- custo: 0
- dano base: 12
- precisão: 95
- prioridade: 0
- escala: Força
- não usa o cooldown genérico
- mensagem de espera identifica corretamente **Soco**, sem chamar de “habilidade 5”'''
)

replace_section(
    "## !ataque 1-4",
    "## Ordem das ações",
    '''## !ataque 1-4 / !ataque soco
Status V2: ✔️

Regras:
- uma escolha por turno
- slots 1-4 usam habilidades equipadas
- `!ataque soco` usa a ação universal fixa
- primeira escolha fica aguardando o adversário
- habilidades só são reveladas na resolução
- falta de Mentalidade permite escolher outra ação
- ação já escolhida não pode ser substituída no mesmo turno'''
)

replace_section(
    "## !recusar",
    "## !desistir / forfeit",
    '''## !recusar
Status V2: ✔️ **validado em produção**

Regras:
- somente o jogador desafiado pode recusar
- remove imediatamente o desafio pendente
- sem perda de Elo
- não interfere em PvP já ativo
- não remove dupla que já entrou na fila global'''
)

replace_section(
    "## !desistir / forfeit",
    "## Timeout de turno / luta abandonada",
    '''## !desistir / forfeit
Status V2: ✔️ **validado em produção**

Regra canônica:
- encerra a luta como derrota de quem desistiu
- desistente perde **2x** a perda normal calculada para aquele confronto
- cap máximo da perda por desistência: `-300`
- rating nunca fica abaixo de 0
- vencedor NÃO recebe recompensa dobrada
- a próxima dupla da fila é promovida normalmente

Proteção contra desistência precoce:
- antes do Turno 3: desistente recebe a penalidade 2x, mas o adversário recebe **0 Elo**
- a partir do Turno 3: vencedor recebe Elo normal, sujeito ao anti-farm

Validado em produção nos Turnos 1, 2, 3 e 5, incluindo penalidade dinâmica de desistência.'''
)

replace_section(
    "## Timeout de turno / luta abandonada",
    "# 🏆 RANKING PVP / XP DE COMBATE",
    '''## Timeout de turno / AFK
Status V2: 🧪 **implementado; regra disciplinar nova em validação**

Regra canônica:
```txt
T+60s sem ação
→ aviso: restam 30 segundos

T+90s sem ação
→ jogador perde a ação
→ recebe 1 strike AFK
→ ação do adversário é resolvida normalmente

3 strikes AFK na mesma luta
→ derrota automática por inatividade
```

O relógio usa **Durable Object Alarm**, portanto não depende de alguém enviar outro comando para destravar a luta.

Disciplina entre partidas:
- 1º incidente AFK abre uma janela de observação de 30 minutos
- novo AFK dentro da janela → bloqueio de PvP por 15 minutos
- após cumprir o bloqueio, existe nova janela de 30 minutos
- reincidência dentro dela → 1 hora
- próximas punições seguem progressão `x4`: 4h, 16h, 64h etc.
- partidas normais entre os incidentes NÃO limpam a janela
- se a janela de 30 minutos expirar sem novo AFK, a reincidência volta ao estágio inicial
- enquanto houver bloqueio, o jogador não pode desafiar nem aceitar PvP
- AFKs adicionais da mesma luta enquanto um bloqueio já está ativo não escalam imediatamente a punição

Mensagens/eventos previstos:
```txt
⏰ @user, você ainda não escolheu uma ação. Restam 30 segundos.
💤 @user não executou uma ação a tempo e perdeu a vez. AFK: 1/3.
💤 @user ficou AFK por 3 turnos e perdeu o PvP por inatividade.
```

Observação de infraestrutura:
- o Worker já pode registrar os eventos automaticamente
- publicação espontânea dessas mensagens no chat depende da saída Twitch/bot próprio, pois `customapi` do StreamElements só responde quando um comando é chamado'''
)

replace_section(
    "## Sistema atual",
    "## Elos",
    '''## Sistema atual
Status V2: ✔️ **Ranking Dinâmico V2 validado em produção**

- XP de Combate separado do XP normal
- rating inicial: 1000
- ganho e perda são calculados separadamente
- o sistema não é zero-sum
- dificuldade de progressão aumenta conforme o próprio rating
- diferença de rating entre adversários altera risco/recompensa
- vitória normal rende pelo menos +1, salvo partida amistosa/anti-farm
- rating nunca fica abaixo de 0'''
)

# Apenas muda o status da seção e preserva as fórmulas já documentadas.
replace_once(
    "## Ranking Dinâmico V2\nStatus V2: ⏳ **PRÓXIMA IMPLEMENTAÇÃO**",
    "## Ranking Dinâmico V2\nStatus V2: ✔️ **implementado, testado e validado em produção**",
    "status Ranking Dinâmico V2"
)

replace_once(
    "## Anti-farm por repetição de adversário\nStatus V2: ⏳ **será implementado junto do Ranking Dinâmico V2**",
    "## Anti-farm por repetição de adversário\nStatus V2: ✔️ **implementado e validado em produção**",
    "status anti-farm"
)

# Acrescenta seção administrativa de tempo antes do reset de Elo.
needle = '''---

## Reset administrativo de Elo
Status V2: ⏳'''
insert = '''---

## Reset administrativo de tempo
Status V2: ✔️ **implementado e validado em produção; escopo AFK em integração**

Sintaxes equivalentes:
```txt
!adm tempo reset @usuario escopo [extra]
!adm reset tempo @usuario escopo [extra]
```

Escopos:
```txt
tudo
pvp
afk
habilidades
habilidade 1-4
meditar
antifarm @oponente
daily
checkin
xpchest
reroll
cura
```

Regras:
- `antifarm` limpa o histórico da dupla dos dois lados
- `habilidade N` limpa somente o cooldown do slot escolhido
- `pvp` limpa tempos/restrições temporais ligados ao PvP
- `afk` limpa bloqueio, nível de reincidência, janela de 30 minutos e strikes vivos da batalha
- `tudo` inclui também o estado temporal/disciplinar de AFK
- não apaga raça, elementos, Elo, vitórias/derrotas, inventário ou identidade do personagem

---

## Recursos máximos por ADM
Status V2: ✔️

Comandos:
```txt
!adm maxhp @usuario valor
!adm maxmentalidade @usuario valor
```

Regras:
- altera o máximo no perfil e no snapshot vivo quando aplicável
- aumentar o máximo não cura/preenche automaticamente
- diminuir o máximo limita o valor atual se necessário

---

## Reset administrativo de Elo
Status V2: ⏳'''
replace_once(needle, insert, "seções ADM de tempo/máximo")

# Núcleo fechado / prioridade atual
replace_once(
    "- Fila Global de PvP ✔️",
    "- Fila Global de PvP ✔️\n- Ranking Dinâmico V2 ✔️\n- Anti-farm A x B ✔️\n- `!recusar` ✔️\n- `!desistir` ✔️\n- Soco universal via `!ataque soco` ✔️\n- reset administrativo de tempos ✔️\n- timeout de 90s via Durable Object Alarm ✔️",
    "núcleo fechado atualizado"
)

old_priority = '''1. **Ranking Dinâmico V2** — novo cálculo assimétrico de ganho/perda ⏳
2. **Anti-farm A x B** — 3 partidas ranqueadas/24h; 4ª+ amistosa ⏳
3. **`!recusar`** ⏳
4. **`!desistir` / forfeit** — penalidade 2x e proteção contra desistência precoce ⏳
5. **Timeout de turno + hardening de lutas abandonadas** ⏳
6. **Reset administrativo de Elo individual/geral** ⏳
7. **Temporadas ranqueadas + soft reset** ⏳
8. **Passe de batalha da Temporada 1** ⏳
9. **Habilidades de Suporte com efeitos reais** ⏳
10. **Aprendizado automático de habilidades por nível** ⏳
11. **Combos Elementais V2 / novas reações** ⏳
12. **Efeitos especiais de Tempo, Espaço, Gravidade e Matéria** ⏳
13. **Individualidade básica do personagem** ⏳
14. **Fundação Multi-Streamer / site / bot próprio** ⏳'''
new_priority = '''1. **Ranking Dinâmico V2** — cálculo assimétrico de ganho/perda ✔️
2. **Anti-farm A x B** — 3 partidas ranqueadas/24h; 4ª+ amistosa ✔️
3. **`!recusar`** ✔️
4. **`!desistir` / forfeit** — penalidade 2x e proteção precoce ✔️
5. **Timeout/AFK + disciplina progressiva + hardening** 🧪
6. **Reset administrativo de Elo individual/geral** ⏳
7. **Temporadas ranqueadas + soft reset** ⏳
8. **Passe de batalha da Temporada 1** ⏳
9. **Habilidades de Suporte com efeitos reais** ⏳
10. **Aprendizado automático de habilidades por nível** ⏳
11. **Combos Elementais V2 / novas reações** ⏳
12. **Efeitos especiais de Tempo, Espaço, Gravidade e Matéria** ⏳
13. **Individualidade básica do personagem** ⏳
14. **Fundação Multi-Streamer / site / bot próprio / saída autônoma para mensagens AFK** ⏳'''
replace_once(old_priority, new_priority, "roadmap canônico")

path.write_text(s, encoding="utf-8")
print("✅ cmdrpg.md atualizado para 12/09/2026")
