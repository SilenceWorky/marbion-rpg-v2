from pathlib import Path
import re

PATH = Path("src/durable/PvpCoordinator.js")
text = PATH.read_text(encoding="utf-8")

if "formatChallengeTimeoutMessage" in text:
    print("ℹ️ Timeout de desafio PvP já parece integrado.")
    raise SystemExit(0)

# 1) Importa os utilitários do timeout de desafio.
marker = '''import {
  getPvpAfkAccess,
  registerPvpAfkIncident
} from "../systems/pvp-afk.js";
'''

insert = marker + '''\nimport {
  partitionExpiredChallenges,
  getNextChallengeExpiry,
  formatChallengeTimeoutMessage
} from "../systems/pvp-challenge-timeout.js";
'''

if marker not in text:
    raise RuntimeError("Não encontrei o bloco de import do pvp-afk.js")

text = text.replace(marker, insert, 1)

# 2) Troca o agendamento exclusivo do turno por um agendador compartilhado
#    entre relógio do turno e expiração de desafios pendentes.
start = text.find("  async scheduleBattleTurnAlarm(\n")
end_marker = '''  /*
   * ==============================
   * PROFILE STORE FORTE
'''
end = text.find(end_marker, start)

if start == -1 or end == -1:
    raise RuntimeError("Não encontrei o bloco de agendamento de Alarm")

shared_alarm_block = '''  async scheduleCoordinatorAlarm(
    data = null,
    preferredBattle = null
  ) {
    const currentData =
      data ||
      await this.getData();

    const now =
      Date.now();

    const candidates = [];

    const activeBattle =
      preferredBattle?.status === "ACTIVE"
        ? preferredBattle
        : getGlobalActivePvpBattle(
            currentData
          );

    if (activeBattle) {
      const clock =
        ensureBattleTurnClock(
          activeBattle,
          now
        );

      if (clock.ok) {
        const nextBattleAlarm =
          getNextBattleTurnAlarmAt(
            activeBattle
          );

        if (
          nextBattleAlarm.ok &&
          Number.isFinite(
            Number(
              nextBattleAlarm.alarmAt
            )
          )
        ) {
          candidates.push({
            kind: "battle",
            stage:
              nextBattleAlarm.stage,
            at:
              Number(
                nextBattleAlarm.alarmAt
              )
          });
        }
      }
    }

    const nextChallengeAt =
      getNextChallengeExpiry(
        currentData.challenges,
        now
      );

    if (
      Number.isFinite(
        Number(nextChallengeAt)
      )
    ) {
      candidates.push({
        kind: "challenge",
        stage: "CHALLENGE_TIMEOUT",
        at:
          Number(nextChallengeAt)
      });
    }

    if (candidates.length === 0) {
      await this.state.storage.deleteAlarm();

      return {
        ok: true,
        scheduled: false
      };
    }

    candidates.sort(
      (a, b) =>
        a.at - b.at
    );

    const next =
      candidates[0];

    const alarmAt =
      Math.max(
        now + 1,
        next.at
      );

    await this.state.storage.setAlarm(
      alarmAt
    );

    return {
      ok: true,
      scheduled: true,
      kind: next.kind,
      stage: next.stage,
      alarmAt
    };
  }


  async scheduleBattleTurnAlarm(
    battle
  ) {
    return this.scheduleCoordinatorAlarm(
      null,
      battle
    );
  }


  async clearBattleTurnAlarm() {
    const data =
      await this.getData();

    const nextChallengeAt =
      getNextChallengeExpiry(
        data.challenges,
        Date.now()
      );

    if (
      Number.isFinite(
        Number(nextChallengeAt)
      )
    ) {
      const alarmAt =
        Math.max(
          Date.now() + 1,
          Number(nextChallengeAt)
        );

      await this.state.storage.setAlarm(
        alarmAt
      );

      return {
        ok: true,
        challengeAlarmPreserved: true,
        alarmAt
      };
    }

    await this.state.storage.deleteAlarm();

    return {
      ok: true,
      challengeAlarmPreserved: false
    };
  }


'''

text = text[:start] + shared_alarm_block + text[end:]

# 3) cleanExpiredChallenges passa a remover + notificar automaticamente.
clean_start = text.find("  cleanExpiredChallenges(\n")
clean_end = text.find("  findBattleByUser(\n", clean_start)

if clean_start == -1 or clean_end == -1:
    raise RuntimeError("Não encontrei cleanExpiredChallenges")

