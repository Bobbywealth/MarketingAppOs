#!/usr/bin/env node

// Generate VAPID keys for Web Push (ES Module version)
import webpush from 'web-push';

console.log('🔑 Generating VAPID keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('📋 Add these to your environment variables:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n📝 Add these to your .env file and Render environment variables');
console.log('🔒 Keep the private key secret!');
