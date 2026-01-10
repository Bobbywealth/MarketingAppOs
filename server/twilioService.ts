import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

function normalizeE164Phone(input: string, defaultCountry: 'US' = 'US'): { ok: true; value: string } | { ok: false; error: string } {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, error: 'Missing phone number' };

  // If already in E.164-ish format, keep it if it matches.
  if (raw.startsWith('+')) {
    const plusDigits = `+${raw.slice(1).replace(/[^\d]/g, '')}`;
    // E.164 max is 15 digits after +, min (practically) ~8
    if (/^\+\d{8,15}$/.test(plusDigits)) return { ok: true, value: plusDigits };
    return { ok: false, error: `Invalid E.164 phone number: "${raw}"` };
  }

  // Strip to digits for common stored formats like "(555) 555-5555"
  const digits = raw.replace(/[^\d]/g, '');

  if (defaultCountry === 'US') {
    // 10-digit US local number
    if (/^\d{10}$/.test(digits)) return { ok: true, value: `+1${digits}` };
    // 11-digit starting with 1
    if (/^1\d{10}$/.test(digits)) return { ok: true, value: `+${digits}` };
  }

  return { ok: false, error: `Unrecognized phone format (expected E.164 like +15551234567): "${raw}"` };
}

export async function sendSms(to: string, body: string) {
  if (!client) {
    console.warn('⚠️ Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const normalizedTo = normalizeE164Phone(to);
    if (!normalizedTo.ok) return { success: false, error: normalizedTo.error };

    const normalizedBody = String(body ?? '').trim();
    if (!normalizedBody) return { success: false, error: 'Message body is required' };

    const createPayload: Record<string, any> = {
      body: normalizedBody,
      to: normalizedTo.value,
    };

    // Prefer Messaging Service if provided (best practice for scaling/toll-free).
    if (messagingServiceSid) {
      createPayload.messagingServiceSid = messagingServiceSid;
    } else {
      const normalizedFrom = normalizeE164Phone(String(fromNumber ?? ''));
      if (!normalizedFrom.ok) {
        return {
          success: false,
          error:
            'TWILIO_PHONE_NUMBER is missing/invalid. Set it to your Twilio toll-free number in E.164 (ex: +18885551234).',
        };
      }
      createPayload.from = normalizedFrom.value;
    }

    const message = await client.messages.create(createPayload);
    console.log(`✅ SMS sent via Twilio: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    const twilioCode = error?.code;
    const twilioStatus = error?.status;
    const twilioMoreInfo = error?.moreInfo;
    const msg = error?.message || 'Unknown Twilio error';

    console.error('❌ Twilio send error:', {
      message: msg,
      code: twilioCode,
      status: twilioStatus,
      moreInfo: twilioMoreInfo,
    });

    return {
      success: false,
      error: twilioCode ? `Twilio error ${twilioCode}: ${msg}` : msg,
      code: twilioCode,
      status: twilioStatus,
      moreInfo: twilioMoreInfo,
    };
  }
}

