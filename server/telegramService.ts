import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import { debugLog } from './debug';

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
const mtprotoEventCounters = {
  initAttempts: 0,
  initSuccess: 0,
  initFailures: 0,
};

function buildCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Initialize MTProto client
async function initializeMTProto(): Promise<TelegramClient | null> {
  const correlationId = buildCorrelationId();
  mtprotoEventCounters.initAttempts += 1;

  // Debug: Log raw environment variables
  debugLog({
    level: 'info',
    location: 'telegram:mtproto',
    message: 'Environment variables check',
    data: {
      correlationId,
      rawApiIdEnv: process.env.TELEGRAM_API_ID,
      rawApiHashEnv: process.env.TELEGRAM_API_HASH ? '[REDACTED]' : 'UNDEFINED',
      rawPhoneEnv: process.env.TELEGRAM_PHONE_NUMBER ? '[REDACTED]' : 'UNDEFINED',
      rawSessionEnv: process.env.TELEGRAM_SESSION_STRING ? `${process.env.TELEGRAM_SESSION_STRING.substring(0, 10)}...` : 'UNDEFINED',
    },
  });

  if (!apiId || !apiHash) {
    debugLog({
      level: 'warn',
      location: 'telegram:mtproto',
      message: 'MTProto not configured',
      data: {
        correlationId,
        hasApiId: Boolean(apiId),
        hasApiHash: Boolean(apiHash),
        apiIdValue: apiId,
        eventCount: mtprotoEventCounters.initAttempts,
      },
    });
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
      debugLog({
        level: 'info',
        location: 'telegram:mtproto',
        message: 'Initializing Telegram MTProto client',
        data: {
          correlationId,
          apiIdConfigured: Boolean(apiId),
          apiIdValue: apiId,
          sessionConfigured: sessionString.length > 0,
          sessionStringLength: sessionString.length,
          sessionStringPreview: sessionString.substring(0, 20) + '...',
          sessionStringFirstChar: sessionString.charAt(0),
          initAttemptCount: mtprotoEventCounters.initAttempts,
        },
      });
      
      // Validate session string format before creating StringSession
      if (!sessionString || sessionString.length < 10) {
        debugLog({
          level: 'error',
          location: 'telegram:mtproto',
          message: 'Session string invalid - too short or empty',
          data: {
            correlationId,
            sessionStringLength: sessionString?.length || 0,
            sessionStringValue: sessionString || 'EMPTY/UNDEFINED',
          },
        });
        clientInitializing = null;
        return null;
      }
      
      // Properly deserialize the session string using StringSession
      const session = new StringSession(sessionString);
      
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
        useTestDC: false,
        retryDelay: 1000,
      });

      await client.connect();
      
      // Test the connection by getting self
      const me = await client.getMe();
      mtprotoEventCounters.initSuccess += 1;
      debugLog({
        level: 'info',
        location: 'telegram:mtproto',
        message: 'Telegram MTProto client connected',
        data: {
          correlationId,
          initSuccessCount: mtprotoEventCounters.initSuccess,
          hasUsername: Boolean(me.username),
          hasPhone: Boolean(me.phone),
        },
      });
      
      mtprotoClient = client;
      clientInitializing = null;
      return client;
    } catch (err: any) {
      mtprotoEventCounters.initFailures += 1;
      debugLog({
        level: 'error',
        location: 'telegram:mtproto',
        message: 'Failed to initialize MTProto',
        data: {
          correlationId,
          error: err?.message || 'Unknown error',
          initFailureCount: mtprotoEventCounters.initFailures,
        },
      });
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
    debugLog({
      level: 'warn',
      location: 'telegram:send',
      message: 'MTProto send failed',
      data: {
        correlationId: buildCorrelationId(),
        error: mtprotoResult.error,
      },
    });
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
    const correlationId = buildCorrelationId();
    // Create new session for fresh authentication
    const session = new StringSession('');
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });
    
    await client.connect();
    
    debugLog({
      level: 'info',
      location: 'telegram:auth',
      message: 'Telegram account authorized successfully',
      data: { correlationId },
    });
    
    const savedSession = client.session.save();
    if (typeof savedSession === 'string') {
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
    debugLog({
      level: 'info',
      location: 'telegram:mtproto',
      message: 'Telegram MTProto client initialized and ready',
      data: { correlationId: buildCorrelationId() },
    });
  }
});
