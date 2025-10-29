import webpush from 'web-push';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 VAPID Keys Generated:');
console.log('');
console.log('Add these to your Render environment variables:');
console.log('');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('');
console.log('📱 These keys are required for push notifications to work on mobile devices.');
console.log('🔧 After adding them to Render, redeploy your app.');