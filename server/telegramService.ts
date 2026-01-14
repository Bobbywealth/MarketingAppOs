type TelegramSendResult =
  | { success: true; messageId?: number }
  | { success: false; error: string; code?: number };

const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim(); // optional

function normalizeChatId(input: string | undefined | null): { ok: true; value: string } | { ok: false; error: string } {
  let raw = String(input ?? "").trim();
  if (!raw) return { ok: false, error: "Missing Telegram chat_id" };

  // Common user mistake: forgetting the '-' or '-100' prefix for groups/channels.
  // Channel IDs from some sources are 13 digits starting with 100...
  // We automatically fix 13-digit IDs starting with 100 by prepending the minus sign.
  if (/^100\d{10}$/.test(raw)) {
    raw = "-" + raw;
  }

  // Telegram chat IDs are numeric (groups/channels often negative like -100...)
  if (!/^-?\d+$/.test(raw)) return { ok: false, error: `Invalid Telegram chat_id: "${raw}"` };
  return { ok: true, value: raw };
}

export async function sendTelegramMessage(chatId: string | null | undefined, text: string) : Promise<TelegramSendResult> {
  if (!botToken) {
    console.warn("⚠️ Telegram not configured. Set TELEGRAM_BOT_TOKEN in env.");
    return { success: false, error: "Telegram not configured" };
  }

  const resolvedChatId = normalizeChatId(chatId || defaultChatId);
  if (!resolvedChatId.ok) return { success: false, error: resolvedChatId.error };

  const bodyText = String(text ?? "").trim();
  if (!bodyText) return { success: false, error: "Message body is required" };

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: resolvedChatId.value,
        text: bodyText,
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      let description = data?.description || `HTTP ${res.status}`;
      
      // Provide more helpful guidance for common Telegram errors
      if (description.toLowerCase().includes("chat not found")) {
        description = "Chat not found. Ensure the Bot is added to the group/channel as an Administrator and the ID is correct. Note: Group/Channel IDs must start with a minus sign (e.g., -100...).";
      } else if (description.toLowerCase().includes("bot was blocked")) {
        description = "Bot was blocked by the user. They need to unblock the bot or restart the conversation.";
      } else if (description.toLowerCase().includes("forbidden")) {
        description = "Access forbidden. Check if the bot has permission to post in this chat.";
      }
      
      return { success: false, error: `Telegram error: ${description}`, code: res.status };
    }

    const messageId = data?.result?.message_id;
    return { success: true, messageId: typeof messageId === "number" ? messageId : undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown Telegram error" };
  }
}

