import cron from 'node-cron';
import * as microsoftAuth from './microsoftAuth';
import type { IStorage } from './storage';

let syncInterval: NodeJS.Timeout | null = null;
let cronJob: cron.ScheduledTask | null = null;

/**
 * Sync emails for a single user
 */
async function syncEmailsForUser(storage: IStorage, userId: number) {
  try {
    console.log(`📧 Starting email sync for user ${userId}...`);
    
    const account = await storage.getEmailAccountByUserId(userId);
    
    if (!account || !account.isActive) {
      console.log(`⏭️  No active email account for user ${userId}, skipping`);
      return { success: false, reason: 'no_account' };
    }

    // Check if token is expired and refresh if needed
    let accessToken = account.accessToken;
    if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
      console.log(`🔄 Token expired for user ${userId}, refreshing...`);
      
      if (!account.refreshToken) {
        console.log(`⚠️  No refresh token for user ${userId}, marking email account as inactive`);
        await storage.updateEmailAccount(account.id, {
          isActive: false,
        });
        return { success: false, reason: 'no_refresh_token' };
      }

      try {
        const refreshed = await microsoftAuth.refreshAccessToken(account.refreshToken);
        accessToken = refreshed.accessToken;
        
        await storage.updateEmailAccount(account.id, {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          tokenExpiresAt: refreshed.expiresOn,
        });
        console.log(`✓ Token refreshed for user ${userId}`);
      } catch (refreshError: any) {
        console.error(`❌ Failed to refresh token for user ${userId}:`, refreshError);
        
        // If token refresh failed due to invalid grant, mark account as inactive
        if (refreshError.message && refreshError.message.includes('invalid_grant')) {
          console.log(`⚠️  Marking email account as inactive for user ${userId} - requires re-authentication`);
          try {
            await storage.updateEmailAccount(account.id, {
              isActive: false,
            });
          } catch (updateError) {
            console.error(`Failed to update email account status:`, updateError);
          }
        }
        
        return { success: false, reason: 'token_refresh_failed' };
      }
    }

    // Fetch emails from Microsoft
    const folders = ['inbox', 'sent', 'spam'];
    let syncedCount = 0;

    for (const folder of folders) {
      try {
        const messages = await microsoftAuth.getEmails(accessToken!, folder, 50);
        
        for (const msg of messages) {
          // Check if email already exists
          const existing = await storage.getEmailByMessageId(msg.id);
          
          if (!existing) {
            await storage.createEmail({
              messageId: msg.id,
              from: msg.from?.emailAddress?.address || '',
              fromName: msg.from?.emailAddress?.name || '',
              to: msg.toRecipients?.map((r: any) => r.emailAddress.address) || [],
              cc: msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
              bcc: msg.bccRecipients?.map((r: any) => r.emailAddress.address) || [],
              subject: msg.subject || '(No Subject)',
              body: msg.body?.content || '',
              folder,
              isRead: msg.isRead || false,
              isImportant: msg.importance === 'high' || msg.isImportant || false,
              hasAttachments: msg.hasAttachments || false,
              userId,
              receivedAt: msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date(),
              sentAt: msg.sentDateTime ? new Date(msg.sentDateTime) : undefined,
            } as any);
            syncedCount++;
          }
        }
      } catch (folderError) {
        console.error(`❌ Error syncing ${folder} for user ${userId}:`, folderError);
      }
    }

    console.log(`✅ Synced ${syncedCount} new emails for user ${userId}`);
    return { success: true, syncedCount };
  } catch (error) {
    console.error(`❌ Error syncing emails for user ${userId}:`, error);
    return { success: false, reason: 'error', error };
  }
}

/**
 * Sync emails for all users with connected email accounts
 */
async function syncAllUsersEmails(storage: IStorage) {
  const startTime = Date.now();
  console.log(`\n🔄 ========== Background Email Sync Started ==========`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  
  try {
    // Get all users
    const users = await storage.getUsers();
    const usersWithEmails: number[] = [];
    
    // Find users with connected email accounts
    for (const user of users) {
      try {
        const account = await storage.getEmailAccountByUserId(user.id);
        if (account && account.isActive) {
          usersWithEmails.push(user.id);
        }
      } catch (err) {
        // Skip users without email accounts
      }
    }

    console.log(`📊 Found ${usersWithEmails.length} users with connected email accounts`);

    if (usersWithEmails.length === 0) {
      console.log(`⏭️  No users with connected email accounts, skipping sync`);
      return;
    }

    // Sync emails for each user
    const results = [];
    for (const userId of usersWithEmails) {
      const result = await syncEmailsForUser(storage, userId);
      results.push({ userId, ...result });
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const totalSynced = results.reduce((sum, r) => sum + (r.syncedCount || 0), 0);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n📈 Summary:`);
    console.log(`   • Users synced: ${successful}/${usersWithEmails.length}`);
    console.log(`   • New emails: ${totalSynced}`);
    console.log(`   • Duration: ${duration}s`);
    console.log(`🔄 ========== Background Email Sync Completed ==========\n`);

  } catch (error) {
    console.error(`❌ Background email sync error:`, error);
  }
}

/**
 * Start the background email sync service (runs every 30 minutes)
 */
export function startEmailSyncService(storage: IStorage) {
  // Stop existing job if any
  stopEmailSyncService();

  console.log(`\n✨ Starting Background Email Sync Service...`);
  console.log(`⏱️  Schedule: Every 30 minutes`);
  console.log(`📧 Will sync emails for all users with connected accounts\n`);

  // Run initial sync after 1 minute (so server has time to fully start)
  console.log(`⏰ Initial sync will run in 1 minute...`);
  setTimeout(() => {
    console.log(`🚀 Running initial email sync...`);
    syncAllUsersEmails(storage);
  }, 60000); // 1 minute

  // Schedule cron job: Run every 30 minutes
  // Format: "*/30 * * * *" means "every 30 minutes"
  cronJob = cron.schedule('*/30 * * * *', () => {
    syncAllUsersEmails(storage);
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust to your timezone
  });

  console.log(`✅ Background Email Sync Service started successfully!`);
}

/**
 * Stop the background email sync service
 */
export function stopEmailSyncService() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log(`⏹️  Stopped email sync interval`);
  }
  
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log(`⏹️  Stopped email sync cron job`);
  }
}

/**
 * Manually trigger a sync for all users (useful for testing)
 */
export async function triggerManualSync(storage: IStorage) {
  console.log(`🔄 Manual email sync triggered...`);
  await syncAllUsersEmails(storage);
}

