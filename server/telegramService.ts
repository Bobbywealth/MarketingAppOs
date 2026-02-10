import { pool } from "./db";

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

export async function sendTelegramMessage(chatId: string | null | undefined, text: string, parseMode?: "HTML" | "Markdown") : Promise<TelegramSendResult> {
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
    const payload: Record<string, any> = {
      chat_id: resolvedChatId.value,
      text: bodyText,
      disable_web_page_preview: false,
    };
    if (parseMode) payload.parse_mode = parseMode;

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
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

/**
 * Send a Telegram message to multiple subscribers (bulk).
 * Returns per-recipient results.
 */
export async function sendTelegramBulk(
  chatIds: string[],
  text: string,
  delayMs = 50 // Telegram rate limit: ~30 msgs/sec, 50ms is safe
): Promise<{ chatId: string; result: TelegramSendResult }[]> {
  const results: { chatId: string; result: TelegramSendResult }[] = [];
  for (const chatId of chatIds) {
    const result = await sendTelegramMessage(chatId, text);
    results.push({ chatId, result });

    // Mark blocked subscribers
    if (!result.success && result.error?.toLowerCase().includes("bot was blocked")) {
      try {
        await pool.query(
          `UPDATE telegram_subscribers SET is_blocked = true, is_active = false, updated_at = NOW() WHERE chat_id = $1`,
          [chatId]
        );
      } catch { /* ignore DB errors during bulk send */ }
    }

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}

/**
 * Process an incoming Telegram webhook update.
 * Handles /start, /stop, and regular messages.
 */
export async function handleTelegramWebhookUpdate(update: any): Promise<void> {
  const message = update?.message;
  if (!message) return;

  const chat = message.chat;
  if (!chat || chat.type !== "private") return; // Only handle private chats with the bot

  const chatId = String(chat.id);
  const username = chat.username || null;
  const firstName = chat.first_name || null;
  const lastName = chat.last_name || null;
  const text = (message.text || "").trim();

  // Upsert subscriber
  await pool.query(
    `INSERT INTO telegram_subscribers (id, chat_id, username, first_name, last_name, is_active, is_blocked, last_interaction, subscribed_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, true, false, NOW(), NOW(), NOW(), NOW())
     ON CONFLICT (chat_id) DO UPDATE SET
       username = COALESCE($2, telegram_subscribers.username),
       first_name = COALESCE($3, telegram_subscribers.first_name),
       last_name = COALESCE($4, telegram_subscribers.last_name),
       is_active = true,
       is_blocked = false,
       last_interaction = NOW(),
       updated_at = NOW()`,
    [chatId, username, firstName, lastName]
  );

  // Handle commands
  if (text.toLowerCase() === "/start") {
    // Send welcome message if configured
    const welcomeRes = await pool.query(
      `SELECT content FROM telegram_automated_messages WHERE welcome_message = true AND status = 'active' LIMIT 1`
    );
    const welcomeContent = welcomeRes.rows?.[0]?.content;
    if (welcomeContent) {
      await sendTelegramMessage(chatId, welcomeContent);
    } else {
      await sendTelegramMessage(chatId, "Welcome! You're now subscribed to our updates. You'll receive marketing messages and announcements here.");
    }
    console.log(`📩 Telegram subscriber added: ${chatId} (@${username || "unknown"})`);
    return;
  }

  if (text.toLowerCase() === "/stop" || text.toLowerCase() === "/unsubscribe") {
    await pool.query(
      `UPDATE telegram_subscribers SET is_active = false, updated_at = NOW() WHERE chat_id = $1`,
      [chatId]
    );
    await sendTelegramMessage(chatId, "You've been unsubscribed. Send /start to subscribe again.");
    console.log(`📤 Telegram subscriber unsubscribed: ${chatId}`);
    return;
  }
}

/**
 * Set up the Telegram webhook URL so the bot forwards incoming messages to our server.
 */
export async function setupTelegramWebhook(appUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!botToken) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const data = await res.json().catch(() => null);
    if (data?.ok) {
      console.log(`🤖 Telegram webhook set to: ${webhookUrl}`);
      return { success: true };
    }
    return { success: false, error: data?.description || "Failed to set webhook" };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown error setting webhook" };
  }
}

/**
 * Get current Telegram webhook info.
 */
export async function getTelegramWebhookInfo(): Promise<any> {
  if (!botToken) return { configured: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await res.json().catch(() => null);
    return { configured: true, ...data?.result };
  } catch {
    return { configured: false };
  }
}

/**
 * Get bot info (username, name, etc).
 */
export async function getTelegramBotInfo(): Promise<any> {
  if (!botToken) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json().catch(() => null);
    return data?.ok ? data.result : null;
  } catch {
    return null;
  }
}

/**
 * Send a message with sender attribution (e.g. "Bobby:\nYour message").
 * Used when the user wants their personal identity on bot-sent messages.
 */
export async function sendTelegramAsUser(
  chatId: string,
  text: string,
  senderName?: string
): Promise<TelegramSendResult> {
  const formattedText = senderName
    ? `${senderName}:\n${text}`
    : text;
  return sendTelegramMessage(chatId, formattedText);
}

/**
 * Resolve a Telegram username to a chat_id from our subscriber database.
 * Returns null if not found (the user needs to /start the bot first).
 */
export async function resolveUsernameToChatId(username: string): Promise<string | null> {
  const clean = username.replace(/^@/, "").trim().toLowerCase();
  if (!clean) return null;
  try {
    const result = await pool.query(
      `SELECT chat_id FROM telegram_subscribers WHERE LOWER(username) = $1 AND is_active = true LIMIT 1`,
      [clean]
    );
    return result.rows[0]?.chat_id || null;
  } catch {
    return null;
  }
}
