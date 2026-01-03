import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSms(to: string, body: string) {
  if (!client) {
    console.warn('⚠️ Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to
    });
    console.log(`✅ SMS sent via Twilio: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('❌ Twilio send error:', error);
    return { success: false, error: error.message || 'Unknown Twilio error' };
  }
}

