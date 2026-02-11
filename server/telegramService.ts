import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';

type TelegramSendResult =
  | { success: true; messageId?: number }
  | { success: false; error: string; code?: number };

// MTProto Configuration (Personal Account)
const apiIdStr = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER;
let sessionString = process.env.TELEGRAM_SESSION_STRING || '';

const apiId = apiIdStr ? parseInt(apiIdStr) : 0;

// Clean up session string if it has line breaks or formatting issues
if (sessionString && (sessionString.includes('\n') || sessionString.includes('\r'))) {
  sessionString = sessionString.replace(/[\n\r]/g, '');
}

// MTProto client instance
let mtprotoClient: TelegramClient | null = null;
let clientInitializing: Promise<TelegramClient | null> | null = null;

// Initialize MTProto client
async function initializeMTProto(): Promise<TelegramClient | null> {
  if (!apiId || !apiHash) {
    console.log('⚠️ MTProto not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH');
    return null;
  }

  // Return existing client if already initialized
  if (mtprotoClient) {
    return mtprotoClient;
  }

  // Prevent multiple simultaneous initializations
  if (clientInitializing) {
    return clientInitializing;
  }

  clientInitializing = (async () => {
    try {
      console.log('🔍 Debug: Creating TelegramClient with apiId:', apiId, 'apiHash:', apiHash.substring(0, 8) + '...');
      console.log('📝 Session string present:', sessionString.length > 0 ? 'Yes (' + sessionString.length + ' chars)' : 'No');
      
      // Properly deserialize the session string using StringSession
      const session = new StringSession(sessionString);
      console.log('✅ StringSession created from saved session');
      
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
        useTestDC: false,
        retryDelay: 1000,
      });

      console.log('🔄 Connecting to Telegram MTProto...');
      await client.connect();
      console.log('✅ Telegram MTProto client connected successfully');
      
      // Test the connection by getting self
      const me = await client.getMe();
      console.log('✅ Authenticated as:', me.username || me.phone || me.id);
      
      mtprotoClient = client;
      clientInitializing = null;
      return client;
    } catch (err: any) {
      console.error('❌ Failed to initialize MTProto:', err.message);
      if (err.message.includes('AUTH_KEY_UNREGISTERED')) {
        console.error('🔧 Session expired. Run authentication script again: npm run telegram:auth');
      }
      clientInitializing = null;
      return null;
    }
  })();

  return clientInitializing;
}

// Send message via MTProto (Personal Account)
async function sendViaMTProto(chatId: string | number, text: string): Promise<TelegramSendResult> {
  if (!mtprotoClient) {
    mtprotoClient = await initializeMTProto();
    if (!mtprotoClient) {
      return { success: false, error: "MTProto not initialized" };
    }
  }

  try {
    // MTProto supports various ID formats: "me", "@username", numeric IDs
    await mtprotoClient.sendMessage(chatId.toString(), { message: text });
    return { success: true };
  } catch (err: any) {
    console.error('MTProto send error:', err);
    return { success: false, error: err?.message || "MTProto send error" };
  }
}

// Main send function - uses MTProto only
export async function sendTelegramMessage(
  chatId: string | null | undefined, 
  text: string
): Promise<TelegramSendResult> {
  const messageText = String(text ?? "").trim();
  if (!messageText) return { success: false, error: "Message body is required" };

  if (!chatId) {
    return { success: false, error: "Chat ID is required" };
  }

  // Use MTProto for personal account
  if (apiId && apiHash) {
    const mtprotoResult = await sendViaMTProto(chatId, messageText);
    if (mtprotoResult.success) {
      return mtprotoResult;
    }
    console.log('MTProto send failed:', mtprotoResult.error);
    return mtprotoResult;
  }

  return { success: false, error: "MTProto not configured" };
}

// Test connection function
export async function testTelegramConnection(): Promise<{ success: boolean; error?: string }> {
  if (!apiId || !apiHash || !phoneNumber) {
    return { success: false, error: "MTProto not configured" };
  }

  try {
    const client = await initializeMTProto();
    if (client) {
      return { success: true };
    }
    return { success: false, error: "Failed to initialize MTProto client" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Authorization function
export async function authorizeTelegramAccount(code: string, twoFA?: string): Promise<{ success: boolean; sessionString?: string; error?: string }> {
  if (!apiId || !apiHash || !phoneNumber) {
    return { success: false, error: "MTProto not configured" };
  }

  try {
    // Create new session for fresh authentication
    const session = new StringSession('');
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });
    
    await client.connect();
    
    console.log('✅ Telegram account authorized successfully!');
    console.log('📝 Your session string (add to .env as TELEGRAM_SESSION_STRING):');
    
    const savedSession = client.session.save();
    if (typeof savedSession === 'string') {
      console.log('Session length:', savedSession.length, 'characters');
      return { success: true, sessionString: savedSession };
    }
    
    return { success: true };
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

  try {
    const client = await initializeMTProto();
    if (client) {
      return { authorized: true, phone: phoneNumber };
    }
    return { authorized: false, error: "Failed to connect" };
  } catch (err: any) {
    return { authorized: false, error: err.message };
  }
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
