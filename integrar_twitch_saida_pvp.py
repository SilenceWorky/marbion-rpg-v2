from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"Trecho não encontrado: {label}")
    return text.replace(old, new, 1)


# ============================================================
# PVP COORDINATOR
# ============================================================
p = Path("src/durable/PvpCoordinator.js")
s = p.read_text(encoding="utf-8")

if "../integrations/twitch-chat.js" not in s:
    anchor = '''import {
  getPvpAfkAccess,
  registerPvpAfkIncident
} from "../systems/pvp-afk.js";
'''

    replacement = anchor + '''\nimport {
  sendTwitchChatMessage
} from "../integrations/twitch-chat.js";

import {
  formatAutomaticPvpResolution,
  formatAutomaticForfeitResult
} from "../systems/pvp-auto-message.js";
'''

    s = replace_once(
        s,
        anchor,
        replacement,
        "imports Twitch/formatador"
    )


if "async function appendAndSendBattleSystemMessage" not in s:
    anchor = '''function createConfusionSelfHitExecution(
  player,
  action,
  confusionResult
) {'''

    helper = '''async function appendAndSendBattleSystemMessage(
  env,
  battle,
  type,
  text,
  details = {},
  now = Date.now()
) {
  const event =
    appendBattleSystemMessage(
      battle,
      type,
      text,
      details,
      now
    );

  const delivery =
    await sendTwitchChatMessage(
      env,
      text
    );

  event.delivery = {
    provider: "twitch",
    attemptedAt: Date.now(),
    ok: delivery.ok === true,
    skipped: delivery.skipped === true,
    error: delivery.ok ? null : delivery.error || null,
    status: delivery.status || null,
    messageId: delivery.messageId || null
  };

  return {
    event,
    delivery
  };
}


function createConfusionSelfHitExecution(
  player,
  action,
  confusionResult
) {'''

    s = replace_once(
        s,
        anchor,
        helper,
        "helper de envio autônomo"
    )


# Troca apenas os append do handler alarm, preservando a função base.
alarm_start = s.find("  async alarm() {")
if alarm_start == -1:
    raise RuntimeError("Trecho não encontrado: async alarm")

fetch_start = s.find("\n\n  async fetch(", alarm_start)
if fetch_start == -1:
    raise RuntimeError("Trecho não encontrado: fim do alarm")

alarm = s[alarm_start:fetch_start]

if "appendAndSendBattleSystemMessage" not in alarm:
    alarm = alarm.replace(
        "appendBattleSystemMessage(\n",
        "await appendAndSendBattleSystemMessage(\n          this.env,\n",
    )


old_forfeit = '''      const result =
        await this.forfeitBattle(
          defeatedUser,
          {
            forceLateForfeit: true,
            timeoutForfeit: true,
            finishReason: "TIMEOUT_FORFEIT"
          }
        );

      return {
        ...result,
        timeoutResult,
        discipline
      };'''

new_forfeit = '''      const result =
        await this.forfeitBattle(
          defeatedUser,
          {
            forceLateForfeit: true,
            timeoutForfeit: true,
            finishReason: "TIMEOUT_FORFEIT"
          }
        );

      const victoryMessage =
        formatAutomaticForfeitResult(
          result
        );

      if (victoryMessage) {
        await sendTwitchChatMessage(
          this.env,
          victoryMessage
        );
      }

      return {
        ...result,
        timeoutResult,
        discipline
      };'''

if old_forfeit in alarm:
    alarm = alarm.replace(
        old_forfeit,
        new_forfeit,
        1
    )
elif "const victoryMessage" not in alarm:
    raise RuntimeError("Trecho não encontrado: envio da vitória por AFK")


old_resolution = '''    for (
      const timedOutUser
      of missingUsers
    ) {
      resolution =
        await this.chooseAction(
          timedOutUser,
          "__timeout__",
          {
            internalTimeout: true
          }
        );
    }

    return {
      ok: true,
      timeout: true,
      timeoutResult,
      discipline,
      resolution
    };'''

