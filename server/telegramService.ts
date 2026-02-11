import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl';

type TelegramSendResult =
  | { success: true; messageId?: number }
  | { success: false; error: string; code?: number };

// Bot API Configuration
const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const defaultChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim();

// MTProto Configuration (Personal Account)
const apiIdStr = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER;
let sessionString = process.env.TELEGRAM_SESSION_STRING?.trim();

const apiId = apiIdStr ? parseInt(apiIdStr) : 0;

// Clean up session string if it has line breaks or formatting issues
if (sessionString && (sessionString.includes('\n') || sessionString.includes('\r'))) {
  sessionString = sessionString.replace(/[\n\r]/g, '');
}

// MTProto client instance
let mtprotoClient: TelegramClient | null = null;
let mtprotoReady = false;

// Initialize MTProto client
async function initializeMTProto(): Promise<TelegramClient | null> {
  if (!apiId || !apiHash || !phoneNumber) {
    console.log('⚠️ MTProto not configured. Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE_NUMBER');
    return null;
  }

  try {
    console.log('🔍 Debug: Creating TelegramClient with apiId:', apiId, 'apiHash:', apiHash.substring(0, 8) + '...');
    
    const session = new StringSession(sessionString || '');
    
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log('🔄 Connecting to Telegram...');

    await client.connect();
    
    console.log('✅ Telegram client connected and ready');
    
    mtprotoClient = client;
    mtprotoReady = true;
    return client;
  } catch (err: any) {
    console.error('❌ Failed to initialize MTProto:', err.message);
    console.error('🔍 Error stack:', err.stack);
    return null;
  }
}

// Bot API: Normalize chat IDs
function normalizeChatId(input: string | undefined | null): { ok: true; value: string } | { ok: false; error: string } {
  let raw = String(input ?? "").trim();
  if (!raw) return { ok: false, error: "Missing Telegram chat_id" };

  // Support bot usernames (starting with @)
  if (raw.startsWith('@')) {
    // Bot usernames are valid chat IDs for Bot API
    return { ok: true, value: raw };
  }

  // Common user mistake: forgetting the '-' or '-100' prefix for groups/channels.
  // Channel IDs from some sources are 13 digits starting with 100...
  if (/^100\d{10}$/.test(raw)) {
    raw = "-" + raw;
  }

  // Telegram chat IDs are numeric (groups/channels often negative like -100...)
  if (!/^-?\d+$/.test(raw)) return { ok: false, error: `Invalid Telegram chat_id: "${raw}"` };
  return { ok: true, value: raw };
}

// Send message via Bot API
async function sendViaBotAPI(chatId: string, text: string): Promise<TelegramSendResult> {
  if (!botToken) {
    return { success: false, error: "Bot token not configured" };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_web_page_preview: false,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      let description = data?.description || `HTTP ${res.status}`;
      
      if (description.toLowerCase().includes("chat not found")) {
        description = "Chat not found. Ensure the Bot is added to the group/channel";
      } else if (description.toLowerCase().includes("bot was blocked")) {
        description = "Bot was blocked by the user";
      } else if (description.toLowerCase().includes("forbidden")) {
        description = "Access forbidden. Check bot permissions";
      }
      
      return { success: false, error: `Telegram Bot API error: ${description}`, code: res.status };
    }

    const messageId = data?.result?.message_id;
    return { success: true, messageId: typeof messageId === "number" ? messageId : undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown Bot API error" };
  }
}

// Send message via MTProto (Personal Account)
async function sendViaMTProto(chatId: string | number, text: string): Promise<TelegramSendResult> {
  if (!mtprotoClient) {
    // Try to initialize
    mtprotoClient = await initializeMTProto();
    if (!mtprotoClient) {
      return { success: false, error: "MTProto not initialized" };
    }
  }

  try {
    // Support both username and numeric ID
    let peer;
    
    if (typeof chatId === 'string' && (isNaN(Number(chatId)) || chatId.startsWith('@'))) {
      // Username format
      const username = chatId.replace('@', '');
      const result = await mtprotoClient.invoke(
        new Api.contacts.ResolveUsername({ username })
      );
      peer = result.peer;
    } else {
      // Numeric ID
      peer = chatId.toString();
    }

    await mtprotoClient.sendMessage(peer, { message: text });
    return { success: true };
  } catch (err: any) {
    console.error('MTProto send error:', err);
    return { success: false, error: err?.message || "MTProto send error" };
  }
}

// Main send function - tries both APIs
export async function sendTelegramMessage(
  chatId: string | null | undefined, 
  text: string
): Promise<TelegramSendResult> {
  const messageText = String(text ?? "").trim();
  if (!messageText) return { success: false, error: "Message body is required" };

  if (!chatId) {
    // Use default chat ID if available
    if (defaultChatId) {
      chatId = defaultChatId;
    } else {
      return { success: false, error: "Chat ID is required" };
    }
  }

  // Try MTProto first (personal account has more capabilities)
  if (apiId && apiHash && phoneNumber) {
    const mtprotoResult = await sendViaMTProto(chatId, messageText);
    if (mtprotoResult.success) {
      return mtprotoResult;
    }
    console.log('MTProto failed, trying Bot API...');
  }

  // Fall back to Bot API
  const normalizedChatId = normalizeChatId(chatId);
  if (!normalizedChatId.ok) {
    return { success: false, error: normalizedChatId.error };
  }

  return sendViaBotAPI(normalizedChatId.value, messageText);
}

// Authorization function - call this to authorize the personal account
export async function authorizeTelegramAccount(code: string, twoFA?: string): Promise<{ success: boolean; sessionString?: string; error?: string }> {
  if (!apiId || !apiHash || !phoneNumber) {
    return { success: false, error: "MTProto not configured" };
  }

  if (!mtprotoClient) {
    mtprotoClient = await initializeMTProto();
  }

  if (!mtprotoClient) {
    return { success: false, error: "Failed to initialize MTProto" };
  }

  try {
    console.log('✅ Telegram account authorized successfully!');
    console.log('📝 Your session string (add to .env as TELEGRAM_SESSION_STRING):');
    
    const savedSession = mtprotoClient.session.save();
    if (typeof savedSession === 'string') {
      console.log(savedSession);
      return { success: true, sessionString: savedSession };
    } else {
      console.log('Session saved (not a string)');
      return { success: true };
    }
  } catch (err: any) {
    console.error('Authorization failed:', err);
    return { success: false, error: err.message };
  }
}

// Get authorization status
export async function getAuthorizationStatus(): Promise<{ authorized: boolean; phone?: string; error?: string }> {
  if (!apiId || !apiHash || !phoneNumber) {
    return { authorized: false, error: "MTProto not configured" };
  }

  if (!mtprotoClient) {
    mtprotoClient = await initializeMTProto();
  }

  if (!mtprotoClient) {
    return { authorized: false, error: "Failed to initialize" };
  }

  return { 
    authorized: true, 
    phone: phoneNumber 
  };
}

// Export helper functions
export async function sendToGroup(groupId: string, text: string): Promise<TelegramSendResult> {
  return sendTelegramMessage(groupId, text);
}

export async function sendToChannel(channelId: string, text: string): Promise<TelegramSendResult> {
  return sendTelegramMessage(channelId, text);
}

export async function sendToUser(userId: string, text: string): Promise<TelegramSendResult> {
  return sendTelegramMessage(userId, text);
}

// Initialize on module load
initializeMTProto().then(client => {
  if (client) {
    mtprotoClient = client;
    console.log('✅ Telegram MTProto client initialized and ready');
  }
});
