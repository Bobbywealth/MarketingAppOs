const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = parseInt(process.env.TELEGRAM_API_ID || '37305841');
const apiHash = process.env.TELEGRAM_API_HASH || '711117f505987d7333133118f2e4c761';

const stringSession = new StringSession(''); // Empty for new auth

(async () => {
  console.log('Starting Telegram authentication...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Please enter your phone number: '),
    password: async () => await input.text('Please enter your password (if 2FA): '),
    phoneCode: async () => await input.text('Please enter the code you received: '),
    onError: (err) => console.error(err),
  });

  console.log('\n✅ Authentication successful!');
  console.log('\n📋 Your session string:');
  console.log('─'.repeat(80));
  console.log(client.session.save());
  console.log('─'.repeat(80));
  console.log('\n📌 Copy this session string and update TELEGRAM_SESSION_STRING in Render.');
  
  await client.disconnect();
  process.exit(0);
})();
