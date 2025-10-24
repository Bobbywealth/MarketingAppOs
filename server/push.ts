import webpush from 'web-push';
import { pool } from './db';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@marketingteamapp.com', // Replace with your email
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
  userId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
  }
) {
  try {
    // Get all push subscriptions for this user
    const result = await pool.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-72x72.png',
      url: payload.url || '/',
      timestamp: Date.now(), // Current timestamp in milliseconds
    });

    // Send to all subscriptions
    const promises = result.rows.map(async (row: any) => {
      const subscription: PushSubscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, notificationPayload);
        console.log(`✅ Push sent to user ${userId}`);
      } catch (error: any) {
        console.error(`❌ Failed to send push to user ${userId}:`, error);

        // If subscription is no longer valid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await pool.query(
            'DELETE FROM push_subscriptions WHERE id = $1',
            [row.id]
          );
          console.log(`Removed invalid subscription for user ${userId}`);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Send a push notification to all users with a specific role
 */
export async function sendPushToRole(
  role: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
  }
) {
  try {
    // Get all users with this role
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      [role]
    );

    const promises = usersResult.rows.map((user: any) =>
      sendPushToUser(user.id, payload)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error sending push to role:', error);
  }
}

/**
 * Send a push notification to all admins
 */
export async function sendPushToAdmins(payload: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}) {
  return sendPushToRole('admin', payload);
}

/**
 * Broadcast a push notification to all users
 */
export async function broadcastPush(payload: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}) {
  try {
    // Get all subscriptions
    const result = await pool.query('SELECT DISTINCT user_id FROM push_subscriptions');

    const promises = result.rows.map((row: any) =>
      sendPushToUser(row.user_id, payload)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error broadcasting push:', error);
  }
}

