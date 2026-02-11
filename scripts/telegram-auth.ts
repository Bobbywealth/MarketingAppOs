import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';

const apiId = parseInt(process.env.TELEGRAM_API_ID!);
const apiHash = process.env.TELEGRAM_API_HASH!;

if (!apiId || !apiHash) {
  console.error('❌ TELEGRAM_API_ID and TELEGRAM_API_HASH must be set');
  process.exit(1);
}

const session = new StringSession('');

const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
});

(async () => {
  console.log('🔐 Starting Telegram authentication...');
  console.log('📱 You will receive a code on your Telegram app\n');

  try {
    await client.start({
      phoneNumber: async () => await input.text('Enter your phone number (e.g., +19731234567): '),
      password: async () => await input.text('Enter 2FA password (press Enter if none): '),
      phoneCode: async () => await input.text('Enter the code from Telegram: '),
      onError: (err) => console.error('❌ Error:', err),
    });

    console.log('\n✅ Authentication successful!');
    console.log('\n📋 COPY THIS SESSION STRING:');
    console.log('═'.repeat(80));
    const savedSession = client.session.save();
    if (typeof savedSession === 'string') {
      console.log(savedSession);
    }
    console.log('═'.repeat(80));
    console.log('\n👆 Add this to TELEGRAM_SESSION_STRING in Render environment variables\n');

    await client.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Authentication failed:', error.message);
    await client.disconnect();
    process.exit(1);
  }
})();