new_resolution = '''    for (
      const timedOutUser
      of missingUsers
    ) {
      resolution =
        await this.chooseAction(
          timedOutUser,
          "__timeout__",
          {
            internalTimeout: true
          }
        );
    }

    const resolutionMessage =
      formatAutomaticPvpResolution(
        resolution
      );

    if (resolutionMessage) {
      await sendTwitchChatMessage(
        this.env,
        resolutionMessage
      );
    }

    return {
      ok: true,
      timeout: true,
      timeoutResult,
      discipline,
      resolution
    };'''

if old_resolution in alarm:
    alarm = alarm.replace(
        old_resolution,
        new_resolution,
        1
    )
elif "const resolutionMessage" not in alarm:
    raise RuntimeError("Trecho não encontrado: envio da resolução automática")

s = s[:alarm_start] + alarm + s[fetch_start:]
p.write_text(s, encoding="utf-8")
print("✅ src/durable/PvpCoordinator.js atualizado")


# ============================================================
# ADMIN ROUTE: teste seguro da saída Twitch
# ============================================================
p = Path("src/routes/admin.js")
s = p.read_text(encoding="utf-8")

if "../integrations/twitch-chat.js" not in s:
    anchor = '''import {
  adminResetProfileTime,
  normalizeAdminTimeScope
} from "../systems/admin-time-reset.js";
'''

    replacement = anchor + '''\nimport {
  sendTwitchChatMessage
} from "../integrations/twitch-chat.js";
'''

    s = replace_once(
        s,
        anchor,
        replacement,
        "import Twitch em admin"
    )


if 'command === "twitch"' not in s:
    anchor = '''  /*
   * ==========================
   * LEVEL
   * ==========================
   *
   * !adm level @user 20
   */'''

    block = '''  /*
   * ==========================
   * TWITCH CHAT / BOT OUTPUT
   * ==========================
   *
   * !adm twitch teste
   *
   * A mensagem de teste é enviada diretamente
   * pela API oficial da Twitch. Tokens/IDs ficam
   * somente nos Secrets do Cloudflare.
   */
  if (
    command === "twitch" ||
    command === "chatbot"
  ) {
    const operation =
      normalizeCommand(
        args[1]
      );

    if (
      operation !== "teste" &&
      operation !== "test"
    ) {
      return new Response(
        `@${actor}, uso: !adm twitch teste`
      );
    }

    const result =
      await sendTwitchChatMessage(
        env,
        "🤖 Marbion RPG: saída automática da Twitch conectada."
      );

    if (!result.ok) {
      const statusText =
        result.status
          ? ` | HTTP ${result.status}`
          : "";

      const missingText =
        Array.isArray(result.missing) &&
        result.missing.length > 0
          ? ` | faltando: ${result.missing.join(", ")}`
          : "";

      return new Response(
        `❌ ADM | Falha na saída Twitch: ${result.error || "ERRO_DESCONHECIDO"}${statusText}${missingText}.`
      );
    }

    return new Response(
      `✅ ADM | Mensagem autônoma de teste enviada para a Twitch.`
    );
  }


  /*
   * ==========================
   * LEVEL
   * ==========================
   *
   * !adm level @user 20
   */'''

    s = replace_once(
        s,
        anchor,
        block,
        "comando ADM Twitch teste"
    )

p.write_text(s, encoding="utf-8")
print("✅ src/routes/admin.js atualizado")

print("\n📡 SAÍDA AUTÔNOMA TWITCH INTEGRADA LOCALMENTE.")
print("- eventos AFK de 60s/90s enviados pela API oficial")
print("- resolução do turno após timeout enviada automaticamente")
print("- vitória por 3/3 AFK enviada automaticamente")
print("- falha da Twitch não interrompe o motor de PvP")
print("- !adm twitch teste adicionado")
print("- credenciais esperadas via Cloudflare Secrets")
