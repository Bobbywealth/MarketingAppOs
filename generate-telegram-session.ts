import TelegramClient from '@mtproto/core';

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH || '';
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER || '';

async function main() {
  console.log('🔐 Telegram Session Generator');
  console.log('API ID:', apiId);
  console.log('Phone:', phoneNumber);
  console.log('');

  if (!apiId || !apiHash || !phoneNumber) {
    console.error('❌ Error: Missing credentials in .env');
    process.exit(1);
  }

  const client = new TelegramClient({
    apiId,
    apiHash,
    storageOptions: { path: './data/telegram_session', sessionName: 'session' },
  });

  console.log('📱 Authorizing...');

  try {
    await client.syncAuth({
      phoneNumber,
      onCodeRequest: async () => {
        const code = await new Promise<string>((resolve) => {
          process.stdout.write('Enter code from Telegram: ');
          process.stdin.once('data', (d) => resolve(d.toString().trim()));
        });
        return code;
      },
      onPasswordRequest: async () => {
        const password = await new Promise<string>((resolve) => {
          process.stdout.write('Enter 2FA password: ');
          process.stdin.once('data', (d) => resolve(d.toString().trim()));
        });
        return password;
      },
    });

    console.log('✅ Session authorized!');
    console.log('');

    // Try different methods to export session
    const exportMethods = [
      'exportSession',
      'exportSessionString',
      'exportSessionString',
      'exportSessionString',
    ];

    let sessionString = '';
    for (const method of exportMethods) {
      if (typeof client[method] === 'function') {
        try {
          sessionString = client[method]();
          if (sessionString) break;
        } catch (e) {
          // Try next method
        }
      }
    }

    if (sessionString) {
      console.log('Session string:', sessionString);
      console.log('');
      console.log('Add to .env: TELEGRAM_SESSION_STRING=' + sessionString);
    } else {
      console.log('Session saved to ./data/telegram_session');
      console.log('Copy the content of that file to .env as TELEGRAM_SESSION_STRING=');
    }

  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
