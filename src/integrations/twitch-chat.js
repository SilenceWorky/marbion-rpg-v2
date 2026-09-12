const TWITCH_CHAT_ENDPOINT =
  "https://api.twitch.tv/helix/chat/messages";

export const TWITCH_CHAT_MAX_LENGTH = 500;


function clean(value) {
  return String(value ?? "")
    .trim();
}


export function getTwitchChatConfig(env) {
  const clientId =
    clean(env?.TWITCH_CLIENT_ID);

  const accessToken =
    clean(env?.TWITCH_ACCESS_TOKEN)
      .replace(/^oauth:/i, "");

  const broadcasterId =
    clean(env?.TWITCH_BROADCASTER_ID);

  const senderId =
    clean(env?.TWITCH_SENDER_ID);

  const missing = [];

  if (!clientId) missing.push("TWITCH_CLIENT_ID");
  if (!accessToken) missing.push("TWITCH_ACCESS_TOKEN");
  if (!broadcasterId) missing.push("TWITCH_BROADCASTER_ID");
  if (!senderId) missing.push("TWITCH_SENDER_ID");

  return {
    ok: missing.length === 0,
    clientId,
    accessToken,
    broadcasterId,
    senderId,
    missing
  };
}


export async function sendTwitchChatMessage(
  env,
  rawMessage,
  options = {}
) {
  const config =
    getTwitchChatConfig(env);

  if (!config.ok) {
    return {
      ok: false,
      skipped: true,
      error: "TWITCH_CHAT_NOT_CONFIGURED",
      missing: config.missing
    };
  }

  const message =
    clean(rawMessage);

  if (!message) {
    return {
      ok: false,
      skipped: true,
      error: "EMPTY_MESSAGE"
    };
  }

  if (
    message.length >
    TWITCH_CHAT_MAX_LENGTH
  ) {
    return {
      ok: false,
      skipped: true,
      error: "MESSAGE_TOO_LONG",
      length: message.length,
      maxLength: TWITCH_CHAT_MAX_LENGTH
    };
  }

  const fetchImpl =
    options.fetchImpl ||
    fetch;

  let response;

  try {
    response =
      await fetchImpl(
        TWITCH_CHAT_ENDPOINT,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${config.accessToken}`,
            "Client-Id":
              config.clientId,
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            broadcaster_id:
              config.broadcasterId,
            sender_id:
              config.senderId,
            message
          })
        }
      );
  }
  catch (error) {
    return {
      ok: false,
      error: "TWITCH_FETCH_FAILED",
      message:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }

  let payload = null;

  try {
    payload =
      await response.json();
  }
  catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: "TWITCH_API_ERROR",
      status: response.status,
      payload
    };
  }

  const sent =
    payload?.data?.[0];

  if (
    sent &&
    sent.is_sent === false
  ) {
    return {
      ok: false,
      error: "TWITCH_MESSAGE_DROPPED",
      status: response.status,
      dropReason:
        sent.drop_reason || null
    };
  }

  return {
    ok: true,
    status: response.status,
    messageId:
      sent?.message_id || null,
    isSent:
      sent?.is_sent !== false
  };
}