clean_block = '''  async cleanExpiredChallenges(
    data,
    now = Date.now()
  ) {
    const partition =
      partitionExpiredChallenges(
        data.challenges,
        now
      );

    if (partition.expired.length === 0) {
      return data;
    }

    data.challenges =
      partition.active;

    /*
     * Persistimos a remoção ANTES de publicar.
     * Assim, uma nova chamada não dispara a mesma
     * expiração duas vezes caso a Twitch falhe.
     */
    await this.saveData(
      data
    );

    for (
      const challenge
      of partition.expired
    ) {
      const message =
        formatChallengeTimeoutMessage(
          challenge
        );

      if (message) {
        await sendTwitchChatMessage(
          this.env,
          message
        );
      }
    }

    await this.scheduleCoordinatorAlarm(
      data
    );

    return data;
  }


'''

text = text[:clean_start] + clean_block + text[clean_end:]

# 4) Como o cleanup agora é assíncrono, aguarda todas as chamadas existentes.
text = re.sub(
    r'(?<!await )this\.cleanExpiredChallenges\(',
    'await this.cleanExpiredChallenges(',
    text
)

# 5) Ao criar um novo desafio, arma o Alarm para os 2 minutos.
create_start = text.find("  async createChallenge(\n")
create_end = text.find("  async startNextQueuedBattle() {\n", create_start)

if create_start == -1 or create_end == -1:
    raise RuntimeError("Não encontrei createChallenge")

create_chunk = text[create_start:create_end]
old_save = '''    await this.saveData(
      data
    );


    return {
      ok: true,
      challenger,
'''
new_save = '''    await this.saveData(
      data
    );

    await this.scheduleCoordinatorAlarm(
      data
    );


    return {
      ok: true,
      challenger,
'''

if old_save not in create_chunk:
    raise RuntimeError("Não encontrei o save final de createChallenge")

create_chunk = create_chunk.replace(old_save, new_save, 1)
text = text[:create_start] + create_chunk + text[create_end:]

# 6) Alarm processa desafios vencidos mesmo sem batalha ativa.
alarm_start = text.find("  async alarm() {\n")

if alarm_start == -1:
    raise RuntimeError("Não encontrei alarm()")

old_alarm_head = '''  async alarm() {
    const data =
      await this.getData();

    const battle =
      getGlobalActivePvpBattle(
        data
      );

    if (!battle) {
      await this.clearBattleTurnAlarm();

      return {
        ok: true,
        activeBattle: false
      };
    }

    const now =
      Date.now();
'''

new_alarm_head = '''  async alarm() {
    let data =
      await this.getData();

    const alarmNow =
      Date.now();

    data =
      await this.cleanExpiredChallenges(
        data,
        alarmNow
      );

    const battle =
      getGlobalActivePvpBattle(
        data
      );

    if (!battle) {
      await this.scheduleCoordinatorAlarm(
        data
      );

      return {
        ok: true,
        activeBattle: false
      };
    }

    const now =
      Date.now();
'''

if old_alarm_head not in text:
    raise RuntimeError("Não encontrei o início esperado de alarm()")

text = text.replace(old_alarm_head, new_alarm_head, 1)

# 7) Depois do aviso de 60s, não sobrescreve um desafio que possa expirar antes dos 90s.
old_warning_alarm = '''      await this.state.storage.setAlarm(
        clock.turnDeadline
      );
'''
new_warning_alarm = '''      await this.scheduleCoordinatorAlarm(
        data,
        battle
      );
'''

alarm_tail = text[alarm_start:]
if old_warning_alarm not in alarm_tail:
    raise RuntimeError("Não encontrei o reagendamento do aviso de 60s")

alarm_tail = alarm_tail.replace(
    old_warning_alarm,
    new_warning_alarm,
    1
)
text = text[:alarm_start] + alarm_tail

PATH.write_text(text, encoding="utf-8")

print("✅ src/durable/PvpCoordinator.js atualizado")
print("\n⌛ TIMEOUT DE DESAFIO PVP INTEGRADO LOCALMENTE.")
print("- desafio continua expirando em 2 minutos")
print("- alvo que não responde NÃO recebe AFK, Elo ou qualquer penalidade")
print("- mensagem automática é enviada pela saída Twitch")
print("- Alarm compartilhado escolhe o próximo evento entre desafio e turno 60/90s")
print("- cleanup por comando também notifica caso vença antes do Alarm")
