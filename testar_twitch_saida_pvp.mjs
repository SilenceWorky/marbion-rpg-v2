import assert from "node:assert/strict";
import fs from "node:fs";

import {
  TWITCH_CHAT_MAX_LENGTH,
  getTwitchChatConfig,
  sendTwitchChatMessage
} from "./src/integrations/twitch-chat.js";

import {
  formatAutomaticPvpResolution,
  formatAutomaticForfeitResult
} from "./src/systems/pvp-auto-message.js";


async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
  }
  catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
}


const env = {
  TWITCH_CLIENT_ID: "client-123",
  TWITCH_ACCESS_TOKEN: "token-456",
  TWITCH_BROADCASTER_ID: "broadcaster-789",
  TWITCH_SENDER_ID: "sender-321"
};


console.log("=== SAÍDA AUTÔNOMA TWITCH ===");

await test(
  "configuração exige as quatro variáveis",
  async () => {
    const ok = getTwitchChatConfig(env);
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.missing, []);

    const missing = getTwitchChatConfig({});
    assert.equal(missing.ok, false);
    assert.equal(missing.missing.length, 4);
  }
);

await test(
  "token oauth: é normalizado",
  async () => {
    const config = getTwitchChatConfig({
      ...env,
      TWITCH_ACCESS_TOKEN: "oauth:abc"
    });

    assert.equal(config.accessToken, "abc");
  }
);

await test(
  "mensagem usa endpoint oficial e payload correto",
  async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    const result = await sendTwitchChatMessage(
      env,
      "Olá Marbion",
      {
        fetchImpl: async (url, options) => {
          capturedUrl = url;
          capturedOptions = options;

          return {
            ok: true,
            status: 200,
            async json() {
              return {
                data: [
                  {
                    message_id: "msg-1",
                    is_sent: true,
                    drop_reason: null
                  }
                ]
              };
            }
          };
        }
      }
    );

    assert.equal(result.ok, true);
    assert.equal(result.messageId, "msg-1");
    assert.equal(
      capturedUrl,
      "https://api.twitch.tv/helix/chat/messages"
    );
    assert.equal(
      capturedOptions.headers.Authorization,
      "Bearer token-456"
    );
    assert.equal(
      capturedOptions.headers["Client-Id"],
      "client-123"
    );

    const body = JSON.parse(capturedOptions.body);
    assert.deepEqual(body, {
      broadcaster_id: "broadcaster-789",
      sender_id: "sender-321",
      message: "Olá Marbion"
    });
  }
);

await test(
  "sem Secrets a saída é ignorada sem derrubar PvP",
  async () => {
    const result = await sendTwitchChatMessage(
      {},
      "teste"
    );

    assert.equal(result.ok, false);
    assert.equal(result.skipped, true);
    assert.equal(result.error, "TWITCH_CHAT_NOT_CONFIGURED");
  }
);

await test(
  "mensagens acima de 500 caracteres são rejeitadas localmente",
  async () => {
    assert.equal(TWITCH_CHAT_MAX_LENGTH, 500);

    const result = await sendTwitchChatMessage(
      env,
      "x".repeat(501),
      {
        fetchImpl: async () => {
          throw new Error("não deveria chamar fetch");
        }
      }
    );

    assert.equal(result.ok, false);
    assert.equal(result.error, "MESSAGE_TOO_LONG");
  }
);

await test(
  "timeout_skip não aparece como ataque e Soco aparece na resolução",
  async () => {
    const message = formatAutomaticPvpResolution({
      ok: true,
      turn: 1,
      nextTurn: 2,
      firstExecution: {
        kind: "physical",
        attacker: "silenceworky",
        defender: "acervojuju",
        skill: "Soco",
        hit: true,
        damage: 12,
        defenderHp: 88
      },
      secondExecution: {
        kind: "timeout_skip",
        attacker: "acervojuju",
        skill: "Tempo esgotado",
        timedOut: true,
        damage: 0
      },
      hp: {
        player1: {
          user: "silenceworky",
          current: 100,
          max: 100
        },
        player2: {
          user: "acervojuju",
          current: 88,
          max: 100
        }
      }
    });

    assert.match(message, /silenceworky usou Soco/);
    assert.match(message, /12 de dano/);
    assert.match(message, /Turno 2 iniciado/);
    assert.doesNotMatch(message, /Tempo esgotado/);
  }
);

await test(
  "resultado de derrota AFK inclui vencedor e Elo",
  async () => {
    const message = formatAutomaticForfeitResult({
      ok: true,
      winner: "silenceworky",
      loser: "acervojuju",
      rankedResult: {
        ok: true,
        friendly: false,
        winner: {
          gain: 15,
          after: 900
        },
        loser: {
          loss: 60,
          after: 700
        }
      }
    });

    assert.match(message, /silenceworky venceu/);
    assert.match(message, /acervojuju/);
    assert.match(message, /\+15/);
    assert.match(message, /-60/);
  }
);

await test(
  "código integrado contém envio nos eventos AFK e comando ADM de teste",
  async () => {
    const coordinator = fs.readFileSync(
      "src/durable/PvpCoordinator.js",
      "utf8"
    );

    const admin = fs.readFileSync(
      "src/routes/admin.js",
      "utf8"
    );

    assert.match(coordinator, /sendTwitchChatMessage/);
    assert.match(coordinator, /appendAndSendBattleSystemMessage/);
    assert.match(coordinator, /formatAutomaticPvpResolution/);
    assert.match(coordinator, /formatAutomaticForfeitResult/);
    assert.match(admin, /!adm twitch teste/);
  }
);

console.log("\n📡 TODOS OS TESTES DA SAÍDA TWITCH PASSARAM.");
